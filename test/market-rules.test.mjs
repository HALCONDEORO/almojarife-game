// Market rule pinning: exact price curve, market founding math, demand multipliers and the
// per-day tick identities that the broader suites (seasons, commerce, economy-invariants)
// only exercise loosely. Expected values are computed by hand from src/sim/market.mjs and
// src/sim/classes.mjs; see the comments next to each assertion.
import test from "node:test";
import assert from "node:assert/strict";
import { makeMarket, price, affordRatio, cityDemand, cityDemandBy, tickMarketCity } from "../src/sim/market.mjs";
import { demandBy, demandOf } from "../src/sim/classes.mjs";

const world = {
  cities: [{ id: "cadiz", pop: 10000, makes: ["grain"], needs: ["wine"] }],
  goods: { grain: { base: 10 }, wine: { base: 8 }, fish: { base: 20 }, iron: { base: 5 } },
};
// A bare fixture (no commerce/needs ledgers) so the tick runs the pure stock math.
const NO_LEDGERS = { needsLedger: false, commerceLedger: false };

test("makeMarket: target, stock, rate, flags and pop follow the founding formulas", () => {
  const market = makeMarket(world);
  // pop 10000 -> pop/100 = 100: makes x3, needs x1, neither x1.5; stock starts at target.
  // (Entries also carry a commerce ledger while COMMERCE_LEDGER_ENABLED is on; pinned in commerce.test.mjs.)
  assert.deepEqual(
    Object.fromEntries(Object.entries(market.cadiz).map(([good, entry]) => [good, (({ stock, target, makes, needs, rate, pop }) => ({ stock, target, makes, needs, rate, pop }))(entry)])),
    {
      grain: { stock: 300, target: 300, makes: true, needs: false, rate: 10, pop: 10000 },
      wine: { stock: 100, target: 100, makes: false, needs: true, rate: 10, pop: 10000 },
      fish: { stock: 150, target: 150, makes: false, needs: false, rate: 10, pop: 10000 },
      iron: { stock: 150, target: 150, makes: false, needs: false, rate: 10, pop: 10000 },
    });
  // rate is max(1, round(pop/1000)): a 400-soul village rounds to 0 but keeps rate 1.
  const small = makeMarket({ cities: [{ id: "v", pop: 400, makes: [], needs: [] }], goods: { grain: { base: 10 } } });
  assert.equal(small.v.grain.rate, 1);
  assert.equal(small.v.grain.target, Math.round(400 / 100 * 1.5)); // 6
});

test("price: parity at target stock, exact curve off parity", () => {
  // base 10, target 300. price = round(base * clamp(ratio^0.6)), ratio = target/max(1,stock).
  assert.equal(price(world, { stock: 300, target: 300 }, "grain"), 10); // ratio 1
  assert.equal(price(world, { stock: 150, target: 300 }, "grain"), 15); // 2^0.6 = 1.5157 -> 15.157 -> 15
  assert.equal(price(world, { stock: 600, target: 300 }, "grain"), 7); // 0.5^0.6 = 0.6598 -> 6.598 -> 7
  assert.equal(price(world, { stock: 100, target: 300 }, "grain"), 19); // 3^0.6 = 1.9332 -> 19.33 -> 19
  assert.equal(price(world, { stock: 1200, target: 300 }, "grain"), 4); // 0.25^0.6 = 0.4353 -> 4.35 -> 4
});

test("price: clamped to 3x base when scarce and 0.4x when glutted", () => {
  assert.equal(price(world, { stock: 1, target: 300 }, "grain"), 30); // ratio 300 -> ^0.6 way over 3 -> 3x
  assert.equal(price(world, { stock: 30000, target: 300 }, "grain"), 4); // ratio 0.01 -> ^0.6 = 0.063 -> 0.4x
  assert.equal(price(world, { stock: 0, target: 300 }, "grain"), 30); // max(1, stock): empty stock reads as 1
});

test("affordRatio is the same rounded price curve the player sees", () => {
  for (const stock of [1, 100, 150, 300, 450, 600, 1200, 30000]) {
    const entry = { stock, target: 300 };
    assert.equal(Math.round(10 * affordRatio(entry, 10)), price(world, entry, "grain"), `stock ${stock}`);
  }
  assert.equal(affordRatio({ stock: 300, target: 300 }, 10), 1); // parity ratio is exactly 1
});

test("cityDemand: needs multiplies by 3, making it yourself multiplies by 0.3", () => {
  const base = { stock: 300, target: 300, pop: 10000 };
  const neither = cityDemand({ ...base }, "grain", 10);
  const needs = cityDemand({ ...base, needs: true }, "grain", 10);
  const makes = cityDemand({ ...base, makes: true }, "grain", 10);
  const both = cityDemand({ ...base, needs: true, makes: true }, "grain", 10);
  // Same left-to-right float order as the implementation: total * 3 * (needs?3:1) * (makes?0.3:1).
  assert.equal(needs, neither * 3);
  assert.equal(makes, neither * 0.3);
  assert.equal(both, neither * 3 * 0.3);
  // Anchored to the demand table: classCounts(10000) = poor 6920, middle 2480, rich 600;
  // grain per-1000 = 1.3/1.1/0.7 at ratio 1 -> 8.996 + 2.728 + 0.42 = 12.144; x DEMAND_SCALE 3.
  assert.equal(neither, (6920 / 1000 * 1.3 + 2480 / 1000 * 1.1 + 600 / 1000 * 0.7) * 3);
});

test("cityDemandBy: class-typed house residents leave the mixed pool and buy by their own class", () => {
  const entry = { stock: 300, target: 300, pop: 1000, classExtra: { rich: 100 } };
  const byClass = cityDemandBy(entry, "grain", 10); // ratio 1 at parity stock
  const pool = demandBy(900, "grain", 1); // 1000 pop - 100 typed residents
  const extra = demandOf({ rich: 100 }, "grain", 1);
  // classCounts(900) = poor 720, middle 162, rich 18; grain 1.3/1.1/0.7 per 1000.
  assert.equal(byClass.poor, pool.poor); // 720/1000*1.3 = 0.936
  assert.equal(byClass.middle, pool.middle); // 162/1000*1.1 = 0.1782
  assert.equal(byClass.rich, pool.rich + extra.rich); // 18/1000*0.7 + 100/1000*0.7 = 0.0126 + 0.07
});

test("tick: producers add round(rate*2*season) and every good gets a round(rate*0.4) trickle", () => {
  // iron is not in SEASON_PEAK, so seasonMul = 1 all year; pop 0 -> no consumption.
  const city = { iron: { stock: 300, target: 300, makes: true, needs: false, rate: 10, pop: 0 } };
  tickMarketCity(city, 5, world, NO_LEDGERS);
  assert.equal(city.iron.stock, 324); // 300 + round(10*2*1*1)=20 production + round(10*0.4)=4 trickle
  const trickleOnly = { iron: { stock: 200, target: 300, makes: false, needs: false, rate: 10, pop: 0 } };
  tickMarketCity(trickleOnly, 5, world, NO_LEDGERS);
  assert.equal(trickleOnly.iron.stock, 204); // no production, just the trickle
});

test("tick: stock never exceeds 4x target from either supply source", () => {
  const city = { iron: { stock: 1190, target: 300, makes: true, needs: false, rate: 10, pop: 0 } };
  tickMarketCity(city, 5, world, NO_LEDGERS);
  assert.equal(city.iron.stock, 1200); // 1190+20 capped at 1200, then trickle also capped
  const trickle = { iron: { stock: 1199, target: 300, makes: false, needs: false, rate: 10, pop: 0 } };
  tickMarketCity(trickle, 5, world, NO_LEDGERS);
  assert.equal(trickle.iron.stock, 1200); // 1199+4 capped
  // A glut above the cap is pulled DOWN to 4x target on the next tick (the trickle line clamps both ways).
  const glut = { iron: { stock: 5000, target: 300, makes: false, needs: false, rate: 1, pop: 0 } };
  tickMarketCity(glut, 5, world, NO_LEDGERS);
  assert.equal(glut.iron.stock, 1200);
});

test("tick: daily consumption rounds against a running total, not day by day", () => {
  // rate 1 -> trickle round(0.4) = 0, makes false -> no production: only consumption moves stock.
  // At parity stock: cityDemand = 12.144 * 3 = 36.432, scarcity 1 -> d = 36.432.
  const day0 = { grain: { stock: 300, target: 300, makes: false, needs: false, rate: 1, pop: 10000 } };
  tickMarketCity(day0, 0, world, NO_LEDGERS);
  assert.equal(day0.grain.stock, 264); // used = round(36.432*1) - round(36.432*0) = 36 - 0
  const day1 = { grain: { stock: 300, target: 300, makes: false, needs: false, rate: 1, pop: 10000 } };
  tickMarketCity(day1, 1, world, NO_LEDGERS);
  assert.equal(day1.grain.stock, 263); // used = round(36.432*2) - round(36.432*1) = 73 - 36 = 37
  // The two days consume exactly round(2d) together: the running total never drifts.
  assert.equal(36 + 37, Math.round(36.432 * 2));
});

test("tick: low stock dampens demand through scarcity = stock/target", () => {
  // stock 150, target 300 -> affordRatio 1.5: poor drop out (tol 1.4), middle 0.5, rich 0.75.
  // D = 2480/1000*1.1*0.5 + 600/1000*0.7*0.75 = 1.364 + 0.315 = 1.679; demand = 1.679*3 = 5.037;
  // scarcity = 0.5 -> d = 2.5185 -> used day 0 = round(2.5185) = 3.
  const city = { grain: { stock: 150, target: 300, makes: false, needs: false, rate: 1, pop: 10000 } };
  tickMarketCity(city, 0, world, NO_LEDGERS);
  assert.equal(city.grain.stock, 147);
});

test("tick: scarcity is capped at 1.5, so extra stock does not raise consumption further", () => {
  // stock 450 = 1.5x target and stock 1200 = 4x target (the tick cap): affordRatio <= 1 in both
  // (full demand), scarcity min(1.5, ...) = 1.5 in both -> identical d = 36.432 * 1.5 = 54.648
  // -> used = round(54.648) = 55 in both.
  const at15 = { grain: { stock: 450, target: 300, makes: false, needs: false, rate: 1, pop: 10000 } };
  const at4x = { grain: { stock: 1200, target: 300, makes: false, needs: false, rate: 1, pop: 10000 } };
  tickMarketCity(at15, 0, world, NO_LEDGERS);
  tickMarketCity(at4x, 0, world, NO_LEDGERS);
  assert.equal(at15.grain.stock, 395); // 450 - 55
  assert.equal(at4x.grain.stock, 1145); // 1200 - the same 55
});
