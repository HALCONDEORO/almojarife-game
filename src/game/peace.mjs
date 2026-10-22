// Mechanic 3 of the piracy set: peace between realms suspends letters of marque. Own design; pure, no DOM.
// Peace comes from dated treaties (data/peaces.json) and from seeded random peaces: pure functions of (seed, pair, day),
// so there is no state to desync and a save/reload cannot change the calendar. Off unless g.peace === true (and g.marque for letters).
// Same rule for player and bots: a letter is suspended while its issuer's realm and the named realm are at peace.
import { seeded } from "../view/cityscene.mjs";
import { yearOf } from "./chronicle.mjs";
import { sameMonarch, realmOf, activeLetter, lettersOf } from "./marque.mjs";
import { post } from "./ledger.mjs";

export const PEACE_EPOCH_DAYS = 6 * 365; // one random draw per realm pair per epoch
export const PEACE_CHANCE = 0.3;        // chance that a pair signs a peace in an epoch (tuning knob)
export const PEACE_MIN_DAYS = 2 * 365, PEACE_SPAN_DAYS = 4 * 365; // length 2 to 6 years (tuning knob)
export const pairKey = (a, b) => [a, b].sort().join("|");
/** Is a dated treaty between the two realms in force in this year? */
export const treatyPeace = (peaces, a, b, year) => (peaces.treaties ?? []).find((t) => t.realms.includes(a) && t.realms.includes(b) && a !== b && (t.from == null || year >= t.from) && (t.until == null || year < t.until)) ?? null;
/** The seeded peace window of a pair that may cover `day`: {from, until} in days, or null. Looks at this epoch and the one before (a peace can straddle). */
export function seededWindow(seed, a, b, day) {
  const e0 = Math.floor(day / PEACE_EPOCH_DAYS);
  for (const e of [e0, e0 - 1]) {
    if (e < 0) continue;
    const r = seeded(`peace-v1:${seed ?? 0}:${pairKey(a, b)}:${e}`);
    if (r() >= PEACE_CHANCE) continue;
    const from = e * PEACE_EPOCH_DAYS + Math.floor(r() * PEACE_EPOCH_DAYS), until = from + PEACE_MIN_DAYS + Math.floor(r() * PEACE_SPAN_DAYS);
    if (day >= from && day < until) return { from, until };
  }
  return null;
}
/** Are two realms at peace today? Never for a realm with itself or under one monarch (those cannot be named anyway). */
export function atPeace(g, realms, peaces, a, b) {
  if (g.peace !== true || !a || !b || a === b) return { peace: false };
  const year = yearOf(g.day, g.startYear);
  if (sameMonarch(realms, a, b, year)) return { peace: false };
  const t = treatyPeace(peaces, a, b, year);
  if (t) return { peace: true, kind: "treaty", source: t.source };
  const w = seededWindow(g.seed, a, b, g.day);
  return w ? { peace: true, kind: "seeded", ...w } : { peace: false };
}
/** The realm that issued a letter, read from its port in the year it was bought. */
export const issuerRealm = (g, realms, letter) => realmOf(realms, letter.issuer, yearOf(letter.from, g.startYear));
/** A letter is suspended while its issuer's realm and the named realm are at peace. It stays held; it works again if the peace ends before it expires. */
export const suspended = (g, realms, peaces, letter) => atPeace(g, realms, peaces, issuerRealm(g, realms, letter), letter.realm).peace;
/** The letter that covers an attack on this realm today: unexpired, naming it, and not suspended. */
export function usableLetter(g, realms, peaces, realm) {
  if (g.marque !== true) return null;
  const l = activeLetter(g, realm);
  return l && !suspended(g, realms, peaces, l) ? l : null;
}
export const coveredNow = (g, realms, peaces, realm) => !!usableLetter(g, realms, peaces, realm);
/** Daily: tell the player (inbox) when a peace starts or ends that touches a letter they hold. Once per change. Returns the notes posted. */
export function peaceNews(g, realms, peaces) {
  if (g.peace !== true || g.marque !== true) return [];
  const seen = (g.peaceSeen ??= {}), out = [];
  for (const l of lettersOf(g).filter((x) => x.until > g.day)) {
    const a = issuerRealm(g, realms, l); if (!a) continue;
    const k = pairKey(a, l.realm), now = atPeace(g, realms, peaces, a, l.realm).peace;
    if ((seen[k] ?? false) === now) continue;
    seen[k] = now;
    const na = realms.realms[a].name, nb = realms.realms[l.realm].name;
    const txt = now ? { es: `${na.es} y ${nb.es} firman la paz: tu carta de marca queda suspendida.`, en: `${na.en} and ${nb.en} sign a peace: your letter of marque is suspended.` }
      : { es: `Termina la paz entre ${na.es} y ${nb.es}: tu carta de marca vuelve a valer.`, en: `The peace between ${na.en} and ${nb.en} ends: your letter of marque is valid again.` };
    post(g, "info", { txt, letter: l.id }); out.push(txt);
  }
  return out;
}
/** Problems in data/peaces.json (empty = valid). */
export function validatePeaces(peaces, realms) {
  const e = [];
  for (const [i, t] of (peaces.treaties ?? []).entries()) {
    if (!/^https:\/\//.test(t.source ?? "")) e.push(`treaty ${i}: missing https source`);
    if (!Array.isArray(t.realms) || t.realms.length !== 2 || t.realms[0] === t.realms[1] || t.realms.some((r) => !realms.realms?.[r])) e.push(`treaty ${i}: needs two different known realms`);
    for (const f of ["from", "until"]) if (t[f] != null && !(Number.isInteger(t[f]) && t[f] >= 1400 && t[f] <= 1800)) e.push(`treaty ${i}: bad ${f}`);
  }
  return e;
}
