// Crew wages and cannons. Pure game logic: no DOM.
// Wages are the crew's share of a ship's daily upkeep (shown as its own line in the weekly report, the total does not change).
// Cannons are bought at port, cost extra upkeep every day, and give the ship a defence value (used later against pirates).
export const WAGE_SHARE = 0.6, CANNON_PRICE = 150, CANNON_UPKEEP = 0.5;
export const MAX_CANNONS = { barca: 1, cog: 3, caravel: 4, nao: 8 };
export const cannonsOf = (ship) => ship.cannons ?? 0;
export const maxCannons = (ship) => MAX_CANNONS[ship.type] ?? 0;
/** Armament condition in percent (100 = like new). Old saves have no value and count as 100. */
export const gunCond = (ship) => { const c = Number(ship.gunCond); return Number.isFinite(c) ? Math.min(100, Math.max(0, c)) : 100; };
export const GUN_WEAR_PER_DAY = 0.4, GUN_REPAIR_SHARE = 0.4; // sea wear per day; full repair costs 40% of the cannons' price
export const defenceOf = (ship) => Math.round(cannonsOf(ship) * 10 * gunCond(ship) / 100);
/** Armament wears out while sailing. Call once per day for a ship at sea. Fights will use wearGunsBy too. */
export const wearGunsBy = (ship, pct) => { if (cannonsOf(ship) > 0) ship.gunCond = Math.max(10, gunCond(ship) - pct); };
export const wearGuns = (ship) => wearGunsBy(ship, GUN_WEAR_PER_DAY);
/** Cost to bring the armament back to 100%: proportional to the damage and to the number of cannons. */
export const gunRepairCost = (ship) => Math.round(cannonsOf(ship) * CANNON_PRICE * GUN_REPAIR_SHARE * (100 - gunCond(ship)) / 100 * 100) / 100;
export function repairGuns(g, ship) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const c = gunRepairCost(ship);
  if (!(c > 0)) return { ok: false, reason: "no damage" };
  if (g.cash < c) return { ok: false, reason: "no cash" };
  g.cash = Math.round((g.cash - c) * 100) / 100; ship.gunCond = 100; return { ok: true, cost: c };
}
/** Extra daily upkeep of the cannons of one ship. */
export const cannonUpkeep = (ship) => cannonsOf(ship) * CANNON_UPKEEP;
export function buyCannon(g, ship) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (cannonsOf(ship) >= maxCannons(ship)) return { ok: false, reason: "full" };
  if (g.cash < CANNON_PRICE) return { ok: false, reason: "no cash" };
  const n = cannonsOf(ship); ship.gunCond = (gunCond(ship) * n + 100) / (n + 1); // the new cannon is like new
  g.cash -= CANNON_PRICE; ship.cannons = n + 1;
  return { ok: true, cost: CANNON_PRICE, cannons: ship.cannons };
}
/** Split of a weekly ship cost into hull upkeep, crew wages and cannons. */
export function splitCost(cost, cannons) {
  const base = Math.max(0, cost - cannons), wages = Math.round(base * WAGE_SHARE * 100) / 100;
  return { wages, cannons: Math.round(cannons * 100) / 100, hull: Math.round((base - wages) * 100) / 100 };
}
