import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, START_CASH } from "../src/game/game.mjs";
import { difficultyOpts, DIFFICULTY_IDS } from "../src/game/difficulty.mjs";
const world = loadWorld();
test("each preset changes starting cash and upkeep", () => {
  assert.deepEqual(DIFFICULTY_IDS, ["easy", "normal", "hard"]);
  const e = newGame(world, "cadiz", difficultyOpts("easy")), n = newGame(world, "cadiz", difficultyOpts("normal")), h = newGame(world, "cadiz", difficultyOpts("hard"));
  assert.equal(n.cash, START_CASH); assert.ok(e.cash > n.cash && n.cash > h.cash);
  assert.ok(e.upkeepMul < n.upkeepMul && n.upkeepMul < h.upkeepMul);
});
test("unknown or hostile ids fall back to normal", () => {
  for (const id of ["", undefined, "__proto__", "constructor", "EASY"]) assert.equal(difficultyOpts(id).difficulty, "normal");
});
