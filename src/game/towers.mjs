// Watchtowers (issue #363, lane C): towers mounted on the city wall, one work at
// a time per city, following the walls pattern (warehouse store first, market
// for the missing, labor fee, exact readyTick). A tower mounts on the wall: the
// cap is TOWERS_PER_WALL_LEVEL x the standing wall level. Upkeep accrues daily
// into the weekly book under accrued.buildings["towers:<city>"]; unpaid towers
// stand but their watch suspends until the pay returns (same restart hysteresis
// as the walls' watch). The kept watch's effect TODAY is the fire watch: each
// manned tower cuts the weekly fire chance and length (calamities "incendio")
// - an own-design choice (the town watch's classic first job), not a documented
// figure. Pirate and siege interactions are deliberately NOT built: the pirate
// lane is held in docs/research/parity-gap.md. Every number is own tuning
// (inference, no documented figure exists). Flag `towers`, ON by default
// (owner order 24/10 12:08: "Todos los flags quiero activarlos siempre"), strict
// semantics: only opts.towers === false or === 1 turns it off. Flag OFF: no
// state, no posts, calamities untouched.
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { quoteUnits, consumeUnits } from "../sim/recipes.mjs";
import { post } from "./ledger.mjs";
import { wallsLevel } from "./walls.mjs";
import { whLocked } from "./whlock.mjs";

export const TOWERS_PER_WALL_LEVEL = 2;                    // the wall carries the towers
export const TOWER_RECIPE = Object.freeze({ bricks: 8, timber: 3, ironware: 1 }); // per tower, own tuning: a third of a wall level
export const TOWER_FEE = 100;                              // labor per tower, own tuning: a third of the wall fee
export const TOWER_BUILD_DAYS = 4;                         // per tower, own tuning
export const TOWER_UPKEEP = 1;                             // per tower and day, own tuning: half a wall level
export const TOWER_FIRE_WATCH = 1;                         // calamity mitigation levels per KEPT tower, own tuning

/** Fresh state for a new game with the flag on: a bare record map per city. Plain object for the JSON save round-trip (see walls). */
export function initTowers() { return {}; }

const cityName = (g, cityId) => g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;
const underConstruction = (g, cityId) => { const w = g.towers?.[cityId]; return !!(w && w.nextCount && w.readyTick > g.tick); };

/** Towers standing in a city (built, kept or not). No state in a flag-off game: zero. */
export function towersCount(g, cityId) { return g.towers?.[cityId]?.count ?? 0; }
/** Towers with a paid watch today: the ones that count for the fire watch. */
export function towersKept(g, cityId) { const w = g.towers?.[cityId]; return w && !w.unkept ? w.count ?? 0 : 0; }
/** Cap from the wall the towers mount on: zero with no standing wall. */
export function towersMax(g, cityId) { return TOWERS_PER_WALL_LEVEL * wallsLevel(g, cityId); }
/** Fire-watch strength of a city, in calamity mitigation levels (0 in a flag-off game). */
export function towersFireWatch(g, cityId) { return TOWER_FIRE_WATCH * towersKept(g, cityId); }

/** Quote the next tower: materials at the local market plus the labor fee. No mutation. */
export function quoteTowers(g, cityId) {
  if (!g.towers) return { ok: false, reason: "unknown" }; // flag off: no state, no towers
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const hasOffice = !Array.isArray(g.offices) || cityId === g.profile?.home || g.offices.includes(cityId); // same rule as construction
  if (!hasOffice) return { ok: false, reason: "office required" };
  if (underConstruction(g, cityId)) return { ok: false, reason: "already building" };
  if (wallsLevel(g, cityId) < 1) return { ok: false, reason: "walls required" }; // a tower mounts on the wall
  const count = towersCount(g, cityId) + 1;
  if (count > towersMax(g, cityId)) return { ok: false, reason: "max level" };
  const inputs = {}, fromStore = {}, missing = {};
  const storeWh = g.warehouses?.[cityId], store = storeWh?.goods ?? {};
  for (const [good, qty] of Object.entries(TOWER_RECIPE)) {
    inputs[good] = qty;
    fromStore[good] = whLocked(storeWh, good) ? 0 : Math.min(qty, Math.max(0, store[good] ?? 0)); // a locked good never leaves the store: the works buy it at the market instead
    missing[good] = qty - fromStore[good];
  }
  const q = quoteUnits(g.world, g.market, cityId, missing);
  if (!q.ok) return q;
  return { ok: true, count, cost: q.cost + TOWER_FEE, materials: q.cost, fee: TOWER_FEE, ticks: TOWER_BUILD_DAYS * TICKS_PER_DAY, inputs, fromStore, missing };
}

/** Pay and start the work. Standing towers keep serving while the next one rises (same rule as walls). */
export function startTowers(g, cityId) {
  if (g.over) return { ok: false, reason: "game over" };
  const q = quoteTowers(g, cityId);
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
  const rec = (g.towers[cityId] ??= { count: 0, state: "construction" });
  rec.state = (rec.count ?? 0) >= 1 ? "active" : "construction"; // the standing towers serve until the new one completes
  rec.nextCount = q.count; rec.readyTick = g.tick + q.ticks;
  post(g, "info", { txt: { es: `Comienzan las obras de una atalaya en ${cityName(g, cityId)} (la ${q.count}ª).`, en: `Work begins on a watchtower at ${cityName(g, cityId)} (number ${q.count}).` } });
  return { ok: true, ...q };
}

/** Construction finishes on its exact tick (hooked next to tickWalls). */
export function tickTowers(g) {
  if (!g.towers) return; // flag OFF: nothing
  for (const [cityId, w] of Object.entries(g.towers)) {
    if (!w.nextCount || w.readyTick > g.tick) continue;
    w.count = w.nextCount; w.state = "active"; delete w.nextCount; delete w.readyTick;
    post(g, "info", { txt: { es: `La atalaya de ${cityName(g, cityId)} queda en servicio (${w.count} en pie).`, en: `The watchtower at ${cityName(g, cityId)} enters service (${w.count} standing).` } });
  }
}

/** Daily upkeep into the weekly book; broke towers stand but their watch suspends, with the walls' restart hysteresis. Returns the running commitment so later accruers share today's cash budget. */
export function accrueTowers(g, priorCommitted = 0) {
  if (!g.towers) return priorCommitted; // flag OFF: nothing
  let committed = priorCommitted; // buildings and walls already reserved their upkeep against the same cash today
  for (const [cityId, w] of Object.entries(g.towers)) {
    if (w.state !== "active" || !w.count) continue;
    const cost = TOWER_UPKEEP * w.count;
    if (w.unkept) {
      if (g.cash - committed < cost * 2) continue; // hysteresis: resume only with two days of cost in hand
      w.unkept = false;
      post(g, "info", { txt: { es: `La guardia vuelve a las atalayas de ${cityName(g, cityId)}.`, en: `The watch returns to the towers of ${cityName(g, cityId)}.` } });
    }
    if (g.cash - committed < cost) {
      w.unkept = true;
      post(g, "info", { txt: { es: `Sin paga, las atalayas de ${cityName(g, cityId)} quedan desguarnecidas: nadie vigila los fuegos.`, en: `Unpaid, the towers of ${cityName(g, cityId)} stand unmanned: no one watches for fires.` } });
      continue;
    }
    const a = (g.accrued ??= { ships: {} });
    (a.buildings ??= {})[`towers:${cityId}`] = (a.buildings[`towers:${cityId}`] ?? 0) + cost;
    committed += cost;
  }
  return committed;
}
