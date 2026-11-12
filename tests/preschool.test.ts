import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { directions, matchingBear, mazeStep, pictureLabel, picturePath, pictures, preschoolGameIds, preschoolRounds,
  streetFarIndex, streetNeighborIndex, tripCount, type Direction } from "../src/preschool";
import { storyBanks, storyFrameId } from "../src/banks/preschool-stories";

test("Preschool rounds have one solution and local illustrations and speech", () => {
  assert.ok(existsSync("public/preschool/audio/correct.wav"));
  assert.ok(existsSync("public/preschool/audio/retry.wav"));
  assert.ok(existsSync("public/preschool/audio/crunch.wav"));
  assert.ok(existsSync("public/preschool/pictures/speaker.png"));
  assert.ok(!Object.hasOwn(pictures, "speaker"));
  for (const picture of Object.keys(pictures)) {
    assert.ok(existsSync(`public/preschool/pictures/${picture}.png`), picture);
  }
  for (const game of preschoolGameIds) {
    assert.ok(existsSync(`public/preschool/audio/${game}.wav`), game);
    const rounds = preschoolRounds(game);
    assert.equal(rounds.length, 5);
    if (game === "pair") assert.equal(new Set(rounds.map(round => round.kind === "choice" && round.answer)).size, 5);
    for (const round of rounds) {
      if (round.kind === "trip") {
        const riders = [...round.stay, ...round.exit, ...round.waiting];
        assert.equal(new Set(riders).size, riders.length);
        assert.ok(round.stay.length + round.exit.length <= 5);
        assert.ok(round.options.every(count => count >= 1 && count <= 5));
        assert.equal(round.options.filter(count => count === tripCount(round)).length, 1);
        continue;
      }
      if (round.kind === "balance") {
        const total = round.starting.reduce((sum, count) => sum + count, 0);
        assert.ok(total >= 2 && total <= 6 && total % 2 === 0);
        assert.ok(round.starting[2] || round.starting[0] !== round.starting[1]);
        continue;
      }
      if (round.kind === "door") {
        assert.equal(round.options.filter(option => matchingBear(option, round.clue)).length, 1);
        assert.ok(round.options.some(option => option.color === round.clue.color && option.pattern !== round.clue.pattern));
        assert.ok(round.options.some(option => option.color !== round.clue.color && option.pattern === round.clue.pattern));
        continue;
      }
      if (round.kind === "street") {
        const fixedHouses = [round.anchor, round.neighbor, ...(round.farHouse ? [round.farHouse] : [])];
        const fixedSlots = [round.anchorIndex, streetNeighborIndex(round), ...(round.farHouse ? [streetFarIndex(round)] : [])];
        assert.equal(new Set(round.houses).size, round.houses.length);
        assert.equal(new Set(fixedHouses).size, round.houses.length - 1);
        assert.equal(new Set(fixedSlots).size, round.houses.length - 1);
        assert.ok(fixedHouses.every(house => round.houses.includes(house)));
        assert.ok(fixedSlots.every(slot => slot >= 0 && slot < round.houses.length));
        continue;
      }
      if (round.kind === "feed") {
        assert.equal(game, "feed");
        assert.ok(round.portions.length === 1 || round.portions.length === 2);
        assert.ok(round.portions.every(portion => portion >= 1 && portion <= 4));
        assert.ok(round.portions.reduce((sum, portion) => sum + portion, 0) <= 6);
        if (round.startingPortions) {
          assert.equal(round.portions.length, 2);
          assert.equal(round.startingPortions.length, 2);
          assert.equal(round.startingPortions.reduce((sum, portion) => sum + portion, 0), round.portions[0] + round.portions[1]);
          assert.ok(round.startingPortions.every((portion, i) => Math.abs(portion - round.portions[i]) === 1));
        }
        continue;
      }
      if (round.kind === "story") {
        assert.equal(new Set(round.order).size, 3);
        assert.deepEqual([...round.options].sort(), [...round.order].sort());
        assert.notDeepEqual(round.options, round.order);
        continue;
      }
      if (round.kind === "build") {
        assert.equal(round.cells.length, round.columns * 2);
        assert.ok(round.cells.filter(Boolean).length >= 2);
        continue;
      }
      if (round.kind === "more") {
        assert.notEqual(...round.counts);
        assert.ok(round.counts.every(count => count >= 1 && count <= 6));
        continue;
      }
      if (round.kind === "maze") {
        const seen = new Set([round.start]);
        for (const cell of seen) {
          for (const direction of Object.keys(directions) as Direction[]) {
            const next = mazeStep(round, cell, direction);
            if (next !== null) seen.add(next);
          }
        }
        assert.ok(seen.has(round.goal), "The house must be reachable");
        continue;
      }
      assert.equal(new Set(round.options).size, round.options.length);
      assert.ok([...round.prompt, ...round.options].every(picture => Object.hasOwn(pictures, picture)));
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

test("Both story levels use the full illustrated bank before repeating recent stories", () => {
  assert.equal(storyBanks[1].length, 20);
  assert.equal(storyBanks[2].length, 30);
  assert.ok(!existsSync("public/preschool/stories"), "Retired pictogram cards must not be published");
  const ids = [...storyBanks[1], ...storyBanks[2]].map(([id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const level of [1, 2] as const) {
    const steps = level === 1 ? 3 : 5;
    const size = storyBanks[level].length + (level === 1 ? 6 : 0);
    for (const [id, frames] of storyBanks[level]) {
      assert.equal(frames.length, steps);
      assert.equal(new Set(frames).size, steps);
      for (const [index, description] of frames.entries()) {
        const picture = storyFrameId(id, index);
        assert.equal(pictureLabel(picture), description);
        assert.ok(existsSync(`public/${picturePath(picture).slice(2)}`), picture);
      }
    }
    let recent: string[] = [];
    const seen = new Set<string>();
    while (seen.size < size) {
      const rounds = preschoolRounds("story", level, recent);
      const session: string[] = [];
      for (const round of rounds) {
        if (round.kind !== "story") assert.fail("Expected story round");
        assert.equal(round.options.length, steps);
        assert.equal(new Set(round.options).size, steps);
        assert.deepEqual([...round.options].sort(), [...round.order].sort());
        if (seen.size < size) assert.ok(!seen.has(round.storyId), round.storyId);
        seen.add(round.storyId);
        session.push(round.storyId);
      }
      recent = [...new Set([...session, ...recent])];
    }
    assert.equal(seen.size, size);
  }
});
