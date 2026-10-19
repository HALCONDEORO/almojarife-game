import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, price } from "../src/sim/market.mjs";
import { makeShip, tickShip, SHIP_TYPES } from "../src/sim/trade.mjs";
import { aiStep } from "../src/sim/ai.mjs";
const world = loadWorld();

function simulate(days, traders = 6, w = world) {
  const m = makeMarket(w), ids = w.cities.map((c) => c.id), start = [...ids].sort();
  const ts = Array.from({ length: traders }, (_, i) => ({ cash: 2000, ship: makeShip(i, i % 2 ? "caravel" : "cog", start[i % start.length]) }));
  const goods = Object.keys(w.goods);
  const pins = {}; // pins["city/good"] = days the unrounded price ratio sat at a clamp
  let maxStock = 0;
  for (let d = 0; d < days; d++) {
    tickMarket(m);
    for (const t of ts) { tickShip(t.ship); aiStep(w, m, t, t.ship); }
    for (const c of ids) for (const g of goods) {
      const e = m[c][g], st = e.stock;
      if (!Number.isInteger(st) || st < 0) throw new Error(`bad stock ${c}/${g}: ${st} on day ${d}`);
      const raw = (e.target / Math.max(1, st)) ** 0.6; // unrounded, every day
      if (raw >= 3 || raw <= 0.4) pins[c + "/" + g] = (pins[c + "/" + g] || 0) + 1;
      maxStock = Math.max(maxStock, st);
    }
    for (const t of ts) if (!Number.isFinite(t.cash) || t.cash < 0) throw new Error("bad cash on day " + d);
  }
  const perGood = {}, perPair = {};
  for (const g of goods) {
    let n = 0;
    for (const c of ids) { const k = pins[c + "/" + g] || 0; n += k; perPair[c + "/" + g] = k / days; }
    perGood[g] = n / (days * ids.length);
  }
  const worstGood = Math.max(...Object.values(perGood)), worstPair = Math.max(...Object.values(perPair));
  return { ts, m, perGood, perPair, worstGood, worstPair, maxStock };
}

test("AI traders earn money and never go below zero cash or negative stock", () => {
  const r = simulate(365 * 5);
  for (const t of r.ts) assert.ok(Number.isFinite(t.cash) && t.cash >= 0);
  assert.ok(r.ts.reduce((a, t) => a + t.cash, 0) > 6 * 2000, "traders as a group grow their cash");
  for (const c of Object.values(r.m)) for (const e of Object.values(c)) assert.ok(e.stock >= 0 && Number.isInteger(e.stock));
});
test("simulation is deterministic: the full state matches, not only cash", () => {
  const a = simulate(500), b = simulate(500);
  assert.deepEqual(JSON.stringify([a.ts, a.m]), JSON.stringify([b.ts, b.m]));
});
test("a different trader count gives a different world (the sim really runs)", () => {
  assert.notEqual(JSON.stringify(simulate(300, 3).m), JSON.stringify(simulate(300, 8).m));
});
// M1b exit gate: measured daily on the unrounded ratio, per good and per city/good (not pooled).
const GATE = 0.3;
for (const n of [0, 6, 12]) {
  test(`long run, ${n} traders: no good and no city/good pinned at a clamp over 30% of days`, () => {
    const r = simulate(365 * 20, n);
    assert.ok(r.worstGood < GATE, "worst good " + JSON.stringify(r.perGood));
    assert.ok(r.worstPair < GATE, "worst city/good " + r.worstPair + " " + Object.entries(r.perPair).sort((a, b) => b[1] - a[1])[0]);
  });
}
test("order independence: reversed cities and goods give the same market and cash", () => {
  const w2 = { ...world, cities: [...world.cities].reverse(), goods: Object.fromEntries(Object.entries(world.goods).reverse()) };
  const sorted = (v) => Array.isArray(v) ? v.map(sorted)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])])) : v;
  const canon = (r) => JSON.stringify(sorted({ m: r.m, ts: r.ts })); // full state: markets, cash, cargo, voyage
  assert.equal(canon(simulate(1500, 6, world)), canon(simulate(1500, 6, w2)));
});
