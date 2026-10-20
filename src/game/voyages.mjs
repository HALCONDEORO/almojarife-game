// Trade log: profit per voyage. A voyage opens when a ship sails; sales made in the port where it lands count for it.
const r2 = (x) => Math.round(x * 100) / 100, MAX = 40;
export function openVoyage(g, ship, from, to) {
  const v = { ship: ship.id, from, to, day: g.day, sold: 0, revenue: 0, profit: 0 };
  (g.voyages ??= []).unshift(v); if (g.voyages.length > MAX) g.voyages.pop();
  return v;
}
/** Add a sale to the latest voyage of that ship; sales with no voyage on record are ignored. */
export function recordSale(g, ship, qty, revenue, profit) {
  const v = (g.voyages ?? []).find((x) => x.ship === ship.id);
  if (!v || !(qty > 0)) return false;
  v.sold += qty; v.revenue = r2(v.revenue + revenue); v.profit = r2(v.profit + profit);
  return true;
}
/** Last voyages first, optionally for one ship. Saves from before the log existed give []. */
export const voyageLog = (g, shipId) => (g.voyages ?? []).filter((v) => shipId === undefined || v.ship === shipId);
export const bestVoyage = (g) => (g.voyages ?? []).reduce((b, v) => (!b || v.profit > b.profit ? v : b), null);
