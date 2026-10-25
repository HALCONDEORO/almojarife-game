// Council treasury and tax votes (phase B1 of docs/design/town-hall-mayor-taxes.md).
// Each port's concejo keeps a caja fed by the derechos (almojarifazgo + portazgo the player
// pays) and by its own citizens' sisas, and spends it on watch and walls. Every MEETING_EVERY
// days the concejo votes one step up or down on a tax. Steps are discrete and bounded, so the
// balance gate is protected by construction; every effect is monotone and shown in the tab.
// Player payments are a small bonus: the town's own income keeps the caja near equilibrium,
// so unvisited ports do not drift into punitive taxes. Pure game logic, no DOM.
import { post } from "./ledger.mjs";
import { townCouncil } from "./townhall.mjs";
import { repOf } from "./rank.mjs";
import { seeded } from "../view/cityscene.mjs"; // same hash the views use (news.mjs precedent)

export const SISA_STEP = 0.05, TOLL_STEP = 0.05, STEP_MAX = 10, MEETING_EVERY = 30; // 5% steps, same +-50% band: the concejo can land on intermediate rates
const r2 = (x) => Math.round(x * 100) / 100;

/** Coins in the town's chest (chests start full: saves from before B1 read as the target reserve). */
export const cajaOf = (g, city) => r2(g.hallCaja?.[city] ?? cajaTarget(g.world, city));
/** Signed tax steps per city: { sisa, portazgo } in [-STEP_MAX, STEP_MAX]. */
export const taxSteps = (g, city) => g.hallTax?.[city] ?? { sisa: 0, portazgo: 0 };
/** Multiplier the concejo applies on the market fee (1 at neutral). */
export const sisaMul = (g, city) => 1 + SISA_STEP * taxSteps(g, city).sisa;
/** Multiplier the concejo applies on the docking toll (1 at neutral). */
export const portazgoMul = (g, city) => 1 + TOLL_STEP * taxSteps(g, city).portazgo;
/** Daily cost of watch and walls: about 1 per 1,000 people, to cents so mid-size ports are not rounded up or down. */
export const upkeepOf = (world, city) => Math.max(1, r2((world.nodes[city]?.pop ?? 8000) / 1000));
/** The concejo keeps about thirty days of upkeep as its target reserve. */
export const cajaTarget = (world, city) => 30 * upkeepOf(world, city);
/** Credit the derechos a trade or a toll paid into the town's chest. */
export function creditCaja(g, city, amount) {
  if (!Number.isFinite(amount)) return;
  const c = (g.hallCaja ??= {});
  c[city] = r2((c[city] ?? cajaTarget(g.world, city)) + amount); // a chest materializes at its target reserve
}
/** One meeting per city per MEETING_EVERY days, staggered deterministically by city. */
export const meetingDay = (world, city, day) => { const r = seeded("meet:" + city)(); return day % MEETING_EVERY === Math.floor(r * MEETING_EVERY); };
export const nextMeetingDay = (world, city, day) => { const off = Math.floor(seeded("meet:" + city)() * MEETING_EVERY); return day + ((off - (day % MEETING_EVERY)) + MEETING_EVERY) % MEETING_EVERY || day + MEETING_EVERY; };

/** Daily council work: citizens' sisas in, watch and walls out, and the meeting on its day. */
export function councilDay(g) {
  for (const c of g.world.cities) {
    const id = c.id, st = taxSteps(g, id), up = upkeepOf(g.world, id);
    const income = up * (1 + 0.6 * SISA_STEP * st.sisa + 0.4 * TOLL_STEP * st.portazgo); // higher taxes, fuller chest
    creditCaja(g, id, r2(income - up));
    if (!meetingDay(g.world, id, g.day)) continue;
    const caja = cajaOf(g, id), target = cajaTarget(g.world, id);
    const rnd = seeded(`vote:${id}:${g.day}`);
    let move = null;
    if (caja < target / 2) move = { tax: rnd() < 0.5 ? "sisa" : "portazgo", d: Math.max(1, Math.min(STEP_MAX, Math.ceil(((target / 2 - caja) / target) * STEP_MAX))) }; // deeper hole, more steps in one vote
    else if (caja > target * 1.5) move = { tax: rnd() < 0.5 ? "sisa" : "portazgo", d: -1 };
    if (!move) continue;
    const next = { ...st };
    next[move.tax] = Math.max(-STEP_MAX, Math.min(STEP_MAX, next[move.tax] + move.d));
    if (next[move.tax] === st[move.tax]) continue; // already at the cap
    (g.hallTax ??= {})[id] = next;
    if (repOf(g, id) <= 0) continue; // the player only hears about councils that know them
    const mayor = townCouncil(g.world, id).mayor, cName = g.world.cities.find((x) => x.id === id)?.name ?? id;
    const up2 = move.d > 0, sisa = move.tax === "sisa";
    post(g, "council", { city: id, txt: {
      es: `El concejo de ${cName}, con el alcalde ${mayor}, vota ${up2 ? "subir" : "bajar"} ${sisa ? "la sisa del mercado" : "el portazgo del muelle"}: la caja ${up2 ? "anda escasa" : "va sobrada"}.`,
      en: `The council of ${cName}, led by mayor ${mayor}, votes to ${up2 ? "raise" : "lower"} ${sisa ? "the market sisa" : "the quay toll"}: the chest is ${up2 ? "running low" : "flush"}.`,
    } });
  }
}
