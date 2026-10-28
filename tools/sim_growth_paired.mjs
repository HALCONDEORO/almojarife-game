// Paired measurement for city growth (living cities 7/8), flag cityGrowth.
// Per seed: two identical free-play games advance in lockstep, one OFF, one ON.
// Records per pair: player cash/net worth (idle), bot cash totals, market grain
// medians, growth multipliers reached, game-over state. No aiStep execution by
// the harness: days advance with advanceDay, the game's own tick; bots run their
// own brains as in any game. Tuning (GROWTH_*) is declared in src/game/growth.mjs.
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth } from "../src/game/game.mjs";
import { growthMul, GROWTH_MIN, GROWTH_MAX, GROWTH_STEP } from "../src/game/growth.mjs";
const world = loadWorld();
const DAYS = Number(process.argv[2] ?? 730), SEEDS = (process.argv[3] ?? "1,2,3,4,5,6,7,8").split(",").map(Number);
const run = (seed, on) => {
  const g = newGame(world, "cadiz", { freePlay: true, seed, cityGrowth: on });
  while (g.day < DAYS && !g.over) advanceDay(g);
  const grainPrices = world.cities.map((c) => { const e = g.market[c.id].grain; return { city: c.id, stock: e.stock, target: e.target }; });
  return {
    seed, on, day: g.day, over: g.over ?? null,
    playerCash: Math.round(g.cash), playerNetWorth: Math.round(netWorth(g)),
    botCash: g.ai.map((t) => Math.round(t.cash)),
    botCashTotal: Math.round(g.ai.reduce((a, t) => a + t.cash, 0)),
    growth: on ? Object.fromEntries(world.cities.map((c) => [c.id, growthMul(g, c.id)])) : null,
    grainStockVsTarget: grainPrices.filter((e) => e.target > 0).map((e) => Math.round(e.stock / e.target * 100) / 100),
  };
};
const out = { days: DAYS, seeds: SEEDS, tuning: { GROWTH_MIN, GROWTH_MAX, GROWTH_STEP }, pairs: [] };
for (const seed of SEEDS) {
  const off = run(seed, false), on = run(seed, true);
  out.pairs.push({ seed, off, on, dPlayerNW: on.playerNetWorth - off.playerNetWorth, dBotCashTotal: on.botCashTotal - off.botCashTotal,
    movedCities: on.growth ? Object.values(on.growth).filter((m) => Math.abs(m - 1) > 0.01).length : 0 });
}
console.log(JSON.stringify(out, null, 1));
