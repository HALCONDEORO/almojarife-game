// Buildings/jobs economy check: real game functions, three scenarios over N days,
// with metric snapshots at the 1/5/10/30 game-year horizons (365/1825/3650/10950 days).
// A: no player buildings (baseline: prices + NPC cash drift). B: bot-player builds and upgrades a
// workshop in his home port. C: poor bot (little cash) builds a saltworks: when do wages halt it?
// Run: node tools/sim_buildings_economy.mjs [days=10950]   Prints one JSON report. Own design.
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth, GOAL_CASH, buyWarehouse, doBuy, storeGoods } from "../src/game/game.mjs";
import { loansOwed } from "../src/game/bank.mjs";
import { buyPlot, startConstruction, quoteConstruction, staffingRatio, jobsNeeded, BUILDING_TYPES, JOBS_PER_LEVEL, WAGE_PER_WORKER, producerRate, sellQuote } from "../src/game/buildings.mjs";
import { RECIPES, quoteRecipe } from "../src/sim/recipes.mjs";
import { price } from "../src/sim/market.mjs";

export const HORIZONS = [365, 1825, 3650, 10950, 18250, 36500]; // 1, 5, 10, 30, 50, 100 game years
const days = Number(process.argv[2] ?? 36500);
if (!Number.isSafeInteger(days) || days < 1) throw new Error("days must be a positive integer");
const snaps = HORIZONS.filter((h) => h <= days);
const FLAGS = JSON.parse(process.env.SIM_FLAGS ?? "{}"); // extra newGame options for every scenario, e.g. SIM_FLAGS='{"plague":true}' (added for the plague tuning wave; default: none)
const world = loadWorld(), ids = world.cities.map((c) => c.id), goods = Object.keys(world.goods);

const priceIndex = (g) => { let s = 0, n = 0; for (const c of ids) for (const good of goods) { s += price(world, g.market[c][good], good) / world.goods[good].base; n++; } return +(s / n).toFixed(4); };
const npcCash = (g) => Math.round(g.ai.reduce((a, t) => a + t.cash, 0));
// NPC worth = cash + cargo valued at base prices. Ships are at sea at most snapshots with their cash spent on cargo, so cash alone looks like a collapse.
const npcWorth = (g) => Math.round(g.ai.reduce((a, t) => a + t.cash + Object.entries(t.ship?.cargo ?? {}).reduce((x, [k, v]) => x + v * (world.goods[k]?.base ?? 0), 0), 0));
const paidBuildings = (g) => Math.round((g.reports ?? []).reduce((a, r) => a + (r.buildings ?? []).reduce((x, l) => x + l.cost, 0), 0));
const halts = (g) => (g.inbox ?? []).filter((m) => m.kind === "halt").length;
const base = (g) => ({ priceIndex: priceIndex(g), npcCash: npcCash(g), npcWorth: npcWorth(g) });

function scenarioA() {
  const g = newGame(world, "cadiz", { freePlay: true, ...FLAGS });
  const s0 = base(g);
  const horizons = {};
  const st = {}, worthYears = []; // one NPC worth sample per game year over the last 10 years of the run
  for (let d = 1; d <= days; d++) { advanceDay(g); campaignAt365(g, st); if (d % 365 === 0 && d > days - 3650) worthYears.push(npcWorth(g)); if (snaps.includes(d)) horizons[d] = { ...base(g), idlePlayerCash: Math.round(g.cash) }; }
  const s1 = base(g);
  const npcWorthMean10y = worthYears.length ? Math.round(worthYears.reduce((a, b) => a + b, 0) / worthYears.length) : s1.npcWorth;
  return { priceIndex: [s0.priceIndex, s1.priceIndex], npcCash: [s0.npcCash, s1.npcCash], npcWorth: [s0.npcWorth, s1.npcWorth], npcWorthMean10y, idlePlayerCashEnd: Math.round(g.cash), campaignEnd: st.firstOver ?? null, horizons };
}

function scenarioB(seed = 0) {
  const home = "casablanca"; // best cloth margin near the start (+125/batch at day 0): the market picks the place
  const g = newGame(world, home, { cash: 2500, freePlay: true, seed, ...FLAGS }); // 4,500 total: a trader who saved up for his first workshop
  const s0 = base(g);
  const bp = buyPlot(g, home, { id: home + ":1", type: "workshop", w: 4, d: 4 });
  const build = startConstruction(g, home, home + ":1", "workshop");
  if (!build.ok) return { error: "build failed", reason: build.reason, plotPrice: bp.price };
  let stockpiled = 0; const BUFFER = 1200;
  let minCash = g.cash, staffSum = 0, staffDays = 0, haltDays = 0, upgrades = 0, haltEvents = 0; let lostB = 0;
  const horizons = {};
  const st = {};
  const snapB = (d) => { const b = g.buildings?.[home]?.[home + ":1"] ?? {}; horizons[d] = { ...base(g), cash: Math.round(g.cash), netWorth: Math.round(netWorth(g)), level: b.level, produced: b.produced ?? 0, wagesPaid: paidBuildings(g), haltEvents, haltDays, halted: !!b.halted, avgStaffing: staffDays ? +(staffSum / staffDays).toFixed(3) : 1 }; };
  for (let d = 1; d <= days; d++) {
    const wasHalted = !!g.buildings?.[home]?.[home + ":1"]?.halted;
    advanceDay(g);
    const b = g.buildings?.[home]?.[home + ":1"];
    if (!b && !lostB) lostB = d;
    if (!wasHalted && b?.halted) haltEvents++;
    if (b?.state === "active") { staffSum += staffingRatio(g, home); staffDays++; if (b.halted) haltDays++; }
    if (d % 7 === 0 && b?.state === "active" && !b.halted) { // restock at every level: a max-level loom still eats wool
      if (!g.warehouses[home] && g.cash > BUFFER + 1500) buyWarehouse(g, home);
      const ship = g.ships.find((s) => s.at === home && !s.voyage);
      if (g.warehouses[home] && ship) for (const [good, qty] of Object.entries(RECIPES.workshop)) {
        const need = Math.max(0, qty * Math.min(b.level + 1, 3) - (g.warehouses[home].goods[good] ?? 0)); // one batch ahead while it can still grow
        const unit = Math.ceil(price(world, g.market[home][good], good) * 1.1);
        const n = Math.min(need, Math.max(0, Math.floor((g.cash - BUFFER) / unit)));
        if (n > 0) { const r = doBuy(g, ship, good, n); if (r.ok) { const stored = storeGoods(g, ship, good, r.qty); if (stored.ok) stockpiled += stored.qty; } }
      }
      const q = quoteRecipe(world, g.market, home, "weave");
      const margin = q.ok ? sellQuote(world, g.market, home, "cloth", 2) - q.cost : 0;
      const daily = (BUILDING_TYPES.workshop.upkeep + JOBS_PER_LEVEL.workshop * WAGE_PER_WORKER) * (b.level + 1);
      const qc = quoteConstruction(g, home, home + ":1", "workshop"); // never start works that breach the buffer: an upgrade that leaves no cash for wool and wages kills the shop
      if (b.level < 3 && qc.ok && g.cash > BUFFER + qc.cost && margin * producerRate("workshop", b.level + 1) >= 3 * daily) {
        const r = startConstruction(g, home, home + ":1", "workshop"); if (r.ok) upgrades++;
      }
    }
    minCash = Math.min(minCash, g.cash);
    campaignAt365(g, st);
    if (snaps.includes(d)) snapB(d);
  }
  const b = g.buildings[home]?.[home + ":1"]; // a bankrupt bot loses the workshop to the free-play seizure: a valid outcome to report, not a sim crash
  return { home, startCash: 4500, plotPrice: bp.price, buildCost: Math.round(build.cost ?? 0), upgrades, stockpiled, whOwned: !!g.warehouses[home], finalLevel: b?.level ?? null, produced: b?.produced ?? 0, bankruptcies: g.bankruptcies ?? 0, workshopLostDay: lostB || null,
    upkeepWagesPaid: paidBuildings(g), haltEvents, haltDays, avgStaffing: staffDays ? +(staffSum / staffDays).toFixed(3) : 1,
    cashMin: Math.round(minCash), cashEnd: Math.round(g.cash), netWorthEnd: Math.round(netWorth(g)),
    priceIndex: [s0.priceIndex, priceIndex(g)], npcCash: [s0.npcCash, npcCash(g)], jobsEnd: jobsNeeded(g, home), campaignEnd: st.firstOver ?? null, horizons };
}

function scenarioC(seed = 0) {
  const g = newGame(world, "cadiz", { cash: 1000, seed, ...FLAGS }); // starts with 3,000: plot + build at the recalibrated price, almost nothing left for wages
  const s0 = base(g);
  const bp = buyPlot(g, "cadiz", { id: "cadiz:1", type: "saltworks", w: 3, d: 3 });
  const build = startConstruction(g, "cadiz", "cadiz:1", "saltworks");
  let firstHaltDay = null, resumedDay = null;
  const horizons = {};
  const st = {};
  for (let d = 1; d <= days; d++) {
    const wasHalted = !!g.buildings?.cadiz?.["cadiz:1"]?.halted;
    advanceDay(g);
    const b = g.buildings?.cadiz?.["cadiz:1"];
    if (firstHaltDay === null && b?.halted) firstHaltDay = g.day;
    if (firstHaltDay !== null && resumedDay === null && wasHalted && !b?.halted) resumedDay = g.day;
    if (g.over && !st.firstOver) st.firstOver = { day: g.day, result: g.over, reason: g.overReason ?? null };
    if (snaps.includes(d)) horizons[d] = { cash: Math.round(g.cash), halted: !!b?.halted, produced: b?.produced ?? 0 };
  }
  const b = g.buildings?.cadiz?.["cadiz:1"] ?? {};
  return { startCash: 3000, plotPrice: bp.price ?? null, buildOk: build.ok ?? false, buildCost: Math.round(build.cost ?? 0), firstHaltDay, resumedDay, halts: halts(g),
    haltedEnd: !!b.halted, cashEnd: Math.round(g.cash), produced: b.produced ?? 0, priceIndex: [s0.priceIndex, priceIndex(g)], campaignEnd: st.firstOver ?? null, horizons };
}

// Long horizons run in free play (no deadline, bankruptcy resolves instead of ending the game).
// The would-be campaign result is recorded at day 365: win if the goal was met, lose otherwise.
const campaignAt365 = (g, st) => { if (g.day === 365 && !st.firstOver) st.firstOver = { day: 365, result: g.cash - loansOwed(g) >= GOAL_CASH ? "win" : "lose", reason: null }; };

function scenarioD() {
  const g = newGame(world, "cadiz", { freePlay: true, ...FLAGS }); // idle free-play trader: the debt-spiral stress test
  let minCash = g.cash;
  for (let d = 1; d <= days; d++) { advanceDay(g); minCash = Math.min(minCash, g.cash); }
  return { dayEnd: g.day, over: g.over, bankruptcies: g.bankruptcies ?? 0, cashMin: Math.round(minCash), cashEnd: Math.round(g.cash) };
}

// Extra game seeds (argv[3], comma list) run the bots B and C again; seed 0 stays the default and the report shape for it does not change.
const extraSeeds = (process.argv[3] ?? "").split(",").filter(Boolean).map((x) => (/^\d+$/.test(x) ? Number(x) : NaN));
if (extraSeeds.some((x) => !Number.isSafeInteger(x) || x < 0 || x > 4294967295)) throw new Error("seeds must be uint32 integers");
const t0 = Date.now();
const report = { days, horizons: snaps, scenarios: { A_no_player: scenarioA(), B_builder_bot: scenarioB(), C_poor_bot: scenarioC(), D_freeplay_idle: scenarioD() }, seedRuns: Object.fromEntries(extraSeeds.map((x) => [x, { B_builder_bot: scenarioB(x), C_poor_bot: scenarioC(x) }])), seconds: +((Date.now() - t0) / 1000).toFixed(1),
  scope: "Real newGame/advanceDay/buyPlot/startConstruction/staffingRatio. Building upkeep+wages via accrueBuildings, halts via the piece-c rule, production via workshopTick, 3 NPC traders, no events, no loans. The bot does not trade by ship. Snapshots at 1/5/10/30 game years in sandbox mode: the campaign end (win/lose at day 365) is cleared so the economy keeps running; the first campaign end is reported as campaignEnd." };
console.log(JSON.stringify(report, null, 1));
