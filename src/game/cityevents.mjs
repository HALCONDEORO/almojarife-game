// City events: famine, epidemic and fair. Short local shocks to one port's market that the player
// has to notice in time. Own design. Rules live in world.cityEvents (data/world.json), texts in
// locales/<lang>.json under "cityEvents". Pure game logic: no DOM.
import { post } from "./ledger.mjs";
import { isLive } from "./intel.mjs";
import { seeded } from "../view/cityscene.mjs";
export const CITY_EVENT_CHANCE = 0.03; // per port, per weekly roll
export const ROLL_EVERY = 7, MAX_ACTIVE = 2, COOLDOWN_DAYS = 35, KEEP_PAST = 20;
const MOD_KEYS = ["make", "use"];

/** Plain-English problems with a city events list (empty list = fine). `texts` is { es: <locale json>, en: … }. */
export function validateCityEvents(list, goods, texts = {}, langs = ["es", "en"]) {
  const errs = [], ids = new Set();
  if (!Array.isArray(list)) return ["cityEvents must be a list"];
  for (const e of list) {
    if (!e.id || ids.has(e.id)) errs.push(`city event ${e.id ?? "?"}: missing or duplicate id`); ids.add(e.id);
    if (!(e.weight > 0)) errs.push(`city event ${e.id}: weight must be positive`);
    const [a, b] = Array.isArray(e.days) ? e.days : [];
    if (!(Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= b && b <= 90)) errs.push(`city event ${e.id}: days must be [min, max] whole days, 1 to 90`);
    if (e.minPop !== undefined && !(e.minPop >= 0)) errs.push(`city event ${e.id}: minPop must be 0 or more`);
    const mods = Object.entries(e.mods ?? {});
    if (!mods.length) errs.push(`city event ${e.id}: needs at least one market modifier`);
    for (const [good, m] of mods) {
      if (good !== "*" && !Object.hasOwn(goods, good)) errs.push(`city event ${e.id}: unknown good "${good}"`);
      for (const [k, v] of Object.entries(m ?? {})) {
        if (!MOD_KEYS.includes(k)) errs.push(`city event ${e.id}/${good}: unknown modifier "${k}"`);
        else if (!(v > 0 && v <= 10)) errs.push(`city event ${e.id}/${good}: ${k} must be above 0 and at most 10`);
      }
    }
    for (const l of langs) {
      const t = texts[l]?.cityEvents?.[e.id];
      for (const k of ["name", "start", "end"]) if (!t?.[k]) errs.push(`city event ${e.id}: text ${k} missing "${l}"`);
      for (const k of ["start", "end"]) if (t?.[k] && !t[k].includes("{city}")) errs.push(`city event ${e.id}: text ${k} "${l}" must name the {city}`);
    }
  }
  return errs;
}

/** Give the world its texts (the page fetches locales/*.json; tests read them from disk). */
export function attachTexts(world, texts) { world.texts = { ...(world.texts ?? {}), ...texts }; return world; }
/** City events run in games started with events, unless the save says otherwise. */
export const cityEventsOn = (g) => !!(g.cityEventsOn ?? g.eventsOn);
export const activeCityEvents = (g) => (g.cityEvents ?? []).filter((e) => e.start <= g.day && g.day < e.end);
export const cityEventAt = (g, city) => activeCityEvents(g).find((e) => e.city === city) ?? null;
const defOf = (world, id) => (world.cityEvents ?? []).find((d) => d.id === id);
/** Does the player know about this event: a ship docked or a warehouse there, or a rumour bought since it began? */
export const knowsCityEvent = (g, e) => isLive(g, e.city) || (g.intel?.[e.city]?.day ?? -1) >= e.start;
/** Known, still running events, for the map and the port panel. */
export const knownCityEvents = (g) => activeCityEvents(g).filter((e) => e.seen || knowsCityEvent(g, e));

/** Market modifiers for today, in the shape tickMarket takes; null if nothing is going on. */
export function cityMarketMods(g) {
  const act = activeCityEvents(g);
  if (!act.length) return null;
  const mods = {};
  for (const e of act) {
    const d = defOf(g.world, e.id), m = (mods[e.city] ??= {});
    if (!d) continue; // an event removed from the data: no effect
    for (const good of Object.keys(g.market[e.city] ?? {})) {
      const x = d.mods[good] ?? d.mods["*"];
      if (x) m[good] = { make: x.make ?? 1, use: x.use ?? 1 };
    }
  }
  return mods;
}

/** One text in one language with {city}, {name} and {n} filled in. */
export function cityEventText(world, lang, e, kind, day) {
  const t = world.texts?.[lang]?.cityEvents, name = t?.[e.id]?.name ?? e.id, city = world.nodes?.[e.city]?.name ?? e.city;
  const tpl = kind === "start" || kind === "end" ? t?.[e.id]?.[kind] : t?.[kind];
  return (tpl ?? `${name}: {city}`).replace(/\{(\w+)\}/g, (_, k) => k === "city" ? city : k === "name" ? name : k === "n" ? String(Math.max(0, e.end - (day ?? e.start))) : "");
}
const allLangs = (world, e, kind) => Object.fromEntries(Object.keys(world.texts ?? { es: 1, en: 1 }).map((l) => [l, cityEventText(world, l, e, kind)]));
function tell(g, e, kind) {
  const txt = allLangs(g.world, e, kind);
  post(g, "info", { txt, city: e.city, cityEvent: e.id });
  g.log.unshift({ day: g.day, key: "event", txt }); if (g.log.length > 30) g.log.pop();
}

/** Weekly roll: each port may start an event (at most one per port, MAX_ACTIVE on the whole map, a rest after each). Returns the new events. */
export function rollCityEvents(g) {
  const defs = g.world.cityEvents ?? [];
  if (!defs.length || g.over) return [];
  const list = (g.cityEvents ??= []), started = [], week = Math.floor(g.day / ROLL_EVERY), seed = g.seed ?? 0;
  const order = g.world.cities.map((c) => ({ c, k: seeded(`cevo:${week}:${c.id}:${seed}`)() })).sort((a, b) => a.k - b.k).map((x) => x.c); // no port is always first
  for (const c of order) {
    if (activeCityEvents(g).length >= MAX_ACTIVE) break;
    if (list.some((e) => e.city === c.id && g.day < e.end + COOLDOWN_DAYS)) continue;
    const r = seeded(`cev:${week}:${c.id}:${seed}`);
    if (r() >= CITY_EVENT_CHANCE) continue;
    const ok = defs.filter((d) => (d.minPop ?? 0) <= (c.pop ?? 0)), total = ok.reduce((a, d) => a + d.weight, 0);
    if (!total) continue;
    let x = r() * total, pick = ok[ok.length - 1];
    for (const d of ok) { x -= d.weight; if (x < 0) { pick = d; break; } }
    const days = pick.days[0] + Math.floor(r() * (pick.days[1] - pick.days[0] + 1));
    const e = { id: pick.id, city: c.id, start: g.day, end: g.day + days, seen: false };
    list.push(e); started.push(e);
  }
  const past = list.filter((e) => e.end <= g.day);
  if (past.length > KEEP_PAST) for (const e of past.slice(0, past.length - KEEP_PAST)) list.splice(list.indexOf(e), 1);
  return started;
}
/** Start of the day (before the market moves): close finished events, roll new ones on roll days. */
export function updateCityEvents(g) {
  for (const e of g.cityEvents ?? []) if (!e.closed && g.day >= e.end) { e.closed = true; if (e.seen) tell(g, e, "end"); }
  if (cityEventsOn(g) && g.day > 0 && g.day % ROLL_EVERY === 0) rollCityEvents(g);
}
/** End of the day (after intel): tell the player about running events they have just learnt of. */
export function noticeCityEvents(g) {
  const told = [];
  for (const e of activeCityEvents(g)) if (!e.seen && knowsCityEvent(g, e)) { e.seen = true; tell(g, e, "start"); told.push(e); }
  return told;
}
