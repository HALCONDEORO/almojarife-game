import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSail } from "../src/game/game.mjs";
import { travelEstimate, cityMenu, shipForKey } from "../src/view/nav.mjs";
const world = loadWorld(), g = newGame(world, "cadiz", {}), s = g.ships[0];
test("estimate gives days, km and path ending at the target, matching what sailing then does", () => {
  const e = travelEstimate(world, s, "barcelona");
  assert.equal(e.ok, true); assert.equal(e.path.at(-1), "barcelona"); assert.equal(e.path[0], "cadiz");
  doSail(g, s, "barcelona"); assert.equal(s.voyage.totalDays, e.days);
});
test("no estimate at sea, to the same port, to an unknown port or without a ship", () => {
  assert.equal(travelEstimate(world, s, "lisboa").reason, "at sea");
  const h = newGame(world, "cadiz", {}).ships[0];
  assert.equal(travelEstimate(world, h, "cadiz").reason, "already here");
  assert.equal(travelEstimate(world, h, "atlantis").ok, false);
  assert.equal(travelEstimate(world, null, "lisboa").ok, false);
});
test("the port menu offers sail only when possible, and always select", () => {
  const h = newGame(world, "cadiz", {}).ships[0];
  assert.equal(cityMenu(world, h, "lisboa")[0].enabled, true);
  assert.equal(cityMenu(world, h, "cadiz")[0].enabled, false);
  assert.equal(cityMenu(world, h, "cadiz").at(-1).id, "select");
});
test("number keys pick a ship only when it exists", () => {
  assert.equal(shipForKey(g, "1"), 0); assert.equal(shipForKey(g, "2"), null); assert.equal(shipForKey(g, "x"), null); assert.equal(shipForKey(g, "0"), null);
});
