// NPC worth (cash + cargo at base prices) sampled every game year, for the seeds given on the command line.
// Used to set the per-horizon NPC worth band in sim_balance_check.mjs from measured data.
// Run: node tools/sim_npc_worth_bands.mjs <years=100> <seed> [seed...]   Prints one JSON report. Own design.
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";

const years = Number(process.argv[2] ?? 100), seeds = process.argv.slice(3).map(Number);
if (!Number.isSafeInteger(years) || years < 1 || !seeds.length || seeds.some((s) => !Number.isSafeInteger(s))) throw new Error("usage: <years> <seed> [seed...]");
const world = loadWorld();
const worth = (g) => Math.round(g.ai.reduce((a, t) => a + t.cash + Object.entries(t.ship?.cargo ?? {}).reduce((x, [k, v]) => x + v * (world.goods[k]?.base ?? 0), 0), 0));
const out = {};
for (const seed of seeds) {
  const g = newGame(world, "cadiz", { freePlay: true, seed });
  const series = [worth(g)];
  for (let d = 1; d <= years * 365; d++) { advanceDay(g); if (d % 365 === 0) series.push(worth(g)); }
  out[seed] = series;
}
console.log(JSON.stringify({ years, seeds, worth: out }));
