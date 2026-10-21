// M1b check: 1,000 simulated years with AI traders. Prints the clamp-pinned share and total trader cash.
// Run: npm run sim1000   (takes about 5 minutes since voyages went continuous: bots act on arrival ticks,
// so there are far more decisions per year). Fails if more than 30% of price samples are at a clamp.
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, price } from "../src/sim/market.mjs";
import { makeShip, tickShip, sailTick, SHIP_TYPES } from "../src/sim/trade.mjs";
import { TICKS_PER_DAY } from "../src/sim/clock.mjs";
import { aiStep } from "../src/sim/ai.mjs";
const years = Number(process.argv[2] ?? 1000), traders = Number(process.argv[3] ?? 6);
const world = loadWorld(), m = makeMarket(world), ids = world.cities.map((c) => c.id), goods = Object.keys(world.goods);
const ts = Array.from({ length: traders }, (_, i) => ({ cash: 2000, ship: makeShip(i, i % 2 ? "caravel" : "cog", ids[i % ids.length]) }));
let upkeepPaid = 0, tollsPaid = 0, repairsPaid = 0; // bots pay what a player pays: daily upkeep, docking tolls, hull repairs
let pinned = 0, samples = 0;
const t0 = Date.now();
for (let d = 0; d < years * 365; d++) {
  tickMarket(m);
  for (const t of ts) { const u = SHIP_TYPES[t.ship.type].upkeepPerDay; t.cash -= u; upkeepPaid += u; }
  for (const t of ts) {
    let acted = false; // decided on the arrival tick already
    for (let i = 0; i < TICKS_PER_DAY && t.ship.voyage; i++) if (sailTick(t.ship)) { tickShip(t.ship, true); const toll = Math.ceil(SHIP_TYPES[t.ship.type].capacity / 10); t.cash -= toll; tollsPaid += toll; if (t.ship.hull < 60) { const rc = Math.ceil((100 - t.ship.hull) * 4); t.cash -= rc; repairsPaid += rc; t.ship.hull = 100; } aiStep(world, m, t, t.ship); acted = true; } // act on the arrival tick; docking pays the portazgo (capacity/10, no respect discount) and hull repairs below 60 like a player at the yard
    tickShip(t.ship); if (!acted) aiStep(world, m, t, t.ship); // daily wear; docked traders decide once a day
  }
  if (d % 30 === 0) for (const c of ids) for (const g of goods) {
    const p = price(world, m[c][g], g), b = world.goods[g].base;
    samples++; if (p >= b * 3 || p <= b * 0.4) pinned++;
  }
}
const share = pinned / samples;
console.log(JSON.stringify({ years, traders, pinnedShare: +share.toFixed(4), totalCash: ts.reduce((a, t) => a + t.cash, 0), upkeepPaid, tollsPaid, repairsPaid, seconds: (Date.now() - t0) / 1000 }));
process.exit(share < 0.3 ? 0 : 1);
