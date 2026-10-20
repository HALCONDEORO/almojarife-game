// Economy check over the whole map: many simulated games with bots of different strategies.
// Run: node tools/sim_economy.mjs [games=50] [days=1095]   Prints one JSON report. Own design, no outside data.
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket, price } from "../src/sim/market.mjs";
import { makeShip, tickShip, sailTick, SHIP_TYPES, FEE, buy, sell, sail, cargoUsed } from "../src/sim/trade.mjs";
import { TICKS_PER_DAY } from "../src/sim/clock.mjs";
import { aiStep } from "../src/sim/ai.mjs";
import { makeRng } from "../src/sim/rng.mjs";

const games = Number(process.argv[2] ?? 50), days = Number(process.argv[3] ?? 1095);
const world = loadWorld(), ids = world.cities.map((c) => c.id), goods = Object.keys(world.goods);
if (![games, days].every((x) => Number.isSafeInteger(x) && x > 0)) throw new Error("games and days must be positive integers");
const START_CASH = 2000;

// Strategies. Each acts for an idle ship (sells what it carries first, like aiStep does).
function sellAll(m, t, s) { for (const g of Object.keys(s.cargo)) { const r = sell(world, m, s, g, s.cargo[g]); if (r.ok) t.cash += r.revenue; } }
const strategies = {
  greedy: (m, t, s) => aiStep(world, m, t, s),
  // Wanders: picks a random reachable port and buys the cheapest-vs-base good there.
  wanderer: (m, t, s, rng) => {
    if (s.voyage) return;
    sellAll(m, t, s); if (cargoUsed(s) > 0) return;
    const dest = ids[Math.floor(rng.next() * ids.length)]; if (dest === s.at) return;
    let bestG = null, bestR = 9;
    for (const g of goods) { const e = m[s.at][g]; if (e.stock <= 0) continue; const r = price(world, e, g) / world.goods[g].base; if (r < bestR) { bestR = r; bestG = g; } }
    if (!bestG) return;
    const qty = Math.min(SHIP_TYPES[s.type].capacity, m[s.at][bestG].stock, Math.floor(t.cash / Math.ceil(price(world, m[s.at][bestG], bestG) * (1 + FEE))));
    if (qty <= 0) return; const b = buy(world, m, s, t.cash, bestG, qty); if (!b.ok) return; t.cash -= b.cost; sail(world, s, dest);
  },
  // Shuttles between its home port and a randomly assigned partner (a fixed two-port loop).
  shuttle: (m, t, s) => {
    if (s.voyage) return;
    sellAll(m, t, s); if (cargoUsed(s) > 0) return;
    const other = s.at === t.homeA ? t.homeB : t.homeA; let bg = null, bs = 1.08;
    for (const g of goods) { const e = m[s.at][g]; if (e.stock <= 0) continue; const sc = (price(world, m[other][g], g) * (1 - FEE)) / (price(world, e, g) * (1 + FEE)); if (sc > bs) { bs = sc; bg = g; } }
    if (!bg) return;
    const qty = Math.min(SHIP_TYPES[s.type].capacity, m[s.at][bg].stock, Math.floor(t.cash / Math.ceil(price(world, m[s.at][bg], bg) * (1 + FEE))));
    if (qty <= 0) return; const b = buy(world, m, s, t.cash, bg, qty); if (!b.ok) return; t.cash -= b.cost; sail(world, s, other);
  },
};
const names = Object.keys(strategies);

// 2) Dynamic: games x days.
const pinnedByGood = Object.fromEntries(goods.map((g) => [g, [0, 0]])), pinnedByCity = Object.fromEntries(ids.map((c) => [c, [0, 0]]));
const visits = Object.fromEntries(ids.map((c) => [c, 0])), sold = Object.fromEntries(goods.map((g) => [g, 0]));
const arrivalsByStrategy = Object.fromEntries(names.map((n) => [n, Object.fromEntries(ids.map((c) => [c, 0]))]));
const immobilized = Object.fromEntries(names.map((n) => [n, 0]));
const finals = Object.fromEntries(names.map((n) => [n, []])), stuck = Object.fromEntries(names.map((n) => [n, 0])), yearly = {};
const t0 = Date.now();
for (let gi = 0; gi < games; gi++) {
  const rng = makeRng(1000 + gi), m = makeMarket(world);
  for (let d = -120; d < 0; d++) tickMarket(m, d, world);
  const ts = [];
  for (const n of names) for (let k = 0; k < 2; k++) {
    const at = ids[Math.floor(rng.next() * ids.length)], A = at, B = ids[Math.floor(rng.next() * ids.length)];
    ts.push({ n, cash: START_CASH, homeA: A, homeB: B === A ? ids[(ids.indexOf(A) + 1) % ids.length] : B, ship: makeShip(ts.length, k ? "caravel" : "cog", at), last: null });
  }
  for (let d = 0; d < days; d++) {
    tickMarket(m, d, world);
    for (const t of ts) {
      // Continuous movement: bots act on their arrival tick (like the game's AI) and once a day when docked.
      for (let i = 0; i < TICKS_PER_DAY && t.ship.voyage; i++) if (sailTick(t.ship)) {
        tickShip(t.ship, true);
        visits[t.ship.at]++; arrivalsByStrategy[t.n][t.ship.at]++; // an arrival
        const had = !!t.ship.voyage; strategies[t.n](m, t, t.ship, rng);
        if (!had && t.ship.voyage) for (const [g, q] of Object.entries(t.ship.cargo)) sold[g] += q;
      }
      tickShip(t.ship); // daily wear while at sea
      if (!t.ship.voyage) { const had = !!t.ship.voyage; strategies[t.n](m, t, t.ship, rng); if (!had && t.ship.voyage) for (const [g, q] of Object.entries(t.ship.cargo)) sold[g] += q; }
    }
    if (d % 30 === 0) for (const c of ids) for (const g of goods) {
      const e = m[c][g], raw = (e.target / Math.max(1, e.stock)) ** 0.6, pin = raw >= 3 || raw <= 0.4 ? 1 : 0;
      pinnedByGood[g][0] += pin; pinnedByGood[g][1]++; pinnedByCity[c][0] += pin; pinnedByCity[c][1]++;
    }
    if (d % 365 === 364) { const y = Math.round((d + 1) / 365); yearly[y] ??= []; for (const t of ts) yearly[y].push(t.cash); }
  }
  for (const t of ts) { finals[t.n].push(t.cash); if (t.cash < 100 && cargoUsed(t.ship) === 0) stuck[t.n]++;
    const cheapest = Math.min(...goods.filter((g) => m[t.ship.at][g].stock > 0).map((g) => Math.ceil(price(world, m[t.ship.at][g], g) * (1 + FEE))));
    if (!t.ship.voyage && t.cash < cheapest) immobilized[t.n]++; }
}
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const pct = (a) => +((a[0] / a[1]) * 100).toFixed(1);
const rep = {
  scope: "Trading bots only. No player upkeep, wages, tolls, loan costs, win/loss or construction. Cash growth is not global money inflation.",
  sampling: "Clamps use the unrounded model ratio, sampled every 30 days; not an every-day safety bound.",
  games, days, cities: ids.length, seconds: Math.round((Date.now() - t0) / 1000),
  finalCashMedian: Object.fromEntries(names.map((n) => [n, med(finals[n])])),
  finalCashMin: Object.fromEntries(names.map((n) => [n, Math.min(...finals[n])])),
  finalCashMax: Object.fromEntries(names.map((n) => [n, Math.max(...finals[n])])),
  lowCashEmptyHoldShare: Object.fromEntries(names.map((n) => [n, +(stuck[n] / finals[n].length * 100).toFixed(1)])),
  cannotAffordOneUnitShare: Object.fromEntries(names.map((n) => [n, +(immobilized[n] / finals[n].length * 100).toFixed(1)])),
  arrivalsByStrategy,
  medianCashByYear: Object.fromEntries(Object.entries(yearly).map(([y, a]) => [y, med(a)])),
  pinnedPctByGood: Object.fromEntries(goods.map((g) => [g, pct(pinnedByGood[g])])),
  pinnedPctByCityWorst: Object.entries(pinnedByCity).map(([c, v]) => [c, pct(v)]).sort((a, b) => b[1] - a[1]).slice(0, 8),
  pinnedPctOverall: pct([Object.values(pinnedByGood).reduce((a, v) => a + v[0], 0), Object.values(pinnedByGood).reduce((a, v) => a + v[1], 0)]),
  tripsToCityLeast: Object.entries(visits).sort((a, b) => a[1] - b[1]).slice(0, 8),
  tripsToCityMost: Object.entries(visits).sort((a, b) => b[1] - a[1]).slice(0, 5),
  unitsPlannedByGood: sold,

};
console.log(JSON.stringify(rep, null, 1));
