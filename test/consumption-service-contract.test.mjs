// Own market regression contract. Inventory remaining is not a consumption receipt.
import test from "node:test";
import assert from "node:assert/strict";
import { tickMarketCity, cityDemand } from "../src/sim/market.mjs";
import { physicalNeeds, recordNeeds } from "../src/sim/needs.mjs";

const row = (stock, pop = 1000) => ({ grain: { stock, target: Math.max(1, stock), rate: 0, pop, makes: false, needs: false } });
const day = (city, index = 0) => tickMarketCity(city, index, undefined, { commerceLedger: false });
const read = (city) => city.grain.needsLedger.daily.byGood.grain;
const roundRequest = (city, index) => {
  const entry = city.grain;
  const demand = cityDemand(entry, "grain") * Math.min(1.5, entry.stock / Math.max(1, entry.target));
  return Math.round(demand * (index + 1)) - Math.round(demand * index);
};

test("exact whole-unit fulfilment can leave an empty shelf: consumption remains recorded", () => {
  const city = row(4);
  assert.equal(roundRequest(city, 0), 4);
  day(city);
  assert.equal(city.grain.stock, 0);
  assert.equal(read(city).consumed, 4);
  assert.equal(Math.max(0, 4 - read(city).consumed), 0, "no unmet whole-unit request");
  assert.ok(read(city).balance < 0, "signed physical balance preserves fractional rounding surplus");
});

test("zero population and empty inventory mean zero need and zero withdrawal", () => {
  const city = row(0, 0);
  day(city);
  assert.deepEqual({ need: read(city).need, desired: read(city).desired, consumed: read(city).consumed, balance: read(city).balance }, { need: 0, desired: 0, consumed: 0, balance: 0 });
  assert.equal(city.grain.stock, 0);
});

test("request above inventory serves only the available stock; physical deficit stays distinct", () => {
  const city = row(1);
  const requested = roundRequest(city, 0);
  assert.equal(requested, 4);
  day(city);
  assert.equal(city.grain.stock, 0);
  assert.equal(read(city).consumed, 1);
  assert.equal(requested - read(city).consumed, 3);
  assert.equal(read(city).balance, read(city).need - 1);
  assert.notEqual(read(city).balance, 3, "physical need and rounded purchase request are different units of evidence");
});

test("zero population with positive inventory makes no withdrawal", () => {
  const city = row(20, 0);
  day(city);
  assert.equal(city.grain.stock, 20);
  assert.equal(read(city).consumed, 0);
  assert.equal(read(city).balance, 0);
});

test("fractional daily rounding is deterministic and stock conservation holds over 30 days", () => {
  const city = row(3000);
  city.grain.target = 1000; // fixed 1.5 scarcity cap, below the 4x shelf capacity
  const dailyFraction = cityDemand(city.grain, "grain") * 1.5;
  assert.ok(!Number.isInteger(dailyFraction), "the scenario must exercise a real fraction");
  let expected = 0;
  const initial = city.grain.stock;
  for (let index = 0; index < 30; index++) {
    const requested = roundRequest(city, index);
    expected += requested;
    const before = city.grain.stock;
    day(city, index);
    assert.equal(before - city.grain.stock, requested);
    assert.equal(read(city).consumed, requested);
  }
  assert.equal(expected, Math.round(dailyFraction * 30), "a constant fractional rate telescopes without hidden carry");
  assert.equal(initial - city.grain.stock, expected);
  assert.equal(city.grain.needsLedger.totals.grain.consumed, expected);
  assert.equal(city.grain.needsLedger.days, 30);
});

test("a prior industrial withdrawal is not counted again as household consumption", () => {
  const city = row(4);
  city.grain.stock -= 2; // an earlier consumer owns this withdrawal
  city.grain.target = 1; // sufficient coverage to retain positive purchase demand
  const shelf = city.grain.stock;
  day(city);
  assert.equal(read(city).consumed, shelf - city.grain.stock);
  assert.equal(read(city).consumed, 2);
  assert.equal(city.grain.needsLedger.totals.grain.consumed, 2, "not the four units withdrawn by both consumers");
});

test("physical policy arithmetic rejects invalid rates, population and multipliers", () => {
  const valid = { grain: { unit: "game-unit", evidence: "test-assumption", perPersonDay: { poor: 1, middle: 1, rich: 1 } } };
  for (const invalid of [-1, NaN, Infinity, "1"]) {
    assert.throws(() => physicalNeeds({ poor: invalid, middle: 0, rich: 0 }, valid), /invalid physical need/);
    assert.throws(() => physicalNeeds({ poor: 1, middle: 0, rich: 0 }, valid, () => invalid), /invalid needs policy/);
    const policy = structuredClone(valid);
    policy.grain.perPersonDay.poor = invalid;
    assert.throws(() => physicalNeeds({ poor: 1, middle: 0, rich: 0 }, policy), /invalid physical need/);
  }
  const meta = {};
  const need = physicalNeeds({ poor: 0, middle: 0, rich: 0 }, valid);
  const receipt = { byClass: Object.fromEntries(["poor", "middle", "rich"].map(cls => [cls, { units: {}, spending: {} }])) };
  recordNeeds(meta, need, receipt, { policyId: "first" });
  assert.throws(() => recordNeeds(meta, need, receipt, { policyId: "other" }), /migrate ledger explicitly/);
});

test("JSON save continuation preserves day-based rounding and cumulative receipts", () => {
  const continuous = row(1000);
  continuous.grain.target = 1000;
  let resumed = structuredClone(continuous);
  for (let index = 0; index < 30; index++) {
    day(continuous, index);
    day(resumed, index);
    if (index === 12) resumed = JSON.parse(JSON.stringify(resumed));
    assert.deepEqual(resumed, continuous, `continuation at day ${index}`);
  }
});
