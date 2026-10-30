// City walls (edificios push, lane B): three wall levels per port, matching the
// wall/gate art (x3). COUNCIL WORKS (Marco 30/10 15:23: "hace falta que el concejo
// vote, lo paguen ellos y lo mantengan ellos"): the concejo VOTES the walls at its
// meetings, pays the works out of the town chest (caja) and pays the watch the same
// way. The player never pays: at most, a merchant the port knows (respect
// "Conocido") can hand in a petition the concejo votes on at its next meeting.
// Construction follows the buildings pattern (labor fee, exact readyTick),
// the old wall keeps serving until the upgrade completes (reference: P3
// official manual 11.5.3, construction gate - no health effect). Upkeep is
// paid daily from the town chest (Marco 30/10: "lo mantengan ellos"); walls
// whose watch the caja cannot pay stand but their growth bonus suspends until
// the chest covers the watch again (buildings halt hysteresis). Kept walls add effective population at
// the market, the P3 wall-growth role (houses and public buildings inside the
// wall). Every number is own tuning (inference, no documented figure exists).
// Flag `walls`, ON by default (strict semantics: only opts.walls === false or
// === 1 turns it off). Flag OFF: no state, no posts, market untouched.
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { quoteUnits, consumeUnits } from "../sim/recipes.mjs";
import { post } from "./ledger.mjs";
import { repOf } from "./rank.mjs";
import { cajaOf, creditCaja, meetingDay } from "./council.mjs";

export const WALL_MAX_LEVEL = 3;                       // matches the wall/gate art levels
export const WALL_RECIPE = Object.freeze({ bricks: 24, timber: 8, ironware: 2 }); // per level, own tuning, measured at hospital scale
export const WALL_FEE = 300;                           // labor per level, own tuning: matches the hospital fee (Estudio binding condition)
export const WALL_BUILD_DAYS = 10;                     // per level, own tuning
export const WALL_UPKEEP = 2;                          // per active level and day, own tuning
export const WALL_POP = 25;                            // effective population per KEPT level (half a house level), own tuning
export const WALL_AUTONOMOUS = false;                        // own-motion builds DISABLED (Main decision 30/10 16:09): with them ON, 22 cities wall themselves in year 1 and the declared living-city balance baseline flips (lose/43022 -> win/50574); the chests' municipal income outgrows any flush bar. Flip to true to let flush concejos wall themselves.
export const WALL_CAJA_FLUSH = 1.5;                        // own proposal (adjustable): when WALL_AUTONOMOUS, the concejo only starts a wall on its own when the chest covers 1.5x the work
export const WALL_MIN_RESPECT = 20;                     // council works: the concejo only takes patronage from a merchant it knows ("Conocido", same bar as the office)

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
  if (underConstruction(g, cityId)) return { ok: false, reason: "already building" };
  const level = wallsLevel(g, cityId) + 1;
  if (level > WALL_MAX_LEVEL) return { ok: false, reason: "max level" };
  const inputs = {}, fromStore = {}, missing = {};
  const store = g.warehouses?.[cityId]?.goods ?? {};
  for (const [good, qty] of Object.entries(WALL_RECIPE)) {
    inputs[good] = qty * level;
    fromStore[good] = 0; // council works: the player's warehouse is never touched; everything is bought at the market
    missing[good] = inputs[good];
  }
  const q = quoteUnits(g.world, g.market, cityId, missing);
  if (!q.ok) return q;
  const fee = WALL_FEE * level, ticks = WALL_BUILD_DAYS * level * TICKS_PER_DAY;
  // Settle the total in whole coins. Keep the material quote unchanged and expose
  // the sub-coin settlement adjustment so the visible breakdown still adds up.
  const rawCents = Math.round((q.cost + fee) * 100), cost = Math.ceil(rawCents / 100), rounding = (cost * 100 - rawCents) / 100;
  return { ok: true, level, cost, materials: q.cost, fee, rounding, ticks, inputs, fromStore, missing };
}

/** The concejo pays and starts the work, out of the town chest (Marco 30/10: "lo paguen ellos"). An upgrade keeps the old wall active until the new one completes (P3 11.5.3). */
export function startWalls(g, cityId) {
  if (g.over) return { ok: false, reason: "game over" };
  const q = quoteWalls(g, cityId);
  if (!q.ok) return q;
  if (cajaOf(g, cityId) < q.cost) return { ok: false, reason: "caja short", cost: q.cost };
  const c = consumeUnits(g.world, g.market, cityId, q.missing, cajaOf(g, cityId) - q.fee);
  if (!c.ok) return c; // re-quoted inside; cannot fail after the checks above, but never mutate half-way
  creditCaja(g, cityId, -q.cost);
  const base = wallsLevel(g, cityId); // includes the legacy read, so an old wall never drops during the work
  const rec = (g.walls[cityId] ??= { level: base, state: "construction" });
  rec.state = base >= 1 ? "active" : "construction"; // the old defenses serve until the new level completes
  rec.nextLevel = q.level; rec.readyTick = g.tick + q.ticks;
  if (repOf(g, cityId) > 0) post(g, "council", { city: cityId, txt: { es: `El concejo de ${cityName(g, cityId)} vota levantar la muralla (nivel ${q.level}) y la paga de la caja de la ciudad.`, en: `The council of ${cityName(g, cityId)} votes to raise the wall (level ${q.level}) and pays for it out of the town chest.` } }); // the player only hears about councils that know them
  return { ok: true, ...q };
}

/** A merchant the port knows hands in a wall petition; the concejo votes on it at its next meeting (Marco 30/10: the player at most proposes). */
export function proposeWall(g, cityId) {
  if (!g.walls) return { ok: false, reason: "unknown" }; // flag off
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  if (repOf(g, cityId) < WALL_MIN_RESPECT) return { ok: false, reason: "respect required", need: WALL_MIN_RESPECT }; // the concejo only hears a merchant it knows ("Conocido", same bar as the office)
  if (underConstruction(g, cityId)) return { ok: false, reason: "already building" };
  if (wallsLevel(g, cityId) >= WALL_MAX_LEVEL) return { ok: false, reason: "max level" };
  const rec = (g.walls[cityId] ??= { level: wallsLevel(g, cityId), state: wallsLevel(g, cityId) >= 1 ? "active" : "construction" });
  if (rec.petition) return { ok: false, reason: "petition pending" };
  rec.petition = true;
  post(g, "council", { city: cityId, txt: { es: `Presentas al concejo de ${cityName(g, cityId)} una petición de muralla: se votará en la próxima reunión.`, en: `You hand the council of ${cityName(g, cityId)} a wall petition: it will be voted at the next meeting.` } });
  return { ok: true };
}

/** Meeting-day wall vote, one city at a time, right after councilDay: a pending petition is voted (and consumed) first; without one the concejo builds only with a flush chest. */
export function councilWallsVote(g) {
  if (!g.walls) return; // flag OFF: nothing
  for (const c of g.world.cities) {
    const id = c.id;
    if (!meetingDay(g.world, id, g.day)) continue;
    const rec = g.walls[id];
    if (underConstruction(g, id) || wallsLevel(g, id) >= WALL_MAX_LEVEL) continue; // a live petition waits for the next meeting
    const q = quoteWalls(g, id);
    if (!q.ok) {
      if (rec?.petition) { // the petition is voted and refused today, with its cause: the market cannot supply the work
        delete rec.petition;
        post(g, "council", { city: id, txt: { es: `El concejo de ${cityName(g, id)} rechaza tu petición de muralla: faltan materiales en el mercado.`, en: `The council of ${cityName(g, id)} turns down your wall petition: the market lacks the materials.` } });
      }
      continue;
    }
    const caja = cajaOf(g, id);
    if (rec?.petition) {
      delete rec.petition; // voted today, one way or the other
      if (caja < q.cost) {
        post(g, "council", { city: id, txt: { es: `El concejo de ${cityName(g, id)} rechaza tu petición de muralla: la caja no llega (${q.cost}).`, en: `The council of ${cityName(g, id)} turns down your wall petition: the chest cannot cover it (${q.cost}).` } });
        continue;
      }
      startWalls(g, id);
    } else if (WALL_AUTONOMOUS && caja >= q.cost * WALL_CAJA_FLUSH) {
      startWalls(g, id); // flush chest: the concejo walls the town on its own motion (disabled: see WALL_AUTONOMOUS)
    }
  }
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

/** Daily upkeep from the town chest; walls the caja cannot pay stand but their bonus suspends, with the buildings' restart hysteresis. The player's cash and weekly book are never touched (Marco 30/10: "lo mantengan ellos").
 *  Migration exception (Main 30/10): upkeep an old save already accrued under accrued.buildings["walls:<city>"] is settled once at the next weekly - never condoned, never charged again. */
export function accrueWalls(g, priorCommitted = 0) {
  if (!g.walls) return priorCommitted; // flag OFF: nothing
  for (const [cityId, w] of Object.entries(g.walls)) {
    if (w.state !== "active" || !w.level) continue;
    const cost = WALL_UPKEEP * w.level, caja = cajaOf(g, cityId);
    if (w.unkept) {
      if (caja < cost * 2) continue; // hysteresis: resume only with two days of cost in the chest
      w.unkept = false;
      post(g, "info", { txt: { es: `La guardia vuelve a las murallas de ${cityName(g, cityId)}.`, en: `The watch returns to the walls of ${cityName(g, cityId)}.` } });
    }
    if (cajaOf(g, cityId) < cost) {
      w.unkept = true;
      post(g, "council", { city: cityId, txt: { es: `La caja de ${cityName(g, cityId)} no paga la guardia: las murallas pierden su impulso.`, en: `The chest of ${cityName(g, cityId)} cannot pay the watch: the walls lose their drive.` } });
      continue;
    }
    creditCaja(g, cityId, -cost);
  }
  return priorCommitted; // the towers' watch continues today's cash-budget chain, unchanged: walls no longer draw on it
}
