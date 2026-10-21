// Construction engine, sim slice (docs/design/city-builder.md piece 2): plot ownership,
// construction timing on ticks, and daily upkeep accrued into the weekly ledger.
// Building effects (production, population, storage) land in later pieces. Own design. Desktop only.
import { quoteRecipe, consumeRecipe, RECIPES } from "../sim/recipes.mjs";
import { price, seasonMul } from "../sim/market.mjs";
import { FEE } from "../sim/trade.mjs";
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { post } from "./ledger.mjs";
import { repOf } from "./rank.mjs";

/** First-slice types (design doc section 3). Costs scale per level: materials x level, fee x level, time x level. */
export const BUILDING_TYPES = Object.freeze({
  house: Object.freeze({ recipe: "house", fee: 150, buildDays: 3, upkeep: 1, maxLevel: 3 }),
  workshop: Object.freeze({ recipe: "workshop", fee: 300, buildDays: 5, upkeep: 3, maxLevel: 3 }),
  warehouse: Object.freeze({ recipe: "warehouse", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  farm: Object.freeze({ recipe: "farm", fee: 200, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  pasture: Object.freeze({ recipe: "pasture", fee: 200, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  sawmill: Object.freeze({ recipe: "sawmill", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  mine: Object.freeze({ recipe: "mine", fee: 300, buildDays: 5, upkeep: 3, maxLevel: 3 }),
  // Primary producers (PR3 of the materials plan): buildable only where the city makes the good.
  oil_mill: Object.freeze({ recipe: "oil_mill", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  vineyard: Object.freeze({ recipe: "vineyard", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }),
  saltworks: Object.freeze({ recipe: "saltworks", fee: 200, buildDays: 3, upkeep: 1, maxLevel: 3 }),
  smokehouse: Object.freeze({ recipe: "smokehouse", fee: 200, buildDays: 3, upkeep: 1, maxLevel: 3 }),
  // Private dock: your ships pay less port toll in this city per active level (docs/design/dock-building.md).
  dock: Object.freeze({ recipe: "dock", fee: 150, buildDays: 5, upkeep: 1, maxLevel: 3 }),
});

/** Plot price from the city's population and the plot's suggested type and area. Deterministic, no rolls. */
export function plotPrice(world, cityId, plot) {
  const pop = world.nodes[cityId]?.pop ?? 8000;
  if (!plot || typeof plot.id !== "string" || !Number.isFinite(plot.w) || !Number.isFinite(plot.d) || plot.w <= 0 || plot.d <= 0) return null;
  const area = plot.w * plot.d;
  const typeMul = plot.type === "warehouse" ? 1.2 : plot.type === "house" ? 0.8 : 1; // services and workshops pay the standard rate
  return Math.round((150 + pop * 0.02 + area * 2) * typeMul);
}

const key = (cityId, plotId) => `${cityId}/${plotId}`;
// Plot ids come from the seeded layout as `<city>:<index>` with no leading zeros; anything else
// (including "__proto__" and friends, and non-canonical forms like "cadiz:01", which would be a
// phantom plot colliding with "cadiz:1") is rejected. The index is capped at 3 digits - the seeded
// layout is grid-bound far below that; real existence is checked by the view layer, which owns
// cityPlots. The maps are null-prototype so a hostile or malformed id can never collide with
// Object internals.
export const PLOT_ID = /^[a-z0-9_-]+:(0|[1-9]\d{0,2})$/;
export function buildingAt(g, cityId, plotId) { return g.buildings?.[cityId]?.[plotId] ?? null; }

/** Buy an empty plot. `plot` is the layout descriptor {id, type, w, d} from the (seeded, deterministic) city layout. */
export const OFFICE_MIN_RESPECT = 20; // respect "known" in the port before it sells you an office
export const OFFICE_PRICE = 750; // one trading office per non-home port; it gates all construction there
export function hasOffice(g, cityId) { // saves made before offices stay playable
  return !Array.isArray(g.offices) || cityId === g.profile.home || g.offices.includes(cityId);
}
export function buyOffice(g, cityId) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  if (cityId === g.profile.home || g.offices.includes(cityId)) return { ok: false, reason: "already owned" };
  if (repOf(g, cityId) < OFFICE_MIN_RESPECT) return { ok: false, reason: "respect required", need: OFFICE_MIN_RESPECT };
  if (g.cash < OFFICE_PRICE) return { ok: false, reason: "no cash", cost: OFFICE_PRICE };
  g.cash -= OFFICE_PRICE; g.offices.push(cityId);
  return { ok: true, cost: OFFICE_PRICE };
}

export function buyPlot(g, cityId, plot) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const price = plotPrice(g.world, cityId, plot);
  if (price === null || !PLOT_ID.test(plot.id)) return { ok: false, reason: "bad plot" };
  if (!hasOffice(g, cityId)) return { ok: false, reason: "office required" };
  if (buildingAt(g, cityId, plot.id)) return { ok: false, reason: "already owned" };
  if (g.cash < price) return { ok: false, reason: "no cash", cost: price };
  g.cash -= price;
  const maps = (g.buildings ??= Object.create(null)); (maps[cityId] ??= Object.create(null))[plot.id] = { type: null, level: 0, state: "plot", plotType: plot.type, paidPlot: price };
  return { ok: true, price };
}

/** Quote for building or upgrading on an owned plot: materials at the local market plus the labor fee. No mutation.
 *  Upgrade policy: a new level pays the FULL level cost (materials x level, fee x level),
 *  not the difference from the previous one - a level-3 workshop is a bigger building, not a patch. */
export function quoteConstruction(g, cityId, plotId, type) {
  if (!hasOffice(g, cityId)) return { ok: false, reason: "office required" };
  const spec = BUILDING_TYPES[type];
  if (!spec) return { ok: false, reason: "unknown type" };
  if (PRODUCERS[type] && !cityAllowsProducer(g.world, cityId, type)) return { ok: false, reason: "good not producible in this city" };
  const b = buildingAt(g, cityId, plotId);
  if (!b) return { ok: false, reason: "plot not owned" };
  if (b.state === "construction") return { ok: false, reason: "already building" };
  const level = b.level + 1;
  if (b.type && b.type !== type) return { ok: false, reason: "plot has another building" };
  if (level > spec.maxLevel) return { ok: false, reason: "max level" };
  const q = quoteRecipe(g.world, g.market, cityId, spec.recipe, level); // materials scale with the level
  if (!q.ok) return q;
  const fee = spec.fee * level, ticks = spec.buildDays * level * TICKS_PER_DAY;
  return { ok: true, type, level, cost: q.cost + fee, materials: q.cost, fee, ticks, inputs: q.inputs };
}

/** Pay and start construction; the building turns active exactly at readyTick (tickBuildings). */
export function startConstruction(g, cityId, plotId, type) {
  if (g.over) return { ok: false, reason: "game over" };
  const q = quoteConstruction(g, cityId, plotId, type);
  if (!q.ok) return q;
  if (g.cash < q.cost) return { ok: false, reason: "no cash", cost: q.cost };
  const spec = BUILDING_TYPES[type];
  const c = consumeRecipe(g.world, g.market, cityId, spec.recipe, g.cash, q.level);
  if (!c.ok) return c; // re-quoted inside; cannot fail after the checks above, but never mutate half-way
  g.cash -= q.cost;
  const b = buildingAt(g, cityId, plotId);
  Object.assign(b, { type, state: "construction", nextLevel: q.level, readyTick: g.tick + q.ticks });
  post(g, "info", { txt: { es: `Obra iniciada en ${cityId} (${type} nivel ${q.level})`, en: `Construction started in ${cityId} (${type} level ${q.level})` } });
  return { ok: true, ...q, readyTick: b.readyTick };
}

/** Exact-tick completion: buildings whose readyTick has passed turn active. Runs inside advanceTick. */
export function tickBuildings(g) {
  for (const [cityId, plots] of Object.entries(g.buildings ?? {})) for (const [plotId, b] of Object.entries(plots)) {
    if (b.state === "construction" && g.tick >= b.readyTick) {
      b.state = "active"; b.level = b.nextLevel; delete b.nextLevel; delete b.readyTick;
      post(g, "info", { txt: { es: `Edificio listo en ${cityId} (${b.type} nivel ${b.level})`, en: `Building ready in ${cityId} (${b.type} level ${b.level})` } });
    }
  }
}

/** One day of upkeep per active building, accrued into the weekly book like ship upkeep. Runs in dayTick.
 *  Upkeep policy: a building under construction accrues nothing; the completion day
 *  already accrues, matching how an arrival day counts as a day at sea. */
export function accrueBuildings(g) {
  let committed = 0; // today's charges commit in order, so several buildings share the one cash figure
  for (const [cityId, plots] of Object.entries(g.buildings ?? {})) for (const [plotId, b] of Object.entries(plots)) {
    if (b.state !== "active") continue;
    const cost = BUILDING_TYPES[b.type].upkeep * b.level + (JOBS_PER_LEVEL[b.type] ?? 0) * b.level * WAGE_PER_WORKER;
    if (b.halted) { // hysteresis: resume only when cash covers two days of cost, so a building near the line does not flap halt/restart daily
      if (g.cash - committed < cost * 2) continue;
      b.halted = false; post(g, "restart", { city: cityId, plot: plotId });
    }
    if (g.cash - committed < cost) { b.halted = true; post(g, "halt", { city: cityId, plot: plotId }); continue; } // no cash at charge time: the workers walk
    const a = (g.accrued ??= { ships: {} });
    (a.buildings ??= {})[key(cityId, plotId)] = (a.buildings[key(cityId, plotId)] ?? 0) + cost;
    committed += cost;
  }
}
/** Restart a halted building once there is cash to pay its upkeep and people again. */
export function restartBuilding(g, cityId, plotId) {
  const b = buildingAt(g, cityId, plotId);
  if (!b || !b.halted) return { ok: false, reason: "not halted" };
  if (g.cash <= 0) return { ok: false, reason: "no cash" };
  b.halted = false;
  return { ok: true };
}

/** Revenue of selling qty of a good into the local market, with per-unit price impact. No mutation. Exported for the Buildings tab's margin preview. */
export function sellQuote(world, market, city, good, qty) {
  const e = market[city]?.[good];
  if (!e) return 0;
  const sim = { ...e };
  let revenue = 0;
  for (let i = 0; i < qty; i++) { revenue += Math.floor(price(world, sim, good) * (1 - FEE)); sim.stock++; }
  return revenue;
}

/** Employment (city-builder follow-up: jobs). The workers ARE the port's inhabitants: the town's own
 *  economy (fishing, farming, shops, the harbour) already employs most of the base population, and the
 *  player's active building levels hire from whoever is left - which includes every inhabitant of the
 *  player's houses, all of them newcomers looking for work. When jobs outnumber free inhabitants, EVERY
 *  producer in the port runs at the same staffing ratio - a labour shortage slows the whole port, not
 *  one unlucky building. The ratio is computed from live state on each tick, never stored. */
export const JOBS_PER_LEVEL = Object.freeze({
  house: 0, warehouse: 3, workshop: 8, farm: 6, pasture: 6, sawmill: 8, mine: 10,
  oil_mill: 6, vineyard: 6, saltworks: 5, smokehouse: 5, dock: 0,
});
/** Share of the base population already working the town's own economy; the rest can be hired. */
export const TOWN_JOBS_SHARE = 0.9;
/** Wages: one coin per worker per day, accrued daily together with the upkeep into the weekly
 *  book (employment piece c). A building that cannot be paid halts until the player restarts it. */
export const WAGE_PER_WORKER = 1;
/** Total workers the port's active buildings want. */
export const jobsNeeded = (g, cityId) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && !b.halted && b.type ? (JOBS_PER_LEVEL[b.type] ?? 0) * b.level : 0), 0);
/** Inhabitants available for hire: effective population (city pop + house bonus) minus the town's own jobs. */
export const freeLabor = (g, cityId) => { const pop = g.world?.nodes?.[cityId]?.pop ?? 8000; return Math.max(0, pop + housePopBonus(g, cityId) - Math.round(pop * TOWN_JOBS_SHARE)); };
/** Staffing ratio for the whole port: 1 when there are enough inhabitants, free/needed below that. */
export const staffingRatio = (g, cityId) => { const need = jobsNeeded(g, cityId); return need < 1 ? 1 : Math.min(1, freeLabor(g, cityId) / need); };

/** Loom throughput per level, keyed on the absolute day so it stays deterministic: level 1 runs one
 *  batch every other day, level 2 one batch a day, level 3 alternates two and one. Measured balance
 *  (docs/design/city-builder.md piece 3 follow-up): at level batches/day the best port paid the
 *  building back in ~35 days; this pattern lands it at roughly a season. */
export const WORKSHOP_BATCH_PATTERN = Object.freeze({ 1: Object.freeze([1, 0]), 2: Object.freeze([1]), 3: Object.freeze([2, 1]) });
/** Producer definitions, keyed by building type: which market recipe it runs and what good it sells.
 *  Adding a new processor-type producer is a row here plus a BUILDING_TYPES row; the tick and the
 *  Buildings tab read from this table, never from hardcoded types. (Primary producers with no
 *  inputs - farms, mines - are a later piece.) */
export const PRODUCERS = Object.freeze({
  workshop: Object.freeze({ recipe: "weave", output: "cloth", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
  // Primary producers: the land yields the good, no inputs. yield = units per batch; seasonal goods
  // follow the market's own seasonMul (harvest/shearing peaks), the rest produce evenly all year.
  farm: Object.freeze({ output: "grain", primary: true, yield: 4, pattern: WORKSHOP_BATCH_PATTERN }),
  pasture: Object.freeze({ output: "wool", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  sawmill: Object.freeze({ output: "timber", primary: true, yield: 3, pattern: WORKSHOP_BATCH_PATTERN }),
  mine: Object.freeze({ output: "iron", primary: true, yield: 1, pattern: WORKSHOP_BATCH_PATTERN }),
  oil_mill: Object.freeze({ output: "olive_oil", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  vineyard: Object.freeze({ output: "wine", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  saltworks: Object.freeze({ output: "salt", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  smokehouse: Object.freeze({ output: "dried_fish", primary: true, yield: 4, pattern: WORKSHOP_BATCH_PATTERN }),
});
/** Where a producer type may be built. Primary producers (farms, mines: no inputs, the land yields
 *  the good) only go where the city MAKES that good - local resources per city, the rest is imported,
 *  like the classic Hansa model. Processors (primary: false) run on market inputs and build anywhere.
 *  Makes-lists come from world.json; no city list is hardcoded here. */
export const producerCities = (world, type) => {
  const def = PRODUCERS[type];
  if (!def) return [];
  if (!def.primary) return world.cities.map((c) => c.id);
  return world.cities.filter((c) => c.makes.includes(def.output)).map((c) => c.id);
};
/** Whether a producer type may be built in a city (see producerCities). */
export const cityAllowsProducer = (world, cityId, type) => producerCities(world, type).includes(cityId);
/** Average batches a level produces per day when the margin holds, from the type's pattern. */
export const producerRate = (type, level) => { const p = PRODUCERS[type]?.pattern?.[level]; return p ? p.reduce((a, b) => a + b, 0) / p.length : 0; };
/** Average batches a workshop level produces per day when the margin holds. */
export const workshopRate = (level) => producerRate("workshop", level);
/** One production day of a port's active producers, run inside that port's (staggered) market tick so
 *  it sees fresh prices. Each producer runs the largest batch count (up to its pattern cap) that still
 *  turns a profit after both market fees: inputs are bought and output sold at the local market, so
 *  dear inputs slow production and missing stock, cash or margin stop it. The market decides; no magic numbers. */
export function workshopTick(g, cityId) {
  const plots = g.buildings?.[cityId];
  if (!plots) return;
  const day = Math.ceil(g.tick / TICKS_PER_DAY);
  const staff = staffingRatio(g, cityId); // one ratio per port and day; a shortage slows everyone equally
  if (staff <= 0) return;
  // Staffing multiplies production. Fractional batches are spread across days deterministically:
  // batches today = staffed cumulative output through today minus through yesterday, so a 90%
  // staffing runs nine days in ten instead of flooring every day's batch to zero. Fully staffed
  // (staff = 1) this is exactly pattern[day % length], the pre-jobs behaviour.
  const staffed = (pattern, d) => { const P = pattern.length; let t = Math.floor(d / P) * pattern.reduce((a, x) => a + x, 0); for (let i = 0; i < d % P; i++) t += pattern[i]; return t; };
  const batchesFor = (pattern, level) => Math.min(level, Math.floor(staff * staffed(pattern, day + 1)) - Math.floor(staff * staffed(pattern, day)));
  for (const b of Object.values(plots)) {
    if (b.state !== "active" || b.halted) continue; // halted: no workers, no production
    const def = PRODUCERS[b.type];
    if (!def) continue;
    if (def.primary) { // the land yields the good: no inputs, no margin check, only upkeep (accrued weekly)
      const pattern = def.pattern[b.level] ?? def.pattern[3];
      const batches = batchesFor(pattern, b.level);
      if (batches < 1) continue;
      const e = g.market[cityId]?.[def.output];
      if (!e) continue;
      const amount = Math.max(1, Math.round(def.yield * batches * seasonMul(def.output, day)));
      e.stock = Math.max(e.stock, Math.min(e.target * 4, e.stock + amount)); // same stock cap as city production, but never clip stock already above it
      b.produced = (b.produced ?? 0) + amount; // lifetime units, for the Buildings tab
      continue;
    }
    const pattern = def.pattern[b.level] ?? def.pattern[3];
    for (let batches = batchesFor(pattern, b.level); batches >= 1; batches--) {
      const q = quoteRecipe(g.world, g.market, cityId, def.recipe, batches);
      if (!q.ok) continue; // not enough input stock for this size: try smaller
      if (g.cash < q.cost) continue;
      const revenue = sellQuote(g.world, g.market, cityId, def.output, q.outputs[def.output]);
      if (revenue <= q.cost) continue; // margin gone at this size
      const c = consumeRecipe(g.world, g.market, cityId, def.recipe, g.cash, batches); // input stock down, output stock up
      if (!c.ok) break; // re-quoted inside; never mutate half-way
      g.cash += revenue - c.cost;
      b.produced = (b.produced ?? 0) + batches; // lifetime batches, for the Buildings tab (piece 4)
      break;
    }
  }
}

/** Building effects (design doc piece 5). Houses raise the port's effective population a little
 *  (more of the existing class demand, nothing new); warehouse buildings extend its storage cap. */
export const HOUSE_POP_PER_LEVEL = 50, WAREHOUSE_CAP_PER_LEVEL = 300;
const activeLevels = (g, cityId, type) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && b.type === type ? b.level : 0), 0);
export const housePopBonus = (g, cityId) => HOUSE_POP_PER_LEVEL * activeLevels(g, cityId, "house");
export const warehouseCapBonus = (g, cityId) => WAREHOUSE_CAP_PER_LEVEL * activeLevels(g, cityId, "warehouse");
/** Dock: share of the port toll your ships still pay there, by summed ACTIVE dock levels (capped at 3:
 *  one good dock is enough; extra piers add nothing). Like the warehouse cap it is a passive effect:
 *  a halted dock keeps it (no workers needed to tie a rope), consistent with the storage bonus. */
export const DOCK_TOLL_DISCOUNT = Object.freeze([0, 0.5, 0.75, 1]); // by level: 0, 1, 2, 3
export const dockTollFactor = (g, cityId) => 1 - DOCK_TOLL_DISCOUNT[Math.min(3, activeLevels(g, cityId, "dock"))];
