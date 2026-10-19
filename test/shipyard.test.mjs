import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, orderShip, repairShip, repairCost, sellShip, shipValue, MAX_FLEET, SHIP_TYPES } from "../src/game/game.mjs";
const world = loadWorld();
const game = (cash = 20000) => { const g = newGame(world, "cadiz", {}); g.cash = cash; return g; };
test("an order costs coins now and the ship arrives only after its build time", () => {
  const g = game(), c = g.cash, r = orderShip(g, "nao", "cadiz");
  assert.equal(r.ok, true); assert.equal(g.cash, c - SHIP_TYPES.nao.price);
  for (let i = 0; i < SHIP_TYPES.nao.buildDays - 1; i++) advanceDay(g);
  assert.equal(g.ships.length, 1);
  advanceDay(g);
  assert.equal(g.ships.length, 2); assert.equal(g.ships[1].type, "nao"); assert.equal(g.ships[1].hull, 100);
});
test("orders are refused without cash, without a docked ship, for unknown types, or over the fleet limit", () => {
  assert.equal(orderShip(game(10), "cog", "cadiz").reason, "no cash");
  assert.equal(orderShip(game(), "cog", "lisboa").reason, "no ship here");
  assert.equal(orderShip(game(), "toString", "cadiz").ok, false);
  const g = game(1e6); for (let i = 1; i < MAX_FLEET; i++) assert.equal(orderShip(g, "barca", "cadiz").ok, true);
  assert.equal(orderShip(g, "barca", "cadiz").reason, "fleet full");
});
test("sea wear lowers hull, repair costs by damage and restores it", () => {
  const g = game(), s = g.ships[0]; doSail(g, s, "lisboa");
  while (s.voyage) advanceDay(g);
  assert.ok(s.hull < 100);
  const c = repairCost(s), cash = g.cash;
  assert.equal(repairShip(g, s).ok, true); assert.equal(g.cash, cash - c); assert.equal(s.hull, 100);
  assert.equal(repairShip(g, s).reason, "no damage");
});
test("selling pays by class and hull, but never the last ship, a loaded one, or one at sea", () => {
  const g = game(); assert.equal(sellShip(g, g.ships[0]).reason, "last ship");
  orderShip(g, "barca", "cadiz"); for (let i = 0; i < 8; i++) advanceDay(g);
  const b = g.ships[1]; b.cargo.salt = 1; assert.equal(sellShip(g, b).reason, "hold not empty"); b.cargo = {};
  const cash = g.cash, v = shipValue(b); b.hull = 50; assert.ok(shipValue(b) < v);
  assert.equal(sellShip(g, b).ok, true); assert.equal(g.ships.length, 1); assert.ok(g.cash > cash);
});
