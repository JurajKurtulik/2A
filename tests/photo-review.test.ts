import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transcriptionSets } from "../src/banks/transcription-grade2";
import {
  assignmentDigest,
  canonicalAssignment,
  readSession,
  readStatus,
  readConfig,
  readUploadLink,
  uploadLink,
  compareTranscription,
  transcriptionDifferences,
  type ReviewAssignment,
} from "../src/photo-review/contracts";
import { reviewClient, preparePhoto } from "../src/photo-review/client";
const config = { enabled: true, apiBaseUrl: "https://review.example.test/api" };
const assignment: ReviewAssignment = {
  schemaVersion: 1,
  id: "assignment-01",
  kind: "transcription",
  grade: 2,
  subject: "czech",
  items: [
    { id: "sentence-1", expectedText: "Eva čte knihu." },
    { id: "sentence-2", expectedText: "Kde bydlíš?" },
  ],
};
async function fixture() {
  return {
    id: "session_1234567890123456",
    assignmentId: assignment.id,
    assignmentDigest: await assignmentDigest(assignment),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    ownerToken: "o".repeat(43),
    uploadToken: "u".repeat(43),
  };
}
test("Transcription offers 50 stable five-sentence sets, with 250 distinct sentences", () => {
  assert.equal(transcriptionSets.length, 50);
  assert.equal(new Set(transcriptionSets.map((s) => s.id)).size, 50);
  assert.ok(transcriptionSets.every((s) => s.sentences.length === 5));
  assert.equal(
    new Set(transcriptionSets.flatMap((s) => s.sentences)).size,
    250,
  );
});
test("Public configuration defaults off and rejects unsafe backend addresses", async () => {
  assert.equal(
    readConfig(
      JSON.parse(
        (await readFile("public/photo-review-config.json", "utf8")).replace(
          /"enabled"\s*:\s*true/,
          '"enabled": false',
        ),
      ),
    ).enabled,
    false,
  );
  assert.equal(readConfig(config).apiBaseUrl, config.apiBaseUrl);
  for (const apiBaseUrl of [
    "http://example.test",
    "https://user:password@example.test",
    "https://example.test?token=secret",
    "https://example.test#token",
  ])
    assert.throws(() => readConfig({ ...config, apiBaseUrl }));
  assert.throws(() => reviewClient({ enabled: false, apiBaseUrl: "" }));
});
test("Assignment digest binds the exact text and schema order", async () => {
  const a = await assignmentDigest(assignment);
  assert.equal(a.length, 64);
  assert.equal(
    a,
    await assignmentDigest(JSON.parse(canonicalAssignment(assignment))),
  );
  assert.notEqual(
    a,
    await assignmentDigest({
      ...assignment,
      items: [
        { ...assignment.items[0], expectedText: "Eva čte." },
        assignment.items[1],
      ],
    }),
  );
  assert.throws(() =>
    canonicalAssignment({
      ...assignment,
      items: [assignment.items[0], assignment.items[0]],
    }),
  );
});
test("Upload QR contains only upload capability and parsed fragments reject malformed tokens", async () => {
  const s = await fixture();
  const link = uploadLink("https://example.test/skola-hrou/?old=true#old", s);
  assert.ok(!link.includes(s.ownerToken));
  assert.equal(new URL(link).pathname, "/skola-hrou/");
  assert.equal(new URL(link).search, "");
  assert.deepEqual(readUploadLink(new URL(link).hash), {
    id: s.id,
    token: s.uploadToken,
  });
  assert.equal(readUploadLink(""), null);
  assert.throws(() => readUploadLink("#photo-upload=bad&token=short"));
});
test("Results from other assignments, duplicates, missing lines and uncertain omissions are rejected", async () => {
  const s = await fixture();
  assert.equal(readSession(s, assignment, s.assignmentDigest).id, s.id);
  assert.throws(() =>
    readSession(
      { ...s, ownerToken: s.uploadToken },
      assignment,
      s.assignmentDigest,
    ),
  );
  assert.throws(() =>
    readSession(
      { ...s, expiresAt: "2000-01-01" },
      assignment,
      s.assignmentDigest,
    ),
  );
  const valid = {
    id: s.id,
    assignmentId: s.assignmentId,
    assignmentDigest: s.assignmentDigest,
    expiresAt: s.expiresAt,
    status: "completed",
    result: {
      items: assignment.items.map((i) => ({
        id: i.id,
        recognizedText: i.expectedText,
        uncertain: false,
      })),
    },
  };
  assert.equal(readStatus(valid, assignment, s).status, "completed");
  for (const bad of [
    { ...valid, assignmentId: "other" },
    { ...valid, assignmentDigest: "wrong" },
    { ...valid, result: { items: [] } },
    {
      ...valid,
      result: { items: [valid.result.items[0], valid.result.items[0]] },
    },
    {
      ...valid,
      result: {
        items: assignment.items.map((i) => ({
          id: i.id,
          recognizedText: i.expectedText,
        })),
      },
    },
  ])
    assert.throws(() => readStatus(bad, assignment, s));
});
test("Automatic transcription scoring preserves case, diacritics and lists every word and punctuation difference", () => {
  const rows = compareTranscription(assignment, {
    "sentence-1": " Eva  čte knihu. ",
    "sentence-2": "Kde bydlis?",
  });
  assert.deepEqual(
    rows.map((r) => r.correct),
    [true, false],
  );
  assert.match(transcriptionDifferences("Eva čte.", "eva čte.")[0], /velikost písmen/);
  assert.match(transcriptionDifferences("Eva čte.", "Eva cte.")[0], /diakritika/);
  assert.match(transcriptionDifferences("Kde bydlíš?", "Kde bydlíš.")[0], /Interpunkce.*\?*.*\./);
  const all = transcriptionDifferences("Eva čte knihu.", "Adam nesl knihu!");
  assert.equal(all.length, 3);
  assert.match(all[0], /Slovo 1.*Eva.*znak/);
  assert.match(all[1], /Slovo 2.*čte.*znak/);
  assert.match(all[2], /Interpunkce.*má být.*\..*je.*!/);
  assert.deepEqual(transcriptionDifferences("Eva čte.", "Eva čte."), []);
  assert.match(
    transcriptionDifferences("Nad horami jsou mraky.", "Nad horami jsou mraky")[0],
    /Chybí interpunkce „\.“ po 4\. slově/,
  );
  assert.match(
    transcriptionDifferences("Kde visí ručník?", "Kde visí ručník.")[0],
    /Interpunkce po 3\. slově: má být „\?“, je „\.“/,
  );
  const photoExample = transcriptionDifferences(
    "Vyměň vodu v misce!",
    "Umeř vodu v mysce!",
  );
  assert.equal(photoExample.length, 2);
  assert.match(photoExample[0], /Slovo 1.*Vyměň.*znak/);
  assert.match(photoExample[0], /Rozdíl po znacích/);
  assert.match(photoExample[0], /chybí|→/);
  assert.match(photoExample[1], /Slovo 4.*misce.*znak/);
  assert.match(photoExample[1], /Rozdíl po znacích/);
});
test("Client sends anonymous creation, separate owner/upload tokens and stable retry identifiers", async () => {
  const s = await fixture();
  const calls: { url: string; init: RequestInit }[] = [];
  const request = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    if (init?.method === "POST") return Response.json(s);
    if (init?.method === "PUT") return new Response(null, { status: 204 });
    return Response.json({
      id: s.id,
      assignmentId: s.assignmentId,
      assignmentDigest: s.assignmentDigest,
      expiresAt: s.expiresAt,
      status: "waiting",
    });
  }) as typeof fetch;
  const client = reviewClient(config, request);
  await client.create(assignment, "attempt-id");
  await client.status(assignment, s);
  await client.upload(
    s.id,
    s.uploadToken,
    new Blob(["jpeg"], { type: "image/jpeg" }),
  );
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), null);
  assert.equal(
    new Headers(calls[0].init.headers).get("Idempotency-Key"),
    "attempt-id",
  );
  assert.equal(
    new Headers(calls[1].init.headers).get("Authorization"),
    `Review ${s.ownerToken}`,
  );
  assert.equal(
    new Headers(calls[2].init.headers).get("X-Upload-Token"),
    s.uploadToken,
  );
  assert.equal(new Headers(calls[2].init.headers).get("Authorization"), null);
  assert.equal(calls[2].init.credentials, "omit");
  assert.equal(calls[2].init.redirect, "error");
});
test("API errors and invalid files do not turn into successful reviews", async () => {
  const client = reviewClient(
    config,
    (async () => new Response(null, { status: 429 })) as typeof fetch,
  );
  await assert.rejects(() => client.create(assignment), /příliš mnoho/);
  await assert.rejects(
    () => preparePhoto(new File(["x"], "wrong.svg", { type: "image/svg+xml" })),
    /JPG/,
  );
  await assert.rejects(
    () => preparePhoto(new File([], "empty.jpg", { type: "image/jpeg" })),
    /JPG/,
  );
});
