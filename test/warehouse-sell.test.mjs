import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSellStored, buyWarehouse, storeGoods, feeMul } from "../src/game/game.mjs";
import { previewSellCombined, sellStored, FEE } from "../src/sim/trade.mjs";
const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

function gameWithStore(qtyCargo, qtyStore) {
  const g = newGame(world); g.cash = 50000; const s = g.ships[0];
  buyWarehouse(g, "cadiz"); doBuy(g, s, "grain", qtyCargo + qtyStore);
  if (qtyStore) storeGoods(g, s, "grain", qtyStore);
  return { g, s };
}

test("sellStored moves goods from the warehouse into the market and pays cash minus the fee", () => {
  const { g } = gameWithStore(0, 10);
  const w = g.warehouses.cadiz, e = g.market.cadiz.grain;
  const cash0 = g.cash, stock0 = e.stock;
  const ps = previewSellCombined(g.world, g.market, g.ships[0], w, "grain", 4, FEE);
  assert.equal(ps.qty, 4); assert.equal(ps.fromCargo, 0); assert.equal(ps.fromStore, 4);
  const r = sellStored(g.world, g.market, "cadiz", w, "grain", 4, FEE);
  assert.equal(r.ok, true); assert.equal(r.qty, 4);
  assert.equal(w.goods.grain, 6); assert.equal(e.stock, stock0 + 4);
  assert.ok(r.revenue > 0, "revenue returned; crediting cash is the caller's job");
  assert.equal(g.cash, cash0, "sellStored itself does not touch cash");
  assert.ok(Math.abs(ps.revenue - r.revenue) < 0.02, "preview matches the executed sale");
});

test("doSellStored credits cash, counts for the council contract and respects the fee", () => {
  const { g } = gameWithStore(0, 8);
  const cash0 = g.cash, stock0 = g.market.cadiz.grain.stock;
  g.contracts = { offers: {}, active: [{ city: "cadiz", good: "grain", qty: 6, delivered: 0, dueDay: g.day + 10, reward: 100 }], done: 0 };
  const r = doSellStored(g, "cadiz", "grain", 5);
  assert.equal(r.ok, true); assert.equal(r.qty, 5);
  assert.equal(g.warehouses.cadiz.goods.grain, 3);
  assert.equal(g.market.cadiz.grain.stock, stock0 + 5);
  assert.ok(g.cash > cash0, "cash credited");
  assert.equal(g.contracts.active[0].delivered, 5, "warehouse sale counts towards the contract");
  const noWh = newGame(world);
  assert.equal(doSellStored(noWh, "cadiz", "grain", 1).reason, "no warehouse here");
});

test("previewSellCombined spans cargo first and then the warehouse, one price path", () => {
  const { g, s } = gameWithStore(5, 10);
  const w = g.warehouses.cadiz;
  const ps = previewSellCombined(g.world, g.market, s, w, "grain", 12, FEE * feeMul(g, "cadiz"));
  assert.equal(ps.qty, 12); assert.equal(ps.fromCargo, 5); assert.equal(ps.fromStore, 7);
  // Execute the same sale in two steps: cargo first, then the store. Revenue must match the preview exactly.
  const r1 = doSell(g, s, "grain", 5);
  const r2 = doSellStored(g, "cadiz", "grain", 7);
  assert.ok(r1.ok && r2.ok);
  assert.ok(Math.abs(r1.revenue + r2.revenue - ps.revenue) < 0.02, `preview ${ps.revenue} vs actual ${r1.revenue + r2.revenue}`);
  assert.equal(s.cargo.grain, undefined); assert.equal(w.goods.grain, 3);
});

test("preview and sale fall back to the warehouse when the hold is empty", () => {
  const { g, s } = gameWithStore(0, 6);
  const ps = previewSellCombined(g.world, g.market, s, g.warehouses.cadiz, "grain", 4, FEE);
  assert.equal(ps.qty, 4); assert.equal(ps.fromCargo, 0); assert.equal(ps.fromStore, 4);
  const r = doSellStored(g, "cadiz", "grain", 4);
  assert.equal(r.ok, true); assert.equal(g.warehouses.cadiz.goods.grain, 2);
});

test("market sell button preview uses cargo plus warehouse stock (UI wiring)", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.match(src, /sq = marketQty === "max" \? Math\.max\(1, have \+ stored\) : marketQty/);
  assert.match(src, /ps = previewSellCombined\(g\.world, g\.market, s, wh, gd, sq, mktFee\)/);
  assert.match(src, /doSellStored\(g, s\.at, gd, want - soldQ\)/);
});
