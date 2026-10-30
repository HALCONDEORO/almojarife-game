// Council works department (obras del concejo, Marco 30/10 20:04: "implementa las obras
// del concejo con cobro por día según el diseño propuesto"): the concejo votes civic
// works (pozo, hospital, capilla, alhóndiga), pays them out of the town chest (caja)
// PER DAY WORKED, and keeps them with a daily upkeep from the same chest. The walls
// (#721) keep their own contract (full quote up front) and are NOT migrated here.
// Council-owned works live in their own registry (g.works), never in g.buildings:
// accrueBuildings bills the PLAYER for every entry there, and the sell/respect/UI
// seams read it as player property.
// Day charging (approved design): the chest is a daily ledger (councilDay settles
// income and upkeep every day), so a work charges one labour day at a time; a thin
// chest PAUSES the work instead of rejecting it, and materials arrive as partial
// deliveries from the LOCAL market stock only (no import). A day without the full
// materials pending charges no labour; the day the last pending unit lands may
// consume one labour unit in the same pass (explicit rule, pinned by tests).
// Flag `works`, ON by default (strict semantics: only opts.works === false or === 1
// turns it off; an off game keeps no key and saves stay identical). Like the walls,
// only new campaigns get the state: old saves are untouched.
import { quoteUnits, consumeUnits, RECIPES } from "../sim/recipes.mjs";
import { FEE, ceil2 } from "../sim/trade.mjs";
import { post } from "./ledger.mjs";
import { repOf } from "./rank.mjs";
import { cajaOf, creditCaja, meetingDay } from "./council.mjs";
import { BUILDING_TYPES, buildingName } from "./buildings.mjs";

const r2 = (x) => Math.round(x * 100) / 100; // the repo-wide cents rounding (same shape as council.mjs)
const cityName = (g, cityId) => g.world.cities.find((c) => c.id === cityId)?.name ?? cityId;

/** Civic works the department builds, with their mitigation weights from the calamity table (calamities.mjs): pozo fights incendio/malsana, hospital malsana/incendio, capilla malsana, alhóndiga hambruna. Own tuning, no documented figure. */
export const WORK_TYPES = Object.freeze(["pozo", "hospital", "capilla", "alhondiga"]);
export const WORK_WEIGHTS = Object.freeze({ pozo: 5, hospital: 3, capilla: 1, alhondiga: 1 }); // pozo: 3 incendio + 2 malsana; hospital: 1 incendio + 2 malsana; capilla: 1 malsana; alhóndiga: 1 hambruna
export const WORKS_MIN_RESPECT = 20; // petition bar: the concejo only hears a merchant it knows ("Conocido", same bar as the walls)
export const WORKS_CAJA_FLUSH = 1.5; // start margin: the chest must hold 1.5x the work's estimate, same bar as WALL_CAJA_FLUSH
export const WORKS_MIN_SCORE = 0.0004; // priority floor in mitigation weight per estimated coin: at reference prices every first level passes and gold-hungry top levels of low-weight works (capilla/alhóndiga level 3) do not
export const WORKS_AUTONOMOUS = false; // petitions only: the WALL_AUTONOMOUS lesson (22 cities walled themselves in year 1) — no autonomous starts here
export const WORKS_MAX_LEVEL = 3; // the civic types' own maxLevel

export function initWorks() { return {}; }

/** The work record of one type in one city, or null. Record: { level, state, unkept?, nextLevel?, needDays?, workedDays?, paidFee?, feeTotal?, need?, delivered? }. */
export function workOf(g, cityId, type) { return g.works?.[cityId]?.[type] ?? null; }

/** One live work (petition, construction or pause) per city at a time, the walls rule. */
const liveWork = (g, cityId) => WORK_TYPES.some((t) => ["solicitado", "building", "paused"].includes(g.works?.[cityId]?.[t]?.state));

/** Quote the next council work: the civic type's own fee/days/recipe scaled by level, plus a stock-independent cost estimate (fee + recipe at base price + market fee) used for the chest margin and the priority score, since real deliveries requote the market day by day. No mutation. */
export function quoteWork(g, cityId, type, level) {
  if (!g.works) return { ok: false, reason: "unknown" }; // flag off
  if (!WORK_TYPES.includes(type)) return { ok: false, reason: "unknown work" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const bt = BUILDING_TYPES[type], recipe = RECIPES[bt.recipe];
  if (!Number.isSafeInteger(level) || level < 1 || level > WORKS_MAX_LEVEL) return { ok: false, reason: "bad level" };
  const need = {};
  for (const [good, qty] of Object.entries(recipe)) need[good] = qty * level;
  let estimate = bt.fee * level;
  for (const [good, qty] of Object.entries(need)) estimate += qty * ceil2(g.world.goods[good].base * (1 + FEE));
  return { ok: true, type, level, fee: bt.fee * level, days: bt.buildDays * level, need, estimate: r2(estimate) };
}

/** Priority of the next level: mitigation weight against the estimate, the approved reference (weight per level missing falls out of the scaling: each built level raises the next quote). */
export function workScore(g, cityId, type) {
  const level = workOf(g, cityId, type)?.level ?? 0;
  if (level >= WORKS_MAX_LEVEL) return null;
  const q = quoteWork(g, cityId, type, level + 1);
  return q.ok ? WORK_WEIGHTS[type] / q.estimate : null; // no rounding: the floor lives below 0.001 and r2 would collapse it to 0.00
}

/** Panel data seam (urban panel UI is a follow-up PR): candidates with level, state, priority, estimate and the gold the chest still lacks to start each one. */
export function worksBoard(g, cityId) {
  if (!g.works) return null;
  const caja = cajaOf(g, cityId);
  return {
    city: cityId, caja,
    candidates: WORK_TYPES.map((type) => {
      const rec = workOf(g, cityId, type), level = rec?.level ?? 0;
      const q = level >= WORKS_MAX_LEVEL ? null : quoteWork(g, cityId, type, level + 1);
      return {
        type, level, state: rec?.state ?? "active", score: q?.ok ? workScore(g, cityId, type) : null,
        estimate: q?.estimate ?? null, missingGold: q?.ok ? r2(Math.max(0, r2(q.estimate * WORKS_CAJA_FLUSH) - caja)) : null,
      };
    }),
  };
}

/** A merchant the port knows hands in a works petition; the concejo votes on it at its next meeting (Marco 30/10: the player at most proposes). */
export function proposeWork(g, cityId, type) {
  if (!g.works) return { ok: false, reason: "unknown" }; // flag off
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  if (!WORK_TYPES.includes(type)) return { ok: false, reason: "unknown work" };
  if (repOf(g, cityId) < WORKS_MIN_RESPECT) return { ok: false, reason: "respect required", need: WORKS_MIN_RESPECT };
  if (liveWork(g, cityId)) return { ok: false, reason: "already building" }; // one live work or petition per city, the walls rule
  const rec = ((g.works[cityId] ??= {})[type] ??= { level: 0, state: "active" });
  if (rec.level >= WORKS_MAX_LEVEL) return { ok: false, reason: "max level" };
  rec.state = "solicitado";
  post(g, "council", { city: cityId, txt: { es: `Presentas al concejo de ${cityName(g, cityId)} una petición: que se construya ${buildingName(type, "es")}. Se votará en la próxima reunión.`, en: `You hand the council of ${cityName(g, cityId)} a petition to build ${buildingName(type, "en")}: it will be voted at the next meeting.` } });
  return { ok: true };
}

/** One labour day of an in-progress work: equal cents shares with the exact final settle (the last day squares the total to the cent, the r2 pattern). */
const dayCost = (rec) => (rec.workedDays + 1 === rec.needDays ? r2(rec.feeTotal - rec.paidFee) : r2(rec.feeTotal / rec.needDays));

/** Meeting-day works vote, right after the walls vote: a pending petition is voted (and consumed) first; the concejo starts the top candidate only over the score floor with a flush chest, and otherwise records the explicit NO-BUILD decision with its cause. No autonomous starts (WORKS_AUTONOMOUS). */
export function councilWorksVote(g) {
  if (!g.works) return; // flag OFF: nothing
  for (const c of g.world.cities) {
    const id = c.id;
    if (!meetingDay(g.world, id, g.day)) continue;
    const recs = g.works[id];
    if (!recs) continue;
    const petitions = WORK_TYPES.filter((t) => recs[t]?.state === "solicitado");
    if (!petitions.length) continue;
    if (WORK_TYPES.some((t) => ["building", "paused"].includes(recs[t]?.state))) continue; // a live work holds the floor: petitions wait for the next meeting
    const refuse = (type, es, en) => {
      recs[type].state = "active"; // the petition is consumed either way (the #721 lesson: no silent refusals)
      if (repOf(g, id) > 0) post(g, "council", { city: id, txt: { es, en } });
    };
    const cands = petitions
      .map((t) => ({ type: t, score: workScore(g, id, t), quote: quoteWork(g, id, t, recs[t].level + 1) }))
      .filter((x) => x.quote.ok)
      .sort((a, b) => b.score - a.score);
    const top = cands[0];
    if (!top || top.score < WORKS_MIN_SCORE) { // explicit NO-BUILD: nothing worth the chest today
      for (const p of petitions) refuse(p, `El concejo de ${cityName(g, id)} decide NO construir ${buildingName(p, "es")}: otras obras van primero a este precio.`, `The council of ${cityName(g, id)} decides NOT to build ${buildingName(p, "en")}: other works come first at this price.`);
      continue;
    }
    if (cajaOf(g, id) < r2(top.quote.estimate * WORKS_CAJA_FLUSH)) { // the chest cannot start: refused with its cause (r2: the margin is a money compare)
      for (const p of petitions) refuse(p, `El concejo de ${cityName(g, id)} rechaza tu petición de ${buildingName(p, "es")}: la caja no llega (se piden ${top.quote.estimate}).`, `The council of ${cityName(g, id)} turns down your ${buildingName(p, "en")} petition: the chest cannot cover it (${top.quote.estimate} asked).`);
      continue;
    }
    const rec = recs[top.type];
    rec.state = "building";
    rec.nextLevel = top.quote.level;
    rec.needDays = top.quote.days;
    rec.workedDays = 0;
    rec.paidFee = 0;
    rec.feeTotal = top.quote.fee;
    rec.need = top.quote.need;
    rec.delivered = {};
    if (repOf(g, id) > 0) post(g, "council", { city: id, txt: { es: `El concejo de ${cityName(g, id)} vota construir ${buildingName(top.type, "es")} (nivel ${top.quote.level}) y lo paga de la caja de la ciudad, por día trabajado.`, en: `The council of ${cityName(g, id)} votes to build ${buildingName(top.type, "en")} (level ${top.quote.level}) and pays for it out of the town chest, per day worked.` } });
  }
}

/** Daily works pass: upkeep of standing levels from the chest (hysteresis like the walls' watch), then deliveries and labour for live works. Paused works consume nothing. */
export function worksDay(g) {
  if (!g.works) return; // flag OFF: nothing
  for (const c of g.world.cities) {
    const id = c.id;
    const recs = g.works[id];
    if (!recs) continue;
    for (const type of WORK_TYPES) {
      const rec = recs[type];
      if (!rec) continue;
      if (rec.level > 0) { // the standing levels keep costing their upkeep, whatever the work state
        const cost = BUILDING_TYPES[type].upkeep * rec.level, caja = cajaOf(g, id);
        if (rec.unkept) {
          if (caja >= cost * 2) { // hysteresis: resume only with two days of cost in the chest
            rec.unkept = false;
            post(g, "info", { txt: { es: `La caja de ${cityName(g, id)} vuelve a mantener ${buildingName(type, "es")}.`, en: `The chest of ${cityName(g, id)} keeps ${buildingName(type, "en")} again.` } });
          } else continue; // unkept and still thin: no charge, no progress either
        }
        if (!rec.unkept) {
          if (cajaOf(g, id) < cost) {
            rec.unkept = true;
            post(g, "council", { city: id, txt: { es: `La caja de ${cityName(g, id)} no paga el mantenimiento: ${buildingName(type, "es")} queda sin efecto.`, en: `The chest of ${cityName(g, id)} cannot pay the upkeep: ${buildingName(type, "en")} lapses.` } });
            continue;
          }
          creditCaja(g, id, -cost);
        }
      }
      if (rec.state === "paused") {
        if (cajaOf(g, id) >= 2 * dayCost(rec)) { // resume with the same hysteresis as the walls' watch
          rec.state = "building";
          if (repOf(g, id) > 0) post(g, "council", { city: id, txt: { es: `Vuelve el oro a la caja: se reanuda la obra de ${buildingName(type, "es")} en ${cityName(g, id)}.`, en: `Gold returns to the chest: the ${buildingName(type, "en")} works resume in ${cityName(g, id)}.` } });
        } else continue; // paused consumes no labour and no materials
      }
      if (rec.state !== "building") continue;
      for (const [good, needQty] of Object.entries(rec.need)) { // partial deliveries from LOCAL market stock only (no import)
        const pending = needQty - (rec.delivered[good] ?? 0);
        if (pending <= 0) continue;
        const take = Math.min(pending, g.market[id]?.[good]?.stock ?? 0);
        if (take <= 0) continue;
        const q = quoteUnits(g.world, g.market, id, { [good]: take });
        if (!q.ok || cajaOf(g, id) < q.cost) continue; // a thin chest waits for stock or gold: nothing consumed
        consumeUnits(g.world, g.market, id, { [good]: take }, cajaOf(g, id));
        creditCaja(g, id, -q.cost);
        rec.delivered[good] = (rec.delivered[good] ?? 0) + take;
      }
      const complete = Object.entries(rec.need).every(([good, n]) => (rec.delivered[good] ?? 0) >= n);
      if (!complete) continue; // a day without the full materials pending charges no labour (explicit rule)
      const cost = dayCost(rec);
      if (cajaOf(g, id) < cost) { // a thin chest PAUSES instead of rejecting
        rec.state = "paused";
        if (repOf(g, id) > 0) post(g, "council", { city: id, txt: { es: `La obra de ${buildingName(type, "es")} en ${cityName(g, id)} se pausa: la caja no paga la jornada (${cost}).`, en: `The ${buildingName(type, "en")} works in ${cityName(g, id)} pause: the chest cannot pay the day (${cost}).` } });
        continue;
      }
      creditCaja(g, id, -cost);
      rec.paidFee = r2(rec.paidFee + cost);
      rec.workedDays += 1;
      if (rec.workedDays >= rec.needDays) { // completion closes the work record exactly once, save/load safe
        rec.level = rec.nextLevel;
        rec.state = "active";
        rec.unkept = false;
        delete rec.nextLevel; delete rec.needDays; delete rec.workedDays; delete rec.paidFee; delete rec.feeTotal; delete rec.need; delete rec.delivered;
        if (repOf(g, id) > 0) post(g, "council", { city: id, txt: { es: `Obra terminada: ${cityName(g, id)} ya tiene ${buildingName(type, "es")} (nivel ${rec.level}), pagado por la ciudad.`, en: `Works complete: ${cityName(g, id)} now has ${buildingName(type, "en")} (level ${rec.level}), paid by the city.` } });
      }
    }
  }
}
