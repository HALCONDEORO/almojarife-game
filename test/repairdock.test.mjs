import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, orderRepair, repairOf } from "../src/game/game.mjs";
import { repairGuns } from "../src/game/crew.mjs";
const mk = () => { const g = newGame(loadWorld()), s = g.ships[0]; s.hull = 50; g.cash = 100000; return { g, s }; };
test("a repair order from another port fails and changes nothing", () => {
  const { g, s } = mk(), cash = g.cash, r = orderRepair(g, [s.id], "lisboa" === s.at ? "cadiz" : "lisboa");
  assert.equal(r.ok, false); assert.equal(r.reason, "not in this port"); assert.equal(s.hull, 50); assert.equal(g.cash, cash);
  assert.equal(repairOf(g, s.id), null);
});
test("a repair order in the port where the ship is docked works", () => {
  const { g, s } = mk(); assert.equal(orderRepair(g, [s.id], s.at).ok, true); assert.ok(repairOf(g, s.id));
});
test("gun repair follows the same port rule", () => {
  const { g, s } = mk(); s.gunCond = 40; s.weapons = { cannon: 1 };
  assert.equal(repairGuns(g, s, "elsewhere").reason, "not in this port");
});
