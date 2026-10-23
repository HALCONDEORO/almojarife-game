// Shared ship visual facts: real ship record -> view-agnostic descriptor, plus the
// side-view class dimensions used by the port and shipyard scenes. Pure, no DOM.
// Only real ship fields are read (type, hull, weapons, gunCond, gear, crew, id): no invented state.
import { weaponCount, maxCannons, gunCond, gearOf, crewOf } from "../sim/armament.mjs";

/** Side-view class dimensions: [length, height, masts]. Single source for the side-view scenes. */
export const HULL_SIDE = { barca: [28, 8, 1], cog: [44, 12, 1], caravel: [54, 12, 2], nao: [66, 16, 3] };

/** Visual facts a view may draw, derived only from the real ship record. */
export function shipDescriptor(ship) {
  return {
    id: ship.id,
    type: ship.type,
    hull: Number.isFinite(ship.hull) ? Math.min(100, Math.max(0, ship.hull)) : 100,
    weapons: weaponCount(ship),
    maxGuns: maxCannons(ship),
    gun: gunCond(ship),
    gear: gearOf(ship),
    crew: crewOf(ship),
  };
}
