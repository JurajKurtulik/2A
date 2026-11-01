import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import { topics, type Subject } from "../src/content";
import {
  createWorksheet,
  validateSelection,
  worksheetQuestions,
  paperSections,
  PAPER,
  type Worksheet,
} from "../src/worksheet";
import { exportDocx, exportPdf, prepareLayout } from "../src/export";
import { migrateProfileNames } from "../src/profiles";

const fonts = Promise.all(
  ["Regular", "Bold"].map((name) =>
    readFile(`public/fonts/NotoSans-${name}.ttf`),
  ),
).then(([regular, bold]) => ({ regular, bold }));
test("Custom worksheets preserve exact selected topics, counts and stable question IDs", () => {
  const selected = [
    { topic: "arithmetic", count: 3 },
    { topic: "story", count: 2 },
  ];
  const w = createWorksheet("math", selected),
    next = createWorksheet("math", selected);
  assert.deepEqual(
    w.sections.map((s) => [s.topic, s.questions.length]),
    [
      ["arithmetic", 3],
      ["story", 2],
    ],
  );
  assert.equal(worksheetQuestions(w).length, 5);
  assert.equal(new Set(worksheetQuestions(w).map((q) => q.id)).size, 5);
  assert.notEqual(w.id, next.id);
  assert.ok(validateSelection("math", []));
  assert.ok(validateSelection("math", [{ topic: "syllables", count: 1 }]));
  assert.ok(validateSelection("math", [{ topic: "story", count: 21 }]));
  assert.ok(validateSelection("math", [{ topic: "story", count: 1.5 }]));
  assert.ok(
    validateSelection("math", [
      { topic: "story", count: 1 },
      { topic: "story", count: 2 },
    ]),
  );
});
test("Profile migration renames both slots once and retains history and active child", () => {
  const d = {
    profiles: [
      { name: "První průzkumnice", history: [{ score: 8 }] },
      { name: "Druhá průzkumnice", history: [{ score: 5 }] },
    ],
    active: 1,
  };
  const next = migrateProfileNames(d);
  assert.deepEqual(
    next.profiles.map((p) => p.name),
    ["Terezka", "Nelinka"],
  );
  assert.deepEqual(
    next.profiles.map((p) => p.history),
    d.profiles.map((p) => p.history),
  );
  assert.equal(next.active, 1);
  next.profiles[0].name = "Tereza";
  assert.equal(migrateProfileNames(next).profiles[0].name, "Tereza");
});
test("Paper conversion removes choices and creates writing space from interactive tasks", () => {
  const w = createWorksheet("math", [
    { topic: "story", count: 2 },
    { topic: "decompose", count: 1 },
  ]);
  const paper = paperSections(w);
  assert.equal(paper[0].items[0].writingLines, 3);
  assert.ok(paper[1].items[0].lines[0].includes("______ + ______"));
  assert.equal(paper[0].items.length, 2);
});
test("PDF and Word export use the same version and keep solutions separate", async () => {
  const w: Worksheet = {
    id: "QA-ABCDEF",
    subject: "math",
    createdAt: "2026-11-01",
    sections: [
      {
        topic: "arithmetic",
        questions: [
          {
            id: "qa1",
            topic: "arithmetic",
            prompt: "14 + 3 = ?",
            kind: "input",
            answers: ["17"],
            explanation: "Tajné vysvětlení.",
          },
        ],
      },
    ],
  };
  const bytes = await fonts;
  const pdf = await exportPdf(w, false, bytes);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 4)), "%PDF");
  const blob = await exportDocx(w, false, bytes);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const xml = await zip.file("word/document.xml")!.async("string");
  assert.ok(xml.includes(w.id));
  assert.ok(xml.includes("14 + 3 = ________"));
  assert.ok(!xml.includes("Tajné vysvětlení"));
  assert.ok(!xml.includes(">17<"));
  const solutions = await exportDocx(w, true, bytes);
  const solutionXml = await (
    await JSZip.loadAsync(await solutions.arrayBuffer())
  )
    .file("word/document.xml")!
    .async("string");
  assert.ok(solutionXml.includes("1) 17"));
  assert.ok(solutionXml.includes(w.id));
  assert.equal(w.sections[0].questions[0].prompt, "14 + 3 = ?");
});
test("Every topic paginates at maximum supported count without clipping or missing rows", async () => {
  for (const subject of ["math", "czech"] as Subject[]) {
    const ids = topics.filter((t) => t.subject === subject);
    const chosen = subject === "math" ? ids : ids.slice(0, 6);
    const w = createWorksheet(
      subject,
      chosen.map((t) => ({ topic: t.id, count: 20 })),
    );
    for (const solutions of [false, true]) {
      const { pages } = await prepareLayout(w, solutions, await fonts);
      assert.ok(pages.length > 1);
      for (const page of pages) {
        assert.ok(
          page.rows.reduce((n, r) => n + r.height, 0) <=
            PAPER.bodyBottom - PAPER.bodyTop,
        );
        assert.ok(page.rows.length > 0);
      }
      for (const [index, section] of w.sections.entries())
        assert.ok(
          pages
            .flatMap((p) => p.rows)
            .some((r) => r.cells[0]?.startsWith(`${index + 1}. `)),
          section.topic,
        );
    }
  }
  for (const id of ["dityni", "detene", "capitals"]) {
    const w = createWorksheet("czech", [{ topic: id, count: 20 }]);
    const { pages } = await prepareLayout(w, false, await fonts);
    assert.ok(pages.length);
  }
});
