// The armory: where ship weapons and sailors' gear are bought. One rule set for the player and the AI traders
// (the buyer is `holder`, anything with a `cash` field). Pure logic, no DOM.
import { SHIP_TYPES } from "./trade.mjs";
import { WEAPON_TYPES, weaponCount, maxCannons, weaponsOf, mountWeapon, armoryPrice, crewOf, gearOf, gearWeight, loadWeight, GEAR, GEAR_MAX } from "./armament.mjs";
/** Why a weapon or gear purchase cannot happen now, or null. The same check serves the player and the AI traders. */
export function armoryBlock(g, ship, extraWeight, price, cash) {
  if (g.over) return "game over";
  if (ship.voyage) return "at sea";
  if (cash < price) return "no cash";
  if (Object.values(ship.cargo ?? {}).reduce((a, b) => a + b, 0) > Math.max(0, SHIP_TYPES[ship.type].capacity - loadWeight(ship) - extraWeight)) return "hold full"; // the new weight would not fit the cargo already aboard
  return null;
}
/** Buy and mount a weapon at the armory of the ship's port. `holder` pays: the game (player) or an AI trader, same rules. */
export function buyWeapon(g, ship, type = "cannon", holder = g) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const W = WEAPON_TYPES[type]; if (!W) return { ok: false, reason: "bad type" };
  if (weaponCount(ship) >= maxCannons(ship)) return { ok: false, reason: "full" };
  const price = armoryPrice(g, ship.at, W.price), why = armoryBlock(g, ship, W.weight, price, holder.cash);
  if (why) return { ok: false, reason: why };
  holder.cash = Math.round((holder.cash - price) * 100) / 100;
  mountWeapon(ship, type);
  return { ok: true, cost: price, weapons: weaponsOf(ship) };
}
/** Extra hold weight the next gear level would add — the UI needs the same number to warn before the click. */
export function gearNextWeight(ship, lvl = gearOf(ship)) { return Math.ceil(crewOf(ship) * 0.1 * (lvl + 1) - 1e-9) - gearWeight(ship); }
/** Buy the next level of sailors' gear at the armory (pays the difference to the next level). */
export function buyGear(g, ship, holder = g) {
  if (g.over) return { ok: false, reason: "game over" };
  if (ship.voyage) return { ok: false, reason: "at sea" };
  const lvl = gearOf(ship); if (lvl >= GEAR_MAX) return { ok: false, reason: "max level" };
  const nextW = gearNextWeight(ship, lvl);
  const price = armoryPrice(g, ship.at, GEAR[lvl + 1] - GEAR[lvl]), why = armoryBlock(g, ship, nextW, price, holder.cash);
  if (why) return { ok: false, reason: why };
  holder.cash = Math.round((holder.cash - price) * 100) / 100; ship.gear = lvl + 1;
  return { ok: true, cost: price, gear: ship.gear };
}
