import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { buyWeapon } from "../src/sim/armory.mjs";
const mk = () => { const g = newGame(loadWorld()), s = g.ships[0]; g.cash = 100000; return { g, s }; };
test("arming from another port fails and changes nothing", () => {
  const { g, s } = mk(), cash = g.cash, n = Object.keys(s.weapons ?? {}).length, r = buyWeapon(g, s, "cannon", g, "elsewhere");
  assert.equal(r.ok, false); assert.equal(r.reason, "not in this port"); assert.equal(g.cash, cash); assert.equal(Object.keys(s.weapons ?? {}).length, n);
});
test("arming in the port where the ship is docked works", () => {
  const { g, s } = mk(); assert.equal(buyWeapon(g, s, "cannon", g, s.at).ok, true);
});
test("callers without a port (AI traders) are unchanged", () => {
  const { g, s } = mk(); assert.equal(buyWeapon(g, s, "cannon").ok, true);
});
