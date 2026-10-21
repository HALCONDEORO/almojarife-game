// Buildings/jobs economy check: real game functions, three scenarios over N days.
// A: no player buildings (baseline: prices + NPC cash drift). B: bot-player builds and upgrades a
// workshop in his home port. C: poor bot (little cash) builds a saltworks: when do wages halt it?
// Run: node tools/sim_buildings_economy.mjs [days=365]   Prints one JSON report. Own design.
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth } from "../src/game/game.mjs";
import { buyPlot, startConstruction, staffingRatio, jobsNeeded } from "../src/game/buildings.mjs";
import { price } from "../src/sim/market.mjs";

const days = Number(process.argv[2] ?? 365);
if (!Number.isSafeInteger(days) || days < 1) throw new Error("days must be a positive integer");
const world = loadWorld(), ids = world.cities.map((c) => c.id), goods = Object.keys(world.goods);

const priceIndex = (g) => { let s = 0, n = 0; for (const c of ids) for (const good of goods) { s += price(world, g.market[c][good], good) / world.goods[good].base; n++; } return +(s / n).toFixed(4); };
const npcCash = (g) => Math.round(g.ai.reduce((a, t) => a + t.cash, 0));
const paidBuildings = (g) => Math.round((g.reports ?? []).reduce((a, r) => a + (r.buildings ?? []).reduce((x, l) => x + l.cost, 0), 0));
const halts = (g) => (g.inbox ?? []).filter((m) => m.kind === "halt").length;
const base = (g) => ({ priceIndex: priceIndex(g), npcCash: npcCash(g) });

function scenarioA() {
  const g = newGame(world, "cadiz");
  const s0 = base(g);
  for (let d = 0; d < days; d++) advanceDay(g);
  const s1 = base(g);
  return { priceIndex: [s0.priceIndex, s1.priceIndex], npcCash: [s0.npcCash, s1.npcCash], idlePlayerCashEnd: Math.round(g.cash) };
}

function scenarioB() {
  const home = "casablanca"; // best cloth margin near the start (+125/batch at day 0): the market picks the place
  const g = newGame(world, home, { cash: 2500 }); // 4,500 total: a trader who saved up for his first workshop
  const s0 = base(g);
  const bp = buyPlot(g, home, { id: home + ":1", type: "workshop", w: 4, d: 4 });
  const build = startConstruction(g, home, home + ":1", "workshop");
  if (!build.ok) return { error: "build failed", reason: build.reason, plotPrice: bp.price };
  let minCash = g.cash, staffSum = 0, staffDays = 0, haltDays = 0, upgrades = 0, haltEvents = 0;
  for (let d = 0; d < days; d++) {
    const wasHalted = !!g.buildings?.[home]?.[home + ":1"]?.halted;
    advanceDay(g);
    const b = g.buildings?.[home]?.[home + ":1"];
    if (!wasHalted && b?.halted) haltEvents++;
    if (b?.state === "active") { staffSum += staffingRatio(g, home); staffDays++; if (b.halted) haltDays++; }
    if ((d === 90 || d === 210) && b?.state === "active" && !b.halted && b.level < 3 && g.cash > 1500) { const r = startConstruction(g, home, home + ":1", "workshop"); if (r.ok) upgrades++; }
    minCash = Math.min(minCash, g.cash);
  }
  const b = g.buildings[home][home + ":1"];
  return { home, startCash: 4500, plotPrice: bp.price, buildCost: Math.round(build.cost ?? 0), upgrades, finalLevel: b.level, produced: b.produced ?? 0,
    upkeepWagesPaid: paidBuildings(g), haltEvents, haltDays, avgStaffing: staffDays ? +(staffSum / staffDays).toFixed(3) : 1,
    cashMin: Math.round(minCash), cashEnd: Math.round(g.cash), netWorthEnd: Math.round(netWorth(g)),
    priceIndex: [s0.priceIndex, priceIndex(g)], npcCash: [s0.npcCash, npcCash(g)], jobsEnd: jobsNeeded(g, home) };
}

function scenarioC() {
  const g = newGame(world, "cadiz", { cash: -800 }); // starts with 1,200: plot + build, almost nothing left
  const bp = buyPlot(g, "cadiz", { id: "cadiz:1", type: "saltworks", w: 3, d: 3 });
  const build = startConstruction(g, "cadiz", "cadiz:1", "saltworks");
  let firstHaltDay = null;
  for (let d = 0; d < days; d++) { advanceDay(g); if (firstHaltDay === null && g.buildings?.cadiz?.["cadiz:1"]?.halted) firstHaltDay = g.day; }
  const b = g.buildings?.cadiz?.["cadiz:1"] ?? {};
  return { startCash: 1200, plotPrice: bp.price ?? null, buildOk: build.ok ?? false, buildCost: Math.round(build.cost ?? 0), firstHaltDay, halts: halts(g),
    haltedEnd: !!b.halted, cashEnd: Math.round(g.cash), produced: b.produced ?? 0 };
}

const t0 = Date.now();
const report = { days, scenarios: { A_no_player: scenarioA(), B_builder_bot: scenarioB(), C_poor_bot: scenarioC() }, seconds: +((Date.now() - t0) / 1000).toFixed(1),
  scope: "Real newGame/advanceDay/buyPlot/startConstruction/staffingRatio. Building upkeep+wages via accrueBuildings, halts via the piece-c rule, production via workshopTick, 3 NPC traders, no events, no loans. The bot does not trade by ship." };
console.log(JSON.stringify(report, null, 1));
