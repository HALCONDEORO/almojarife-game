import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse, warehouseCap } from "../src/game/game.mjs";
import { setStewardRule, stewardTick } from "../src/game/steward.mjs";
import { FEE } from "../src/sim/trade.mjs";
import { price } from "../src/sim/market.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};

test("the recorded sale is the committed one: units, revenue, fee, stock and cash all agree", () => {
  const game = setup();
  const entry = game.market.cadiz.grain;
  entry.stock = 1; // dear: the clamp-high price clears any floor
  const dear = price(world, entry, "grain");
  game.warehouses.cadiz.goods.grain = 30;
  game.warehouses.cadiz.basis = { grain: 300 };
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { sellAbove: Math.min(dear, 1), sellKeep: 5 }, cap).ok);
  const cashBefore = game.cash;
  const stockBefore = entry.stock;
  const did = stewardTick(game, "cadiz", cap);
  assert.equal(did.length, 1);
  const sale = did[0];
  assert.equal(sale.sold, 25, "every unit above the keep was committed");
  assert.equal(entry.stock, stockBefore + 25, "the market gained exactly the committed units");
  assert.equal(game.warehouses.cadiz.goods.grain, 5, "the keep stayed in the store");
  assert.ok(Math.abs(game.cash - (cashBefore + sale.revenue)) < 1e-9, "cash moved by the recorded revenue, nothing else");
  assert.ok(sale.fee > 0, "the port took its cut");
  assert.ok(sale.fee < sale.revenue * (FEE + 0.02), "and the fee is the fee, no more (rounding aside)");
});

test("the recorded purchase is the committed one, fee included in the cost", () => {
  const game = setup();
  const entry = game.market.cadiz.grain;
  entry.stock = entry.target * 4; // clamp-low price
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 10 }, cap).ok);
  const cashBefore = game.cash;
  const stockBefore = entry.stock;
  const did = stewardTick(game, "cadiz", cap);
  const buy = did[0];
  assert.equal(buy.bought, 10);
  assert.equal(entry.stock, stockBefore - 10);
  assert.equal(game.warehouses.cadiz.goods.grain, 10);
  assert.ok(Math.abs(game.cash - (cashBefore - buy.cost)) < 1e-9);
  assert.ok(buy.fee > 0);
  assert.ok(buy.fee < buy.cost, "the fee is a part of the cost, not on top");
});

test("a rule whose price never crosses commits nothing, and the day reports no action", () => {
  const game = setup();
  const entry = game.market.cadiz.grain;
  entry.stock = 1; // dear
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1, buyTo: 10 }, cap).ok);
  const cashBefore = game.cash;
  assert.equal(stewardTick(game, "cadiz", cap), null, "processed without action: not a trade");
  assert.equal(game.cash, cashBefore);
  assert.equal(game.warehouses.cadiz.goods.grain ?? 0, 0);
});

test("a sale cut short by the price floor records only the committed units", () => {
  const game = setup();
  const entry = game.market.cadiz.grain;
  entry.stock = 1;
  const dear = price(world, entry, "grain");
  game.warehouses.cadiz.goods.grain = 60;
  const cap = warehouseCap(game, "cadiz");
  // floor just below today's price: the first units clear it, the cheaper later ones do not
  assert.ok(setStewardRule(game, "cadiz", "grain", { sellAbove: dear - 0.5, sellKeep: 0 }, cap).ok);
  const did = stewardTick(game, "cadiz", cap);
  const sale = did[0];
  assert.ok(sale.sold > 0 && sale.sold < 60, `partial commit: ${sale.sold} of 60`);
  assert.equal(game.warehouses.cadiz.goods.grain, 60 - sale.sold, "the store keeps exactly the uncommitted rest");
  assert.equal(entry.stock, 1 + sale.sold);
});
