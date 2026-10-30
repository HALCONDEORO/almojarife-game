import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
const world = loadWorld();
test("weekly report cash-after includes the household tribute shown on the same line", () => {
  const g = newGame(world, "cadiz", { seed: 3, household: true }); g.cash = 20000;
  for (let i = 0; i < 7; i++) advanceDay(g);
  const rep = g.reports.find((r) => r.household);
  assert.ok(rep && rep.household > 0, "tribute line present");
  assert.equal(rep.cashAfter, g.cash, "cashAfter is the true cash after the tribute, not the pre-tribute settlement snapshot");
});
