// Captain experience (backlog 7). Own design: the three existing skills (navigation = manoeuvre, weather, defence) grow with what the captain lives through.
// Flag g.captainXp (default off): off, every function is a no-op and nothing is saved. Levels stay 0-3 so every reader of the skills is unchanged.
import { captainPrice } from "./captains.mjs";
export const XP_AT = [0, 5, 15, 35]; // cumulative experience needed for level 0..3 (our own numbers, to be measured)
export const SKILLS = ["navigation", "weather", "defence"];
const lvl = (v) => (Number.isSafeInteger(v) && v >= 0 && v <= 3 ? v : 0);
export const levelFor = (xp) => { let l = 0; for (let i = 1; i < XP_AT.length; i++) if (xp >= XP_AT[i]) l = i; return l; };
/** Add experience to one skill of the ship's captain. Returns the new level when it rose, else null. */
export function gainXp(g, ship, skill, n = 1) {
  if (g?.captainXp !== true || !SKILLS.includes(skill) || !Number.isFinite(n) || n <= 0) return null;
  const c = ship?.captain; if (!c || typeof c.id !== "string") return null;
  if (typeof c.xp !== "object" || c.xp === null || Array.isArray(c.xp)) c.xp = {}; // a loaded save can carry a corrupt container (7, "bad", []): normalize instead of throwing mid-arrival or losing the book on save
  const cur = lvl(c[skill]), xp = (Number.isFinite(c.xp[skill]) ? c.xp[skill] : XP_AT[cur]) + n;
  c.xp[skill] = Math.min(xp, 9999);
  const next = Math.max(cur, levelFor(xp));
  if (next === cur) return null;
  c[skill] = next;
  const wage = captainPrice(c).wage; if (wage > (Number.isFinite(c.wage) ? c.wage : 0)) c.wage = Math.min(10, wage); // a better captain asks for a better wage
  return next;
}
/** Experience points for a finished encounter (kind, result). */
export function encounterXp(outcome) {
  if (outcome?.kind === "storm") return { weather: outcome.result === "severe" ? 2 : 1 };
  if (outcome?.kind === "pirates") return { defence: outcome.result === "repelled" ? 2 : 1 };
  return {};
}
export function xpOfEncounter(g, ship, outcome) { for (const [k, n] of Object.entries(encounterXp(outcome))) gainXp(g, ship, k, n); }
