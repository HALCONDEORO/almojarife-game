// Fishery balance measurement (docs/design/fish-chain.md, step 1). A primary producer pays no
// cash: the land yields fish INTO the market stock, so its value is supply depth. This sim measures
// exactly that. Home port: santander (small fishing town, natural inflow ~6 fish/day). Every day a
// DRAIN of fish leaves the local market (what a chain of smokehouses or a fleet would take out);
// we record the units actually served, the average fish price and the share of days the stock hit
// zero, WITHOUT a fishery (L0) and WITH an active one at L1-L3, 8 seeds, 1 game year.
// Run: node tools/sim_fish_balance.mjs [drainPerDay=12]
import fs from "node:fs";
import { buildWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buyPlot, quoteConstruction, startConstruction, buildingAt, BUILDING_TYPES, JOBS_PER_LEVEL, WAGE_PER_WORKER } from "../src/game/buildings.mjs";
import { price } from "../src/sim/market.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const CITY = "santander", PLOT = { id: "santander:13", type: "warehouse", w: 4, d: 5 };
const DAYS = 365, DRAIN = Number(process.argv[2] ?? 12), SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function runYear(seed, level) {
  const g = newGame(world, CITY, { cash: 1000000, freePlay: true });
  g.seed = seed; g.eventsOn = false;
  let oneOff = 0;
  if (level > 0) {
    const p = buyPlot(g, CITY, PLOT); if (!p.ok) throw new Error("plot: " + p.reason); oneOff += p.cost ?? 0;
    for (;;) {
      const b = buildingAt(g, CITY, PLOT.id);
      if (b.level >= level && b.state === "active") break;
      for (const good of ["timber", "cloth", "iron"]) g.market[CITY][good].stock = Math.max(g.market[CITY][good].stock, 200); // a small port may lack building materials: not what is measured
      if (b.state !== "construction") { const q = quoteConstruction(g, CITY, PLOT.id, "fishery"); if (!q.ok) throw new Error("quote: " + q.reason); startConstruction(g, CITY, PLOT.id, "fishery"); oneOff += q.cost; }
      advanceDay(g); if (g.day > 400) throw new Error("construction stuck");
    }
  }
  let served = 0, priceSum = 0, emptyDays = 0;
  for (let d = 0; d < DAYS && !g.over; d++) {
    const e = g.market[CITY].fish, n = Math.min(DRAIN, e.stock);
    e.stock -= n; served += n; if (n < DRAIN) emptyDays++;
    priceSum += price(world, e, "fish");
    advanceDay(g);
  }
  return { served, avgPrice: priceSum / DAYS, emptyShare: emptyDays / DAYS, oneOff,
           runningYear: level * (BUILDING_TYPES.fishery.upkeep + JOBS_PER_LEVEL.fishery * WAGE_PER_WORKER) * DAYS };
}

const r2 = (x) => Math.round(x * 100) / 100;
const out = { days: DAYS, drainPerDay: DRAIN, seeds: SEEDS, home: CITY, scenarios: {} };
for (const level of [0, 1, 2, 3]) {
  const runs = SEEDS.map((s) => runYear(s, level));
  const avg = (k) => r2(runs.reduce((a, r) => a + r[k], 0) / runs.length);
  out.scenarios["L" + level] = { served: Math.round(avg("served")), avgPrice: avg("avgPrice"), emptyShare: avg("emptyShare"), oneOff: avg("oneOff"), runningYear: avg("runningYear") };
}
console.log(JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out.scenarios))
  console.error(`${k}: served ${v.served}/${DAYS * DRAIN}, avg price ${v.avgPrice}, stock-out ${Math.round(v.emptyShare * 100)}% of days, one-off ${v.oneOff}, running ${v.runningYear}/y`);
