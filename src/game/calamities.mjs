// City calamities (own design; block C3): famine, fire and port sanitation scares in the
// same frame as the plague module (weekly seeded roll, building mitigations, ES/EN info
// messages). Flag `calamities`, OFF by default: no state, no rolls, no change without it.
// No probability or duration is documented: every number is our own tuning (inference).
// No mortality and no destruction of property are coded: fire HALTS buildings for a while
// (they reopen by themselves), famine raises food demand, a sanitation scare slackens trade.
// Same rules for the player and the bots: the market and the buildings move for everyone.
import { seeded } from "../view/cityscene.mjs";
import { towersFireWatch } from "./towers.mjs"; // kept watchtowers spot fires early (own design, issue #363)
import { watchFireWatch, whCap } from "./whwatch.mjs"; // the warehouse watch's fire rounds scale with storage (P4-06 office notes, own design)

// Own tuning constants (inference, not documented figures).
export const CALAMITY = Object.freeze({
  hambruna: Object.freeze({ chance: 0.015, days: 35, minDays: 14, mitigation: Object.freeze({ posito: 3, alhondiga: 1 }), mood: 15 }),
  incendio: Object.freeze({ chance: 0.01, days: 7, minDays: 3, mitigation: Object.freeze({ pozo: 3, hospital: 1 }), mood: 10 }),
  malsana: Object.freeze({ chance: 0.015, days: 14, minDays: 7, mitigation: Object.freeze({ pozo: 2, hospital: 2, capilla: 1 }), mood: 5 }),
});
export const CHANCE_CUT = 0.08, CHANCE_CAP = 0.5; // per mitigating level; never below half the base
export const FAMINE_FOOD_MUL = 1.5;  // food demand while a famine lasts
export const MALSANA_DEMAND = 0.9;   // demand while a sanitation scare lasts
export const FIRE_MAX_HALTS = 2;     // buildings a fire can halt at once

const fireRounds = (g, cityId) => towersFireWatch(g, cityId) + watchFireWatch(g, cityId, whCap(g, cityId)); // towers and the warehouse watch both walk fire rounds

const workingLevels = (g, cityId, type) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && !b.halted && b.type === type ? b.level : 0), 0);
const levels = (g, cityId, table) => Object.keys(table).reduce((a, t) => a + workingLevels(g, cityId, t), 0);

/** Weekly chance of one calamity in one city, cut by its mitigating buildings. */
export function calamityChance(g, cityId, kind) {
  const spec = CALAMITY[kind];
  const watch = kind === "incendio" ? fireRounds(g, cityId) : 0; // manned towers and the warehouse watch are fire watches (0 with their flags off / no guards hired)
  return spec.chance * Math.max(CHANCE_CAP, 1 - CHANCE_CUT * (levels(g, cityId, spec.mitigation) + watch));
}
/** How long one calamity sits on one city: mitigations shorten it, never below the floor. */
export function calamityDays(g, cityId, kind) {
  const spec = CALAMITY[kind];
  const watch = kind === "incendio" ? fireRounds(g, cityId) : 0; // the watch also shortens the fire
  const cut = Object.entries(spec.mitigation).reduce((a, [t, w]) => a + w * workingLevels(g, cityId, t), 0) + watch;
  return Math.max(spec.minDays, spec.days - cut);
}

/** Active calamity of a kind in a city (or any kind when kind is null). */
export const calamityActive = (g, cityId, kind = null) =>
  Object.entries(g.calamities?.active?.[cityId] ?? {}).filter(([k, c]) => (!kind || k === kind) && c.untilDay > g.day).map(([k]) => k);

/** Demand multipliers felt by the market: famine hungers, a scare slackens. 1 in a flag-off game. */
export function calamityDemandMul(g, cityId, good) {
  const active = calamityActive(g, cityId);
  let mul = 1;
  if (active.includes("malsana")) mul *= MALSANA_DEMAND;
  if (active.includes("hambruna") && ["grain", "fish", "meat", "olive_oil"].includes(good)) mul *= FAMINE_FOOD_MUL;
  return mul;
}
/** Mood hit while calamities last (citylife seam; 0 without the flag). */
export const calamityMoodHit = (g, cityId) => calamityActive(g, cityId).reduce((a, k) => a + CALAMITY[k].mood, 0);

/** Fresh state for a new game with the flag on. */
export function initCalamities() { return { active: {}, fireHalted: {} }; }

const NAMES = Object.freeze({
  hambruna: Object.freeze({ start: { es: "Hambruna en {c}: el grano escasea y el concejo abre el pósito.", en: "Famine in {c}: grain runs short and the council opens the granary." }, end: { es: "La hambruna afloja en {c}: vuelven a llenarse las alhóndigas.", en: "The famine eases in {c}: the corn exchanges fill again." } }),
  incendio: Object.freeze({ start: { es: "Incendio en {c}: varios talleres cierran hasta rehacerse.", en: "Fire in {c}: several workshops close until they rebuild." }, end: { es: "El incendio de {c} está domado: los talleres reabren.", en: "The fire in {c} is out: the workshops reopen." } }),
  malsana: Object.freeze({ start: { es: "Sanidad malsana en {c}: el puerto afloja su tráfico unos días.", en: "Foul sanitation in {c}: the port slackens its traffic for a few days." }, end: { es: "El puerto de {c} respira de nuevo: la sanidad mejora.", en: "The port of {c} breathes again: sanitation improves." } }),
});
const fill = (tpl, city) => tpl.replace("{c}", city);

/** Weekly roll and upkeep: fires halt and reopen, every calamity starts and ends with a word. */
export function calamityWeek(g, post) {
  const cal = g.calamities; if (!cal) return; // flag OFF: no state, no rolls, no change
  for (const c of g.world.cities) {
    const cityName = c.name ?? c.id, row = (cal.active[c.id] ??= {});
    for (const [kind, cur] of Object.entries(row)) {
      if (cur.untilDay > g.day) continue;
      if (kind === "incendio") {
        for (const key of cal.fireHalted[c.id] ?? []) { // the fire's own victims reopen; a building the owner halted himself stays halted
          const [cid, plotId] = key.split("/"); const b = g.buildings?.[cid]?.[plotId];
          if (b && b.halted === "incendio") delete b.halted;
        }
        delete cal.fireHalted[c.id];
      }
      delete row[kind];
      post(g, "info", { txt: { es: fill(NAMES[kind].end.es, cityName), en: fill(NAMES[kind].end.en, cityName) } });
    }
    for (const kind of Object.keys(CALAMITY)) {
      if (row[kind]) continue; // one of each kind at a time per city
      const r = seeded(`calamity:${kind}:${c.id}:${Math.floor(g.day / 7)}:${g.seed ?? 0}`);
      if (r() >= calamityChance(g, c.id, kind)) continue;
      row[kind] = { fromDay: g.day, untilDay: g.day + calamityDays(g, c.id, kind) };
      if (kind === "incendio") { // the fire halts a few working buildings until it is out
        const candidates = Object.entries(g.buildings?.[c.id] ?? {}).filter(([, b]) => b.state === "active" && !b.halted && b.type);
        const pick = seeded(`fire:${c.id}:${g.day}:${g.seed ?? 0}`);
        const halted = [];
        for (let i = 0; i < Math.min(FIRE_MAX_HALTS, candidates.length); i++) {
          const [plotId, b] = candidates[Math.floor(pick() * candidates.length)];
          if (halted.includes(plotId)) continue;
          b.halted = "incendio"; halted.push(plotId);
        }
        cal.fireHalted[c.id] = halted.map((p) => `${c.id}/${p}`);
      }
      post(g, "info", { topic: "calamity", txt: { es: fill(NAMES[kind].start.es, cityName), en: fill(NAMES[kind].start.en, cityName) } });
    }
  }
}
