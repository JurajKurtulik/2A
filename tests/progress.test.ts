import { test } from "node:test";
import assert from "node:assert/strict";
import { completionRecord, migrateHistory } from "../src/progress";
import { topicsForGrade } from "../src/content";
import {
  createWorksheet,
  validateSelection,
  worksheetQuestions,
} from "../src/worksheet";
test("Grades have isolated catalogs and cannot generate another grade's topics", () => {
  assert.equal(topicsForGrade(2).length, 15);
  for (const grade of [1, 3, 4, 5, 6, 7, 8, 9] as const) {
    assert.equal(topicsForGrade(grade).length, 0);
    assert.ok(
      validateSelection("math", [{ topic: "arithmetic", count: 2 }], grade),
    );
    assert.throws(() =>
      createWorksheet("math", [{ topic: "arithmetic", count: 2 }], [], grade),
    );
  }
});
test("Completed online worksheets survive serialization with variant, grade and score", () => {
  const w = createWorksheet("math", [{ topic: "arithmetic", count: 2 }]);
  const questions = worksheetQuestions(w);
  const answers = Object.fromEntries(
    questions.map((q) => [q.id, q.answers[0]]),
  );
  const entry = completionRecord({
    label: "Matematika · varianta X",
    test: true,
    grade: 2,
    variant: w.id,
    questions,
    answers,
    firstAnswers: {},
  });
  assert.deepEqual(migrateHistory(JSON.parse(JSON.stringify(entry))), entry);
  assert.equal(entry.kind, "test");
  assert.equal(entry.grade, 2);
  assert.equal(entry.score, 2);
  assert.equal(entry.variant, w.id);
  const practice = completionRecord({
    label: "Procvičování",
    test: false,
    grade: 2,
    questions,
    answers,
    firstAnswers: { [questions[0].id]: "nesprávně" },
  });
  assert.equal(practice.kind, "practice");
  assert.equal(practice.score, 1);
  assert.equal(practice.correctedScore, 2);
});
test("Legacy history preserves scores and assigns original content to grade two", () => {
  const old = {
    date: "2026-11-01",
    label: "Český jazyk · varianta ABC",
    score: 7,
    total: 8,
    topics: [],
  };
  assert.deepEqual(migrateHistory(old), { ...old, grade: 2, kind: "test" });
  assert.equal(migrateHistory({ ...old, label: "Slabiky" }).kind, "practice");
});
