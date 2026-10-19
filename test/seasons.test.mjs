import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, seasonMul, seasonOf, SEASON_PEAK } from "../src/sim/market.mjs";
const world = loadWorld();
test("seasonal production averages 1 over the year and peaks on the harvest day", () => {
  for (const g of Object.keys(SEASON_PEAK)) {
    let sum = 0; for (let d = 0; d < 365; d++) sum += seasonMul(g, d);
    assert.ok(Math.abs(sum / 365 - 1) < 0.01, g);
    assert.ok(seasonMul(g, SEASON_PEAK[g]) > 1.3 && seasonMul(g, (SEASON_PEAK[g] + 182) % 365) < 0.7);
  }
  assert.equal(seasonMul("iron", 100), 1);
  assert.equal(seasonMul("grain", undefined), 1);
});
test("a producer adds more stock in season than out of season", () => {
  const city = world.cities.find((c) => c.makes.includes("grain")) ?? world.cities.find((c) => c.makes.includes("wine"));
  const good = city.makes.includes("grain") ? "grain" : "wine";
  const gain = (day) => { const m = makeMarket(world), e = m[city.id][good]; e.stock = 0; e.needs = false; tickMarket(m, day); return e.stock; };
  assert.ok(gain(SEASON_PEAK[good]) >= gain((SEASON_PEAK[good] + 182) % 365));
});
test("without a day the market behaves as before", () => {
  const a = makeMarket(world), b = makeMarket(world);
  for (let d = 0; d < 30; d++) { tickMarket(a); tickMarket(b, undefined); }
  assert.deepEqual(a, b);
});
test("seasons follow the calendar", () => {
  assert.equal(seasonOf(0), "winter"); assert.equal(seasonOf(100), "spring"); assert.equal(seasonOf(200), "summer"); assert.equal(seasonOf(290), "autumn"); assert.equal(seasonOf(364), "winter");
});
