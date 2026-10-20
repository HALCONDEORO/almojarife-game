// Port tolls and trade privileges. Pure game logic: no DOM.
// Every time a ship docks, the port charges a toll that depends on the ship's size. It is added to the weekly bill (own line in the report).
// Privilege: the more respect you have earned in a port, the smaller the toll there. At "honoured" you pass free.
import { SHIP_TYPES } from "../sim/trade.mjs";
import { respectIndex, repOf } from "./rank.mjs";
export const TOLL_DIV = 10; // toll = capacity / 10 (a 60 cog pays 6)
export const TOLL_DISCOUNT = [0, 0.25, 0.5, 1]; // by respect level: stranger, known, trusted, honoured
const r2 = (x) => Math.round(x * 100) / 100;
export const baseToll = (ship) => SHIP_TYPES[ship.type].capacity / TOLL_DIV;
export const tollFor = (g, ship, city) => r2(baseToll(ship) * (1 - TOLL_DISCOUNT[respectIndex(repOf(g, city))]));
export const tollsDue = (g) => r2(g.accrued?.tolls ?? 0);
/** Charge the toll of `city` for `ship` into the weekly bill. Returns the amount. */
export function chargeToll(g, ship, city) {
  const t = tollFor(g, ship, city);
  if (t > 0) { const a = (g.accrued ??= { ships: {} }); a.tolls = r2((a.tolls ?? 0) + t); }
  return t;
}
