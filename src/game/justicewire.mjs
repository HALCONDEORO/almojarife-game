// Wiring of port justice (mechanic 5): what the host registers once, and what the game calls. Own design, no DOM.
// With g.justice off, or with no data registered, every function here returns at once and touches nothing.
import { officersAct, raiseCharge, justiceOn, isHeld } from "./justice.mjs";
import { decayInfamy } from "./pardon.mjs";
import { addRep } from "./reputation.mjs";
import { price } from "../sim/market.mjs";

const DATA = { realms: null, courts: null };
/** The host hands over data/realms.json and data/courts.json once. Calling with no realms clears it. */
export const setJusticeData = (realms, courts = null) => { DATA.realms = realms ?? null; DATA.courts = courts ?? null; };
export const justiceReady = (g) => justiceOn(g) && !!DATA.realms;
/** Called when a ship of the player arrives in port: the officers of that port's realm try the open charges. */
export function arrivalJustice(g, ship) { return justiceReady(g) && ship?.at ? officersAct(g, DATA.realms, ship.at, ship, DATA.courts) : []; }
/** Once a day: bad names fade with time (a month at a time). */
export function dailyJustice(g) { if (justiceOn(g)) decayInfamy(g); }
/** A ship held by the court cannot leave. */
export const heldNow = (g, ship) => justiceOn(g) && isHeld(ship, g.day);
/** Reputation lost in the victim's home port for an attack with no letter. */
export const PIRACY_REP_HIT = 8;
/** An attack with no letter was detected: charge it in the victim's home port and cool the port's opinion. loot = goods taken. */
export function chargePiracy(g, victimHome, loot) {
  if (!justiceReady(g) || !victimHome) return null;
  const entry = g.market?.[victimHome];
  const value = Object.entries(loot ?? {}).reduce((s, [good, q]) => s + (entry?.[good] ? Math.round(price(g.world, entry[good], good) * q) : 0), 0);
  const c = raiseCharge(g, DATA.realms, victimHome, "piracy", value);
  if (c) addRep(g, victimHome, -PIRACY_REP_HIT);
  return c;
}
