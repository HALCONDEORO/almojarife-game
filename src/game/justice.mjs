// Port justice: charges and sentences for a bad name (smuggling, fraud, piracy). Own design, own words; pure game logic, no DOM.
// Off unless g.justice === true; nothing here is called from the daily loop, a sale or a sailing yet, so a flag-off game is identical.
// Institutions: the port's officers (the alguacil and the watch the concejo pays for). The more the town's chest holds, the sharper
// the watch. A charge is raised when a deed is detected (the caller says which); the officers act when the ship is next in a port of
// the same realm. Sentences grow with infamy: a fine first; then part of the cargo is seized; at the top, the ship is held in prison.
// Money conserved: the fine goes into the town's chest (creditCaja). Seized goods leave the game (counted in g.seizedUnits).
import { realmOf } from "./marque.mjs";
import { yearOf } from "./chronicle.mjs";
import { infamyOf, addInfamy } from "./pardon.mjs";
import { cajaOf, cajaTarget, creditCaja } from "./council.mjs";
import { post } from "./ledger.mjs";
import { seeded } from "../view/cityscene.mjs";

/** Per kind: infamy added, fine as a share of the deed's value, share of the charged cargo seized at the middle tier. Tuning knobs, no historical claim. */
export const CHARGES = {
  smuggling: { infamy: 4, fineShare: 0.5, seizeShare: 0.5 },
  fraud: { infamy: 3, fineShare: 1.0, seizeShare: 0 },
  piracy: { infamy: 10, fineShare: 0.3, seizeShare: 0.3 },
};
export const MAX_OPEN = 20;
/** Recidivism (graduated by prior convictions in the same realm; the Castilian law of 1480 on coin exports also graded by repeat offence, Dialnet 134816: https://dialnet.unirioja.es/descarga/articulo/134816.pdf). Numbers are ours. */
export const RECIDIVISM_FINE_STEP = 0.5, RECIDIVISM_SEIZE_STEP = 0.15, RECIDIVISM_MAX = 4, RECIDIVISM_PRISON_AT = 3;
export const priorConvictions = (g, realm) => Math.min(RECIDIVISM_MAX, g.convictions?.[realm] ?? 0);
/** The court that judges in a port: a port row, else its realm's row, else null (general officers). Data: data/courts.json. */
export const courtOf = (courts, port, realm) => courts?.byPort?.[port] ?? courts?.byRealm?.[realm] ?? null;
export const SEIZURE_FROM = 20, PRISON_FROM = 50;   // infamy tiers: fine only below 20; seizure from 20; prison from 50
export const PRISON_DAYS_PER_TIER = 5;              // 50-79: 5 days, 80+: 10 days
export const MIN_FINE = 20;
export const catchChance = (g, port) => Math.min(0.9, 0.2 + 0.4 * Math.min(1, cajaOf(g, port) / Math.max(1, cajaTarget(g.world, port))) + infamyOf(g) / 250);
export const justiceOn = (g) => g?.justice === true;
export const openCharges = (g) => (g.charges ??= []).filter((c) => c.status === "open");
/** The deed is detected: raise a charge and the bad name. value = coins of goods or sale involved. Returns the charge or null. */
export function raiseCharge(g, realms, port, kind, value) {
  if (!justiceOn(g) || g.over || !CHARGES[kind]) return null;
  const realm = realmOf(realms, port, yearOf(g.day, g.startYear));
  if (!realm) return null; // a port with no council has no officers
  const v = Math.max(0, Math.floor(Number(value) || 0));
  const list = (g.charges ??= []);
  if (openCharges(g).length >= MAX_OPEN) { const old = list.find((c) => c.status === "open"); old.status = "lapsed"; }
  const c = { id: "ch" + (g.chargeSeq = (g.chargeSeq ?? 0) + 1), kind, realm, port, value: v, day: g.day, status: "open" };
  list.push(c); addInfamy(g, CHARGES[kind].infamy);
  return c;
}
/** The tier the officers will use now, from infamy: 0 fine, 1 fine and seizure, 2 also prison. */
export const sentenceTier = (g, realm = null) => { const t = infamyOf(g) >= PRISON_FROM ? 2 : infamyOf(g) >= SEIZURE_FROM ? 1 : 0; return realm && priorConvictions(g, realm) >= RECIDIVISM_PRISON_AT ? 2 : t; };
export const prisonDays = (g, realm = null) => (sentenceTier(g, realm) < 2 ? 0 : infamyOf(g) >= 80 ? 2 * PRISON_DAYS_PER_TIER : PRISON_DAYS_PER_TIER);
/** A ship is held until a given day. */
export const isHeld = (ship, day) => Number.isFinite(ship?.heldUntil) && day < ship.heldUntil;
/** Officers act when a ship is docked in a port: each open charge of that port's realm is tried once. Returns the sentences applied. */
export function officersAct(g, realms, port, ship, courts = null) {
  if (!justiceOn(g) || g.over || !ship || ship.voyage) return [];
  const realm = realmOf(realms, port, yearOf(g.day, g.startYear)); if (!realm) return [];
  const out = [];
  for (const c of openCharges(g).filter((x) => x.realm === realm)) {
    const r = seeded(`justice-v1:${g.seed ?? 0}:${c.id}:${g.day}`);
    if (r() >= catchChance(g, port)) continue; // slipped away today; the charge stays open
    const rule = CHARGES[c.kind], prior = priorConvictions(g, realm), court = courtOf(courts, port, realm), s = { charge: c.id, kind: c.kind, port, day: g.day, fine: 0, seized: {}, prisonDays: 0, prior, court: court?.name ?? null };
    const fine = Math.min(Math.max(0, g.cash), Math.max(MIN_FINE, Math.round(c.value * rule.fineShare * (1 + RECIDIVISM_FINE_STEP * prior))));
    if (fine > 0) { g.cash -= fine; creditCaja(g, port, fine); s.fine = fine; g.fines = (g.fines ?? 0) + fine; }
    const seizeShare = Math.min(1, rule.seizeShare + (rule.seizeShare > 0 ? RECIDIVISM_SEIZE_STEP * prior : 0));
    if (sentenceTier(g, realm) >= 1 && seizeShare > 0) {
      for (const [good, q] of Object.entries(ship.cargo ?? {})) {
        const take = Math.min(q, Math.floor(q * seizeShare)); if (!take) continue;
        ship.cargo[good] = q - take; if (!ship.cargo[good]) delete ship.cargo[good];
        s.seized[good] = take; g.seizedUnits = (g.seizedUnits ?? 0) + take;
      }
    }
    const days = prisonDays(g, realm);
    if (days > 0) { ship.heldUntil = Math.max(ship.heldUntil ?? 0, g.day + days); s.prisonDays = days; }
    c.status = "tried"; c.sentence = s; (g.convictions ??= {})[realm] = (g.convictions[realm] ?? 0) + 1; (g.sentences ??= []).unshift(s); if (g.sentences.length > 40) g.sentences.pop();
    post(g, "info", { topic: "justice", txt: { es: `${court ? court.name.es + " te juzga" : "Los oficiales del puerto te juzgan"} por ${c.kind === "smuggling" ? "contrabando" : c.kind === "fraud" ? "fraude" : "piratería"}: multa ${s.fine}${Object.keys(s.seized).length ? ", parte de la carga embargada" : ""}${s.prisonDays ? `, barco retenido ${s.prisonDays} días` : ""}.`, en: `${court ? court.name.en : "The port officers"} tries you for ${c.kind}: fine ${s.fine}${Object.keys(s.seized).length ? ", part of the cargo seized" : ""}${s.prisonDays ? `, ship held ${s.prisonDays} days` : ""}.` } });
    out.push(s);
  }
  return out;
}
/** Problems in data/courts.json (empty = valid): every row has names in es and en and an https source; ports and realms exist. */
export function validateCourts(courts, portIds, realms) {
  const e = [];
  const row = (r, w) => { if (!r?.name?.es || !r?.name?.en) e.push(`${w}: name needs es and en`); if (!/^https:\/\//.test(r?.source ?? "")) e.push(`${w}: missing https source`); };
  for (const [p, r] of Object.entries(courts.byPort ?? {})) { row(r, "port " + p); if (!portIds.includes(p)) e.push(`port ${p}: unknown port`); }
  for (const [k, r] of Object.entries(courts.byRealm ?? {})) { row(r, "realm " + k); if (!realms.realms?.[k]) e.push(`realm ${k}: unknown realm`); }
  return e;
}
