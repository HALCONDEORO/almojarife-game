// Measures retained heap across fresh-seed restarts. Run: node --expose-gc tools/benchmark_newgame_warmup_memory.mjs
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";

if (!global.gc) throw new Error("run with node --expose-gc");
const world = loadWorld();
const runs = 10;
newGame(world, "cadiz", { seed: 0, freePlay: true }); // load modules and populate shared data before measuring
global.gc();
const before = process.memoryUsage().heapUsed;
for (let seed = 1; seed <= runs; seed++) newGame(world, "cadiz", { seed, freePlay: true });
global.gc();
const after = process.memoryUsage().heapUsed;
const delta = after - before;
const result = { runs, beforeMB: +(before / 1048576).toFixed(2), afterMB: +(after / 1048576).toFixed(2), retainedDeltaMB: +(delta / 1048576).toFixed(2) };
console.log(JSON.stringify(result, null, 2));
if (delta > 6 * 1048576) throw new Error(`warm-up cache retained ${result.retainedDeltaMB} MB across ${runs} fresh seeds (LRU cap: four entries)`);
