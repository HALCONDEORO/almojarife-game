// Letters of marque (mechanic 1 of docs/design/piracy-study.md).
// A port council sells a letter naming one realm; attacks on that realm cost no reputation; a quinto
// (one fifth) of a prize goes to the issuer: two thirds to the crown, one third to the admiral
// (Castile, Dialnet 58329: https://dialnet.unirioja.es/descarga/articulo/58329.pdf).
// Pure game logic, own design. Off unless g.marque === true, so a flag-off game is unchanged.
// Same functions for player and bots (a bot calls them on its own record).
import { yearOf } from "./chronicle.mjs";
import { post } from "./ledger.mjs";

export const LETTER_DAYS = 365;        // a letter lasts a year (tuning knob, set by the sweep)
export const LETTER_FEE = 600;         // price in coins (tuning knob, not historical)
export const QUINTO = 0.2;             // one fifth of the prize
export const QUINTO_CROWN = 2 / 3;     // of the quinto: to the king; the rest to the admiral
export const LETTER_MAX = 3;           // letters held at once

/** The realm that holds a port in a year, or null (no verified holder). */
export function realmOf(data, port, year) {
  for (const h of data.holdings ?? []) {
    if (h.port === port && (h.from == null || year >= h.from) && (h.until == null || year < h.until)) return h.realm;
  }
  return null;
}
/** Do two realms share a monarch in a year (personal union)? A realm is always united with itself. */
export function sameMonarch(data, a, b, year) {
  if (a === b) return true;
  return (data.unions ?? []).some((u) => u.realms.includes(a) && u.realms.includes(b) && (u.from == null || year >= u.from) && (u.until == null || year < u.until));
}
/** Realms a letter can name in a year: only realms that hold at least one port then. */
export function namableRealms(data, year) {
  return Object.keys(data.realms ?? {}).filter((r) => (data.holdings ?? []).some((h) => h.realm === r && realmOf(data, h.port, year) === r));
}
/** The share of a prize value: quinto to the issuer (crown + admiral), the rest to the captain. */
export function quintoSplit(value) {
  const v = Math.max(0, Math.floor(Number(value) || 0)), q = Math.floor(v * QUINTO), crown = Math.floor(q * QUINTO_CROWN);
  return { crown, admiral: q - crown, net: v - q };
}
export const lettersOf = (g) => (g.letters ??= []);
/** An unexpired letter naming this realm, or null. */
export const activeLetter = (g, realm) => lettersOf(g).find((l) => l.realm === realm && l.until > g.day) ?? null;

/** Buy a letter in a port. The issuing port must be in a realm that is not the realm named. */
export function buyLetter(g, data, port, realm) {
  if (g.marque !== true) return { ok: false, reason: "off" };
  if (g.over) return { ok: false, reason: "game over" };
  const year = yearOf(g.day, g.startYear), issuer = realmOf(data, port, year);
  if (!issuer) return { ok: false, reason: "no council" };
  if (!namableRealms(data, year).includes(realm)) return { ok: false, reason: "unknown realm" };
  if (sameMonarch(data, issuer, realm, year)) return { ok: false, reason: "own realm" }; // own realm or one under the same monarch
  lettersOf(g).splice(0, lettersOf(g).length, ...lettersOf(g).filter((l) => l.until > g.day)); // drop expired ones
  if (lettersOf(g).length >= LETTER_MAX) return { ok: false, reason: "too many" };
  if (activeLetter(g, realm)) return { ok: false, reason: "already held" };
  if (g.cash < LETTER_FEE) return { ok: false, reason: "no cash" };
  g.cash -= LETTER_FEE;
  const l = { id: "lm" + (g.letterSeq = (g.letterSeq ?? 0) + 1), realm, issuer: port, from: g.day, until: g.day + LETTER_DAYS };
  lettersOf(g).push(l);
  post(g, "letterBought", { letter: l.id, realm, txt: { es: `Carta de marca contra ${data.realms[realm].name.es}, un año.`, en: `Letter of marque against ${data.realms[realm].name.en}, one year.` } });
  return { ok: true, letter: l };
}
/** Is attacking a ship of this realm covered by a letter today? (false when the flag is off) */
export const coveredBy = (g, realm) => g.marque === true && !!realm && !!activeLetter(g, realm);
/** Validate the shipped data: sources, known ports and realms, dates in 1480-1600, no overlapping holders. */
export function validateRealms(data, portIds) {
  const e = [], seen = new Map();
  for (const [id, r] of Object.entries(data.realms ?? {})) { if (!/^https:\/\//.test(r.source ?? "")) e.push(`realm ${id}: missing https source`); if (!r.name?.es || !r.name?.en) e.push(`realm ${id}: name needs es and en`); }
  for (const [i, u] of (data.unions ?? []).entries()) {
    if (!/^https:\/\//.test(u.source ?? "")) e.push(`union ${i}: missing https source`);
    if (!Array.isArray(u.realms) || u.realms.length < 2 || u.realms.some((r) => !data.realms?.[r])) e.push(`union ${i}: unknown realm`);
    for (const f of ["from", "until"]) if (u[f] != null && !(Number.isInteger(u[f]) && u[f] >= 1400 && u[f] <= 1800)) e.push(`union ${i}: bad ${f}`);
  }
  for (const h of data.holdings ?? []) {
    const k = `${h.port}/${h.realm}/${h.from}`;
    if (!portIds.includes(h.port)) e.push(`${k}: unknown port`);
    if (!data.realms?.[h.realm]) e.push(`${k}: unknown realm`);
    if (!/^https:\/\//.test(h.source ?? "")) e.push(`${k}: missing https source`);
    for (const f of ["from", "until"]) if (h[f] != null && !(Number.isInteger(h[f]) && h[f] >= 1400 && h[f] <= 1800)) e.push(`${k}: bad ${f}`);
    (seen.get(h.port) ?? seen.set(h.port, []).get(h.port)).push(h);
  }
  for (const [port, rows] of seen) for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i], b = rows[j];
    if ((a.from ?? -Infinity) < (b.until ?? Infinity) && (b.from ?? -Infinity) < (a.until ?? Infinity)) e.push(`${port}: overlapping holders`);
  }
  for (const [i, z] of (data.zones ?? []).entries()) {
    if (!data.realms?.[z.realm]) e.push(`zone ${i}: unknown realm`);
    if (!/^https:\/\//.test(z.source ?? "")) e.push(`zone ${i}: missing https source`);
    for (const f of ["from", "until"]) if (z[f] != null && !(Number.isInteger(z[f]) && z[f] >= 1400 && z[f] <= 1800)) e.push(`zone ${i}: bad ${f}`);
    if (!Array.isArray(z.polygon) || z.polygon.length < 3 || !z.polygon.every((pt) => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite))) e.push(`zone ${i}: bad polygon`);
  }
  return e;
}
