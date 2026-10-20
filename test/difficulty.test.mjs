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
import { cleanProfile, startBonus, defaultProfile } from "../src/game/profile.mjs";
test("the profile keeps a valid difficulty and the start adds cash and multiplies upkeep", () => {
  assert.equal(defaultProfile().difficulty, "normal");
  for (const bad of ["", "x", "__proto__", 3, null]) assert.equal(cleanProfile({ difficulty: bad }).difficulty, "normal");
  const base = startBonus(cleanProfile({ background: "merchant" })), easy = startBonus(cleanProfile({ background: "merchant", difficulty: "easy" })), hard = startBonus(cleanProfile({ background: "seafarer", difficulty: "hard" }));
  assert.equal(base.cash, 300); assert.equal(easy.cash, 1300); assert.equal(hard.cash, -500);
  assert.ok(Math.abs(easy.upkeepMul - 0.8) < 1e-9); assert.ok(Math.abs(hard.upkeepMul - 0.85 * 1.25) < 1e-9);
});
