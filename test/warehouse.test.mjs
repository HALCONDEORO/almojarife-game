import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, buyWarehouse, storeGoods, takeGoods, WAREHOUSE_PRICE, WAREHOUSE_CAP, netWorth } from "../src/game/game.mjs";
const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("buy a warehouse once, with cash", () => {
  const g = newGame(world); const c0 = g.cash;
  assert.ok(buyWarehouse(g, "cadiz").ok); assert.equal(g.cash, c0 - WAREHOUSE_PRICE);
  assert.equal(buyWarehouse(g, "cadiz").reason, "already owned");
  const poor = newGame(world); poor.cash = 10; assert.equal(buyWarehouse(poor, "cadiz").reason, "no cash");
});
test("store and take goods; totals are kept", () => {
  const g = newGame(world); g.cash = 9000; const s = g.ships[0];
  assert.equal(storeGoods(g, s, "grain", 5).ok, false);
  buyWarehouse(g, "cadiz"); doBuy(g, s, "grain", 20);
  const had = s.cargo.grain;
  assert.equal(storeGoods(g, s, "grain", 1000).qty, had); assert.equal(s.cargo.grain, undefined);
  assert.equal(g.warehouses.cadiz.goods.grain, had);
  assert.equal(takeGoods(g, s, "grain", 3).qty, 3); assert.equal(s.cargo.grain, 3); assert.equal(g.warehouses.cadiz.goods.grain, had - 3);
  assert.equal(takeGoods(g, s, "salt", 3).ok, false);
  const before = netWorth(g); storeGoods(g, s, "grain", 3); assert.equal(netWorth(g), before); // stored goods still count
});
test("warehouse capacity and ship room are respected", () => {
  const g = newGame(world); g.cash = 99999; const s = g.ships[0]; buyWarehouse(g, "cadiz");
  g.warehouses.cadiz.goods.wine = WAREHOUSE_CAP - 1; s.cargo.grain = 10;
  assert.equal(storeGoods(g, s, "grain", 10).qty, 1);
  g.warehouses.cadiz.goods.salt = 500; assert.equal(takeGoods(g, s, "salt", 500).qty <= 60, true);
});
