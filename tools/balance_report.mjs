// Balance report: repeats the player benchmark over many seeds and measures outcomes.
// Same policies and game functions as tools/sim_player.mjs; adds per-good and per-route
// profit attribution, bankruptcy statistics (campaign and free play), dispersion, and a
// roster of player styles (conservative, leveraged, specialist, short-haul, fog-of-prices,
// clumsy-human, industrial) so broken or dominant strategies show up in numbers.
// Run: node tools/balance_report.mjs [games=24] [competition=default] [offset=0] [roster=core|styles|all]
// Prints one JSON report. Deterministic given games/competition/offset/roster. Own design, no outside data.
import { loadWorld, route } from '../src/sim/world.mjs';
import { newGame, advanceDay, doBuy, doSell, doSail, orderRepair, netWorth } from '../src/game/game.mjs';
/** Repairs cost real days here: the yard works REPAIR_POINTS_PER_DAY points a day, so after ordering, the calendar advances the quoted days (advanceDay runs the yard and the rest of the economy) and the ship waits in port meanwhile. */
const repairShip = (game, ship) => { const res = orderRepair(game, [ship.id], ship.at); if (res.ok) { for (let dayNum = 0; dayNum < res.days && !game.over; dayNum++) advanceDay(game); } return res; };
import { previewBuy, previewSell, SHIP_TYPES } from '../src/sim/trade.mjs';
import { makeRng } from '../src/sim/rng.mjs';
import { takeLoan, repayLoan, loanRoom, loansOf, LOAN_STEP } from '../src/game/bank.mjs';
import { knownMarket, buyRumor, RUMOR_PRICE } from '../src/game/intel.mjs';
import { buyPlot, startConstruction, restartBuilding, buildingAt } from '../src/game/buildings.mjs';
import { resolveEvent } from '../src/game/events.mjs';
import { resolvePirates, dismissEncounterReport } from '../src/game/encounterdaily.mjs';
import { MISSIONS, campaignEvent } from '../src/game/campaigns.mjs';
import { repOf } from '../src/game/rank.mjs';
import { MISSION as MISSION_HOOKS } from '../src/game/game.mjs';

const w = loadWorld(), games = Number(process.argv[2] ?? 24), competition = process.argv[3] ?? 'default';
if (!['default', 'planned'].includes(competition)) throw new Error('competition must be default or planned');
const offset = Number(process.argv[4] ?? 0);
if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('offset must be nonnegative integer');
if (!Number.isSafeInteger(games) || games < 1) throw new Error('games must be a positive integer');
const roster = process.argv[5] ?? 'core';
if (!['core', 'styles', 'all'].includes(roster)) throw new Error('roster must be core, styles or all');
const DAYS = 365, started = performance.now();
const GOODS = Object.keys(w.goods);

// Player styles. Every style sells its cargo on arrival and plans with the same scoring as
// tools/sim_player.mjs; the flags below bend one behaviour at a time.
const STYLES = {
  'greedy-preview': { repairBelow: 65, pirate: 'flee' }, // perfect current prices, no errors (reference)
  'random-destination': { random: true, repairBelow: 65, pirate: 'flee' }, // picks a random port, buys the best score to it
  conservative: { repairBelow: 85, buffer: 800, marginMin: 0.25, capacityMul: 0.6, pirate: 'flee' }, // only fat margins, repairs early, keeps a cash cushion
  leveraged: { repairBelow: 65, leverage: true, pirate: 'fight' }, // borrows to fill the hold, fights pirates
  specialist: { specialist: true, repairBelow: 65, pirate: 'flee' }, // trades one single good all game (chosen by seed)
  'short-haul': { repairBelow: 65, maxRouteDays: 4, pirate: 'flee' }, // only routes of 4 days or less
  foggy: { repairBelow: 75, fog: true, buffer: 200, pirate: 'flee' }, // no perfect prices: decides on remembered/rumoured prices
  clumsy: { repairBelow: 65, clumsy: true, pirate: 'flee' }, // greedy human: idles, forgets repairs, mis-picks, under-buys
  industrial: { repairBelow: 65, industrial: true, pirate: 'flee' }, // trades until it can build, then lives off a workshop at home
  errand: { repairBelow: 65, errand: true, pirate: 'flee' }, // mission runner: does the active mission first, then trades greedy
};
const CORE = ['greedy-preview', 'random-destination'], EXTRA = Object.keys(STYLES).filter((s) => s !== 'random-destination');
const ROSTERS = { core: CORE.map((s) => [s, false]), styles: EXTRA.map((s) => [s, true]), all: [...CORE.map((s) => [s, false]), ...EXTRA.map((s) => [s, true])] };

// One policy decision for an idle ship: the same planning as tools/sim_player.mjs.
function plan(g, ship, style, rng, cashForBuying, onlyDests = null) {
  const st = STYLES[style];
  let best = null; const positives = [];
  const known = st.fog ? knownMarket(g) : null;
  let candidates = st.random ? [w.cities[Math.floor(rng.next() * w.cities.length)]] : w.cities;
  if (onlyDests) candidates = candidates.filter((c) => onlyDests.has(c.id)); // mission work restricts destinations
  for (const city of candidates) {
    if (city.id === ship.at) continue;
    if (st.fog && !(known.market[city.id] && known.age[city.id].days <= 45)) continue; // fog: unknown or stale ports do not exist
    const r = route(w, ship.at, city.id); if (!r) continue;
    const days = Math.max(1, Math.ceil(r.km / SHIP_TYPES[ship.type].kmPerDay));
    if (st.maxRouteDays && days > st.maxRouteDays) continue;
    for (const good of GOODS) {
      if (st.specialist && good !== GOODS[(rng.seed0 ?? 0) % GOODS.length]) continue;
      const b = previewBuy(w, g.market, ship, cashForBuying, good, Math.floor(SHIP_TYPES[ship.type].capacity * (st.capacityMul ?? 1)));
      if (!b.qty) continue;
      if (st.buffer && g.cash - b.cost < st.buffer) continue;
      const virtual = { ...ship, at: city.id, cargo: { [good]: b.qty } };
      const s = previewSell(w, st.fog ? known.market : g.market, virtual, good, b.qty); // fog: stale estimate, real sale later
      const costs = days * SHIP_TYPES[ship.type].upkeepPerDay + 6;
      const score = (s.revenue - b.cost - costs) / (days + 1);
      if (st.marginMin && (s.revenue - b.cost - costs) / Math.max(b.cost, 1) < st.marginMin) continue;
      if (score > 0) { positives.push({ dest: city.id, good, qty: b.qty, score, cost: b.cost }); if (!best || score > best.score) best = positives[positives.length - 1]; }
    }
  }
  if (st.clumsy && positives.length > 1 && rng.next() < 0.25) best = positives[Math.floor(rng.next() * positives.length)]; // human: mis-picks
  if (st.clumsy && best && rng.next() < 0.15) best = { ...best, qty: Math.max(1, Math.floor(best.qty / 2)) }; // human: under-buys
  return best;
}

// Pending events pause the game clock; resolve them the way the style would.
function settle(g, style) {
  let guard = 0;
  while (g.pending && guard++ < 10) {
    if (g.pending.event === 'sea-pirates') resolvePirates(g, STYLES[style].pirate);
    else {
      const ev = g.world.events.find((e) => e.id === g.pending.event);
      const cid = ev?.choices?.[0]?.id; // styles always take the first offered choice
      if (!cid || !resolveEvent(g, cid).ok) break;
    }
  }
  while (g.encounterReport && guard++ < 20) dismissEncounterReport(g);
}

function run(start, seed, style, mode, events) {
  const st = STYLES[style];
  const g = newGame(w, start, { npcCompetition: competition, freePlay: mode === 'freeplay', events }), rng = makeRng(seed);
  rng.seed0 = seed; // specialist picks its good from the seed
  const home = start, plotId = home + ':1';
  const byGood = {}, byRoute = {}, costBasis = {}, origin = {};
  let trips = 0, minCash = g.cash, firstBankruptDay = null, leftoverCost = 0, built = 0, loans = 0, stalls = 0, phase = 'trade';
  const missionDays = {}; // mission id -> day first seen completed
  const addProfit = (good, at, revenue) => {
    const cost = costBasis[good] ?? 0, profit = revenue - cost;
    (byGood[good] ??= { revenue: 0, cost: 0, profit: 0 }).revenue += revenue; byGood[good].cost += cost; byGood[good].profit += profit;
    const key = `${origin[good] ?? at}>${at}`;
    (byRoute[key] ??= { profit: 0, trips: 0 }); byRoute[key].profit += profit; byRoute[key].trips++;
    costBasis[good] = 0;
  };
  while (!g.over && g.day < DAYS) {
    settle(g, style);
    const ship = g.ships[0];
    if (!ship.voyage && !g.pending && !g.encounterReport) {
      for (const [good, qty] of Object.entries(ship.cargo)) { const r = doSell(g, ship, good, qty); if (r.ok) addProfit(good, ship.at, r.revenue); }
      if (g.over) break;
      if (!(st.clumsy && rng.next() < 0.2) && ship.hull < st.repairBelow) repairShip(g, ship); // clumsy forgets repairs
      if (st.leverage) for (const l of [...loansOf(g)]) if (g.cash > 4000) repayLoan(g, l.id, Math.min(l.left, g.cash - 2000));
      if (st.industrial && phase === 'trade' && g.cash >= 6000) phase = 'build';
      if (st.industrial && phase === 'build') {
        const b = buildingAt(g, home, plotId);
        if (!b && g.cash > 1200) { const p = buyPlot(g, home, { id: plotId, type: 'workshop', w: 4, d: 4 }); if (p.ok) { const c = startConstruction(g, home, plotId, 'workshop'); if (c.ok) built++; } }
        else if (b?.state === 'active' && !b.halted && b.level < 3 && g.cash > 4000) { if (startConstruction(g, home, plotId, 'workshop').ok) built++; }
        else if (b?.halted && g.cash > 1000) restartBuilding(g, home, plotId);
      } else if (!(st.clumsy && rng.next() < 0.1)) { // clumsy idles one day in ten
        if (st.errand && g.campaign) { // mission runner: work the current mission step first
          const mid = g.campaign.active[0], mst = g.campaign.missions[mid];
          if (mst && !mst.done && !mst.failed && mid === 'm1-oficio') {
            const cur = () => g.campaign.missions['m1-oficio'].step;
            if (cur() === 0) { // buy salt here, or sail to the port with most stock
              const want = 40 - mst.count;
              const b = previewBuy(w, g.market, ship, g.cash, 'salt', Math.min(want, SHIP_TYPES[ship.type].capacity));
              if (b.qty > 0) { const r = doBuy(g, ship, 'salt', b.qty); if (r.ok) { costBasis.salt = (costBasis.salt ?? 0) + r.cost; origin.salt = ship.at; } }
              if (cur() === 1) { if (doSail(g, ship, 'sevilla').ok) trips++; }
              else if (b.qty === 0) { const best = w.cities.filter((c) => c.id !== ship.at).sort((x, y) => (g.market[y.id]?.salt?.stock ?? 0) - (g.market[x.id]?.salt?.stock ?? 0))[0]; if (best && doSail(g, ship, best.id).ok) trips++; }
            } else if (cur() === 1) { if (doSail(g, ship, 'sevilla').ok) trips++; }
            else if (cur() === 3 && ship.at === 'sevilla') { const q = ship.cargo.salt ?? 0; if (q > 0) { const r = doSell(g, ship, 'salt', q); if (r.ok) addProfit('salt', ship.at, r.revenue); } }
            else if (cur() === 4) campaignEvent(g, { kind: 'readReport' }, MISSION_HOOKS);
          } else if (mst && !mst.done && !mst.failed && mid === 'm2-nombre') {
            // reputation mission: trade deliberately into the ports nearest the respect bar
            const targets = Object.keys(g.market).map((c) => [c, repOf(g, c)]).filter(([, r]) => r < 20).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
            if (targets.length) {
              const best = plan(g, ship, style, rng, g.cash, new Set(targets));
              if (best) {
                const r = doBuy(g, ship, best.good, best.qty);
                if (r.ok) { costBasis[best.good] = (costBasis[best.good] ?? 0) + r.cost; origin[best.good] = ship.at; if (doSail(g, ship, best.dest).ok) trips++; }
              }
              continue;
            }
          }
        }
        const cashForBuying = g.cash + (st.leverage ? loanRoom(g, netWorth(g)) : 0);
        const best = plan(g, ship, style, rng, cashForBuying);
        if (best && st.leverage && best.cost > g.cash) {
          const need = Math.ceil((best.cost - g.cash) / LOAN_STEP) * LOAN_STEP;
          const t = takeLoan(g, ship.at, need, netWorth(g)); if (t.ok) loans++;
        }
        if (best && best.cost <= g.cash) {
          const b = doBuy(g, ship, best.good, best.qty);
          if (b.ok) {
            costBasis[best.good] = (costBasis[best.good] ?? 0) + b.cost; origin[best.good] = ship.at;
            if (doSail(g, ship, best.dest).ok) trips++;
          }
        } else if (st.fog && !best && g.cash > RUMOR_PRICE + (st.buffer ?? 0)) {
          const unknown = w.cities.filter((c) => c.id !== ship.at && !(known_market_has(g, c.id))).slice(0, 2);
          for (const c of unknown) buyRumor(g, c.id);
        }
      }
    }
    const prevB = g.bankruptcies ?? 0, prevDay = g.day;
    if (!g.over) advanceDay(g);
    if (g.day === prevDay && !g.over) { if (++stalls > 3) break; } else stalls = 0;
    if (firstBankruptDay === null && (g.bankruptcies ?? 0) > prevB) firstBankruptDay = g.day;
    for (const [mid, mst] of Object.entries(g.campaign?.missions ?? {})) if (mst.done && !(mid in missionDays)) missionDays[mid] = g.day;
    if (g.cash < minCash) minCash = g.cash;
  }
  for (const cost of Object.values(costBasis)) leftoverCost += cost; // bought but unsold at the end
  const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { revenue: Math.round(v.revenue), cost: Math.round(v.cost), profit: Math.round(v.profit) }]));
  const roundR = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { profit: Math.round(v.profit), trips: v.trips }]));
  const missions = Object.fromEntries(MISSIONS.map((m) => [m.id, { offered: !!g.campaign?.missions?.[m.id], done: g.campaign?.missions?.[m.id]?.done ?? false, failed: g.campaign?.missions?.[m.id]?.failed ?? false, doneDay: missionDays[m.id] ?? null }]));
  return { missions, start, day: g.day, outcome: g.over, reason: g.overReason ?? null, cash: Math.round(g.cash), netWorth: Math.round(netWorth(g)), trips, minCash: Math.round(minCash), bankruptcies: g.bankruptcies ?? 0, firstBankruptDay, leftoverCost: Math.round(leftoverCost), built, loansTaken: loans, stalled: stalls > 3 || undefined, byGood: round(byGood), byRoute: roundR(byRoute) };
}
const known_market_has = (g, city) => { const k = knownMarket(g); return k.market[city] && k.age[city].days <= 45; };

const med = (xs) => xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null;
const pct = (xs, p) => xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))] : null;
const merge = (acc, rs, pick) => {
  for (const r of rs) for (const [k, v] of Object.entries(pick(r))) (acc[k] ??= { profit: 0, revenue: 0, cost: 0, trips: 0 }).profit += v.profit, acc[k].revenue = (acc[k].revenue ?? 0) + (v.revenue ?? 0), acc[k].cost = (acc[k].cost ?? 0) + (v.cost ?? 0), acc[k].trips = (acc[k].trips ?? 0) + (v.trips ?? 0);
  return acc;
};
const cells = ROSTERS[roster].flatMap(([style, events]) => ['campaign', 'freeplay'].map((mode) => ({ style, mode, events })));
const results = [];
for (const c of cells) for (let i = offset; i < offset + games; i++) results.push({ strategy: c.style, mode: c.mode, events: c.events, ...run(w.cities[i % w.cities.length].id, i + 1000, c.style, c.mode, c.events) });

const summaries = {};
for (const c of cells) {
  const key = `${c.style}/${c.mode}${c.events ? '+events' : ''}`;
  const rs = results.filter((r) => r.strategy === c.style && r.mode === c.mode && r.events === c.events);
  const byGood = merge({}, rs, (r) => r.byGood), byRoute = merge({}, rs, (r) => r.byRoute);
  const totalProfit = Object.values(byGood).reduce((a, v) => a + v.profit, 0);
  const topGood = Object.entries(byGood).sort((a, b) => b[1].profit - a[1].profit)[0] ?? null;
  summaries[key] = {
    games: rs.length, events: c.events,
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
    missions: Object.fromEntries(MISSIONS.map((m) => [m.id, { offered: rs.filter((r) => r.missions[m.id]?.offered).length, done: rs.filter((r) => r.missions[m.id]?.done).length, failed: rs.filter((r) => r.missions[m.id]?.failed).length, medianDoneDay: med(rs.filter((r) => r.missions[m.id]?.doneDay !== null && r.missions[m.id]?.doneDay !== undefined).map((r) => r.missions[m.id].doneDay)) }])),
    buildingsBuilt: rs.reduce((a, r) => a + r.built, 0), loansTaken: rs.reduce((a, r) => a + r.loansTaken, 0), stalledRuns: rs.filter((r) => r.stalled).length,
    topGood: topGood ? { good: topGood[0], profit: Math.round(topGood[1].profit), share: totalProfit > 0 ? +(topGood[1].profit / totalProfit).toFixed(3) : null } : null,
    profitByGood: Object.fromEntries(Object.entries(byGood).sort((a, b) => b[1].profit - a[1].profit).map(([k, v]) => [k, Math.round(v.profit)])),
    profitByRoute: Object.fromEntries(Object.entries(byRoute).sort((a, b) => b[1].profit - a[1].profit).slice(0, 10).map(([k, v]) => [k, { profit: Math.round(v.profit), trips: v.trips }])),
  };
}
console.log(JSON.stringify({
  competition, daysPerRun: DAYS, gamesPerCell: games, offset, roster, seeds: `makeRng(seed=${offset}..${offset + games - 1} + 1000)`, elapsedMs: Math.round(performance.now() - started),
  scope: 'Same policies and real game functions as tools/sim_player.mjs; one behaviour bent per style (see STYLES in this file). Core cells run without events (comparable with sim_player and the 2026-10-21 baseline); style cells run WITH random events and encounters on (auto-resolved: first choice offered, pirates fled except the leveraged style, which fights). No contracts, no extra ships. Per-good/route profit is realized trade profit (sell revenue minus buy cost of the same lot); upkeep, tolls, wages, repairs, loan interest, building costs and unsold leftover cargo are NOT attributed to goods, so totalTradingProfit exceeds final net worth growth. Free play runs all 365 days (no win end); bankruptcies there resolve and play continues. Fog style plans on remembered/rumoured prices (buys rumours when blind) but trades at real prices.',
  summaries, results
}, null, 2));
