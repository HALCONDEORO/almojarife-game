// Plague and city calamities (own design; block C2). Flag `plague`, OFF by default:
// with no g.plague state nothing rolls, nothing changes, and the game is untouched.
// No probability or duration is documented anywhere: every number here is our own
// tuning (marked as inference in the PR), never presented as a historical figure.
// A plague never kills in the model: people shut in and trade less; mortality is
// deliberately not coded. Same rules for the player and the bots: the market itself shifts.
import { seeded } from "../view/cityscene.mjs";

// Own tuning constants (inference, not documented figures).
export const PLAGUE_BASE_CHANCE = 0.02;   // per city and week
export const PLAGUE_BASE_DAYS = 28;       // how long a plague sits on a city
export const PLAGUE_MIN_DAYS = 7;
export const PLAGUE_DEMAND = 0.75;        // effective population for demand while it lasts
export const MITIGATION = Object.freeze({ caminos: 1, pozo: 2, hospital: 3, capilla: 2 }); // days off per working level
export const MITIGATION_CHANCE = 0.08;    // weekly-chance reduction per mitigating level, capped
export const MITIGATION_CHANCE_CAP = 0.5; // never below half the base chance
export const WALL_COST = 4000;            // one wall expansion per city; gates hospital and capilla
export const PLAGUE_MOOD = 20;            // mood-target hit while a plague is on (citylife seam)

const workingLevels = (g, cityId, type) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && !b.halted && b.type === type ? b.level : 0), 0);

/** Mitigating levels of a city, by family. */
export function mitigationLevels(g, cityId) {
  return Object.fromEntries(Object.keys(MITIGATION).map((t) => [t, workingLevels(g, cityId, t)]));
}
/** Weekly chance for one city: mitigations cut it, never below the cap. */
export function plagueChance(g, cityId) {
  const m = mitigationLevels(g, cityId);
  const levels = Object.values(m).reduce((a, n) => a + n, 0);
  return PLAGUE_BASE_CHANCE * Math.max(MITIGATION_CHANCE_CAP, 1 - MITIGATION_CHANCE * levels);
}
/** Duration of a plague in one city: mitigations shorten it, never below the floor. */
export function plagueDays(g, cityId) {
  const m = mitigationLevels(g, cityId);
  const cut = Object.entries(m).reduce((a, [t, n]) => a + MITIGATION[t] * n, 0);
  return Math.max(PLAGUE_MIN_DAYS, PLAGUE_BASE_DAYS - cut);
}

export const plagueActive = (g, cityId) => (g.plague?.active?.[cityId]?.untilDay ?? -1) > g.day;
/** Demand lever: the market feels fewer people while a plague lasts. 1 in a flag-off game. */
export const plaguePopMul = (g, cityId) => (plagueActive(g, cityId) ? PLAGUE_DEMAND : 1);

/** Fresh state for a new game with the flag on. */
export function initPlague() { return { active: {}, walls: {} }; }

/** One wall expansion per city, funded from the company purse; it licenses hospital and capilla. */
export function expandWalls(g, cityId) {
  if (!g.plague) return { ok: false, reason: "unknown" };
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const hasOffice = !Array.isArray(g.offices) || cityId === g.profile?.home || g.offices.includes(cityId); // same rule as construction (home port always has one)
  if (!hasOffice) return { ok: false, reason: "office required" };
  if ((g.plague.walls[cityId] ?? 0) >= 1) return { ok: false, reason: "already expanded" };
  if (g.cash < WALL_COST) return { ok: false, reason: "no cash", cost: WALL_COST };
  g.cash -= WALL_COST;
  g.plague.walls[cityId] = 1;
  return { ok: true, cost: WALL_COST };
}
/** Hospital and capilla stand inside the expanded walls (doc reference: P3 manual, wall growth). */
export const needsWalls = (type) => type === "hospital" || type === "capilla";
export function wallsAllow(g, cityId, type) {
  if (!needsWalls(type)) return true;
  if (!g.plague) return true; // flag off: the plague gate does not exist
  return (g.plague.walls[cityId] ?? 0) >= 1;
}

/** Weekly roll: every city can catch the plague; mitigations decide how often and how long. */
export function plagueWeek(g, post) {
  const pl = g.plague; if (!pl) return; // flag OFF: no state, no rolls, no change
  for (const c of g.world.cities) {
    const cur = pl.active[c.id];
    if (cur && cur.untilDay <= g.day) { // it burns out
      delete pl.active[c.id];
      post(g, "info", { txt: { es: `La peste ha pasado en ${c.name ?? c.id}: el puerto recupera la normalidad.`, en: `The plague has passed in ${c.name ?? c.id}: the port returns to normal.` } });
    }
    if (pl.active[c.id]) continue; // one at a time per city
    const r = seeded(`plague:${c.id}:${Math.floor(g.day / 7)}:${g.seed ?? 0}`);
    if (r() < plagueChance(g, c.id)) {
      pl.active[c.id] = { fromDay: g.day, untilDay: g.day + plagueDays(g, c.id) };
      post(g, "info", { txt: { es: `Peste en ${c.name ?? c.id}: los vecinos se encierran y el mercado flojea.`, en: `Plague in ${c.name ?? c.id}: neighbours shut in and the market goes slack.` } });
    }
  }
}
