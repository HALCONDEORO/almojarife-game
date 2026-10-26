// Player hull wear at sea: base + wind strain + storm exposure, and the drag a damaged hull adds
// to the rest of the voyage. Design: docs/design/hull-wear-rebalance.md. NPC traders keep the flat
// tickShip model on purpose: their hulls are never repaired, so coupling them would paralyze them.
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { windAt, inStorm } from "../sim/weather.mjs";
import { locate } from "./freenav.mjs";

export const WEAR_BASE_PER_DAY = 0.4; // calm sea, moderate: a Lisboa-Cadiz round costs ~10-12 points
export const WEAR_WIND_PER_DAY = 0.2; // extra at wind force 1.0 (rigging strain)
export const WEAR_STORM_PER_DAY = 3.5; // extra per day inside a storm cell: storms matter
export const HULL_FLOOR = 10; // weather never sinks you; battles do
export const HULL_SPEED_MIN = 0.65; // even a wreck limps home at 65% speed

/** Speed multiplier of a hull: 1.0 at 100%, HULL_SPEED_MIN at 0%. */
export const hullSpeedFactor = (hull) => HULL_SPEED_MIN + (1 - HULL_SPEED_MIN) * Math.max(0, Math.min(100, hull ?? 100)) / 100;

/** One day at sea for a PLAYER ship: weather-coupled wear + drag from the damage. Returns
 * { wear, storm, windForce, drag } or null when not underway (docked or anchored). */
export function seaWearDay(g, ship, force = false) {
  if (!ship.voyage && !force) return null; // force: the arrival day counts as a day at sea, charged on the arrival tick
  if (ship.voyage?.anchored) return null;
  let wear = WEAR_BASE_PER_DAY, windForce = 0, storm = false;
  let pos = g.world ? locate(g.world, ship) : null;
  if (pos && !Number.isFinite(pos.lat) && pos.id && g.world?.nodes?.[pos.id]) pos = g.world.nodes[pos.id]; // docked (arrival-day charge): the port's own coordinates
  if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lon) && Number.isFinite(g.day)) {
    windForce = windAt(pos.lat, pos.lon, g.day, g.seed ?? 0).force;
    storm = inStorm(pos.lat, pos.lon, g.day, g.seed ?? 0);
  }
  wear += WEAR_WIND_PER_DAY * windForce + (storm ? WEAR_STORM_PER_DAY : 0);
  ship.hull = Math.max(HULL_FLOOR, (ship.hull ?? 100) - wear);
  // Drag: sailing on a damaged hull stretches the rest of the voyage. Deterministic, save-safe
  // (dragFrac is absent in old saves and reads as 0); the ETA derives from ticksLeft, so it shows.
  const drag = TICKS_PER_DAY * (1 / hullSpeedFactor(ship.hull) - 1);
  const v = ship.voyage;
  if (v && !v.escorted && !v.escortedBy && drag > 0) { // an escorted pair keeps station: no drag on the shared voyage
    const total = (v.dragFrac ?? 0) + drag, whole = Math.floor(total);
    if (whole > 0) v.ticksLeft += whole;
    v.dragFrac = total - whole;
  }
  return { wear, storm, windForce, drag };
}

/** Hull warning thresholds: the playtest showed a hull can rot 78% -> 21% with no nudge. */
export const HULL_WARN_LOW = 30, HULL_WARN_CRITICAL = 15;
/** Post a message the first time a hull crosses each threshold downward. Uses the generic event
 * feed (inline txt) so no new UI strings are needed in web/main.mjs. */
export function hullWarning(before, ship) {
  const after = ship.hull ?? 100, h = Math.round(after);
  if (before >= HULL_WARN_CRITICAL && after < HULL_WARN_CRITICAL) return { es: `Casco crítico (${h}%): el barco apenas se mantiene; repara en el próximo puerto.`, en: `Critical hull (${h}%): the ship is barely holding together; repair at the next port.` };
  if (before >= HULL_WARN_LOW && after < HULL_WARN_LOW) return { es: `Casco bajo (${h}%): el daño frena el barco; conviene reparar pronto.`, en: `Low hull (${h}%): the damage is slowing the ship; worth repairing soon.` };
  return null;
}
