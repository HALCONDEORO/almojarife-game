// Player benchmark: real game functions, fixed policies, deterministic starting ports.
// No claim that these simple policies represent human skill or all game systems.
import { loadWorld, route } from '../src/sim/world.mjs';
import { newGame, advanceDay, doBuy, doSell, doSail, orderRepair, processRepairs, netWorth } from '../src/game/game.mjs';
/** Sims keep the old instant repair: order and drain the yard the same day. */
const repairShip = (g, ship) => { const r = orderRepair(g, [ship.id], ship.at); if (r.ok) { let n = 0; while ((ship.hull ?? 100) < 100 && n++ < 40) processRepairs(g); } return r; };
import { previewBuy, previewSell, SHIP_TYPES } from '../src/sim/trade.mjs';
import { makeRng } from '../src/sim/rng.mjs';
const w = loadWorld(), games = Number(process.argv[2] ?? 66), competition = process.argv[3] ?? 'default';
if(!['default','planned'].includes(competition))throw new Error('competition must be default or planned');
const started=performance.now(), offset=Number(process.argv[4]??0);
if(!Number.isSafeInteger(offset)||offset<0)throw new Error('offset must be nonnegative integer');
if (!Number.isSafeInteger(games) || games < 1) throw new Error('games must be a positive integer');
const flags = JSON.parse(process.env.SIM_FLAGS ?? '{}');
const results = [];
for (const strategy of ['greedy-preview', 'random-destination']) for (let i = offset; i < offset+games; i++) {
  const start = w.cities[i % w.cities.length].id, g = newGame(w, start, {npcCompetition:competition,...flags}), rng = makeRng(i + 1000);
  let trips = 0, repaired = 0, traded = 0;
  while (!g.over && g.day < 365) {
    const ship = g.ships[0];
    if (!ship.voyage) {
      for (const [good, qty] of Object.entries(ship.cargo)) doSell(g, ship, good, qty);
      if (g.over) break;
      if (ship.hull < 65) { const r = repairShip(g, ship); if (r.ok) repaired += r.cost; }
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
      if (best) {
        const b = doBuy(g, ship, best.good, best.qty);
        if (b.ok) { traded += b.qty; if (doSail(g, ship, best.dest).ok) trips++; }
      }
    }
    if (!g.over) advanceDay(g);
  }
  results.push({ strategy, start, day: g.day, outcome: g.over, reason: g.overReason ?? null, cash: Math.round(g.cash), netWorth: Math.round(netWorth(g)), trips, unitsBought: traded, repairPaid: repaired });
}
const med = (xs) => [...xs].sort((a,b) => a-b)[Math.floor(xs.length/2)];
console.log(JSON.stringify({
  competition, flags, npcCount:competition==='planned'?48:3, elapsedMs:Math.round(performance.now()-started),
  scope: 'Real newGame/doBuy/doSell/doSail/advanceDay/repair orders; includes selected NPC competition from 60-day warmup onward, weekly upkeep/wages, arrival tolls, price impact, hull repairs and mission end. No loans, factories, buildings, extra ships or random events. Perfect current-price information for greedy policy.',
  gamesPerStrategy: games, offset, ports: w.cities.length, summaries: Object.fromEntries(['greedy-preview','random-destination'].map((s) => {
    const rs = results.filter((r) => r.strategy === s);
    return [s, { wins: rs.filter((r) => r.outcome === 'win').length, bankrupt: rs.filter((r) => r.reason === 'bankrupt').length, deadlineLosses: rs.filter((r) => r.outcome === 'lose' && r.reason !== 'bankrupt').length, medianFinalCash: med(rs.map((r) => r.cash)), medianFinalNetWorth: med(rs.map((r) => r.netWorth)), medianEndDay: med(rs.map((r) => r.day)) }];
  })), results
}, null, 2));
