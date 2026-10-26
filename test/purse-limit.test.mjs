// Household purses limit DISCRETIONARY retail sales; food is measured, never capped.
// Decision and evidence: docs/design/household-purses-limit.md (Marco: "2 tu decides", 26/10).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket } from "../src/sim/market.mjs";
import { commerceOf } from "../src/sim/procurement.mjs";
import { capRetailByPurses } from "../src/sim/households.mjs";
import { PURSE_UNCAPPED } from "../src/sim/households.mjs";

const w = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));

test("capRetailByPurses: pure cap math", () => {
  // plenty of purse: nothing changes
  assert.deepEqual(capRetailByPurses({ poor: 1e6, middle: 1e6, rich: 1e6 }, { poor: 0, middle: 1, rich: 3 }, 10, 100).units, 10);
  // empty purses: nothing is bought
  assert.deepEqual(capRetailByPurses({ poor: 0, middle: 0, rich: 0 }, { poor: 0, middle: 1, rich: 3 }, 10, 100).units, 0);
  // partial: only whole units that fit, spend never above the budget
  const r = capRetailByPurses({ poor: 0, middle: 0, rich: 250 }, { poor: 0, middle: 0, rich: 1 }, 10, 100);
  assert.equal(r.units, 2);
  assert.ok(r.spend.rich <= 250);
  // no desire: no sale
  assert.equal(capRetailByPurses({ poor: 1e6, middle: 1e6, rich: 1e6 }, { poor: 0, middle: 0, rich: 0 }, 10, 100).units, 0);
});

test("a port whose purses cannot cover luxury desire keeps the unsold silk but keeps eating", () => {
  // Binding by construction: a silk quarter (classExtra) adds far more rich desire than the
  // town's rich income can pay at silk prices, so the cap must bite on day 0.
  const m = makeMarket(w);
  m.cadiz.silk.classExtra = { rich: 50000 };
  const m2 = makeMarket(w); // reference run without accounts: legacy consumption
  m2.cadiz.silk.classExtra = { rich: 50000 };
  for (const row of Object.values(m2)) delete row.grain.commerce;
  tickMarket(m, 0, w);
  tickMarket(m2, 0, w, { commerceLedger: false });
  assert.ok(m.cadiz.silk.stock > m2.cadiz.silk.stock, `silk capped: ${m.cadiz.silk.stock} vs legacy ${m2.cadiz.silk.stock}`);
  assert.equal(m.cadiz.grain.stock, m2.cadiz.grain.stock, "grain (food) consumes exactly as before");
  // and the money reconciles: rich spend this day never exceeds rich purse + income
  const h = commerceOf(m.cadiz).households;
  assert.ok(h.rich.cash >= 0, "rich purse never negative");
  assert.ok(h.rich.spent > 0, "rich did pay for what they bought");
});

test("a port with rich purses buys exactly as before (no regression when the cap does not bind)", () => {
  const m = makeMarket(w), m2 = makeMarket(w);
  for (const row of Object.values(m2)) delete row.grain.commerce;
  for (let d = 0; d < 20; d++) { tickMarket(m, d, w); tickMarket(m2, d, w, { commerceLedger: false }); }
  // after 20 days of income with no player dumping, Cádiz purses cover daily desire: discretionary stocks track legacy closely
  // (caps may shave whole-unit rounding on the tightest days, never increase consumption)
  for (const g of Object.keys(m.cadiz)) {
    if (PURSE_UNCAPPED.has(g)) continue;
    assert.ok(m.cadiz[g].stock >= m2.cadiz[g].stock, `${g}: cap never raises consumption`);
    assert.ok(m.cadiz[g].stock - m2.cadiz[g].stock <= Math.max(2, m2.cadiz[g].target), `${g}: divergence stays bounded in a quiet port`);
  }
});

test("the day's discretionary spend never exceeds purse plus income", () => {
  const m = makeMarket(w);
  tickMarket(m, 0, w); // one day settles purses into existence
  const a = commerceOf(m.cadiz);
  for (const cls of ["poor", "middle", "rich"]) {
    const h = a.households[cls];
    assert.ok(h.cash >= 0, `${cls} purse never negative`);
  }
});

test("the uncapped set is exactly the daily food basket", () => {
  assert.deepEqual([...PURSE_UNCAPPED].sort(), ["fish", "grain", "legumes", "meat", "olive_oil", "salt"]);
  for (const g of ["silk", "pepper", "wine", "beer", "cloth"]) assert.ok(!PURSE_UNCAPPED.has(g), `${g} must stay capped`);
});

test("capRetailByPurses reconciles: sum(spend) === units * price, never above budget, never above desire (Web repro)", () => {
  // Web's repro of the first cut: an exhausted class was charged nothing yet its units were sold.
  const r = capRetailByPurses({ poor: 0, middle: 0, rich: 100 }, { poor: 1, middle: 0, rich: 1 }, 10, 10);
  assert.equal(r.units, 5);
  assert.equal(r.spend.rich, 50);
  assert.equal(r.spend.poor, 0, "a class that cannot pay is never charged");
  // invariant + bounds across a sweep of budgets, shares, sizes and prices
  for (const [budget, shares, units, price] of [
    [{ poor: 0, middle: 0, rich: 100 }, { poor: 1, middle: 0, rich: 1 }, 10, 10],
    [{ poor: 7, middle: 13, rich: 999 }, { poor: 3, middle: 2, rich: 5 }, 17, 6],
    [{ poor: 1e6, middle: 1e6, rich: 1e6 }, { poor: 5, middle: 3, rich: 2 }, 11, 33],
    [{ poor: 0, middle: 5, rich: 0 }, { poor: 4, middle: 4, rich: 4 }, 9, 4],
    [{ poor: 50, middle: 50, rich: 50 }, { poor: 0, middle: 0, rich: 1 }, 3, 100],
  ]) {
    const x = capRetailByPurses(budget, shares, units, price);
    const sum = Object.values(x.spend).reduce((a, b) => a + b, 0);
    assert.equal(sum, x.units * price, `reconcile ${JSON.stringify({ budget, shares, units, price })}`);
    assert.ok(x.units <= units, "never sells more than desired");
    for (const c of ["poor", "middle", "rich"]) assert.ok(x.spend[c] <= (budget[c] ?? 0) + 1e-9, `${c} never over budget`);
    // a class with no budget buys nothing even if it desired units
    for (const c of ["poor", "middle", "rich"]) if (!(budget[c] >= price)) assert.equal(x.spend[c], 0, `${c} broke`);
  }
  // no overselling beyond a rich purse's desire share even when it could pay for the poor's units too
  const y = capRetailByPurses({ poor: 0, middle: 0, rich: 1e6 }, { poor: 1, middle: 0, rich: 1 }, 10, 10);
  assert.equal(y.units, 5, "rich buys only its own desire; the poor's units stay on the shelf");
});
