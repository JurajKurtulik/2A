import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { pictures, preschoolGameIds, preschoolRounds } from "../src/preschool";

test("Preschool rounds have one solution and local illustrations and speech", () => {
  for (const picture of Object.keys(pictures)) {
    assert.ok(existsSync(`public/preschool/pictures/${picture}.png`), picture);
  }
  for (const game of preschoolGameIds) {
    assert.ok(existsSync(`public/preschool/audio/${game}.wav`), game);
    const rounds = preschoolRounds(game);
    assert.equal(rounds.length, 5);
    for (const round of rounds) {
      if (round.kind === "feed") {
        assert.equal(game, "feed");
        assert.ok(round.count >= 1 && round.count <= 6);
        continue;
      }
      assert.equal(new Set(round.options).size, round.options.length);
      assert.equal(round.options.filter(option => option === round.answer).length, 1);
      if (game === "pair") assert.deepEqual(round.prompt, [round.answer]);
      if (game === "pattern") {
        const unit = round.prompt.slice(0, round.prompt.length / 3);
        assert.deepEqual(round.prompt, [...unit, ...unit, ...unit]);
        assert.equal(unit[0], round.answer);
      }
    }
  }
});
