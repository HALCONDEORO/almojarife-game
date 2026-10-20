// Crew wages and cannons. Pure game logic: no DOM.
// Wages are the crew's share of a ship's daily upkeep (shown as its own line in the weekly report, the total does not change).
// Cannons are bought at port, cost extra upkeep every day, and give the ship a defence value (used later against pirates).
export const WAGE_SHARE = 0.6, CANNON_PRICE = 150, CANNON_UPKEEP = 0.5;
export const MAX_CANNONS = { barca: 1, cog: 3, caravel: 4, nao: 8 };
export const cannonsOf = (ship) => ship.cannons ?? 0;
export const maxCannons = (ship) => MAX_CANNONS[ship.type] ?? 0;
export const defenceOf = (ship) => cannonsOf(ship) * 10;
/** Extra daily upkeep of the cannons of one ship. */
export const cannonUpkeep = (ship) => cannonsOf(ship) * CANNON_UPKEEP;
export function buyCannon(g, ship) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (cannonsOf(ship) >= maxCannons(ship)) return { ok: false, reason: "full" };
  if (g.cash < CANNON_PRICE) return { ok: false, reason: "no cash" };
  g.cash -= CANNON_PRICE; ship.cannons = cannonsOf(ship) + 1;
  return { ok: true, cost: CANNON_PRICE, cannons: ship.cannons };
}
/** Split of a weekly ship cost into hull upkeep, crew wages and cannons. */
export function splitCost(cost, cannons) {
  const base = Math.max(0, cost - cannons), wages = Math.round(base * WAGE_SHARE * 100) / 100;
  return { wages, cannons: Math.round(cannons * 100) / 100, hull: Math.round((base - wages) * 100) / 100 };
}
