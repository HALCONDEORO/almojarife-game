// Ship armament, sailors' gear and the weight both put on a ship. Pure data and helpers, no imports,
// shared by the trade rules (capacity), the crew rules (defence) and the AI traders.
// Own design ("tu decides", docs/design/armory.md): numbers are first proposals tuned by the sweep.

/** Ship weapons, one per slot. `weight` is hold space (cargo units) the piece takes away from the ship. */
export const WEAPON_TYPES = {
  ballista: { price: 90, power: 6, upkeep: 0.3, weight: 1 },
  catapult: { price: 130, power: 8, upkeep: 0.4, weight: 2 },
  cannon: { price: 150, power: 10, upkeep: 0.5, weight: 3 },
  bombard: { price: 300, power: 16, upkeep: 0.8, weight: 5 },
};
export const MAX_CANNONS = { barca: 1, cog: 3, caravel: 4, nao: 8 };
export const CREW = { barca: { min: 3, opt: 5, max: 8 }, cog: { min: 8, opt: 12, max: 18 }, caravel: { min: 10, opt: 14, max: 22 }, nao: { min: 18, opt: 28, max: 40 } };
export const crewLimits = (ship) => CREW[ship.type] ?? CREW.cog;
export const crewOf = (ship) => { const L = crewLimits(ship), c = Number(ship.crew); return Number.isInteger(c) ? Math.min(L.max, Math.max(0, c)) : L.opt; };

/** Mounted weapons as {type: count}. Legacy `ship.cannons` counts as that many `cannon`. */
export const weaponsOf = (ship) => { const w = { ...(ship.weapons ?? {}) }; for (const k of Object.keys(w)) if (!WEAPON_TYPES[k] || !Number.isInteger(w[k]) || w[k] < 1) delete w[k]; if (Number.isInteger(ship.cannons) && ship.cannons > 0) w.cannon = (w.cannon ?? 0) + ship.cannons; return w; };
export const weaponCount = (ship) => Object.values(weaponsOf(ship)).reduce((a, b) => a + b, 0);
export const maxCannons = (ship) => MAX_CANNONS[ship.type] ?? 0;
export const weaponWeight = (ship) => Object.entries(weaponsOf(ship)).reduce((s, [t, n]) => s + WEAPON_TYPES[t].weight * n, 0);

/** Sailors' gear (swords, shields, crossbows): level 0-3 per ship, bought at the armory. Each level adds
 *  GEAR_DEFENCE to the crew's defence factor and weighs GEAR_WEIGHT_PER_SAILOR hold units per sailor aboard (rounded up). */
export const GEAR = [0, 60, 150, 300]; // total price to own level 0..3 (buying a level pays the difference)
export const GEAR_MAX = 3, GEAR_DEFENCE = 0.1, GEAR_WEIGHT_PER_SAILOR = 0.1;
export const gearOf = (ship) => { const l = Number(ship.gear); return Number.isInteger(l) ? Math.min(GEAR_MAX, Math.max(0, l)) : 0; };
export const gearWeight = (ship) => Math.ceil(crewOf(ship) * GEAR_WEIGHT_PER_SAILOR * gearOf(ship) - 1e-9) + 0; // +0: never return -0 for an unarmed crew
/** Hold space taken by armament and gear. */
export const loadWeight = (ship) => weaponWeight(ship) + gearWeight(ship);

export const gunCond = (ship) => { const c = Number(ship.gunCond); return Number.isFinite(c) ? Math.min(100, Math.max(0, c)) : 100; };

/** Armory prices: every port has a town armory at list price; the player's own armory (active levels, capped at 3) takes 10% per level off the player's purchases there. */
export const ARMORY_DISCOUNT_PER_LEVEL = 0.1;
export const armoryLevels = (g, city) => Math.min(3, Object.values(g?.buildings?.[city] ?? {}).reduce((a, b) => a + (b.state === "active" && b.type === "armory" ? b.level : 0), 0));
export const armoryPrice = (g, city, base) => Math.round(base * (1 - ARMORY_DISCOUNT_PER_LEVEL * armoryLevels(g, city)));

/** Mount one weapon. Mutates the ship only; the caller pays. */
export function mountWeapon(ship, type) {
  const n = weaponCount(ship); ship.gunCond = (gunCond(ship) * n + 100) / (n + 1); // the new piece is like new
  if (type === "cannon" && !ship.weapons) ship.cannons = (ship.cannons ?? 0) + 1; // legacy field stays the cannon count when nothing else is mounted
  else ship.weapons = { ...weaponsOf(ship), [type]: (weaponsOf(ship)[type] ?? 0) + 1 }, ship.cannons = 0;
}
