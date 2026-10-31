import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSellStored, doSellCombined, sellableHold, sellRequestQty, previewSellCombinedPort, buyWarehouse, storeGoods, feeMul } from "../src/game/game.mjs";
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

test("doSellStored books the sale in the weekly ledger and advances sell missions", () => {
  const g = newGame(world); g.cash = 50000;
  g.tutorial = null; // missions frozen during the tutorial by design
  g.basis = { salt: { qty: 40, cost: 400 } };
  g.warehouses.sevilla = { goods: { salt: 40 }, basis: { salt: 400 } };
  g.contracts = { offers: {}, active: [], done: 0 };
  g.campaign = { active: ["m1-oficio"], missions: { "m1-oficio": { step: 3, count: 0, done: false, failed: false } } };
  const r = doSellStored(g, "sevilla", "salt", 40);
  assert.equal(r.ok, true);
  const w = g.weekTrade.salt;
  assert.equal(w.sold, 40, "weekTrade counts the warehouse sale");
  assert.ok(w.revenue > 0, "revenue booked");
  assert.ok((g.basis.salt?.qty ?? 0) === 0, "global book cost goes down with the sale");
  assert.ok(g.campaign.missions["m1-oficio"].count >= 40 || g.campaign.missions["m1-oficio"].step > 3 || g.campaign.missions["m1-oficio"].done, "sell mission advances with store sales");
});

test("doSellCombined is one transaction: combined preview matches execution at a respect threshold", () => {
  const { g, s } = gameWithStore(5, 10);
  g.market.cadiz.grain.stock = 1; g.market.cadiz.grain.target = 1000;
  g.portRep = { cadiz: 19.99 }; // a hair under the respect tier: the cargo sale alone would cross it and move the fee
  const f0 = FEE * feeMul(g, "cadiz");
  const pv = previewSellCombined(g.world, g.market, s, g.warehouses.cadiz, "grain", 10, f0);
  const cash0 = g.cash;
  const r = doSellCombined(g, s, "grain", 10, g.warehouses.cadiz);
  assert.equal(r.ok, true);
  assert.equal(r.qty, pv.qty, "executed qty matches the combined preview");
  assert.ok(Math.abs(r.revenue - pv.revenue) < 0.02, `preview ${pv.revenue} matches executed ${r.revenue} (one fee for the whole click)`);
  assert.ok(r.profit > 0 && r.spent > 0, "combined result carries the gain parts (tutorial sell step needs them)");
  assert.ok(Math.abs((g.cash - cash0) - r.revenue) < 0.02, "cash moves by the combined revenue");
  assert.equal(g.weekTrade.grain.sold, r.qty, "one ledger entry for the combined sale");
});

test("doSellCombined stops at the port purse and says so when the market has no cash", () => {
  const { g, s } = gameWithStore(5, 10);
  const e = g.market.cadiz.grain;
  e.commerce = { cash: 5, income: 0, spent: 0 }; // binding purse with almost no cash (commerceOf reads the good entry)
  const f0 = FEE * feeMul(g, "cadiz");
  const pv = previewSellCombined(g.world, g.market, s, g.warehouses.cadiz, "grain", 15, f0);
  const r = doSellCombined(g, s, "grain", 15, g.warehouses.cadiz);
  if (pv.qty === 0) assert.equal(r.ok, false, "empty purse rejects the sale");
  else { assert.equal(r.qty, pv.qty, "purse cap traced the same way in preview and execution"); }
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
  const ps = previewSellCombined(g.world, g.market, s, g.warehouses.cadiz, "grain", 4, FEE * feeMul(g, "cadiz"));
  assert.equal(ps.qty, 4); assert.equal(ps.fromCargo, 0); assert.equal(ps.fromStore, 4);
  const r = doSellCombined(g, s, "grain", 4, g.warehouses.cadiz); // the UI route: must not trip on the empty hold
  assert.equal(r.ok, true); assert.equal(r.qty, 4);
  assert.ok(Math.abs(r.revenue - ps.revenue) < 0.02, "execution matches the store-only preview");
  assert.equal(g.warehouses.cadiz.goods.grain, 2);
  const r2 = doSellStored(g, "cadiz", "grain", 2);
  assert.equal(r2.ok, true); assert.equal(g.warehouses.cadiz.goods.grain ?? 0, 0); // a sold-out good leaves no entry, same as the hold
});

test("doSellCombined never sells or drains locked prize goods", () => {
  const { g, s } = gameWithStore(5, 10);
  g.marque = true; s.prizeLots = [{ goods: { grain: 5 } }]; // the whole hold is prize cargo awaiting a court
  const cash0 = g.cash;
  const r = doSellCombined(g, s, "grain", 5, g.warehouses.cadiz);
  assert.equal(r.ok, true); assert.equal(r.qty, 5); // the sale still works: the 5 come from the store
  assert.equal(s.cargo.grain, 5, "prize cargo untouched");
  assert.equal(s.prizeLots[0].goods.grain, 5, "prize lot untouched");
  assert.equal(g.warehouses.cadiz.goods.grain, 5, "store leg carried the whole sale");
  assert.ok(g.cash > cash0, "cash credited from the store sale");
  const r2 = doSellCombined(g, s, "grain", 11, g.warehouses.cadiz); // 0 sellable hold + 5 store left
  assert.equal(r2.ok, false); assert.equal(r2.reason, "prize");
  assert.equal(s.cargo.grain, 5, "still untouched after the rejected sale");
});

test("preview and MAX use the sellable hold: locked prizes stay out of the number the player sees", () => {
  const { g, s } = gameWithStore(5, 10);
  g.marque = true; s.prizeLots = [{ goods: { grain: 5 } }]; // whole hold locked
  assert.equal(sellableHold(g, s, "grain"), 0);
  const pv = previewSellCombinedPort(g, s, "grain", 15, g.warehouses.cadiz); // what MAX would offer
  assert.equal(pv.qty, 10, "preview clamps to sellable hold + store, never the locked units");
  assert.equal(pv.fromCargo, 0); assert.equal(pv.fromStore, 10);
  const r = doSellCombined(g, s, "grain", pv.qty, g.warehouses.cadiz); // executing exactly the previewed click
  assert.equal(r.ok, true);
  assert.equal(r.qty, pv.qty);
  assert.ok(Math.abs(r.revenue - pv.revenue) < 0.02, `execution ${r.revenue} matches preview ${pv.revenue}`);
  assert.ok(Math.abs(r.profit - pv.profit) < 0.02, `execution profit ${r.profit} matches preview profit ${pv.profit} (no phantom cargo cost)`);
  assert.ok(Math.abs(r.spent - pv.spent) < 0.02 || pv.spent === undefined, "spent matches when the preview reports it");
});

test("partially locked hold: preview and execution split the same way", () => {
  const { g, s } = gameWithStore(5, 10);
  g.marque = true; s.prizeLots = [{ goods: { grain: 2 } }]; // 3 sellable of 5 in the hold
  assert.equal(sellableHold(g, s, "grain"), 3);
  const pv = previewSellCombinedPort(g, s, "grain", 5, g.warehouses.cadiz);
  assert.equal(pv.fromCargo, 3); assert.equal(pv.fromStore, 2);
  const r = doSellCombined(g, s, "grain", 5, g.warehouses.cadiz);
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.revenue - pv.revenue) < 0.02 && Math.abs(r.profit - pv.profit) < 0.02, "preview parity with a partially locked hold");
  assert.equal(s.cargo.grain, 2, "only the locked units remain");
  assert.equal(s.prizeLots[0].goods.grain, 2, "prize lot untouched");
});

test("fixed sell buttons clamp to the sellable stock (the exact quantity the handler sends)", () => {
  for (const v of [20, 100]) { // the UI quantity buttons, with the whole hold locked as prize
    const { g, s } = gameWithStore(5, 10);
    g.marque = true; s.prizeLots = [{ goods: { grain: 5 } }];
    const want = sellRequestQty(g, s, "grain", v, g.warehouses.cadiz); // what data-s="grain:20" now sends
    assert.equal(want, 10, `button ${v} asks only for sellable hold + store`);
    const pv = previewSellCombinedPort(g, s, "grain", want, g.warehouses.cadiz);
    const r = doSellCombined(g, s, "grain", want, g.warehouses.cadiz); // executing the exact click
    assert.equal(r.ok, true);
    assert.equal(r.qty, pv.qty);
    assert.ok(Math.abs(r.revenue - pv.revenue) < 0.02 && Math.abs(r.profit - pv.profit) < 0.02, `button ${v}: execution matches the painted preview`);
    assert.equal(s.cargo.grain, 5, "prize cargo untouched");
  }
});

test("market sell button preview uses cargo plus warehouse stock (UI wiring)", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.match(src, /sq = marketQty === "max" \? Math\.max\(1, free \+ storedEff\) : marketQty/); // MAX asks for hold plus lock-filtered store stock
  assert.match(src, /ps = previewSellCombined\(g\.world, g\.market, s, whEff, gd, sq, mktFee, free\)/); // the painted preview reads the same lock-filtered store
  assert.match(src, /const want = amt === "all" \? sellableHold\(g, s, gd\) \+ \(whLocked\(wh, gd\) \? 0 : \(wh\?\.goods\?\.\[gd\] \?\? 0\)\) : sellRequestQty\(g, s, gd, Number\(amt\), wh\)/);
  assert.match(src, /doSellCombined\(g, s, gd, want, wh\)/);
});
