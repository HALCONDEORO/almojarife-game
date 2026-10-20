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
export const defenceOf = (ship) => Math.round(cannonsOf(ship) * 10 * gunCond(ship) / 100 * crewDefence(ship)); // cannons x their condition x the crew
/** Armament wears out while sailing. Call once per day for a ship at sea. Fights will use wearGunsBy too. */
export const wearGunsBy = (ship, pct) => { if (cannonsOf(ship) > 0) { const c = gunCond(ship); ship.gunCond = Math.max(Math.min(c, 10), c - pct); } }; // wear stops at 10% and never raises a lower value
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
// Sailors per ship type: minimum to sail, optimal (the normal crew, wages as before) and maximum. Old saves have no crew field and count as optimal.
export const CREW = { barca: { min: 3, opt: 5, max: 8 }, cog: { min: 8, opt: 12, max: 18 }, caravel: { min: 10, opt: 14, max: 22 }, nao: { min: 18, opt: 28, max: 40 } };
export const HIRE_FEE = 10; // per sailor hired at the tavern
export const crewLimits = (ship) => CREW[ship.type] ?? CREW.cog;
export const crewOf = (ship) => { const L = crewLimits(ship), c = Number(ship.crew); return Number.isInteger(c) ? Math.min(L.max, Math.max(0, c)) : L.opt; };
/** Speed factor: 0 below the minimum (cannot sail), 0.7 to 1 up to the optimal crew, up to 1.1 with a full crew. */
export function speedFactor(ship) {
  const L = crewLimits(ship), c = crewOf(ship);
  if (c < L.min) return 0;
  if (c <= L.opt) return L.opt === L.min ? 1 : 0.7 + 0.3 * (c - L.min) / (L.opt - L.min);
  return 1 + 0.1 * (c - L.opt) / (L.max - L.opt);
}
/** Defence factor of the crew: half with nobody, 1 at the optimal crew, up to 1.5 with a full crew. */
export function crewDefence(ship) {
  const L = crewLimits(ship), c = crewOf(ship);
  return c <= L.opt ? 0.5 + 0.5 * c / L.opt : 1 + 0.5 * (c - L.opt) / (L.max - L.opt);
}
/** Daily upkeep split: the hull part is fixed (40%); the wages (60% at the optimal crew) follow the number of sailors. */
export function dailyUpkeep(ship, baseUpkeep) {
  const L = crewLimits(ship), wages = baseUpkeep * WAGE_SHARE * crewOf(ship) / L.opt;
  return { wages, total: baseUpkeep * (1 - WAGE_SHARE) + wages };
}
export function hireCrew(g, ship, n) {
  n = Math.floor(Number(n));
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isFinite(n) || n < 1) return { ok: false, reason: "bad amount" };
  const room = crewLimits(ship).max - crewOf(ship); if (room <= 0) return { ok: false, reason: "full" };
  n = Math.min(n, room); const cost = n * HIRE_FEE;
  if (g.cash < cost) return { ok: false, reason: "no cash" };
  g.cash -= cost; ship.crew = crewOf(ship) + n; return { ok: true, hired: n, cost, crew: ship.crew };
}
export function dismissCrew(g, ship, n) {
  n = Math.floor(Number(n));
  if (ship.voyage) return { ok: false, reason: "at sea" };
  if (!Number.isFinite(n) || n < 1 || crewOf(ship) <= 0) return { ok: false, reason: "bad amount" };
  n = Math.min(n, crewOf(ship)); ship.crew = crewOf(ship) - n; return { ok: true, dismissed: n, crew: ship.crew };
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
export function splitCost(cost, cannons, realWages = null) {
  const base = Math.max(0, cost - cannons), wages = Math.round((realWages ?? base * WAGE_SHARE) * 100) / 100;
  return { wages, cannons: Math.round(cannons * 100) / 100, hull: Math.round((base - wages) * 100) / 100 };
}
