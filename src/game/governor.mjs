// City governor: a hired, paid upgrade of the warehouse administrator (Marco 26/10: "el gobernador
// por ciudad que hay que contratar y pagar"). Hired in the port tavern, needs your own warehouse
// there. Fee 100 per level, daily wage 2/4/7 coins (levels 1-3, the approved design figures).
// If the house cannot pay the wage he suspends with a notice - never a debt - and his standing
// orders pause until there is cash again (the halt/restart idiom buildings already use).
// The free administrator of old saves is level 0 and changes nothing. No DOM here.
import { post } from "./ledger.mjs";

export const GOVERNOR_LEVELS = Object.freeze({ 1: { fee: 100, wage: 2 }, 2: { fee: 200, wage: 4 }, 3: { fee: 300, wage: 7 } });
/** Highest level whose trades are actually delivered: hiring or promoting past it is refused (level 3 arrives with its own PR). */
export const GOVERNOR_MAX_IMPLEMENTED = 2;

/** The port's governor, sanitized; null when the warehouse has none (level 0: the free administrator). */
export function governorOf(g, city) {
  const governor = g.warehouses?.[city]?.governor;
  if (!governor) return null;
  const level = Number.isSafeInteger(governor.level) && GOVERNOR_LEVELS[governor.level] ? governor.level : 1;
  const state = governor.state === "suspended" ? "suspended" : "active";
  const hiredDay = Number.isSafeInteger(governor.hiredDay) ? governor.hiredDay : 0;
  return { level, state, hiredDay, ...GOVERNOR_LEVELS[level] };
}
/** Whether the warehouse's standing orders run today: a suspended governor stops them. */
export const governorWorks = (g, city) => governorOf(g, city)?.state !== "suspended";

/** Hire a governor for this port's warehouse. Level 1 does today's threshold automation;
    levels 2 and 3 arrive with their own features (templates/priorities, goals/budget). */
export function hireGovernor(g, city, level) {
  if (g.over) return { ok: false, reason: "game over" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  if (!Number.isSafeInteger(level) || !GOVERNOR_LEVELS[level] || level > GOVERNOR_MAX_IMPLEMENTED) return { ok: false, reason: "bad level" };
  if (governorOf(g, city)) return { ok: false, reason: "governor hired" };
  const { fee, wage } = GOVERNOR_LEVELS[level];
  if (!Number.isFinite(g.cash) || g.cash < fee) return { ok: false, reason: "no cash" };
  g.cash -= fee;
  wh.governor = { level, state: "active", hiredDay: g.day };
  return { ok: true, cost: fee, wage };
}

/** Dismiss the governor: the record goes away and the free administrator takes the orders back.
    The hire fee is never refunded (the captain contract works the same way). */
/** Raise a hired governor one level: the fee is only the difference still owed (100 per level, GOVERNOR_LEVELS). */
export function upgradeGovernor(g, city, level) {
  if (g.over) return { ok: false, reason: "game over" };
  const governor = governorOf(g, city);
  if (!governor || governor.state !== "active") return { ok: false, reason: "no governor hired" };
  const spec = GOVERNOR_LEVELS[level];
  if (!spec || level <= governor.level || level > GOVERNOR_MAX_IMPLEMENTED) return { ok: false, reason: "unknown or not higher level" };
  const due = spec.fee - GOVERNOR_LEVELS[governor.level].fee;
  if (g.cash < due) return { ok: false, reason: "not enough cash" };
  g.cash -= due;
  g.warehouses[city].governor.level = level; // write through: governorOf hands out a sanitized copy
  post(g, "governor_upgrade", { city, level, fee: due });
  return { ok: true, level, fee: due };
}

export function dismissGovernor(g, city) {
  if (g.over) return { ok: false, reason: "game over" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  if (!governorOf(g, city)) return { ok: false, reason: "no governor" };
  delete wh.governor;
  return { ok: true, refund: 0 };
}

/** Daily wage, charged directly from cash at the day tick (never through the weekly book, so a
    governor can never run up debt): short cash suspends him with one notice; cash again resumes
    him with one notice. Returns what happened, or null when no governor is on duty. */
export function governorDay(g, city) {
  const governorRaw = g.warehouses?.[city]?.governor;
  const governor = governorOf(g, city);
  if (!governor || g.over) return null;
  const cityName = g.world.nodes[city]?.name ?? city;
  if (governor.state === "suspended") {
    if (!Number.isFinite(g.cash) || g.cash < governor.wage) return null; // still short: no charge, no work, no repeated notice
    governorRaw.state = "active";
    g.cash -= governor.wage;
    post(g, "info", { city, topic: "governor", txt: { es: `El gobernador de ${cityName} vuelve al cargo: hay caja para su sueldo (${governor.wage} al día). Sus órdenes del almacén siguen en marcha.`, en: `The governor of ${cityName} is back on duty: cash covers his wage (${governor.wage} a day). His warehouse orders are running again.` } });
    return { resumed: true, paid: governor.wage };
  }
  if (!Number.isFinite(g.cash) || g.cash < governor.wage) {
    governorRaw.state = "suspended";
    post(g, "info", { city, topic: "governor", txt: { es: `El gobernador de ${cityName} se suspende por impago: su sueldo es ${governor.wage} monedas al día y no hay caja. No se debe nada; sus órdenes del almacén quedan en pausa hasta que vuelva el dinero.`, en: `The governor of ${cityName} suspends for lack of pay: his wage is ${governor.wage} coins a day and the cash box is short. Nothing is owed; his warehouse orders pause until there is money again.` } });
    return { suspended: true };
  }
  g.cash -= governor.wage;
  return { paid: governor.wage };
}
