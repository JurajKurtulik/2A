import { test } from "node:test";
import assert from "node:assert/strict";
import { topics, dityni, detene, syllables } from "../src/content";
import { generate, makeSession, isCorrect, signature } from "../src/engine";
test("Every topic generates valid questions with correct choices and distinct sessions", () => {
  for (const topic of topics) {
    const qs = makeSession([topic.id], 8);
    assert.equal(new Set(qs.map(signature)).size, 8, topic.id);
    for (let i = 0; i < 100; i++) {
      const q = generate(topic.id);
      assert.ok(q.answers[0]);
      assert.ok(isCorrect(q, q.answers[0]));
      if (q.kind === "choice") {
        assert.ok(q.choices?.includes(q.answers[0]), JSON.stringify(q));
        assert.equal(new Set(q.choices).size, q.choices?.length);
      }
      if (q.kind === "order")
        for (const answer of q.answers)
          assert.deepEqual(
            q.tokens!.map((w) => w.toLowerCase()).sort(),
            answer.replace(/\.$/, "").toLowerCase().split(" ").sort(),
          );
    }
  }
});
test("Arithmetic stays in the requested range and answers satisfy equations", () => {
  for (const topic of ["arithmetic", "tens", "missing"])
    for (let i = 0; i < 500; i++) {
      const q = generate(topic),
        prompt = q.prompt.replace("?", q.answers[0]).replace("□", q.answers[0]);
      const nums = prompt.match(/\d+/g)!.map(Number);
      assert.equal(nums.length, 3);
      assert.ok(
        nums.every((n) => n >= 0 && n <= (topic === "arithmetic" ? 20 : 100)),
      );
      assert.equal(
        prompt.includes("+") ? nums[0] + nums[1] : nums[0] - nums[1],
        nums[2],
        prompt,
      );
    }
});
test("Czech syllable banks contain the literal missing syllable", () => {
  for (const [part, word] of [...dityni, ...detene])
    assert.ok(word.includes(part), `${part}: ${word}`);
  for (const word of syllables) {
    assert.ok(word.includes("|"));
    assert.ok(!word.includes("||"));
  }
});

test("Number chains have five operands up to ten and no negative intermediate result", () => {
  const questions = makeSession(["arithmetic-chain"], 20);
  assert.equal(new Set(questions.map(signature)).size, 20);
  for (const question of questions) {
    const parts = question.prompt.replace(" = ?", "").split(" ");
    assert.equal(parts.length, 9);
    let total = 0;
    for (let i = 0; i < parts.length; i += 2) {
      const operand = Number(parts[i]);
      assert.ok(operand >= 1 && operand <= 10);
      if (i > 0) assert.match(parts[i - 1], /^[+−]$/);
      total += parts[i - 1] === "−" ? -operand : operand;
      assert.ok(total >= 0);
    }
    assert.ok(isCorrect(question, String(total)));
  }
});

test("Arithmetic to 100 mixes operations and respects each topic's crossing rule", () => {
  for (const id of [
    "hundred-no-crossing",
    "hundred-crossing",
    "hundred-two-digit",
  ]) {
    const questions = makeSession([id], 20);
    const seen = new Set<string>();
    assert.equal(new Set(questions.map(signature)).size, 20);
    for (const question of questions) {
      const [leftText, sign, rightText] = question.prompt.split(" ");
      const left = Number(leftText),
        right = Number(rightText);
      assert.match(sign, /^[+−]$/);
      const result = sign === "+" ? left + right : left - right;
      assert.ok(left >= 10 && left <= 99);
      assert.ok(result >= 0 && result <= 100);
      assert.ok(isCorrect(question, String(result)));
      if (id === "hundred-two-digit") {
        assert.ok(right >= 10 && right <= 99);
        const units = (left % 10) + (sign === "+" ? right % 10 : -(right % 10));
        seen.add(`${sign}${units >= 10 || units < 0}`);
      } else {
        assert.ok(right >= 1 && right <= 9);
        const changesTens = Math.floor(left / 10) !== Math.floor(result / 10);
        assert.equal(changesTens, id === "hundred-crossing");
        seen.add(sign);
      }
    }
    assert.equal(seen.size, id === "hundred-two-digit" ? 4 : 2);
  }
});

test("Length conversion generates all 54 whole-number questions and mixes all six directions", () => {
  const questions = makeSession(["length-conversion"], 54);
  const inMm = { mm: 1, cm: 10, dm: 100 };
  const directions = questions.map((question) => {
    const match = /^(\d+) (mm|cm|dm) = \? (mm|cm|dm)$/.exec(question.prompt);
    assert.ok(match);
    const [, given, from, to] = match;
    assert.notEqual(from, to);
    const givenMm = inMm[from as keyof typeof inMm];
    const answerMm = inMm[to as keyof typeof inMm];
    const answer = (Number(given) * givenMm) / answerMm;
    assert.ok(Number.isInteger(answer));
    assert.ok(
      Math.min(Number(given), answer) >= 1 &&
        Math.min(Number(given), answer) <= 9,
    );
    assert.ok(isCorrect(question, String(answer)));
    return `${from}-${to}`;
  });
  assert.equal(new Set(questions.map(signature)).size, 54);
  assert.equal(new Set(directions.slice(0, 6)).size, 6);
  const next = makeSession(
    ["length-conversion"],
    20,
    questions.slice(0, 20).map(signature),
  );
  assert.ok(
    next.every(
      (q) =>
        !questions
          .slice(0, 20)
          .some((previous) => signature(previous) === signature(q)),
    ),
  );
});
test("Recent questions are avoided and session composition covers topics", () => {
  const first = makeSession(["syllables"], 8),
    second = makeSession(["syllables"], 8, first.map(signature));
  assert.ok(second.every((q) => !first.map(signature).includes(signature(q))));
  const mixed = makeSession(["arithmetic", "tens", "decompose"], 12);
  for (const id of ["arithmetic", "tens", "decompose"])
    assert.equal(mixed.filter((q) => q.topic === id).length, 4);
});
