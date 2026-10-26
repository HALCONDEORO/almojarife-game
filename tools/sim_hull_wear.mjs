// One game year of a barca looping Cadiz <-> Huelva without repairs under the weather-coupled
// hull wear, vs the old flat 0.5/day. Measures: sea days, storm days, total wear, voyage-time
// inflation from hull drag, warning crossings. Run: node tools/sim_hull_wear.mjs [seed]
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doSail, TICKS_PER_DAY } from "../src/game/game.mjs";
import { shipPosition } from "../src/sim/position.mjs";
import { inStorm } from "../src/sim/weather.mjs";

const world = loadWorld();
const seed = Number(process.argv[2] ?? 7);
const g = newGame(world, "cadiz", { freePlay: true, seed });
const s = g.ships[0];
let seaDays = 0, stormDays = 0, wearTotal = 0, ticksSailed = 0, dragAdded = 0, lowWarns = 0, critWarns = 0, voyages = 0;
for (let d = 0; d < 365; d++) {
  if (!s.voyage && !g.over) { const r = doSail(g, s, s.at === "huelva" ? "cadiz" : "huelva"); if (r.ok) voyages++; }
  const before = s.hull ?? 100;
  const dragBefore = s.voyage ? (s.voyage.ticksLeft + (s.voyage.dragFrac ?? 0)) : 0;
  advanceDay(g);
  if (s.voyage || before !== (s.hull ?? 100)) {
    const charged = before - (s.hull ?? 100);
    if (charged > 0) {
      seaDays++;
      wearTotal += charged;
      const p = shipPosition(world, s, 0);
      if (p && inStorm(p.lat, p.lon, g.day, g.seed ?? 0)) stormDays++;
      if (s.voyage) { const after = s.voyage.ticksLeft + (s.voyage.dragFrac ?? 0); dragAdded += Math.max(0, after - dragBefore + TICKS_PER_DAY); }
    }
  }
  if (s.hull < 30 && before >= 30) lowWarns++;
  if (s.hull < 15 && before >= 15) critWarns++;
  ticksSailed += 0;
}
const flat = seaDays * 0.5;
console.log(JSON.stringify({
  seed, days: 365, voyages, seaDays, stormDays,
  wearTotal: Math.round(wearTotal * 100) / 100,
  flatModelWear: Math.round(flat * 100) / 100,
  avgWearPerSeaDay: Math.round((wearTotal / Math.max(1, seaDays)) * 1000) / 1000,
  dragTicksAdded: Math.round(dragAdded),
  dragDaysAdded: Math.round(dragAdded / TICKS_PER_DAY * 10) / 10,
  hullEnd: Math.round(s.hull * 10) / 10,
  lowWarns, critWarns,
  repairCostEnd: Math.ceil((100 - s.hull) * 4),
}, null, 1));
