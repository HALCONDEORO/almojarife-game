// Shared rounding for player departure and estimates. A captain never replaces required sailors.
import {speedFactor} from './crew.mjs';
import {captainSpeed} from './captains.mjs';
export function playerTravelDays(baseDays,ship){
 const crew=speedFactor(ship);if(crew<=0)return null;
 return Math.max(1,Math.ceil(baseDays/(crew*captainSpeed(ship))));
}
