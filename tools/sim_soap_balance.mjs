// Soapworks balance measurement (docs/design/production-chains-study.md, PR soap). The soapworks is a
// PROCESSOR: it buys olive oil at the local market, sells soap locally and keeps the margin.
// A/B per seed, one game year in the port named by CITY (default sevilla, an olive-oil and soap port), WITHOUT
// and WITH a soapworks at levels 1-3. Building net = cash delta vs the no-building run; the one-off
// cost is reported separately. Wages and upkeep are in the cash delta. The study also asks for the
// olive-oil use and price effect: average daily olive-oil and soap prices are reported per scenario. 8 seeds.
// Run: CITY=argel node tools/sim_soap_balance.mjs
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { price } from "../src/sim/market.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buyOffice, buyPlot, quoteConstruction, startConstruction, buildingAt } from "../src/game/buildings.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const CITY = process.env.CITY ?? "sevilla";
const PLOT = { id: CITY + ":13", type: "workshop", w: 4, d: 5 };
const DAYS = 365, SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function runYear(seed, level) {
  const g = newGame(world, "cadiz", { cash: 100000, freePlay: true });
  g.seed = seed; g.eventsOn = false;
  let oneOff = 0;
  if (level > 0) {
    (g.rep ??= {})[CITY] = 25;
    if (CITY !== "cadiz") oneOff += buyOffice(g, CITY).cost ?? 0;
    const p = buyPlot(g, CITY, PLOT); if (!p.ok) throw new Error("plot: " + p.reason); oneOff += p.price ?? 0;
    for (;;) {
      const b = buildingAt(g, CITY, PLOT.id);
      if (b && b.level >= level && b.state === "active") break;
      if (!b || b.state !== "construction") { const q = quoteConstruction(g, CITY, PLOT.id, "soapworks"); if (!q.ok) throw new Error("quote: " + q.reason); startConstruction(g, CITY, PLOT.id, "soapworks"); oneOff += q.cost; }
      advanceDay(g); if (g.day > 400) throw new Error("construction stuck");
    }
  }
  const cash0 = g.cash, day0 = g.day;
  let oilSum = 0, soapSum = 0, n = 0;
  while (g.day - day0 < DAYS && !g.over) {
    advanceDay(g);
    oilSum += price(world, g.market[CITY].olive_oil, "olive_oil");
    soapSum += price(world, g.market[CITY].soap, "soap");
    n++;
  }
  const b = level > 0 ? buildingAt(g, CITY, PLOT.id) : null;
  return { net: Math.round(g.cash - cash0), produced: b?.produced ?? 0, oneOff: Math.round(oneOff), oilAvg: oilSum / n, soapAvg: soapSum / n };
}

const out = { days: DAYS, seeds: SEEDS, at: CITY, scenarios: {} };
for (const level of [0, 1, 2, 3]) {
  const runs = SEEDS.map((s) => runYear(s, level));
  const avg = (k) => Math.round((runs.reduce((a, r) => a + r[k], 0) / runs.length) * 100) / 100;
  out.scenarios["L" + level] = { netYear: avg("net"), batches: avg("produced"), oneOff: avg("oneOff"), oilAvg: avg("oilAvg"), soapAvg: avg("soapAvg") };
}
console.log(JSON.stringify(out, null, 1));
const base = out.scenarios.L0;
for (const [k, v] of Object.entries(out.scenarios))
  console.error(`${CITY} ${k}: ${v.batches} batches (${v.batches} olive_oil used, ${v.batches * 2} soap), building net ${Math.round(v.netYear - base.netYear)}/y vs one-off ${v.oneOff}, olive_oil ${base.oilAvg}->${v.oilAvg}, soap ${base.soapAvg}->${v.soapAvg}`);
