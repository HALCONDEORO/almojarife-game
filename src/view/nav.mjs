// Map navigation logic that does not need a browser: travel estimate and the context-menu entries.
import { playerTravelTicks } from "../game/traveltime.mjs";
import { route } from "../sim/world.mjs";
import { SHIP_TYPES } from "../sim/trade.mjs";
/** {ok, ticks, km, path} for sending `ship` to `to` (still air unless `wind`, the leg's weather factor, is passed), or {ok:false, reason}. */
export function travelEstimate(world, ship, to, wind = 1) {
  if (!ship) return { ok: false, reason: "no ship" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (ship.at === to) return { ok: false, reason: "already here" };
  const r = route(world, ship.at, to);
  if (!r) return { ok: false, reason: "no route" };
  const ticks=playerTravelTicks(r.km,SHIP_TYPES[ship.type].kmPerDay,ship,wind);
  if(ticks===null)return {ok:false,reason:"crew"};
  return { ok: true, km: Math.round(r.km), ticks, path: r.path };
}
/** Entries for the right-click / long-press menu on a port. Each: {id, enabled, ticks?}. */
export function cityMenu(world, ship, city) {
  const est = travelEstimate(world, ship, city), items = [{ id: "sail", enabled: est.ok, ticks: est.ticks, reason: est.reason }];
  items.push({ id: "select", enabled: true });
  return items;
}
/** Which ship does key "1".."9" select? Returns an index or null. */
export const shipForKey = (g, key) => (/^[1-9]$/.test(key) && +key <= g.ships.length ? +key - 1 : null);
