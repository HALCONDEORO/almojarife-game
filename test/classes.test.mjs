import test from "node:test";
import assert from "node:assert/strict";
import { classShares, classCounts, demandBy, totalDemand, affordMul, PER_1000, CLASSES } from "../src/sim/classes.mjs";
import { makeMarket, tickMarket, cityDemand, affordRatio, price } from "../src/sim/market.mjs";
import { cityRows } from "../src/view/cityview.mjs";

test("class counts add up to the population and big cities have a bigger rich share", () => {
  for (const p of [500, 3000, 12000, 50000]) { const c = classCounts(p); assert.equal(c.poor + c.middle + c.rich, p); assert.ok(c.poor > 0 && c.middle > 0 && c.rich > 0); }
  assert.ok(classShares(50000).rich > classShares(3000).rich);
  assert.ok(classShares(3000).poor > classShares(50000).poor);
});
test("rich citizens buy far more luxury per head than poor ones; poor buy more staples per head", () => {
  const perHead = (g, c, pop = 20000) => demandBy(pop, g)[c] / classCounts(pop)[c];
  assert.ok(perHead("silk", "rich") > 10 * perHead("silk", "poor") || perHead("silk", "poor") === 0);
  assert.ok(perHead("grain", "poor") > perHead("grain", "rich"));
  assert.equal(demandBy(20000, "silk").poor, 0);
});
test("a class stops buying a good once the price passes what it can pay", () => {
  assert.equal(affordMul("poor", 1), 1); assert.equal(affordMul("poor", 1.4), 0); assert.equal(affordMul("poor", 3), 0);
  assert.ok(affordMul("rich", 2) > 0 && affordMul("rich", 3) === 0);
  const cheap = demandBy(20000, "wine", 1), dear = demandBy(20000, "wine", 2);
  assert.ok(dear.poor === 0 && dear.middle === 0 && dear.rich > 0 && dear.rich < cheap.rich);
  assert.ok(totalDemand(20000, "wine", 2) < totalDemand(20000, "wine", 1));
});
test("every trade good has a consumption row for all three classes", () => {
  for (const [g, row] of Object.entries(PER_1000)) for (const c of CLASSES) assert.ok(typeof row[c] === "number" && row[c] >= 0, g + c);
});
test("market: demand grows with population, whole units are taken from stock, small demands add up and stock never goes negative", () => {
  const world = { cities: [{ id: "a", pop: 4000, makes: [], needs: ["grain"] }, { id: "b", pop: 40000, makes: [], needs: ["grain"] }], goods: { grain: { base: 22 }, silk: { base: 220 } } };
  const m = makeMarket(world);
  assert.ok(cityDemand(m.b.grain, "grain") > cityDemand(m.a.grain, "grain"));
  assert.ok(cityDemand(m.b.silk, "silk") > 0);
  m.a.silk.stock = 50; m.a.silk.rate = 0; const before = m.a.silk.stock;
  for (let d = 0; d < 400; d++) { tickMarket(m, d); for (const c of Object.values(m)) for (const e of Object.values(c)) assert.ok(e.stock >= 0 && Number.isInteger(e.stock)); }
  assert.ok(m.a.silk.stock <= before);
});
test("city rows: three classes, top goods sorted, poor are priced out of luxuries when dear", () => {
  const goods = ["grain", "wine", "silk"];
  const rows = cityRows(20000, goods);
  assert.deepEqual(rows.map((r) => r.cls), ["poor", "middle", "rich"]);
  assert.equal(rows.reduce((a, r) => a + r.count, 0), 20000);
  assert.equal(rows[0].top[0].good, "grain");
  assert.equal(rows[2].top[0].good, "silk");
  const dear = cityRows(20000, goods, (g) => g === "wine" ? 2 : 1);
  assert.ok(dear[0].priced_out.includes("wine") && dear[1].priced_out.includes("wine") && !dear[2].priced_out.includes("wine"));
});
test("rounding boundary: the market and the City tab use the same rounded price", () => {
  // grain base 22, target 100, stock 58: raw ratio 1.4 ^ ... rounds to a trading price of 31, above the poor limit of 1.4x
  const e = { target: 100, stock: 58, needs: true, makes: false, rate: 10, pop: 10000 };
  const base = 22, tradePrice = price({ goods: { grain: { base } } }, e, "grain");
  assert.equal(affordRatio(e, base), tradePrice / base);
  assert.ok(tradePrice / base > 1.4, "trading price is over the poor limit");
  assert.equal(demandBy(10000, "grain", affordRatio(e, base)).poor, 0);
  assert.equal(cityRows(10000, ["grain"], () => affordRatio(e, base))[0].priced_out[0], "grain");
  const e2 = { ...e, stock: 100 }; // price at base: poor buy again
  assert.ok(demandBy(10000, "grain", affordRatio(e2, base)).poor > 0);
  // without the base (old call sites) it falls back to the raw ratio
  assert.ok(Math.abs(affordRatio(e, undefined) - (100 / 58) ** 0.6) < 1e-9);
});

test("tickMarket: daily demand below 0.5 still consumes over time, and the long run matches demand", () => {
  for (const d of [0.2, 0.4, 0.5, 0.7, 1.3]) {
    let total = 0;
    for (let day = 0; day < 1000; day++) total += Math.round(d * (day + 1)) - Math.round(d * day);
    assert.ok(Math.abs(total - d * 1000) <= 1, `d=${d} total=${total}`);
  }
});

import { basketBy, basketCost } from "../src/sim/classes.mjs";
test("basketBy splits every good across the three classes and adds up to totalDemand", () => {
  const b = basketBy(20000);
  for (const g of Object.keys(PER_1000)) assert.ok(Math.abs(b.poor[g] + b.middle[g] + b.rich[g] - totalDemand(20000, g)) < 1e-9, g);
  assert.ok(b.rich.meat > b.middle.meat && b.middle.meat > b.poor.meat); // meat belongs to the rich
});
test("basketCost grows with class and falls to zero when nothing is affordable", () => {
  const c = basketCost(20000, () => 1);
  assert.ok(c.rich / 2400 > c.middle / 6800 && c.middle / 6800 > c.poor / 10800);
  assert.equal(basketCost(20000, () => 1, () => 5).rich, 0);
});
