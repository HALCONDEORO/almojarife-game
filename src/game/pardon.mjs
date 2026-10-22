// Mechanic 7 of the piracy set: pardon (perdón). Own design; pure game logic, no DOM. Off unless g.pardon === true.
// The minimum of infamy needed to give a pardon something to forgive: one number 0-100 (g.infamy). Mechanic 5 (bad name and
// justice) will raise it; this module only holds it, lowers it with time, and sells the pardon.
// A pardon is bought in a port whose reputation toward you is at least neutral, while one of your ships is docked there: the fine
// is paid to the port's realm (money leaves the game, a sink), infamy drops to zero, and the same realm will not pardon you again
// for a year (no cycle of sin and pay).
import { realmOf } from "./marque.mjs";
import { yearOf } from "./chronicle.mjs";
import { portRep } from "./reputation.mjs";
import { post } from "./ledger.mjs";

export const INFAMY_MAX = 100;
export const PARDON_PER_POINT = 30;       // coins per point of infamy (tuning knob)
export const PARDON_MIN_FEE = 100;        // the smallest fine
export const PARDON_COOLDOWN_DAYS = 365;  // per realm
export const INFAMY_DECAY_PER_MONTH = 1;  // like reputation decay
export const infamyOf = (g) => { const n = Number(g.infamy); return Number.isFinite(n) ? Math.min(INFAMY_MAX, Math.max(0, n)) : 0; };
/** Raise (or lower with a negative amount) infamy, clamped. Returns the new value. */
export function addInfamy(g, n) { if (!Number.isFinite(n)) return infamyOf(g); g.infamy = Math.min(INFAMY_MAX, Math.max(0, Math.round((infamyOf(g) + n) * 100) / 100)); return g.infamy; }
/** Monthly fade: call once a day, it lowers infamy by INFAMY_DECAY_PER_MONTH on every 30th day. */
export function decayInfamy(g) { if ((g.pardon === true || g.justice === true) && g.day > 0 && g.day % 30 === 0 && infamyOf(g) > 0) addInfamy(g, -INFAMY_DECAY_PER_MONTH); }
/** What a pardon costs now. */
export const pardonFee = (g) => (infamyOf(g) > 0 ? Math.max(PARDON_MIN_FEE, Math.ceil(infamyOf(g) * PARDON_PER_POINT)) : 0);
/** Why a pardon cannot be bought here, or null if it can. */
export function pardonBlocker(g, realms, port) {
  if (g.pardon !== true) return "off";
  if (g.over) return "game over";
  if (infamyOf(g) <= 0) return "nothing to pardon";
  const realm = realmOf(realms, port, yearOf(g.day, g.startYear));
  if (!realm) return "no council";
  if (!g.ships.some((s) => s.at === port && !s.voyage)) return "no ship here";
  if (portRep(g, port) < 0) return "port hostile";
  const last = g.pardonDay?.[realm];
  if (last != null && g.day - last < PARDON_COOLDOWN_DAYS) return "too soon";
  if (g.cash < pardonFee(g)) return "no cash";
  return null;
}
/** Buy the pardon. Returns { ok, fee, realm } or { ok:false, reason }. */
export function buyPardon(g, realms, port) {
  const why = pardonBlocker(g, realms, port); if (why) return { ok: false, reason: why };
  const realm = realmOf(realms, port, yearOf(g.day, g.startYear)), fee = pardonFee(g);
  g.cash -= fee; g.pardonPaid = (g.pardonPaid ?? 0) + fee; (g.pardonDay ??= {})[realm] = g.day; g.infamy = 0;
  post(g, "info", { txt: { es: `Perdón concedido por ${realms.realms[realm].name.es}: ${fee} monedas. Tu mala fama queda borrada.`, en: `Pardon granted by ${realms.realms[realm].name.en}: ${fee} coins. Your bad name is cleared.` } });
  return { ok: true, fee, realm };
}
