// Regional economic shocks: mild, seeded and reproducible events (poor harvest, new demand,
// a port closed for a few days) over three regions of the map. Effects live in the market
// entries themselves (rate/target scaled while active, originals kept on the shock and
// restored on expiry), so a save/load mid-shock stays exact. No DOM here.
import { seeded } from "../view/cityscene.mjs";
import { post } from "./ledger.mjs";

/** The three regions. Every city of the world belongs to exactly one (a test checks this). */
export const REGIONS = {
  atlantico: ["lisboa", "setubal", "vigo", "porto", "mazagan", "coruna", "faro", "casablanca", "huelva", "rabat", "sevilla", "santander", "bilbao", "sansebastian", "larache", "arcila", "cadiz"],
  estrecho: ["tanger", "tetuan", "ceuta", "malaga", "melilla"],
  mediterraneo: ["almeria", "cartagena", "oran", "alicante", "valencia", "mostaganem", "tarragona", "ibiza", "barcelona", "palma", "argel"],
};
export const regionOf = (city) => Object.keys(REGIONS).find((r) => REGIONS[r].includes(city)) ?? null;
export const SHOCK_CHANCE = 0.05, SHOCK_MIN_DAY = 30, SHOCK_MAX_ACTIVE = 2;
/** Goods a poor harvest can hit (the grown ones; manufactures and imports are spared). */
export const HARVEST_GOODS = ["grain", "wine", "olive_oil", "sugar", "wool", "dried_fish", "salt"];
export const SHOCK_TYPES = [
  { id: "poor_harvest", weight: 0.4, days: [14, 28] },
  { id: "new_demand", weight: 0.4, days: [14, 28] },
  { id: "port_closed", weight: 0.2, days: [3, 7] },
];
export const HARVEST_RATE_MUL = 0.5, DEMAND_TARGET_MUL = 1.5;

/** Shocks touching a city right now. */
export const activeShocks = (g, city) => (g.shocks ?? []).filter((s) => s.untilDay > g.day && (city === undefined || (s.type === "port_closed" ? s.city === city : REGIONS[s.region]?.includes(city))));
/** A closed port trades nothing. */
export const portClosed = (g, city) => activeShocks(g, city).some((s) => s.type === "port_closed");

const REGION_NAMES = { es: { atlantico: "el Atlántico", estrecho: "el Estrecho", mediterraneo: "el Mediterráneo" }, en: { atlantico: "the Atlantic", estrecho: "the Strait", mediterraneo: "the Mediterranean" } };
const GOOD_NAMES = { es: { grain: "el grano", wine: "el vino", olive_oil: "el aceite", sugar: "el azúcar", wool: "la lana", dried_fish: "el pescado seco", salt: "la sal", timber: "la madera", iron: "el hierro", cloth: "el paño", silk: "la seda", pepper: "la pimienta", beer: "la cerveza" } };
/** "de" + the name, contracted: del grano, de la lana. */
const DE_GOOD = Object.fromEntries(Object.entries(GOOD_NAMES.es).map(([k, v]) => [k, v.replace(/^el /, "del ").replace(/^la /, "de la ")]));
/** Plain text of a shock (start or end), ES/EN. */
export function shockText(sh, lang, end = false) {
  const es = lang === "es", reg = REGION_NAMES[lang]?.[sh.region] ?? sh.region, good = (es ? GOOD_NAMES.es[sh.good] : null) ?? sh.good;
  if (sh.type === "poor_harvest") return es ? `Mala cosecha ${DE_GOOD[sh.good] ?? `de ${sh.good}`} en ${reg}${end ? ": la producción vuelve a la normalidad" : ": la producción cae durante unas semanas"}.` : `Poor ${sh.good} harvest in ${reg}${end ? ": production is back to normal" : ": output falls for a few weeks"}.`;
  if (sh.type === "new_demand") return es ? `Nueva demanda ${DE_GOOD[sh.good] ?? `de ${sh.good}`} en ${reg}${end ? ": el mercado se calma" : ": los precios tiran hacia arriba durante unas semanas"}.` : `New demand for ${sh.good} in ${reg}${end ? ": the market settles" : ": prices pull up for a few weeks"}.`;
  return es ? `${sh.city} cierra su puerto unos días por un susto de peste${end ? "; ya se puede comerciar otra vez" : ""}.` : `${sh.city} closes its port for a few days over a plague scare${end ? "; trading is open again" : ""}.`;
}

/** Exported for tests; the game only calls it from tickShocks. */
/** Apply the market effect of a shock, remembering the DELTAS on the shock itself: deltas commute,
 *  so two shocks over the same market entry (say a harvest and a demand spike on one good) unwind
 *  exactly in any expiry order - absolute snapshots would restore stale values and corrupt the market. */
export function applyShock(g, sh) {
  sh.touched = [];
  if (sh.type === "port_closed") return; // the block is checked at trade time, nothing to scale
  for (const city of REGIONS[sh.region]) {
    const e = g.market[city]?.[sh.good];
    if (!e) continue;
    if (sh.type === "poor_harvest" && !e.makes) continue; // only producers lose output
    const rateDelta = sh.type === "poor_harvest" ? Math.max(1, Math.round(e.rate * HARVEST_RATE_MUL)) - e.rate : 0;
    const targetDelta = sh.type === "new_demand" ? Math.round(e.target * DEMAND_TARGET_MUL) - e.target : 0;
    e.rate += rateDelta; e.target += targetDelta;
    sh.touched.push({ city, rateDelta, targetDelta });
  }
}
/** Restore every market entry a shock touched, subtracting its own deltas only. */
export function clearShock(g, sh) {
  for (const t of sh.touched ?? []) {
    const e = g.market[t.city]?.[sh.good];
    if (e) { e.rate -= t.rateDelta; e.target -= t.targetDelta; }
  }
  sh.touched = [];
}

/** Seeded pick of the next shock on a day, or null. Pure: no mutation. */
export function rollShock(g) {
  if (!g.eventsOn || g.over || g.day < SHOCK_MIN_DAY) return null;
  const active = (g.shocks ?? []).filter((s) => s.untilDay > g.day);
  if (active.length >= SHOCK_MAX_ACTIVE) return null;
  const r = seeded(`shock-v2:${g.seed ?? 0}:${g.day}`);
  if (r() >= SHOCK_CHANCE) return null;
  let x = r(), type = SHOCK_TYPES[SHOCK_TYPES.length - 1];
  const total = SHOCK_TYPES.reduce((a, t) => a + t.weight, 0);
  for (const t of SHOCK_TYPES) { x -= t.weight / total; if (x < 0) { type = t; break; } }
  const regions = Object.keys(REGIONS), region = regions[Math.floor(r() * regions.length)];
  const [dMin, dMax] = type.days, days = dMin + Math.floor(r() * (dMax - dMin + 1));
  const sh = { id: `shock:${g.day}`, type: type.id, region, untilDay: g.day + days, fromDay: g.day };
  if (type.id === "poor_harvest") sh.good = HARVEST_GOODS[Math.floor(r() * HARVEST_GOODS.length)];
  else if (type.id === "new_demand") { const goods = Object.keys(g.world.goods); sh.good = goods[Math.floor(r() * goods.length)]; }
  else { const cities = REGIONS[region]; sh.city = cities[Math.floor(r() * cities.length)]; delete sh.region; }
  if (sh.type === "port_closed") { if (active.some((a) => a.type === "port_closed" && a.city === sh.city)) return null; } // a port never closes twice over
  else if (active.some((a) => a.type === sh.type && a.region === sh.region && a.good === sh.good)) return null; // no exact duplicates running
  return sh;
}

/** Day-boundary work: expire finished shocks (restoring the market), then maybe start one. */
export function tickShocks(g) {
  const keep = [];
  for (const sh of g.shocks ?? []) {
    if (sh.untilDay > g.day) { keep.push(sh); continue; }
    clearShock(g, sh);
    const txt = { es: shockText(sh, "es", true), en: shockText(sh, "en", true) };
    g.log.unshift({ day: g.day, key: "shock", txt }); if (g.log.length > 30) g.log.pop();
    post(g, "shock", { txt });
  }
  g.shocks = keep;
  const sh = rollShock(g);
  if (sh) {
    applyShock(g, sh);
    g.shocks.push(sh);
    const txt = { es: shockText(sh, "es"), en: shockText(sh, "en") };
    g.log.unshift({ day: g.day, key: "shock", txt }); if (g.log.length > 30) g.log.pop();
    post(g, "shock", { txt });
  }
  return sh;
}
