import { test } from "node:test";
import assert from "node:assert/strict";
import {
  syllables,
  opposites,
  dityni,
  detene,
  sentenceGroups,
  wordSentences,
  alternateSentences,
  capitalSentences,
  categories,
} from "../src/content";
import { storyTemplates, storyText } from "../src/banks/math-stories-grade2";
import { bankSizes, generate, makeSession, signature } from "../src/engine";
import { createWorksheet, worksheetQuestions } from "../src/worksheet";
const unique = (values: string[]) => new Set(values).size;
test("Content floors count real prompts and each sentence kind independently", () => {
  for (const words of [
    syllables.map((x) => x.replaceAll("|", "")),
    wordSentences,
    capitalSentences,
    dityni.map((x) => x[1]),
    detene.map((x) => x[1]),
    opposites.map((x) => x[0]),
  ])
    assert.ok(unique(words) >= 100);
  for (const [kind, words] of sentenceGroups) {
    assert.ok(unique(words) >= 100, kind);
    assert.equal(unique(words), words.length);
    assert.ok(
      words.every((w) =>
        w.endsWith(
          kind === "Tázací" ? "?" : kind === "Rozkazovací" ? "!" : ".",
        ),
      ),
    );
  }
  assert.equal(wordSentences.length, alternateSentences.length);
  assert.ok(unique(categories.flatMap(([, words]) => words)) >= 100);
  assert.equal(unique(storyTemplates.map((s) => s.id)), storyTemplates.length);
  assert.ok(storyTemplates.length >= 25);
  assert.equal(
    unique(storyTemplates.map((s) => s.text)),
    storyTemplates.length,
  );
});
test("Every finite-bank item generates correct distinct choices and preserves all words", () => {
  for (const [topic, size] of Object.entries(bankSizes))
    for (let i = 0; i < size; i++) {
      const q = generate(topic, i);
      assert.equal(q.topic, topic);
      assert.ok(q.answers[0]);
      if (q.kind === "choice") {
        assert.ok(q.choices!.includes(q.answers[0]));
        assert.equal(new Set(q.choices).size, q.choices!.length);
      }
      if (q.kind === "order")
        for (const answer of q.answers)
          assert.deepEqual(
            q.tokens!.map((w) => w.toLocaleLowerCase("cs")).sort(),
            answer.replace(/\.$/, "").toLocaleLowerCase("cs").split(" ").sort(),
          );
    }
});
test("Ten eight-item worksheets use eighty different prompts per fixed Czech topic", () => {
  for (const topic of [
    "syllables",
    "opposites",
    "sentences",
    "wordorder",
    "capitals",
    "dityni",
    "detene",
  ]) {
    let recent: string[] = [];
    for (let round = 0; round < 10; round++) {
      const w = createWorksheet("czech", [{ topic, count: 8 }], recent);
      const keys = worksheetQuestions(w).map(signature);
      assert.ok(
        keys.every((k) => !recent.includes(k)),
        topic,
      );
      recent = [...keys, ...recent];
    }
    assert.equal(new Set(recent).size, 80, topic);
  }
});
test("Exhausted bank repeats the oldest prompt and story templates do not repeat just with new numbers", () => {
  const size = bankSizes.syllables;
  const all = makeSession(["syllables"], size);
  const recent = all.map(signature);
  assert.equal(
    signature(makeSession(["syllables"], 1, recent)[0]),
    recent.at(-1),
  );
  const stories = makeSession(["story"], 25);
  assert.equal(unique(stories.map(signature)), 25);
});
test("All story templates substitute both quantities and use addition or valid subtraction in range", () => {
  for (const template of storyTemplates)
    for (const [a, b] of [
      [1, 1],
      [4, 2],
      [20, 10],
    ]) {
      const text = storyText(template, a, b);
      assert.ok(!/[{}]/.test(text));
      assert.ok(text.includes(String(a)));
      assert.ok(text.includes(String(b)));
    }
  for (let i = 0; i < 500; i++) {
    const q = generate("story");
    const [a, b, result] = q.answers[0].match(/\d+/g)!.map(Number);
    assert.equal(q.answers[0].includes("+") ? a + b : a - b, result);
    assert.ok(result >= 0 && result <= 100);
    assert.ok(
      q.answers[0].includes("+")
        ? a + b <= 20 || [a, b].every((n) => n % 10 === 0)
        : a <= 20 || [a, b].every((n) => n % 10 === 0),
    );
  }
});
