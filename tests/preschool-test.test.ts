import { test } from "node:test";
import assert from "node:assert/strict";
import { makePreschoolTest } from "../src/preschool-test";

test("Preschool test reorders the same items and separates a dominant game when possible", () => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const { online, paper } = makePreschoolTest({ trip: 5, street: 2, balance: 2 }, 1, []);
    assert.equal(online.length, 9);
    assert.equal(new Set(online).size, 9);
    assert.deepEqual(new Set(online), new Set(paper));
    assert.deepEqual(paper.map(item => item.game), [
      "trip", "trip", "trip", "trip", "trip", "balance", "balance", "street", "street",
    ]);
    assert.ok(online.every((item, index) => item.game !== online[index - 1]?.game));
  }
});

test("Preschool test can exceed one game's normal session without repeating stories", () => {
  const { online } = makePreschoolTest({ story: 12 }, 2, []);
  const stories = online.flatMap(({ round }) => round.kind === "story" ? [round] : []);
  assert.equal(stories.length, 12);
  assert.equal(new Set(stories.map(round => round.storyId)).size, 12);
  assert.ok(stories.every(round => round.order.length === 5));
});
