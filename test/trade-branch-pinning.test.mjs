// Branch-pinning tests for src/sim/trade.mjs pure helpers: they lock the CURRENT
// behavior of shipTypeName, previewBuy, previewSell, sellStored and previewSellCombined
// on the edge paths the main suites do not exercise. No production behavior is changed.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, price } from "../src/sim/market.mjs";
import {
  SHIP_TYPE_NAMES, shipTypeName, makeShip, sail, buy, sell,
  previewBuy, previewSell, sellStored, previewSellCombined, FEE,
} from "../src/sim/trade.mjs";
import { commerceOf } from "../src/sim/procurement.mjs";

const world = loadWorld();
const [A, B] = [world.cities[0].id, world.cities[1].id];
const GOOD = world.cities[0].makes[0];

// --- shipTypeName: display names and raw-key fallback (lines 28-30) ---
test("shipTypeName returns the localized name for known types", () => {
  for (const [type, names] of Object.entries(SHIP_TYPE_NAMES)) {
    assert.equal(shipTypeName(type, "es"), names.es);
    assert.equal(shipTypeName(type, "en"), names.en);
  }
});
test("shipTypeName falls back to the raw key for unknown types and non-en languages", () => {
  assert.equal(shipTypeName("zeppelin", "es"), "zeppelin");
  assert.equal(shipTypeName("zeppelin", "en"), "zeppelin");
  assert.equal(shipTypeName("cog", "fr"), SHIP_TYPE_NAMES.cog.es, "any non-en language gets the Spanish name");
});

// --- previewBuy guards and limit reasons ---
test("previewBuy refuses at sea, missing market, bad qty and negative cash without mutating", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  sail(world, s, B);
  assert.deepEqual(previewBuy(world, m, s, 1e6, GOOD, 5), { qty: 0, cost: 0, avg: 0, next: null });
  s.voyage = null;
  assert.equal(previewBuy(world, m, s, 1e6, "unobtanium", 5).qty, 0);
  assert.equal(previewBuy(world, m, s, 1e6, GOOD, 0).qty, 0);
  assert.equal(previewBuy(world, m, s, 1e6, GOOD, -3).qty, 0);
  assert.equal(previewBuy(world, m, s, 1e6, GOOD, 2.5).qty, 0);
  assert.equal(previewBuy(world, m, s, -1, GOOD, 5).qty, 0, "negative cash is rejected");
  const stock0 = m[A][GOOD].stock;
  previewBuy(world, m, s, 1e6, GOOD, 10);
  assert.equal(m[A][GOOD].stock, stock0, "a preview never moves real stock");
});
test("previewBuy with Infinity qty is capped by stock and reports the stock limit", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const stock0 = m[A][GOOD].stock;
  const pv = previewBuy(world, m, s, 1e12, GOOD, Infinity);
  assert.ok(pv.qty > 0 && pv.qty <= Math.min(stock0, 60));
  assert.equal(m[A][GOOD].stock, stock0, "still no mutation");
  const big = previewBuy(world, m, s, 1e12, GOOD, 1e12);
  assert.equal(big.qty, pv.qty, "a huge finite qty behaves like Infinity");
  assert.equal(big.limit, pv.qty === stock0 ? "stock" : "room");
});
test("previewBuy reports the cash limit when the budget runs out first", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const unit = Math.ceil(price(world, m[A][GOOD], GOOD) * (1 + FEE) * 100 - 1e-9) / 100;
  const pv = previewBuy(world, m, s, unit * 3 + unit / 2, GOOD, 100);
  assert.equal(pv.qty, 3);
  assert.equal(pv.limit, "cash");
  assert.ok(pv.cost <= unit * 3 + unit / 2);
  assert.equal(pv.avg, Math.round(pv.cost / 3 * 100) / 100);
  assert.equal(typeof pv.next, "number");
});
test("previewBuy reports the room limit when the hold fills first", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const other = Object.keys(world.goods).find((g) => g !== GOOD);
  const b = buy(world, m, s, 1e9, other, 55);
  assert.ok(b.ok && b.qty >= 55 - 1, "mostly full hold");
  const pv = previewBuy(world, m, s, 1e9, GOOD, 100);
  assert.equal(pv.limit, "room");
  assert.equal(pv.qty, 60 - b.qty, "only the free hold space is quoted");
});

// --- previewSell guards, basis and purse cap ---
test("previewSell refuses at sea, missing market, bad qty and empty hold", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const empty = { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  assert.deepEqual(previewSell(world, m, s, GOOD, 5), empty, "nothing held");
  const b = buy(world, m, s, 1e9, GOOD, 5);
  assert.ok(b.ok);
  assert.equal(previewSell(world, m, s, "unobtanium", 1).qty, 0);
  assert.equal(previewSell(world, m, s, GOOD, 0).qty, 0);
  assert.equal(previewSell(world, m, s, GOOD, 1.5).qty, 0);
  sail(world, s, B);
  assert.deepEqual(previewSell(world, m, s, GOOD, 1), empty, "at sea");
});
test("previewSell with no book basis reports profit equal to revenue and hasBasis false", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  s.cargo[GOOD] = 4; // cargo with no basis (e.g. looted goods)
  const pv = previewSell(world, m, s, GOOD, 4);
  assert.equal(pv.qty, 4);
  assert.equal(pv.hasBasis, false);
  assert.equal(pv.profit, pv.revenue, "no cost basis: it is all profit");
});
test("previewSell caps the quote at the purse cash and matches the real partial sale", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const b = buy(world, m, s, 1e9, GOOD, 40);
  assert.ok(b.ok && b.qty > 5);
  const purse = commerceOf(m[A]);
  const full = previewSell(world, m, s, GOOD, b.qty);
  purse.cash = Math.max(1, Math.floor(full.revenue / 2)); // squeeze the purse below the full sale
  const pv = previewSell(world, m, s, GOOD, b.qty);
  assert.ok(pv.qty > 0 && pv.qty < b.qty, "the quote stops at the purse");
  assert.ok(pv.revenue <= purse.cash);
  const r = sell(world, m, s, GOOD, b.qty);
  assert.equal(r.qty, pv.qty);
  assert.equal(r.revenue, pv.revenue);
});

// --- sellStored guards and book-cost share ---
test("sellStored refuses bad qty, missing market, nothing stored and an empty purse", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const store = { goods: { [GOOD]: 10 }, basis: { [GOOD]: 100 } };
  assert.deepEqual(sellStored(world, m, A, store, GOOD, 0), { ok: false, reason: "bad quantity" });
  assert.deepEqual(sellStored(world, m, A, store, GOOD, 1.5), { ok: false, reason: "bad quantity" });
  assert.deepEqual(sellStored(world, m, A, store, "unobtanium", 5), { ok: false, reason: "no market" });
  assert.deepEqual(sellStored(world, m, A, { goods: {}, basis: {} }, GOOD, 5), { ok: false, reason: "nothing to sell" });
  commerceOf(m[A]).cash = 0;
  assert.deepEqual(sellStored(world, m, A, store, GOOD, 5), { ok: false, reason: "market has no cash" });
  assert.equal(store.goods[GOOD], 10, "a refused sale keeps the goods");
  void s;
});
test("sellStored splits the book cost proportionally on a partial sale and cleans up emptied keys", () => {
  const m = makeMarket(world);
  const store = { goods: { [GOOD]: 10 }, basis: { [GOOD]: 100 } };
  const r1 = sellStored(world, m, A, store, GOOD, 4);
  assert.ok(r1.ok && r1.qty === 4);
  assert.equal(r1.spent, 40, "4/10 of the book cost leaves with the goods");
  assert.equal(store.basis[GOOD], 60);
  const r2 = sellStored(world, m, A, store, GOOD, 6);
  assert.ok(r2.ok && r2.qty === 6);
  assert.equal(r2.spent, 60, "a full sale settles the exact remaining cost");
  assert.equal(store.goods[GOOD], undefined, "emptied good is removed");
  assert.equal(store.basis[GOOD], undefined, "its basis is removed too");
});

// --- previewSellCombined guards and hold/store split ---
test("previewSellCombined refuses at sea and with nothing to sell; hold goes before the store", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const store = { goods: { [GOOD]: 5 }, basis: { [GOOD]: 50 } };
  const empty = { qty: 0, revenue: 0, avg: 0, profit: 0, next: null };
  assert.deepEqual(previewSellCombined(world, m, s, { goods: {}, basis: {} }, GOOD, 3), empty, "empty hold and empty store");
  const only = previewSellCombined(world, m, s, store, GOOD, 3);
  assert.equal(only.qty, 3);
  assert.equal(only.fromCargo, 0);
  assert.equal(only.fromStore, 3, "an empty hold means the store sells alone");
  const b = buy(world, m, s, 1e9, GOOD, 10);
  assert.ok(b.ok);
  const pv = previewSellCombined(world, m, s, store, GOOD, 12);
  assert.equal(pv.qty, 12);
  assert.equal(pv.fromCargo, 10, "the hold empties first");
  assert.equal(pv.fromStore, 2, "the rest comes from the store");
  sail(world, s, B);
  assert.deepEqual(previewSellCombined(world, m, s, store, GOOD, 1), empty, "at sea");
});
test("previewSellCombined respects holdAvail: locked hold goods never enter the quote", () => {
  const m = makeMarket(world), s = makeShip(1, "cog", A);
  const b = buy(world, m, s, 1e9, GOOD, 10);
  assert.ok(b.ok);
  const store = { goods: { [GOOD]: 5 }, basis: { [GOOD]: 50 } };
  const pv = previewSellCombined(world, m, s, store, GOOD, 20, FEE, 4);
  assert.equal(pv.qty, 9, "only 4 hold + 5 stored are sellable");
  assert.equal(pv.fromCargo, 4);
  assert.equal(pv.fromStore, 5);
});
