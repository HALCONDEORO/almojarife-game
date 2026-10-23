// City walls (edificios push, lane B): three wall levels per port, matching the
// wall/gate art (x3). Construction follows the buildings pattern (warehouse
// store first, market for the missing, labor fee, exact readyTick), phased so
// the old wall keeps serving until the upgrade completes (reference: P3
// official manual 11.5.3, construction gate - no health effect). Upkeep
// accrues daily into the weekly book under accrued.buildings["walls:<city>"];
// unpaid walls stand but their growth bonus suspends until the watch is paid
// again (buildings halt hysteresis). Kept walls add effective population at
// the market, the P3 wall-growth role (houses and public buildings inside the
// wall). Every number is own tuning (inference, no documented figure exists).
// Flag `walls`, ON by default (strict semantics: only opts.walls === false or
// === 1 turns it off). Flag OFF: no state, no posts, market untouched.
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { quoteUnits, consumeUnits } from "../sim/recipes.mjs";
import { post } from "./ledger.mjs";

export const WALL_MAX_LEVEL = 3;                       // matches the wall/gate art levels
export const WALL_RECIPE = Object.freeze({ bricks: 24, timber: 8, ironware: 2 }); // per level, own tuning, measured at hospital scale
export const WALL_FEE = 300;                           // labor per level, own tuning: matches the hospital fee (Estudio binding condition)
export const WALL_BUILD_DAYS = 10;                     // per level, own tuning
export const WALL_UPKEEP = 2;                          // per active level and day, own tuning
export const WALL_POP = 25;                            // effective population per KEPT level (half a house level), own tuning

/** Fresh state for a new game with the flag on: a bare level map per city. */
/**
 * A plain object, never Object.create(null): the JSON save round-trip returns plain
 * objects, and deepStrictEqual would fail the save tests on the prototype mismatch.
 */
export function initWalls() { return {}; }

const cityName = (g, cityId) => g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
const legacyLevel = (g, cityId) => ((g.plague?.walls?.[cityId] ?? 0) >= 1 ? 1 : 0); // saves from before the module read as level 1
const underConstruction = (g, cityId) => { const w = g.walls?.[cityId]; return !!(w && w.nextLevel && w.readyTick > g.tick); };

/** Wall level of a city: a COMPLETED modern record owns the truth and subsumes any legacy marker; legacy plague.walls=1 reads as 1 only while no modern wall stands (works under way never drop the old wall). */
export function wallsLevel(g, cityId) {
  const w = g.walls?.[cityId];
  if ((w?.level ?? 0) >= 1) return w.level;
  return legacyLevel(g, cityId);
}
/** Level that counts for bonuses today: zero while the modern watch is unpaid (a stale legacy marker never resurrects it). Legacy walls predate upkeep and count as kept. */
export function wallsKeptLevel(g, cityId) {
  const w = g.walls?.[cityId];
  if ((w?.level ?? 0) >= 1) return w.unkept ? 0 : w.level;
  return legacyLevel(g, cityId);
}

/** Quote the next wall level: materials at the local market plus the labor fee, full level cost. No mutation. */
export function quoteWalls(g, cityId) {
  if (!g.walls) return { ok: false, reason: "unknown" }; // flag off: no state, no walls
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const hasOffice = !Array.isArray(g.offices) || cityId === g.profile?.home || g.offices.includes(cityId); // same rule as construction
  if (!hasOffice) return { ok: false, reason: "office required" };
  if (underConstruction(g, cityId)) return { ok: false, reason: "already building" };
  const level = wallsLevel(g, cityId) + 1;
  if (level > WALL_MAX_LEVEL) return { ok: false, reason: "max level" };
  const inputs = {}, fromStore = {}, missing = {};
  const store = g.warehouses?.[cityId]?.goods ?? {};
  for (const [good, qty] of Object.entries(WALL_RECIPE)) {
    inputs[good] = qty * level;
    fromStore[good] = Math.min(inputs[good], Math.max(0, store[good] ?? 0));
    missing[good] = inputs[good] - fromStore[good];
  }
  const q = quoteUnits(g.world, g.market, cityId, missing);
  if (!q.ok) return q;
  const fee = WALL_FEE * level, ticks = WALL_BUILD_DAYS * level * TICKS_PER_DAY;
  return { ok: true, level, cost: q.cost + fee, materials: q.cost, fee, ticks, inputs, fromStore, missing };
}

/** Pay and start the work. An upgrade keeps the old wall active until the new one completes (P3 11.5.3). */
export function startWalls(g, cityId) {
  if (g.over) return { ok: false, reason: "game over" };
  const q = quoteWalls(g, cityId);
  if (!q.ok) return q;
  if (g.cash < q.cost) return { ok: false, reason: "no cash", cost: q.cost };
  const c = consumeUnits(g.world, g.market, cityId, q.missing, g.cash - q.fee);
  if (!c.ok) return c; // re-quoted inside; cannot fail after the checks above, but never mutate half-way
  const w = g.warehouses?.[cityId];
  for (const [good, qty] of Object.entries(q.fromStore)) {
    if (!qty) continue;
    const had = w.goods[good], transferred = Math.round((w.basis?.[good] ?? 0) * qty / had);
    if (w.basis) w.basis[good] = (w.basis[good] ?? 0) - transferred;
    w.goods[good] -= qty;
    if (!w.goods[good]) { delete w.goods[good]; if (w.basis) delete w.basis[good]; }
  }
  g.cash -= q.cost;
  const base = wallsLevel(g, cityId); // includes the legacy read, so an old wall never drops during the work
  const rec = (g.walls[cityId] ??= { level: base, state: "construction" });
  rec.state = base >= 1 ? "active" : "construction"; // the old defenses serve until the new level completes
  rec.nextLevel = q.level; rec.readyTick = g.tick + q.ticks;
  post(g, "info", { txt: { es: `Comienzan las obras de las murallas de ${cityName(g, cityId)} (nivel ${q.level}).`, en: `Wall works begin at ${cityName(g, cityId)} (level ${q.level}).` } });
  return { ok: true, ...q };
}

/** Construction finishes on its exact tick (hooked next to tickBuildings). */
export function tickWalls(g) {
  if (!g.walls) return; // flag OFF: nothing
  for (const [cityId, w] of Object.entries(g.walls)) {
    if (!w.nextLevel || w.readyTick > g.tick) continue;
    w.level = w.nextLevel; w.state = "active"; delete w.nextLevel; delete w.readyTick;
    post(g, "info", { txt: { es: `Las murallas de ${cityName(g, cityId)} alcanzan el nivel ${w.level}.`, en: `The walls of ${cityName(g, cityId)} reach level ${w.level}.` } });
  }
}

/** Daily upkeep into the weekly book; broke walls stand but their bonus suspends, with the buildings' restart hysteresis. */
export function accrueWalls(g) {
  if (!g.walls) return; // flag OFF: nothing
  let committed = 0; // today's charges commit in order against one cash figure (accrueBuildings pattern)
  for (const [cityId, w] of Object.entries(g.walls)) {
    if (w.state !== "active" || !w.level) continue;
    const cost = WALL_UPKEEP * w.level;
    if (w.unkept) {
      if (g.cash - committed < cost * 2) continue; // hysteresis: resume only with two days of cost in hand
      w.unkept = false;
      post(g, "info", { txt: { es: `La guardia vuelve a las murallas de ${cityName(g, cityId)}.`, en: `The watch returns to the walls of ${cityName(g, cityId)}.` } });
    }
    if (g.cash - committed < cost) {
      w.unkept = true;
      post(g, "info", { txt: { es: `Sin paga, la guardia abandona las murallas de ${cityName(g, cityId)}: la ciudad pierde su impulso.`, en: `Unpaid, the watch leaves the walls of ${cityName(g, cityId)}: the city loses its drive.` } });
      continue;
    }
    const a = (g.accrued ??= { ships: {} });
    (a.buildings ??= {})[`walls:${cityId}`] = (a.buildings[`walls:${cityId}`] ?? 0) + cost;
    committed += cost;
  }
}
