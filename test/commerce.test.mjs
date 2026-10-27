// Phase-0 wholesale purse + household accounting (docs/design/commerce-ledger-phase0.md):
// measurement only. These tests pin the ledger identities and, above all, that recording
// never changes the economy it observes.
import test from "node:test";
import assert from "node:assert/strict";
import { makeMarket, fillMissingMarketRows, tickMarket, tickMarketCity } from "../src/sim/market.mjs";
import { loadWorld } from "../src/sim/world.mjs";
import { makeShip, buy, sell } from "../src/sim/trade.mjs";
import { consumeUnitsImport } from "../src/sim/recipes.mjs";
import { commerceOf, openCommerce, COMMERCE_LEDGER_ENABLED, recordMarketPurchase } from "../src/sim/procurement.mjs";
import { HOUSEHOLD_INCOME } from "../src/sim/households.mjs";
import { classCounts } from "../src/sim/classes.mjs";
import { PURSE_UNCAPPED } from "../src/sim/households.mjs";

const w = loadWorld();
const cents = (x) => Math.round(x * 100) / 100;
const stockValue = (world, city) => cents(Object.entries(city).reduce((s, [g, e]) => s + (world.goods[g] ? e.stock * world.goods[g].base : 0), 0));
const basisTotal = (a) => cents(Object.values(a.inventoryBasis).reduce((s, v) => s + v, 0));

test("flag defaults ON and a new market opens one account per port at founding value", () => {
  assert.equal(COMMERCE_LEDGER_ENABLED, true);
  const m = makeMarket(w);
  const a = commerceOf(m.cadiz);
  assert.ok(a, "account exists");
  assert.equal(a.openingCapital, stockValue(w, m.cadiz));
  assert.equal(a.openingInventory, a.openingCapital);
  assert.equal(a.cash, a.openingCapital);
  assert.equal(basisTotal(a), a.openingInventory);
  assert.equal(a.households, null);
  assert.deepEqual([a.retail, a.received, a.paid, a.localSupplyValue, a.consumedBasis, a.releasedBasis], [0, 0, 0, 0, 0, 0]);
});

test("tick-only city: cash = opening + retail, and shelf book = founding + supply - consumed", () => {
  const m = makeMarket(w);
  for (let d = 0; d < 30; d++) tickMarket(m, d, w);
  const a = commerceOf(m.cadiz);
  assert.ok(a.retail > 0 && a.localSupplyValue > 0 && a.consumedBasis > 0);
  assert.equal(a.cash, cents(a.openingCapital + a.retail + a.received - a.paid), "purse cash identity");
  assert.equal(a.received + a.paid + a.releasedBasis, 0, "no trades in a tick-only run");
  assert.equal(basisTotal(a), cents(a.openingInventory + a.localSupplyValue - a.consumedBasis), "shelf book identity");
});

test("recording never changes the economy: identical ticks, stocks and trades with and without the account", () => {
  const a = makeMarket(w), b = makeMarket(w);
  for (const row of Object.values(b)) delete row.grain.commerce;
  for (let d = 0; d < 20; d++) {
    tickMarket(a, d, w);
    tickMarket(b, d, w, { commerceLedger: false });
  }
  // Declared semantic change (docs/design/household-purses-limit.md): since household purses now cap
  // DISCRETIONARY retail consumption, the account is no longer invisible for non-food goods. What must
  // stay identical is food (measured, never capped) and every ship trade; discretionary entries may only
  // diverge by keeping unsold stock (caps reduce consumption, never raise it).
  for (const [c, row] of Object.entries(a)) {
    for (const [g, e] of Object.entries(row)) {
      const { commerce, needsLedger, ...rest } = e;
      const { needsLedger: _nl, ...restB } = b[c][g];
      if (PURSE_UNCAPPED.has(g)) assert.deepEqual(rest, restB, `${c}.${g} food diverged`);
      else {
        const { stock, ...metaA } = rest, { stock: stockB, ...metaB } = restB;
        assert.deepEqual(metaA, metaB, `${c}.${g} non-stock fields diverged`);
        assert.ok(stock >= stockB, `${c}.${g} purse caps must never increase consumption`);
      }
    }
  }
  const shA = makeShip("s1", "cog", "cadiz"), shB = makeShip("s2", "cog", "cadiz");
  const rb = buy(w, a, shA, 5000, "grain", 20);
  const rc = buy(w, b, shB, 5000, "grain", 20);
  assert.deepEqual({ qty: rb.qty, cost: rb.cost }, { qty: rc.qty, cost: rc.cost }, "buy outcome identical");
  const rsA = sell(w, a, shA, "grain", rb.qty), rsB = sell(w, b, shB, "grain", rc.qty);
  assert.deepEqual({ qty: rsA.qty, revenue: rsA.revenue, profit: rsA.profit }, { qty: rsB.qty, revenue: rsB.revenue, profit: rsB.profit }, "sell outcome identical");
  assert.equal(a.cadiz.grain.stock, b.cadiz.grain.stock, "stock after round trip identical");
});

test("ship trades feed the purse: received/paid identities and exact shelf settlement", () => {
  const m = makeMarket(w);
  tickMarket(m, 0, w);
  const a = commerceOf(m.cadiz);
  const sh = makeShip("s1", "nao", "cadiz");
  const r = buy(w, m, sh, 100000, "grain", 30);
  assert.ok(r.ok && r.qty === 30);
  assert.equal(a.received, cents(r.cost));
  assert.equal(a.cash, cents(a.openingCapital + a.retail + a.received - a.paid));
  const s = sell(w, m, sh, "grain", 30);
  assert.ok(s.ok);
  assert.equal(a.paid, cents(s.revenue));
  assert.equal(a.cash, cents(a.openingCapital + a.retail + a.received - a.paid), "cash identity across both legs");
  // buy the whole shelf of a good: its book value must settle to exactly zero
  const e = m.cadiz.fish, had = e.stock;
  let trips = 0;
  while (e.stock > 0 && trips < 20) { // ship capacity is the limit, so empty the shelf in trips
    const t = buy(w, m, makeShip("trip" + trips, "nao", "cadiz"), 10000000, "fish", e.stock);
    assert.ok(t.ok && t.qty > 0);
    trips++;
  }
  assert.equal(a.inventoryBasis.fish, 0, "empty shelf, zero book value");
  assert.ok(a.releasedBasis > 0);
});

test("phase 1: the purse is binding, a deep-negative purse buys nothing", () => {
  const m = makeMarket(w);
  const a = commerceOf(m.cadiz);
  a.cash = -999999; // phase 0 bookkeeping could go negative unnoticed; phase 1 makes the purse binding
  const sh = makeShip("s1", "cog", "cadiz");
  sh.cargo.grain = 50;
  sh.basis = { grain: 500 };
  const before = m.cadiz.grain.stock;
  const r = sell(w, m, sh, "grain", 50);
  assert.deepEqual(r, { ok: false, reason: "market has no cash" }, "a negative purse pays nothing");
  assert.equal(m.cadiz.grain.stock, before, "no stock moved");
  assert.equal(sh.cargo.grain, 50, "cargo stays aboard");
});

test("old save without accounts: fillMissingMarketRows reopens them at current stock value", () => {
  const m = makeMarket(w);
  for (let d = 0; d < 5; d++) tickMarket(m, d, w);
  for (const row of Object.values(m)) delete row.grain.commerce; // a save from before the ledger
  fillMissingMarketRows(w, m);
  const a = commerceOf(m.cadiz);
  assert.ok(a, "account reopened");
  assert.equal(a.openingCapital, stockValue(w, m.cadiz), "opening = stock on hand at load (declared approximation)");
  assert.equal(a.retail, 0, "history before the ledger is not invented");
});

test("lazy open: an account-less city gets its account on its first tick; bare fixtures stay untouched", () => {
  const m = makeMarket(w);
  delete m.cadiz.grain.commerce;
  tickMarketCity(m.cadiz, 0, w);
  assert.ok(commerceOf(m.cadiz), "opened by the tick");
  const bare = { fish: { stock: 5, target: 10, makes: false, needs: false, rate: 1, pop: 1000 } }; // no grain row at all: no account can open
  tickMarketCity(bare, 0, w, { needsLedger: false }); // commerce stays off, nothing opened, no crash
  assert.equal(commerceOf(bare), null);
  recordMarketPurchase({}, "grain", 3, 10, 5); // recorder on a market without an account: a silent no-op
});

test("save/reload equivalence: JSON round-trip mid-run matches the uninterrupted run exactly", () => {
  const a = makeMarket(w);
  let b = makeMarket(w);
  for (let d = 0; d < 30; d++) {
    tickMarket(a, d, w);
    tickMarket(b, d, w);
    if (d === 14) b = JSON.parse(JSON.stringify(b));
  }
  assert.deepEqual(b, a);
});

test("household purses: exact income, spend capped by cash, unmet only above means", () => {
  const m = makeMarket(w);
  tickMarket(m, 0, w);
  const a = commerceOf(m.cadiz);
  assert.ok(a.households, "households settled on first tick");
  const counts = classCounts(m.cadiz.grain.pop);
  for (const [cls, h] of Object.entries(a.households)) {
    assert.equal(h.income, cents(counts[cls] * HOUSEHOLD_INCOME[cls]), `${cls} income exact`);
    assert.ok(h.spent <= h.income + 1e-9, "spend never exceeds cash on hand");
    assert.ok(h.unmet >= 0);
    assert.equal(cents(h.cash + h.spent), h.income, "cash + spent = income");
  }
  const totalSpent = cents(Object.values(a.households).reduce((s, h) => s + h.spent + h.unmet, 0));
  assert.ok(Math.abs(totalSpent - a.retail) < 1, "attributed class spend covers the recorded retail (rounding slack)");
});

test("construction materials: only the local part pays the purse, imports stay outside (declared scope)", () => {
  const m = makeMarket(w);
  tickMarket(m, 0, w);
  const a = commerceOf(m.cadiz);
  const have = m.cadiz.bricks.stock, qty = have + 10; // 10 beyond the shelf: imported at the premium
  const receivedBefore = a.received;
  const r = consumeUnitsImport(w, m, "cadiz", { bricks: qty }, 1000000);
  assert.ok(r.ok && r.local.bricks === have && r.imported.bricks === 10);
  const localPaid = cents(a.received - receivedBefore);
  assert.ok(localPaid > 0 && localPaid < r.lineCosts.bricks, "local part recorded, import premium outside the purse");
  assert.equal(a.cash, cents(a.openingCapital + a.retail + a.received - a.paid), "cash identity still holds");
});
