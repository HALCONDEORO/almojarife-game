// F1 of docs/design/hermandad.md: data only, zero economic effect. Pure readers and a validator; nothing here changes a game.
import { readFileSync } from "node:fs";
export const CLASSES = ["member", "trading_house", "station", "free_port", "strong_place"];
/** A port without a class is a member (the migration default for old saves). */
export const portClassOf = (data, portId) => data.portClass?.[portId] ?? "member";
const key = (d) => d ? d.year * 10000 + d.month * 100 + d.day : null;
/** Institutions alive in a calendar year (from/until null = open). until is the first year it no longer exists. */
export const institutionsAt = (data, year) => data.institutions.filter((i) => (i.from === null || year >= i.from) && (i.until === null || year < i.until));
/** Events whose start falls in [fromYear, toYear], in date order. */
export const eventsBetween = (data, fromYear, toYear) => data.events.filter((e) => e.from.year >= fromYear && e.from.year <= toYear).sort((a, b) => key(a.from) - key(b.from));
export const loadHermandad = () => JSON.parse(readFileSync(new URL("../../data/hermandad.json", import.meta.url), "utf8"));
const okDate = (d) => d && Number.isInteger(d.year) && d.year >= 1480 && d.year <= 1600 && Number.isInteger(d.month) && d.month >= 1 && d.month <= 12 && Number.isInteger(d.day) && d.day >= 1 && d.day <= 31;
/** Returns a list of problems (empty = valid). Every row needs an https source; ports must exist; years stay inside 1480-1600 (institutions may be open). */
export function validateHermandad(data, portIds) {
  const bad = [], ids = new Set(), ports = new Set(portIds);
  const src = (r, where) => { if (typeof r.source !== "string" || !/^https:\/\//.test(r.source)) bad.push(`${where}: missing https source`); };
  const uniq = (r, where) => { if (typeof r.id !== "string" || !r.id || ids.has(r.id)) bad.push(`${where}: bad or duplicate id`); ids.add(r.id); };
  for (const [p, c] of Object.entries(data.portClass ?? {})) { if (!ports.has(p)) bad.push(`portClass ${p}: unknown port`); if (!CLASSES.includes(c)) bad.push(`portClass ${p}: unknown class ${c}`); }
  for (const l of data.lords ?? []) { const w = `lord ${l.id}`; uniq(l, w); src(l, w); if (!ports.has(l.port)) bad.push(`${w}: unknown port`); if (!l.title?.es || !l.title?.en) bad.push(`${w}: title needs es and en`); }
  for (const i of data.institutions ?? []) { const w = `institution ${i.id}`; uniq(i, w); src(i, w); if (!i.name?.es || !i.name?.en) bad.push(`${w}: name needs es and en`); for (const y of [i.from, i.until]) if (y !== null && !(Number.isInteger(y) && y >= 1480 && y <= 1600)) bad.push(`${w}: year out of 1480-1600`); if (i.from !== null && i.until !== null && i.from >= i.until) bad.push(`${w}: from >= until`); }
  for (const e of data.events ?? []) { const w = `event ${e.id}`; uniq(e, w); src(e, w); if (!okDate(e.from)) bad.push(`${w}: bad from`); if (e.until !== null && !okDate(e.until)) bad.push(`${w}: bad until`); else if (e.until && key(e.until) < key(e.from)) bad.push(`${w}: until before from`); if (e.port !== null && !ports.has(e.port)) bad.push(`${w}: unknown port`); }
  return bad;
}
