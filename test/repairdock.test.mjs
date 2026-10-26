import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, repairShip } from "../src/game/game.mjs";
import { repairGuns } from "../src/game/crew.mjs";
const mk = () => { const g = newGame(loadWorld()), s = g.ships[0]; s.hull = 50; g.cash = 100000; return { g, s }; };
test("repair from another port fails and changes nothing", () => {
  const { g, s } = mk(), cash = g.cash, r = repairShip(g, s, "lisboa" === s.at ? "cadiz" : "lisboa");
  assert.equal(r.ok, false); assert.equal(r.reason, "not in this port"); assert.equal(s.hull, 50); assert.equal(g.cash, cash);
});
test("repair in the port where the ship is docked works", () => {
  const { g, s } = mk(); assert.equal(repairShip(g, s, s.at).ok, true); assert.equal(s.hull, 100);
});
test("callers without a port (automatic routes) still repair the docked ship", () => {
  const { g, s } = mk(); assert.equal(repairShip(g, s).ok, true);
});
test("gun repair follows the same port rule", () => {
  const { g, s } = mk(); s.gunCond = 40; s.weapons = { cannon: 1 };
  assert.equal(repairGuns(g, s, "elsewhere").reason, "not in this port");
});
