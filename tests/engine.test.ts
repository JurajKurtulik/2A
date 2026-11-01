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
test("Recent questions are avoided and session composition covers topics", () => {
  const first = makeSession(["syllables"], 8),
    second = makeSession(["syllables"], 8, first.map(signature));
  assert.ok(second.every((q) => !first.map(signature).includes(signature(q))));
  const mixed = makeSession(["arithmetic", "tens", "decompose"], 12);
  for (const id of ["arithmetic", "tens", "decompose"])
    assert.equal(mixed.filter((q) => q.topic === id).length, 4);
});
