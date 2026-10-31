import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, orderShip, orderRepair, repairOf, repairCost, sellShip, shipValue, SHIP_TYPES } from "../src/game/game.mjs";
const world = loadWorld();
const mkGame = (cash = 20000) => { const game = newGame(world, "cadiz", {}); game.cash = cash; return game; };
test("an order costs coins now and the ship arrives only after its build time", () => {
  const game = mkGame(), cost0 = game.cash, res = orderShip(game, "nao", "cadiz");
  assert.equal(res.ok, true); assert.equal(game.cash, cost0 - SHIP_TYPES.nao.price);
  for (let idx = 0; idx < SHIP_TYPES.nao.buildDays - 1; idx++) advanceDay(game);
  assert.equal(game.ships.length, 1);
  advanceDay(game);
  assert.equal(game.ships.length, 2); assert.equal(game.ships[1].type, "nao"); assert.equal(game.ships[1].hull, 100);
});
test("orders are refused without cash, without a docked ship, for unknown types, (there is no fleet limit)", () => {
  assert.equal(orderShip(mkGame(10), "cog", "cadiz").reason, "no cash");
  assert.equal(orderShip(mkGame(), "cog", "lisboa").reason, "no ship here");
  assert.equal(orderShip(mkGame(), "toString", "cadiz").ok, false);
  const game = mkGame(1e6); for (let idx = 0; idx < 9; idx++) assert.equal(orderShip(game, "barca", "cadiz").ok, true); // no fleet limit: upkeep is the brake
});
test("sea wear lowers hull, a repair order costs by damage and restores it over days", () => {
  const game = mkGame(), ship = game.ships[0]; doSail(game, ship, "lisboa");
  while (ship.voyage) advanceDay(game);
  assert.ok(ship.hull < 100);
  const cost0 = repairCost(ship), cash = game.cash;
  assert.equal(orderRepair(game, [ship.id], ship.at).ok, true); assert.equal(game.cash, cash - cost0);
  assert.ok(repairOf(game, ship.id), "the yard keeps the ship until the hull is sound");
  for (let idx = 0; idx < 5 && ship.hull < 100; idx++) advanceDay(game);
  assert.equal(ship.hull, 100); assert.equal(repairOf(game, ship.id), null);
  assert.equal(orderRepair(game, [ship.id], ship.at).reason, "no damage");
});
test("selling pays by class and hull, but never the last ship, a loaded one, or one at sea", () => {
  const game = mkGame(); assert.equal(sellShip(game, game.ships[0]).reason, "last ship");
  orderShip(game, "barca", "cadiz"); for (let idx = 0; idx < 8; idx++) advanceDay(game);
  const mate = game.ships[1]; mate.cargo.salt = 1; assert.equal(sellShip(game, mate).reason, "hold not empty"); mate.cargo = {};
  const cash = game.cash, v = shipValue(mate); mate.hull = 50; assert.ok(shipValue(mate) < v);
  assert.equal(sellShip(game, mate).ok, true); assert.equal(game.ships.length, 1); assert.ok(game.cash > cash);
});
