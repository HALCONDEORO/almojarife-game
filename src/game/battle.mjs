// Ship-to-ship battle resolver (phase 0 of docs/design/piracy-study.md). Own design.
// Pure and seeded: resolveBattle() reads two ships and four rolls and returns a report; nothing is mutated.
// applyBattle() moves the report onto the ships and conserves goods: loot leaves the victim's hold and enters the
// attacker's, and everything else the report destroys is counted. The same rules serve player and bot ships.
// Not wired into the game yet: no gate or balance number changes in this phase.
import { defenceOf, crewOf, wearGunsBy } from "./crew.mjs";

export const ROUNDS = 3, SURRENDER_RATIO = 2, LOOT_CAP = 0.6, ROUND_DAMAGE = 12, GUN_WEAR_PER_ROUND = 3;
const skill = (ship, key) => { const n = ship.captain?.[key]; return Number.isSafeInteger(n) && n >= 0 && n <= 3 ? n : 0; };
const level = (v) => (Number.isInteger(v) && v >= 0 && v <= 3 ? v : 0);
const hullOf = (ship) => { const h = Number(ship.hull); return Number.isFinite(h) ? Math.min(100, Math.max(0, h)) : 100; };
const unit = (n) => { if (!Number.isFinite(n) || n < 0 || n >= 1) throw Error("roll must be finite in [0,1)"); return n; };
/** Firepower: weapons x condition x crew (defenceOf), captain skill, a floor of 2 (men with bows), scaled by the hull left. */
export const firepower = (ship, hull = hullOf(ship)) => (defenceOf(ship) + skill(ship, "defence") * 6 + 2) * (0.5 + 0.5 * hull / 100);
/** Boarding strength: sailors x gear (+10% per level, ship.gear 0-3) x captain defence (+10% per level). */
export const boardStrength = (ship, crew = crewOf(ship)) => crew * (1 + 0.1 * level(ship.gear)) * (1 + 0.1 * skill(ship, "defence"));

/** Goods the attacker takes: best value per unit first, at most LOOT_CAP of the victim's units and at most freeHold units. */
export function lootPlan(cargo, freeHold, prices = {}, cap = LOOT_CAP) {
  const total = Object.values(cargo ?? {}).reduce((a, b) => a + b, 0);
  let room = Math.max(0, Math.min(Math.floor(total * cap), Math.floor(freeHold)));
  const loot = {};
  for (const [good, q] of Object.entries(cargo ?? {}).sort((a, b) => (prices[b[0]] ?? 0) - (prices[a[0]] ?? 0) || (a[0] < b[0] ? -1 : 1))) {
    const take = Math.min(q, room); if (take > 0) { loot[good] = take; room -= take; }
  }
  return loot;
}

/** opts: { damage (hull points per round at even odds, default ROUND_DAMAGE), lootCap (default LOOT_CAP), finish: "capture" | "plunder" | "sink" (attacker's choice when it wins, default "capture"), freeHold, prices }. rolls: 4 values in [0,1). */
export function resolveBattle(att, def, rolls, opts = {}) {
  if (!Array.isArray(rolls) || rolls.length < ROUNDS + 1) throw Error("need ROUNDS + 1 rolls");
  rolls.slice(0, ROUNDS + 1).forEach(unit);
  const finish = opts.finish ?? "capture", damage = opts.damage ?? ROUND_DAMAGE;
  if (!["capture", "plunder", "sink"].includes(finish)) throw Error("unknown finish");
  let hA = hullOf(att), hD = hullOf(def), cA = crewOf(att), cD = crewOf(def), rounds = 0;
  for (let i = 0; i < ROUNDS && hA > 0 && hD > 0; i++, rounds++) {
    const fA = firepower(att, hA), fD = firepower(def, hD), share = fA / (fA + fD);
    const dD = Math.round(damage * share * (0.5 + rolls[i])), dA = Math.round(damage * (1 - share) * (0.5 + rolls[(i + 1) % ROUNDS]));
    hD = Math.max(0, hD - dD); hA = Math.max(0, hA - dA);
    cD = Math.max(0, cD - Math.floor(dD / 4)); cA = Math.max(0, cA - Math.floor(dA / 4));
  }
  const rep = { rounds, hullA: hA, hullD: hD, crewA: cA, crewD: cD, loot: {}, destroyed: {}, destroyedAttacker: {}, attackerShipSunk: hA <= 0, defenderShipSunk: hD <= 0, captured: false, surrendered: false };
  const cargo = def.cargo ?? {};
  const sinkAll = () => { rep.destroyed = { ...cargo }; };
  // A ship that goes down takes its whole hold with it, the attacker's as much as the defender's.
  if (hA <= 0) rep.destroyedAttacker = { ...(att.cargo ?? {}) };
  if (hA <= 0 && hD <= 0) { rep.result = "both-sunk"; sinkAll(); return rep; }
  if (hA <= 0) { rep.result = "defender-won"; return rep; }
  if (hD <= 0) { rep.result = "defender-sunk"; sinkAll(); return rep; }
  // Both afloat. Hopeless odds make the defender strike its flag; otherwise the crews board.
  const ratio = firepower(att, hA) / firepower(def, hD);
  let attackerWins;
  if (ratio >= SURRENDER_RATIO) { attackerWins = true; rep.surrendered = true; }
  else attackerWins = boardStrength(att, cA) * (0.5 + rolls[ROUNDS]) > boardStrength(def, cD) * (1.5 - rolls[ROUNDS]);
  if (!attackerWins) { rep.result = "defender-won"; return rep; }
  if (finish === "sink") { rep.result = "defender-sunk"; rep.defenderShipSunk = true; sinkAll(); return rep; }
  rep.loot = lootPlan(cargo, opts.freeHold ?? Infinity, opts.prices, opts.lootCap ?? LOOT_CAP);
  if (finish === "capture") { rep.result = "captured"; rep.captured = true; } else rep.result = "plundered";
  return rep;
}

/** Apply a report once. Moves loot between holds, sets hulls and crews, wears the guns, and marks sunk ships (ship.sunk = true);
 *  removing a sunk ship and changing the owner of a captured one stay with the caller. Returns the units of goods destroyed on both ships. */
export function applyBattle(att, def, rep) {
  att.hull = rep.hullA; def.hull = rep.hullD; att.crew = rep.crewA; def.crew = rep.crewD;
  wearGunsBy(att, GUN_WEAR_PER_ROUND * rep.rounds); wearGunsBy(def, GUN_WEAR_PER_ROUND * rep.rounds);
  if (rep.attackerShipSunk) att.sunk = true;
  if (rep.defenderShipSunk) def.sunk = true;
  def.cargo ??= {};
  for (const [good, q] of Object.entries(rep.loot)) {
    const take = Math.min(q, def.cargo[good] ?? 0);
    def.cargo[good] = (def.cargo[good] ?? 0) - take; if (!def.cargo[good]) delete def.cargo[good];
    (att.cargo ??= {})[good] = (att.cargo[good] ?? 0) + take;
  }
  let destroyed = 0;
  const burn = (ship, lost) => { ship.cargo ??= {}; for (const [good, q] of Object.entries(lost ?? {})) { const d = Math.min(q, ship.cargo[good] ?? 0); destroyed += d; ship.cargo[good] -= d; if (!ship.cargo[good]) delete ship.cargo[good]; } };
  burn(def, rep.destroyed); burn(att, rep.destroyedAttacker);
  return destroyed;
}
