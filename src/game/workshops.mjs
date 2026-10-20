// Own workshops (production chains), driven by data (world.workshops in data/world.json). Own design.
// A workshop sits next to your warehouse in a port: every day it takes its inputs from the warehouse and leaves its
// outputs there. It never touches the market, so prices only move when you sell what it made.
// Running costs (upkeep and wages) build up day by day and are paid on the weekly settlement day.
// Pure game logic, no DOM, no randomness. State: g.workshops[city][type] (absent in old saves: read with ??).
import { post, SETTLE_EVERY } from "./ledger.mjs";
import { seasonMul } from "../sim/market.mjs";
export const WORKSHOP_RESALE = 0.5, MAX_WORKSHOP_REPORTS = 52;
const WH_CAP = 300; // same as WAREHOUSE_CAP in game.mjs (not imported to avoid a cycle)
const r2 = (x) => Math.round(x * 100) / 100;

// Message texts (posted as "info" so the inbox shows them in the player's language).
export const WT = {
  es: { ready: "Tu {w} en {city} ya funciona.", noInput: "Tu {w} en {city} está parado: faltan materias primas en el almacén.", full: "Tu {w} en {city} está parado: el almacén está lleno.", noWh: "Tu {w} en {city} está parado: no hay almacén.", week: "Talleres, semana {week}: produjeron {made} unidades; salarios y mantenimiento {cost}." },
  en: { ready: "Your {w} at {city} is now working.", noInput: "Your {w} at {city} has stopped: the warehouse is out of raw materials.", full: "Your {w} at {city} has stopped: the warehouse is full.", noWh: "Your {w} at {city} has stopped: there is no warehouse.", week: "Workshops, week {week}: they made {made} units; wages and upkeep {cost}." },
};
const fill = (tpl, p) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? ""));
const both = (key, p) => ({ es: fill(WT.es[key], { ...p, w: p.w?.es ?? "" }), en: fill(WT.en[key], { ...p, w: p.w?.en ?? "" }) });

/** Plain-English problems with a workshops list (empty list = fine). Recipes may only use goods that exist. */
export function validateWorkshops(list, goods, textKeys = ["es", "en"]) {
  const errs = [], ids = new Set(), known = Object.keys(goods ?? {});
  if (!Array.isArray(list)) return ["workshops must be a list"];
  for (const w of list) {
    if (!w.id || ids.has(w.id)) errs.push(`workshop ${w.id ?? "?"}: missing or duplicate id`); ids.add(w.id);
    for (const k of ["name", "text"]) for (const l of textKeys) if (!w[k]?.[l]) errs.push(`workshop ${w.id}: ${k} missing "${l}"`);
    for (const k of ["price", "batchesPerDay"]) if (!(w[k] > 0)) errs.push(`workshop ${w.id}: ${k} must be positive`);
    for (const k of ["buildDays", "upkeepPerDay", "wagesPerDay"]) if (!(w[k] >= 0)) errs.push(`workshop ${w.id}: ${k} must be zero or more`);
    for (const k of ["inputs", "outputs"]) {
      const e = Object.entries(w[k] ?? {});
      if (!e.length) errs.push(`workshop ${w.id}: ${k} must not be empty`);
      for (const [g, q] of e) {
        if (!known.includes(g)) errs.push(`workshop ${w.id}: ${k} unknown good "${g}"`);
        if (!(Number.isInteger(q) && q > 0)) errs.push(`workshop ${w.id}: ${k} ${g} must be a positive whole number`);
      }
    }
    if (w.season !== undefined && !known.includes(w.season)) errs.push(`workshop ${w.id}: season unknown good "${w.season}"`);
    if (!w.allow || (!Array.isArray(w.allow.makes) && !(w.allow.minPop > 0))) errs.push(`workshop ${w.id}: allow needs "makes" or "minPop"`);
    for (const g of w.allow?.makes ?? []) if (!known.includes(g)) errs.push(`workshop ${w.id}: allow unknown good "${g}"`);
  }
  return errs;
}

export const workshopTypes = (world) => world.workshops ?? [];
export const workshopDef = (world, type) => workshopTypes(world).find((w) => w.id === type) ?? null;
/** May this kind of workshop be built in this port? (the port makes one of the listed goods, or is big enough) */
export function allowedIn(world, city, def) {
  const c = world.cities.find((x) => x.id === city);
  if (!c || !def) return false;
  return (def.allow?.makes ?? []).some((g) => c.makes.includes(g)) || (def.allow?.minPop > 0 && c.pop >= def.allow.minPop);
}
export const workshopsIn = (g, city) => g.workshops?.[city] ?? {};
export const workshopOf = (g, city, type) => g.workshops?.[city]?.[type] ?? null;
export const costPerDay = (def) => def.upkeepPerDay + def.wagesPerDay;
/** What the workshops have run up since the last settlement (paid on the next one). */
export const workshopsDue = (g) => r2(all(g).reduce((a, x) => a + (x.w.cost ?? 0), 0));
/** Resale value of all workshops (for net worth or rank; not used by the bank). */
export const workshopsValue = (g) => all(g).reduce((a, x) => a + (x.def ? Math.round(x.def.price * WORKSHOP_RESALE) : 0), 0);
function all(g) {
  const out = [];
  for (const [city, ws] of Object.entries(g.workshops ?? {})) for (const [type, w] of Object.entries(ws)) out.push({ city, type, w, def: workshopDef(g.world, type) });
  return out;
}
const cityLabel = (g, city) => g.world.cities.find((c) => c.id === city)?.name ?? city;

/** Build a workshop next to your warehouse, in a port where one of your ships is docked. Ready after buildDays. */
export function buildWorkshop(g, city, type) {
  const def = workshopDef(g.world, type);
  if (g.over) return { ok: false, reason: "game over" };
  if (!def) return { ok: false, reason: "unknown type" };
  if (!allowedIn(g.world, city, def)) return { ok: false, reason: "not allowed here" };
  if (!g.ships.some((s) => !s.voyage && s.at === city)) return { ok: false, reason: "no ship here" };
  if (!g.warehouses?.[city]) return { ok: false, reason: "no warehouse" };
  if (workshopOf(g, city, type)) return { ok: false, reason: "already owned" };
  if (g.cash < def.price) return { ok: false, reason: "no cash" };
  g.cash -= def.price;
  ((g.workshops ??= {})[city] ??= {})[type] = { built: g.day, readyDay: g.day + def.buildDays, cost: 0, progress: 0, made: 0, weekMade: 0, stalled: null };
  return { ok: true, readyDay: g.day + def.buildDays };
}
/** Sell a workshop for part of its price. What it ran up this week is paid now. */
export function sellWorkshop(g, city, type) {
  const w = workshopOf(g, city, type), def = workshopDef(g.world, type);
  if (g.over) return { ok: false, reason: "game over" };
  if (!w) return { ok: false, reason: "not owned" };
  const value = def ? Math.round(def.price * WORKSHOP_RESALE) : 0;
  g.cash = r2(g.cash + value - (w.cost ?? 0));
  delete g.workshops[city][type];
  if (!Object.keys(g.workshops[city]).length) delete g.workshops[city];
  return { ok: true, value, paid: r2(w.cost ?? 0) };
}

function stall(g, city, def, w, reason) {
  if (w.stalled === reason) return; // warn once, until it works again
  w.stalled = reason;
  post(g, "info", { txt: both(reason, { w: def.name, city: cityLabel(g, city) }) });
}
/** One day of work for every workshop; on the settlement day, pay their costs. Call before the weekly settlement. */
export function tickWorkshops(g) {
  for (const { city, w, def } of all(g)) {
    if (!def || g.day < (w.readyDay ?? 0)) continue; // a type removed from the data, or still being built
    if (g.day === w.readyDay) post(g, "info", { txt: both("ready", { w: def.name, city: cityLabel(g, city) }) });
    w.cost = r2((w.cost ?? 0) + costPerDay(def));
    const wh = g.warehouses?.[city];
    if (!wh) { stall(g, city, def, w, "noWh"); continue; }
    w.progress = (w.progress ?? 0) + def.batchesPerDay * (def.season ? seasonMul(def.season, g.day) : 1);
    let n = 0, stop = null;
    while (w.progress >= 1) {
      const used = Object.values(wh.goods).reduce((a, b) => a + b, 0), net = sum(def.outputs) - sum(def.inputs);
      if (Object.entries(def.inputs).some(([gd, q]) => (wh.goods[gd] ?? 0) < q)) stop = "noInput";
      else if (used + net > WH_CAP) stop = "full";
      if (stop) break;
      for (const [gd, q] of Object.entries(def.inputs)) { wh.goods[gd] -= q; if (!wh.goods[gd]) delete wh.goods[gd]; }
      for (const [gd, q] of Object.entries(def.outputs)) wh.goods[gd] = (wh.goods[gd] ?? 0) + q;
      w.progress -= 1; n++;
      const made = sum(def.outputs);
      w.made = (w.made ?? 0) + made; w.weekMade = (w.weekMade ?? 0) + made;
    }
    if (stop) { stall(g, city, def, w, stop); w.progress -= Math.floor(w.progress); } // a stopped workshop does not bank days of work
    else if (n > 0) w.stalled = null; // working again
  }
  if (g.day && g.day % SETTLE_EVERY === 0) return settleWorkshops(g);
  return null;
}
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
/** Pay what the workshops ran up this week (cash may go negative, like ship upkeep) and keep a short report. */
function settleWorkshops(g) {
  const list = all(g);
  if (!list.length) return null;
  const lines = list.map(({ city, type, w }) => ({ city, type, made: w.weekMade ?? 0, cost: r2(w.cost ?? 0) }));
  const cost = r2(lines.reduce((a, l) => a + l.cost, 0)), made = lines.reduce((a, l) => a + l.made, 0);
  g.cash = r2(g.cash - cost);
  for (const { w } of list) { w.cost = 0; w.weekMade = 0; }
  const r = { week: g.day / SETTLE_EVERY, day: g.day, lines, cost, made };
  (g.workshopReports ??= []).unshift(r);
  if (g.workshopReports.length > MAX_WORKSHOP_REPORTS) g.workshopReports.pop();
  if (cost > 0 || made > 0) post(g, "info", { txt: both("week", { week: r.week, made, cost }) });
  return r;
}
