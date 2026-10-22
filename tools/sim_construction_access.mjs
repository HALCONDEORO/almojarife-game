// Can a player buy the construction materials where they stand? For every port and building type, quote a level-1
// build on day 0 and after one year (8 seeds, no player activity) and count the ports that are blocked by missing stock.
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { BUILDING_TYPES, PRODUCERS, cityAllowsProducer } from "../src/game/buildings.mjs";
import { quoteRecipe } from "../src/sim/recipes.mjs";

const SEEDS = 8, world = loadWorld(), ids = world.cities.map((c) => c.id);
const types = Object.keys(BUILDING_TYPES).filter((t) => t !== "office");
const stats = {}; const missing = {};
for (let seed = 1; seed <= SEEDS; seed++) {
  const g = newGame(world, "cadiz", { freePlay: true, seed });
  for (const when of ["day0", "year1"]) {
    if (when === "year1") for (let d = 0; d < 365; d++) advanceDay(g);
    for (const t of types) for (const c of ids) {
      if (PRODUCERS[t]?.primary && !cityAllowsProducer(world, c, t)) continue;
      const q = quoteRecipe(world, g.market, c, BUILDING_TYPES[t].recipe, 1);
      const k = `${t}|${when}`; (stats[k] ??= { ok: 0, n: 0 }).n++; if (q.ok) stats[k].ok++; else { const m = `${when}|${q.good ?? q.reason}`; missing[m] = (missing[m] ?? 0) + 1; }
    }
  }
}
const rows = types.map((t) => { const a = stats[`${t}|day0`], b = stats[`${t}|year1`]; return { type: t, day0: +(a.ok / a.n).toFixed(2), year1: +(b.ok / b.n).toFixed(2) }; });
console.log(JSON.stringify({ seeds: SEEDS, rows, blockedBy: missing }, null, 1));
