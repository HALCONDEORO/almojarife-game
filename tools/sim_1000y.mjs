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
const ts = Array.from({ length: traders }, (_, i) => ({ cash: 2000, ship: makeShip(i, i % 2 ? "caravel" : "cog", ids[i % ids.length]), rep: {}, respect: {}, repToday: null }));
let upkeepPaid = 0, tollsPaid = 0, repairsPaid = 0; // bots pay what a player pays: daily upkeep, docking tolls, hull repairs
// Player-rule mirrors (src/game/reputation.mjs, rank.mjs, tolls.mjs): fee/repair tiers by port reputation,
// toll discount by cumulative sales respect. Bots earn and lose both exactly like a player.
const REP_TIERS_FROM = [-50, 0, 20, 50, 80], REP_FEE_MUL = [1.5, 1, 0.75, 0.5, 0.25], REP_REPAIR_MUL = [1, 1, 1, 0.9, 0.8];
const RESPECT_FROM = [0, 20, 100, 400], TOLL_DISCOUNT = [0, 0.25, 0.5, 1], REP_PER_COINS = 100;
const REP_DAY_CAP = 10, REP_TRADE_CAP = 5;
const tierIdx = (pts, from) => { let i = 0; from.forEach((f, k) => { if (pts >= f) i = k; }); return i; };
const awardRep = (t, city, d, day) => {
  if (!d) return;
  if (d > 0) {
    if (t.repToday?.day !== day) t.repToday = { day, cities: {} };
    const used = t.repToday.cities[city] ?? 0, room = Math.max(0, REP_DAY_CAP - used);
    d = Math.min(d, room); t.repToday.cities[city] = used + d;
    if (d <= 0) return;
  }
  t.rep[city] = Math.min(100, Math.max(-50, (t.rep[city] ?? 0) + d));
};
const mkHooks = (t, dayRef) => ({
  feeMul: (city) => REP_FEE_MUL[tierIdx(t.rep[city] ?? 0, REP_TIERS_FROM)],
  onSale: (city, good, scarcity, revenue) => {
    if (scarcity > 1) awardRep(t, city, Math.min(REP_TRADE_CAP, (revenue / 100) * (scarcity >= 2 ? 2 : 1)), dayRef.day);
    t.respect[city] = (t.respect[city] ?? 0) + revenue;
  },
  onBuy: (city, good, scarcity, cost) => {
    if (scarcity > 1) awardRep(t, city, -Math.min(REP_TRADE_CAP, (cost / 100) * (scarcity >= 2 ? 2 : 1)), dayRef.day);
  },
});
let pinned = 0, samples = 0;
const t0 = Date.now();
for (let d = 0; d < years * 365; d++) {
  tickMarket(m);
  for (const t of ts) { const u = SHIP_TYPES[t.ship.type].upkeepPerDay; t.cash -= u; upkeepPaid += u; }
  for (const t of ts) {
    let acted = false; // decided on the arrival tick already
    for (let i = 0; i < TICKS_PER_DAY && t.ship.voyage; i++) if (sailTick(t.ship)) { tickShip(t.ship, true); const tollDisc = TOLL_DISCOUNT[tierIdx((t.respect[t.ship.at] ?? 0) / REP_PER_COINS, RESPECT_FROM)]; const toll = Math.ceil(SHIP_TYPES[t.ship.type].capacity / 10 * (1 - tollDisc)); t.cash -= toll; tollsPaid += toll; if (t.ship.hull < 60) { const rc = Math.ceil((100 - t.ship.hull) * 4 * REP_REPAIR_MUL[tierIdx(t.rep[t.ship.at] ?? 0, REP_TIERS_FROM)]); t.cash -= rc; repairsPaid += rc; t.ship.hull = 100; } aiStep(world, m, t, t.ship, mkHooks(t, { day: d })); acted = true; } // act on the arrival tick; docking pays the portazgo (capacity/10 with the respect discount a player would have) and hull repairs below 60 at the port's reputation-priced yard rate
    tickShip(t.ship); if (!acted) aiStep(world, m, t, t.ship, mkHooks(t, { day: d })); // daily wear; docked traders decide once a day
  }
  if (d % 30 === 0) for (const c of ids) for (const g of goods) {
    const p = price(world, m[c][g], g), b = world.goods[g].base;
    samples++; if (p >= b * 3 || p <= b * 0.4) pinned++;
  }
}
const share = pinned / samples;
console.log(JSON.stringify({ years, traders, pinnedShare: +share.toFixed(4), totalCash: ts.reduce((a, t) => a + t.cash, 0), upkeepPaid, tollsPaid, repairsPaid, seconds: (Date.now() - t0) / 1000 }));
process.exit(share < 0.3 ? 0 : 1);
