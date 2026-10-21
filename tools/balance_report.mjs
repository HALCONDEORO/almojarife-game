// Balance report: repeats the player benchmark over many seeds and measures outcomes.
// Same policies and game functions as tools/sim_player.mjs; adds per-good and per-route
// profit attribution, bankruptcy statistics (campaign and free play) and dispersion.
// Run: node tools/balance_report.mjs [games=24] [competition=default] [offset=0]
// Prints one JSON report. Deterministic given games/competition/offset. Own design, no outside data.
import { loadWorld, route } from '../src/sim/world.mjs';
import { newGame, advanceDay, doBuy, doSell, doSail, repairShip, netWorth } from '../src/game/game.mjs';
import { previewBuy, previewSell, SHIP_TYPES } from '../src/sim/trade.mjs';
import { makeRng } from '../src/sim/rng.mjs';
const w = loadWorld(), games = Number(process.argv[2] ?? 24), competition = process.argv[3] ?? 'default';
if (!['default', 'planned'].includes(competition)) throw new Error('competition must be default or planned');
const offset = Number(process.argv[4] ?? 0);
if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('offset must be nonnegative integer');
if (!Number.isSafeInteger(games) || games < 1) throw new Error('games must be a positive integer');
const DAYS = 365, started = performance.now();

// One policy decision for an idle ship: the same planning as tools/sim_player.mjs.
function plan(g, ship, strategy, rng) {
  let best = null;
  const candidates = strategy === 'random-destination' ? [w.cities[Math.floor(rng.next() * w.cities.length)]] : w.cities;
  for (const city of candidates) {
    if (city.id === ship.at) continue;
    const r = route(w, ship.at, city.id); if (!r) continue;
    const days = Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay));
    for (const good of Object.keys(w.goods)) {
      const b = previewBuy(w, g.market, ship, g.cash, good, SHIP_TYPES[ship.type].capacity);
      if (!b.qty) continue;
      const virtual = { ...ship, at: city.id, cargo: { [good]: b.qty } };
      const s = previewSell(w, g.market, virtual, good, b.qty);
      // Planning estimate only. Prices may change during the actual voyage.
      const score = (s.revenue - b.cost - days * SHIP_TYPES[ship.type].upkeepPerDay - 6) / (days + 1);
      if (score > 0 && (!best || score > best.score)) best = { dest: city.id, good, qty: b.qty, score };
    }
  }
  return best;
}

// One simulated run. mode 'campaign': normal game, win/lose end. mode 'freeplay': no goal/deadline,
// bankruptcy resolves instead of ending the game (counted via g.bankruptcies).
function run(start, seed, strategy, mode) {
  const g = newGame(w, start, { npcCompetition: competition, freePlay: mode === 'freeplay' }), rng = makeRng(seed);
  const byGood = {}, byRoute = {}, costBasis = {}, origin = {};
  let trips = 0, minCash = g.cash, firstBankruptDay = null, leftoverCost = 0;
  const addProfit = (good, at, revenue) => {
    const cost = costBasis[good] ?? 0, profit = revenue - cost;
    (byGood[good] ??= { revenue: 0, cost: 0, profit: 0 }).revenue += revenue; byGood[good].cost += cost; byGood[good].profit += profit;
    const key = `${origin[good] ?? at}>${at}`;
    (byRoute[key] ??= { profit: 0, trips: 0 }); byRoute[key].profit += profit; byRoute[key].trips++;
    costBasis[good] = 0;
  };
  while (!g.over && g.day < DAYS) {
    const ship = g.ships[0];
    if (!ship.voyage) {
      for (const [good, qty] of Object.entries(ship.cargo)) { const r = doSell(g, ship, good, qty); if (r.ok) addProfit(good, ship.at, r.revenue); }
      if (g.over) break;
      if (ship.hull < 65) repairShip(g, ship);
      const best = plan(g, ship, strategy, rng);
      if (best) {
        const b = doBuy(g, ship, best.good, best.qty);
        if (b.ok) {
          costBasis[best.good] = (costBasis[best.good] ?? 0) + b.cost; origin[best.good] = ship.at;
          if (doSail(g, ship, best.dest).ok) trips++;
        }
      }
    }
    const prevB = g.bankruptcies ?? 0;
    if (!g.over) advanceDay(g);
    if (firstBankruptDay === null && (g.bankruptcies ?? 0) > prevB) firstBankruptDay = g.day;
    if (g.cash < minCash) minCash = g.cash;
  }
  for (const [good, cost] of Object.entries(costBasis)) leftoverCost += cost; // bought but unsold at the end
  const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'object' ? { revenue: Math.round(v.revenue), cost: Math.round(v.cost), profit: Math.round(v.profit) } : v]));
  const roundR = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { profit: Math.round(v.profit), trips: v.trips }]));
  return { start, day: g.day, outcome: g.over, reason: g.overReason ?? null, cash: Math.round(g.cash), netWorth: Math.round(netWorth(g)), trips, minCash: Math.round(minCash), bankruptcies: g.bankruptcies ?? 0, firstBankruptDay, leftoverCost: Math.round(leftoverCost), byGood: round(byGood), byRoute: roundR(byRoute) };
}

const med = (xs) => xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null;
const pct = (xs, p) => xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))] : null;
const merge = (acc, rs, pick) => {
  for (const r of rs) for (const [k, v] of Object.entries(pick(r))) (acc[k] ??= { profit: 0, revenue: 0, cost: 0, trips: 0 }).profit += v.profit, acc[k].revenue = (acc[k].revenue ?? 0) + (v.revenue ?? 0), acc[k].cost = (acc[k].cost ?? 0) + (v.cost ?? 0), acc[k].trips = (acc[k].trips ?? 0) + (v.trips ?? 0);
  return acc;
};
const results = [];
for (const strategy of ['greedy-preview', 'random-destination']) for (const mode of ['campaign', 'freeplay'])
  for (let i = offset; i < offset + games; i++) results.push({ strategy, mode, ...run(w.cities[i % w.cities.length].id, i + 1000, strategy, mode) });

const summaries = {};
for (const strategy of ['greedy-preview', 'random-destination']) for (const mode of ['campaign', 'freeplay']) {
  const rs = results.filter((r) => r.strategy === strategy && r.mode === mode);
  const byGood = merge({}, rs, (r) => r.byGood), byRoute = merge({}, rs, (r) => r.byRoute);
  const totalProfit = Object.values(byGood).reduce((a, v) => a + v.profit, 0);
  const topGood = Object.entries(byGood).sort((a, b) => b[1].profit - a[1].profit)[0] ?? null;
  summaries[`${strategy}/${mode}`] = {
    games: rs.length,
    wins: rs.filter((r) => r.outcome === 'win').length,
    bankruptEndings: rs.filter((r) => r.reason === 'bankrupt').length,
    deadlineLosses: rs.filter((r) => r.outcome === 'lose' && r.reason !== 'bankrupt').length,
    seedsWithBankruptcy: rs.filter((r) => r.bankruptcies > 0 || r.reason === 'bankrupt').length,
    medianFirstBankruptDay: med(rs.filter((r) => r.firstBankruptDay !== null).map((r) => r.firstBankruptDay)),
    medianBankruptEndDay: med(rs.filter((r) => r.reason === 'bankrupt').map((r) => r.day)),
    medianFinalNetWorth: med(rs.map((r) => r.netWorth)),
    p10FinalNetWorth: pct(rs.map((r) => r.netWorth), 0.1),
    p90FinalNetWorth: pct(rs.map((r) => r.netWorth), 0.9),
    medianEndDay: med(rs.map((r) => r.day)),
    medianMinCash: med(rs.map((r) => r.minCash)),
    totalTradingProfit: Math.round(totalProfit),
    topGood: topGood ? { good: topGood[0], profit: Math.round(topGood[1].profit), share: totalProfit > 0 ? +(topGood[1].profit / totalProfit).toFixed(3) : null } : null,
    profitByGood: Object.fromEntries(Object.entries(byGood).sort((a, b) => b[1].profit - a[1].profit).map(([k, v]) => [k, Math.round(v.profit)])),
    profitByRoute: Object.fromEntries(Object.entries(byRoute).sort((a, b) => b[1].profit - a[1].profit).slice(0, 10).map(([k, v]) => [k, { profit: Math.round(v.profit), trips: v.trips }])),
  };
}
console.log(JSON.stringify({
  competition, daysPerRun: DAYS, gamesPerCell: games, offset, seeds: `makeRng(seed=${offset}..${offset + games - 1} + 1000)`, elapsedMs: Math.round(performance.now() - started),
  scope: 'Same policies and real game functions as tools/sim_player.mjs (perfect current-price information for greedy; no loans, factories, buildings, extra ships or random events). Per-good/route profit is realized trade profit (sell revenue minus buy cost of the same lot); upkeep, tolls, wages, repairs and unsold leftover cargo are NOT attributed to goods, so totalTradingProfit exceeds final net worth growth. Free play runs all 365 days (no win end); bankruptcies there resolve and play continues.',
  summaries, results
}, null, 2));
