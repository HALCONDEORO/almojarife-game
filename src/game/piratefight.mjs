// Phase 1 of docs/design/piracy-study.md: the player's pirate encounter fought with the shared battle resolver.
// The pirate is a real ship, seeded from the encounter id (reproducible after save/reload), owner "pirates".
// Own design. Pure: reads the player's ship, returns an outcome in the shape applyEncounter already takes.
import { seeded } from "../view/cityscene.mjs";
import { resolveBattle, applyBattle } from "./battle.mjs";
import { MAX_CANNONS, WEAPON_TYPES } from "./crew.mjs";

export const PIRATE_TYPES = [["barca", 0.6], ["cog", 0.3], ["caravel", 0.1]]; // same mix as the old prize roll
export const PIRATE_DAMAGE = 4; // hull points per round at even odds (the shared default is 12)
export const PIRATE_WEAK = 0.17; // share of pirates with no guns
export const PIRATE_STRENGTH = 1.5; // calibration knob: multiplies the pirates' weapon count, tuned with tools/sim_pirate_fight.mjs
/** A seeded pirate ship for one encounter. */
export function pirateShip(seed, encounterId) {
  const r = seeded(`pirate-ship-v1:${seed ?? 0}:${encounterId}`);
  let x = r(), type = PIRATE_TYPES[PIRATE_TYPES.length - 1][0];
  for (const [t, p] of PIRATE_TYPES) { x -= p; if (x < 0) { type = t; break; } }
  const slots = MAX_CANNONS[type] ?? 0;
  const weak = r() < PIRATE_WEAK; // a share of pirates are poorly armed fishermen-turned-raiders
  const guns = weak ? 0 : Math.max(1, Math.round(slots * PIRATE_STRENGTH * (0.2 + 2 * r()))); // pirates are not held to the slot caps: they are the difficulty knob
  const wr = r(), crewRoll = r();
  return { id: `pirate:${encounterId}`, owner: "pirates", type, hull: 100, weapons: guns ? { [Object.keys(WEAPON_TYPES)[Math.floor(wr * 4)]]: guns } : {}, gunCond: 100, captain: { defence: weak ? 0 : Math.floor(r() * 3) }, weak, crew: undefined, crewRoll, cargo: {} };
}
/** Fight the pirates: returns { outcome (for applyEncounter), prize ({type,hull} or null), battle (the report) }. Never mutates the real ship. */
export function fightPirates(ship, seed, encounterId, escort = 0) {
  const p = pirateShip(seed, encounterId);
  const { crewRoll, weak } = p; delete p.crewRoll; delete p.weak; delete p.crew;
  p.crew = Math.round(({ barca: 3, cog: 8, caravel: 10 }[p.type] ?? 3) + crewRoll * ({ barca: 5, cog: 10, caravel: 12 }[p.type] ?? 5) * (weak ? 0.1 : 0.5));
  const r = seeded(`battle-v1:${seed ?? 0}:${encounterId}`);
  const rolls = [r(), r(), r(), r()];
  const me = { ...ship, cargo: { ...(ship.cargo ?? {}) } };
  if (escort > 0) me.captain = { ...(me.captain ?? {}), defence: (me.captain?.defence ?? 0) + escort / 6 }; // convoy escort: defence points count like captain skill levels (6 points each) // the resolver reads a copy; applyEncounter does the real change
  const rep = resolveBattle(p, me, rolls, { finish: "plunder", lootCap: 0.2, damage: PIRATE_DAMAGE, freeHold: Infinity });
  const won = rep.result === "defender-won" || rep.attackerShipSunk;
  const hullLoss = Math.max(0, Math.round((ship.hull ?? 100) - rep.hullD));
  return {
    outcome: { kind: "pirates", result: won ? "repelled" : "raided", hullLoss: Math.min(100, hullLoss), cargoLossPct: won ? 0 : 20, delay: won ? 0 : 1 },
    prize: won && rep.hullA > 0 ? { type: p.type, hull: Math.max(1, Math.round(rep.hullA)) } : null,
    battle: rep,
  };
}
