export type ReviewAssignment = {
  schemaVersion: 1;
  id: string;
  kind: "transcription";
  grade: number;
  subject: string;
  items: { id: string; expectedText: string }[];
};
export type ReviewConfig = {
  enabled: boolean;
  apiBaseUrl: string;
};
export type ReviewSession = {
  id: string;
  assignmentId: string;
  assignmentDigest: string;
  expiresAt: string;
  uploadToken: string;
  ownerToken: string;
};
export type ReviewStatus = {
  id: string;
  assignmentId: string;
  assignmentDigest: string;
  expiresAt: string;
  status: "waiting" | "processing" | "completed" | "failed" | "expired";
  result?: {
    items: { id: string; recognizedText: string; uncertain: boolean }[];
  };
};
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Služba vrátila neplatnou odpověď.");
  return v as Record<string, unknown>;
};
export function readConfig(input: unknown): ReviewConfig {
  const v = object(input);
  if (v.enabled !== true) return { enabled: false, apiBaseUrl: "" };
  const api = new URL(String(v.apiBaseUrl));
  if (
    api.protocol !== "https:" ||
    api.username ||
    api.password ||
    api.search ||
    api.hash
  )
    throw new Error("Adresa kontrolní služby musí používat HTTPS.");
  return { enabled: true, apiBaseUrl: api.href.replace(/\/$/, "") };
}
export function validateAssignment(a: ReviewAssignment) {
  if (
    a.schemaVersion !== 1 ||
    a.kind !== "transcription" ||
    !a.id ||
    a.id.length > 100 ||
    !Number.isInteger(a.grade) ||
    a.grade < 1 ||
    a.grade > 9 ||
    !a.subject ||
    a.items.length < 1 ||
    a.items.length > 5 ||
    new Set(a.items.map((i) => i.id)).size !== a.items.length ||
    a.items.some(
      (i) => !i.id || !i.expectedText.trim() || i.expectedText.length > 300,
    )
  )
    throw new Error("Neplatné zadání pro kontrolu fotky.");
}
// The canonical order is part of the v1 API contract, implemented identically by the backend.
export function canonicalAssignment(a: ReviewAssignment) {
  validateAssignment(a);
  return JSON.stringify({
    schemaVersion: 1,
    id: a.id,
    kind: a.kind,
    grade: a.grade,
    subject: a.subject,
    items: a.items.map((i) => ({ id: i.id, expectedText: i.expectedText })),
  });
}
export async function assignmentDigest(a: ReviewAssignment) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalAssignment(a)),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function validDate(v: unknown) {
  return typeof v === "string" && Number.isFinite(Date.parse(v));
}
export function readSession(
  input: unknown,
  a: ReviewAssignment,
  digest: string,
): ReviewSession {
  const v = object(input);
  if (
    typeof v.id !== "string" ||
    !/^[a-zA-Z0-9_-]{16,100}$/.test(v.id) ||
    v.assignmentId !== a.id ||
    v.assignmentDigest !== digest ||
    !validDate(v.expiresAt) ||
    Date.parse(String(v.expiresAt)) <= Date.now() ||
    Date.parse(String(v.expiresAt)) > Date.now() + 3600000 ||
    typeof v.ownerToken !== "string" ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(v.ownerToken) ||
    v.ownerToken === v.uploadToken ||
    typeof v.uploadToken !== "string" ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(v.uploadToken)
  )
    throw new Error("Nepodařilo se bezpečně propojit kontrolu se zadáním.");
  return v as ReviewSession;
}
export function readStatus(
  input: unknown,
  a: ReviewAssignment,
  session: ReviewSession,
): ReviewStatus {
  const v = object(input);
  if (
    v.id !== session.id ||
    v.assignmentId !== a.id ||
    v.assignmentDigest !== session.assignmentDigest ||
    v.expiresAt !== session.expiresAt ||
    !validDate(v.expiresAt) ||
    !["waiting", "processing", "completed", "failed", "expired"].includes(
      String(v.status),
    )
  )
    throw new Error("Výsledek nepatří k tomuto zadání.");
  if (v.status === "completed") {
    const result = object(v.result);
    if (!Array.isArray(result.items) || result.items.length !== a.items.length)
      throw new Error("Výsledek neobsahuje všechny věty.");
    const rows = result.items.map(object);
    if (
      new Set(rows.map((i) => i.id)).size !== a.items.length ||
      a.items.some((item) => !rows.some((r) => r.id === item.id)) ||
      rows.some(
        (i) =>
          typeof i.recognizedText !== "string" ||
          i.recognizedText.length > 1000 ||
          typeof i.uncertain !== "boolean",
      )
    )
      throw new Error("Neplatný přepis ze služby.");
  }
  return v as ReviewStatus;
}
export function uploadLink(base: string, s: ReviewSession) {
  const url = new URL(base);
  url.search = "";
  url.hash = new URLSearchParams({
    "photo-upload": s.id,
    token: s.uploadToken,
  }).toString();
  return url.href;
}
export function readUploadLink(hash: string) {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  if (!p.has("photo-upload")) return null;
  const id = p.get("photo-upload") || "",
    token = p.get("token") || "";
  if (
    !/^[a-zA-Z0-9_-]{16,100}$/.test(id) ||
    !/^[a-zA-Z0-9_-]{32,256}$/.test(token)
  )
    throw new Error(
      "Odkaz pro nahrání fotky není platný. Naskenuj nový QR kód.",
    );
  return { id, token };
}
export const normalizedText = (s: string) =>
  s.normalize("NFC").trim().replace(/\s+/g, " ");
export function compareTranscription(
  a: ReviewAssignment,
  texts: Record<string, string>,
) {
  return a.items.map((item) => ({
    id: item.id,
    expectedText: item.expectedText,
    recognizedText: texts[item.id] ?? "",
    correct:
      normalizedText(item.expectedText) ===
      normalizedText(texts[item.id] ?? ""),
  }));
}

export function explainTranscriptionDifference(
  expected: string,
  actual: string,
) {
  const a = normalizedText(expected),
    b = normalizedText(actual);
  if (a === b) return "Věta odpovídá vzoru.";
  if (!b) return "Věta na papíře chybí.";
  if (a.toLocaleLowerCase("cs") === b.toLocaleLowerCase("cs"))
    return "Liší se velká a malá písmena. Zkontroluj začátek věty a vlastní jména.";
  const withoutMarks = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");
  if (withoutMarks(a) === withoutMarks(b))
    return "Liší se háčky nebo čárky nad písmeny.";
  if (a.replace(/[.,!?;:]/g, "") === b.replace(/[.,!?;:]/g, ""))
    return "Liší se interpunkce. Zkontroluj čárky a znaménko na konci věty.";
  const aw = a.split(" "),
    bw = b.split(" ");
  let i = 0;
  while (i < Math.min(aw.length, bw.length) && aw[i] === bw[i]) i++;
  return `První rozdíl je u ${i + 1}. slova: ve vzoru je „${aw[i] ?? "(konec věty)"}“, v přepisu „${bw[i] ?? "(slovo chybí)"}“.${aw.length !== bw.length ? " Liší se i počet slov." : ""}`;
}
