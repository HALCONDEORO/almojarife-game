// Shared travel-time math for departure and estimates. A captain never replaces required sailors.
import {speedFactor} from './crew.mjs';
import {captainSpeed} from './captains.mjs';
import {ticksForKm} from '../sim/clock.mjs';
/** Ticks for a voyage of `km` at `kmPerDay`, after crew, captain and the leg's wind. null if under-crewed. */
export function playerTravelTicks(km, kmPerDay, ship, wind = 1){
 const crew=speedFactor(ship);if(crew<=0)return null;
 return Math.max(1,Math.round(ticksForKm(km, kmPerDay)/(crew*captainSpeed(ship)*wind)));
}
