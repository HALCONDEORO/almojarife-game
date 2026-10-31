// Market information: a merchant only knows prices where he has a ship docked or a warehouse (live),
// or from what he saw last time, or from a bought rumour (stale and inexact).
import { seeded } from "../view/cityscene.mjs";
export const RUMOR_PRICE = 40, RUMOR_ERROR = 0.25;
// Snapshots must own nested commerce/household records too, including bot views.
const clone = (c) => structuredClone(c);
export function isLive(g, city) {
  return !!g.warehouses?.[city] || g.ships.some((s) => !s.voyage && s.at === city);
}
/** Record exact data for every port where the player is present today. */
export function refreshIntel(g) {
  const intel = (g.intel ??= {});
  for (const c of g.world.cities) if (isLive(g, c.id)) intel[c.id] = { day: g.day, exact: true, cells: clone(g.market[c.id]) };
}
/** Buy a rumour about a port: a snapshot of today's stock with up to +-25% error. */
export function buyRumor(g, city, at) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === city)) return { ok: false, reason: "unknown city" };
  if (at !== undefined && !g.ships.some((x) => !x.voyage && x.at === at)) return { ok: false, reason: "no ship here" };
  if (isLive(g, city)) return { ok: false, reason: "already known" };
  if (g.cash < RUMOR_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= RUMOR_PRICE;
  const rnd = seeded(`${city}:${g.day}:${g.nextId}`), cells = clone(g.market[city]);
  for (const e of Object.values(cells)) e.stock = Math.max(0, Math.round(e.stock * (1 + (rnd() * 2 - 1) * RUMOR_ERROR)));
  (g.intel ??= {})[city] = { day: g.day, exact: false, cells };
  return { ok: true };
}
/** A market-shaped object holding only what the player knows, plus how old each entry is. */
export function knownMarket(g) {
  const m = {}, age = {};
  for (const [city, i] of Object.entries(g.intel ?? {})) { m[city] = i.cells; age[city] = { days: g.day - i.day, exact: i.exact && g.day - i.day === 0 }; }
  return { market: m, age };
}
