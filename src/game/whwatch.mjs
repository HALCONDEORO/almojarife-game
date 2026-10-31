// Warehouse watch (vigilancia del almacén): a guard level the player hires per port
// warehouse, own design on the P4-06 office notes ("resumen y vigilancia"; research
// doc, not a documented mechanic). State rides on the warehouse (g.warehouses[city].watch),
// so old saves carry no watch and load unchanged: no guards, no charge, no posts.
// - Contract: setWatch validates the warehouse and the game state, floors the request and
//   clamps it to the CURRENT cap-derived max in both directions. Explicit decision where
//   the notes leave it open: the source's asymmetric clamp (a cut could stay above a
//   lowered limit) is NOT adopted - a lowered cap never leaves guards above the limit,
//   because the effective level re-clamps against the live cap at every read.
// - Classification: security grade 0/1/2 from stored units M vs kept guards G with a
//   sqrt shape (L = trunc(sqrt(M/2)); L > 2G -> 0, L < G -> 2, else 1; empty warehouse:
//   M = G = 0 -> 1, M = 0 with guards -> 2). Own tuning, halved 2026-10-31: the P3 study
//   ties the watch requirement to the REQUIRED storage and keeps the sqrt shape but does
//   not document its divisor. The halved divisor means roughly half the guards for the
//   same stored load (the continuous goods threshold per guard quadruples: L of M instead
//   of trunc(sqrt(2M))). A classification shown to the player, not a theft probability:
//   no theft mechanic exists.
// - Accounting: the wage (kept guards x WH_WATCH_WAGE, an exact integer, the same figure
//   the tab shows as the estimate) accrues once per day into the weekly book under
//   accrued.buildings["whwatch:<city>"] - per period and per city identifier, the
//   watchtowers' convention. The watch record carries its last accrued day, so a repeated
//   call the same day (a re-run period) cannot charge twice. Unpaid guards
//   stand down (unkept) and resume with the towers' hysteresis.
// - Effect TODAY: the kept watch patrols the warehouse district and spots fires early,
//   one fire-mitigation level per WH_WATCH_FIRE_EVERY guards (calamities.mjs, same seam
//   as the watchtowers). Own tuning throughout: no figure is documented.
// No DOM here.
import { post } from "./ledger.mjs";
import { warehouseCapBonus } from "./buildings.mjs";

const WH_BASE_CAP = 300; // base warehouse capacity (game.mjs WAREHOUSE_CAP; local like almoneda.mjs's WAREHOUSE_BASE_CAP: importing game.mjs would cycle)

/** Total storage capacity of a port: the base warehouse plus each active warehouse-building level (same formula as game.mjs warehouseCap). */
export const whCap = (g, city) => WH_BASE_CAP + warehouseCapBonus(g, city);

export const WH_WATCH_WAGE = 1;      // coins per guard and day (own tuning: a watchtower's upkeep)
export const WH_WATCH_FIRE_EVERY = 5; // guards per fire-mitigation level (own tuning: five watchmen match one tower's round)

/** Guard cap for a storage capacity: the full-load classification threshold, floored plus one, so grade 2 stays reachable even when sqrt(cap/2) is an exact integer (cap 1800: threshold 30, cap 31). Same own halved tuning as the classification. */
export const watchMaxFor = (cap) => (cap > 0 ? Math.trunc(Math.sqrt(cap / 2)) + 1 : 0);

/** The watch record of a port's warehouse, or null. */
export const watchOf = (g, city) => g.warehouses?.[city]?.watch ?? null;
const whUsed = (wh) => Object.values(wh.goods).reduce((sum, qty) => sum + qty, 0);
const cityName = (g, cityId) => g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;

/** Guards actually on duty: the stored level re-clamped to the live cap, 0 while unpaid. */
export const watchKept = (g, city, cap) => {
  const rec = watchOf(g, city);
  if (!rec || rec.unkept) return 0;
  return Math.min(rec.guards, watchMaxFor(cap));
};

/** Hire or trim the watch. Returns {ok, guards} with the effective level, or {ok:false, reason}. */
export function setWatch(g, city, n, cap) {
  if (g.over) return { ok: false, reason: "game over" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  if (!Number.isFinite(n)) return { ok: false, reason: "bad number" };
  const guards = Math.min(Math.max(Math.floor(n), 0), watchMaxFor(cap));
  (wh.watch ??= { guards: 0 }).guards = guards;
  if (!guards) delete wh.watch.unkept; // no watch, no debt: a rehire starts clean
  return { ok: true, guards };
}

/** Security grade 0 (low), 1 (fair), 2 (high): stored units against kept guards, the own halved sqrt shape. */
export function watchSecurity(g, city, cap) {
  const stored = whUsed(g.warehouses?.[city] ?? { goods: {} }), onDuty = watchKept(g, city, cap);
  if (stored === 0) return onDuty > 0 ? 2 : 1; // nothing to guard: fair without a watch, high with one
  const load = Math.trunc(Math.sqrt(stored / 2));
  return load > 2 * onDuty ? 0 : load < onDuty ? 2 : 1;
}

/** Fire-mitigation levels the kept watch adds to the city's fire roll (0 without a watch). */
export const watchFireWatch = (g, city, cap) => Math.floor(watchKept(g, city, cap) / WH_WATCH_FIRE_EVERY);

/** Daily wage accrual into the weekly book, after the towers in the same cash-budget chain. */
export function accrueWatch(g, capOf, priorCommitted = 0) {
  let committed = priorCommitted; // buildings, walls and towers already reserved their upkeep against the same cash today
  for (const [cityId, wh] of Object.entries(g.warehouses ?? {})) {
    const rec = wh.watch;
    if (!rec || !rec.guards) continue;
    if (rec.lastDay === g.day) continue; // one accrual per day per city, even on a repeated call
    rec.lastDay = g.day;
    const cost = Math.min(rec.guards, watchMaxFor(capOf(cityId))) * WH_WATCH_WAGE;
    if (!cost) continue;
    if (rec.unkept) {
      if (g.cash - committed < cost * 2) continue; // hysteresis: resume only with two days of cost in hand
      rec.unkept = false;
      post(g, "info", { txt: { es: `La guardia vuelve a tu almacén de ${cityName(g, cityId)}.`, en: `The watch returns to your warehouse at ${cityName(g, cityId)}.` } });
    }
    if (g.cash - committed < cost) {
      rec.unkept = true;
      post(g, "info", { txt: { es: `Sin paga, la guardia de tu almacén de ${cityName(g, cityId)} se retira: nadie vigila tus mercancías.`, en: `Unpaid, the watch of your warehouse at ${cityName(g, cityId)} stands down: no one guards your goods.` } });
      continue;
    }
    const acc = (g.accrued ??= { ships: {} });
    (acc.buildings ??= {})[`whwatch:${cityId}`] = (acc.buildings[`whwatch:${cityId}`] ?? 0) + cost;
    committed += cost;
  }
  return committed;
}
