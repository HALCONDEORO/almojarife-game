// Construction engine, sim slice (docs/design/city-builder.md piece 2): plot ownership,
// construction timing on ticks, and daily upkeep accrued into the weekly ledger.
// Building effects (production, population, storage) land in later pieces. Own design. Desktop only.
import { quoteRecipe, consumeRecipe, RECIPES } from "../sim/recipes.mjs";
import { price } from "../sim/market.mjs";
import { FEE } from "../sim/trade.mjs";
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { post } from "./ledger.mjs";

/** First-slice types (design doc section 3). Costs scale per level: materials x level, fee x level, time x level. */
export const BUILDING_TYPES = Object.freeze({
  house: Object.freeze({ recipe: "house", fee: 150, buildDays: 3, upkeep: 1, maxLevel: 3 }),
  workshop: Object.freeze({ recipe: "workshop", fee: 300, buildDays: 5, upkeep: 3, maxLevel: 3 }),
  warehouse: Object.freeze({ recipe: "warehouse", fee: 250, buildDays: 4, upkeep: 2, maxLevel: 3 }),
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
export function buildingAt(g, cityId, plotId) { return g.buildings?.[cityId]?.[plotId] ?? null; }

/** Buy an empty plot. `plot` is the layout descriptor {id, type, w, d} from the (seeded, deterministic) city layout. */
export function buyPlot(g, cityId, plot) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const price = plotPrice(g.world, cityId, plot);
  if (price === null) return { ok: false, reason: "bad plot" };
  if (buildingAt(g, cityId, plot.id)) return { ok: false, reason: "already owned" };
  if (g.cash < price) return { ok: false, reason: "no cash", cost: price };
  g.cash -= price;
  ((g.buildings ??= {})[cityId] ??= {})[plot.id] = { type: null, level: 0, state: "plot", plotType: plot.type, paidPlot: price };
  return { ok: true, price };
}

/** Quote for building or upgrading on an owned plot: materials at the local market plus the labor fee. No mutation. */
export function quoteConstruction(g, cityId, plotId, type) {
  const spec = BUILDING_TYPES[type];
  if (!spec) return { ok: false, reason: "unknown type" };
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

/** One day of upkeep per active building, accrued into the weekly book like ship upkeep. Runs in dayTick. */
export function accrueBuildings(g) {
  for (const [cityId, plots] of Object.entries(g.buildings ?? {})) for (const [plotId, b] of Object.entries(plots)) {
    if (b.state !== "active") continue;
    const a = (g.accrued ??= { ships: {} });
    (a.buildings ??= {})[key(cityId, plotId)] = (a.buildings[key(cityId, plotId)] ?? 0) + BUILDING_TYPES[b.type].upkeep * b.level;
  }
}

/** Revenue of selling qty of a good into the local market, with per-unit price impact. No mutation. */
function sellQuote(world, market, city, good, qty) {
  const e = market[city]?.[good];
  if (!e) return 0;
  const sim = { ...e };
  let revenue = 0;
  for (let i = 0; i < qty; i++) { revenue += Math.floor(price(world, sim, good) * (1 - FEE)); sim.stock++; }
  return revenue;
}

/** One production day of a port's active workshops, run inside that port's (staggered) market tick so
 *  it sees fresh prices. Each workshop runs the largest batch count (up to its level) that still
 *  turns a profit after both market fees: wool is bought and cloth sold at the local market, so dear
 *  inputs slow production and missing stock, cash or margin stop it. The market decides; no magic numbers. */
export function workshopTick(g, cityId) {
  const plots = g.buildings?.[cityId];
  if (!plots) return;
  for (const b of Object.values(plots)) {
    if (b.state !== "active" || b.type !== "workshop") continue;
    for (let batches = b.level; batches >= 1; batches--) {
      const q = quoteRecipe(g.world, g.market, cityId, "weave", batches);
      if (!q.ok) continue; // not enough input stock for this size: try smaller
      if (g.cash < q.cost) continue;
      const revenue = sellQuote(g.world, g.market, cityId, "cloth", q.outputs.cloth);
      if (revenue <= q.cost) continue; // margin gone at this size
      const c = consumeRecipe(g.world, g.market, cityId, "weave", g.cash, batches); // wool stock down, cloth stock up
      if (!c.ok) break; // re-quoted inside; never mutate half-way
      g.cash += revenue - c.cost;
      b.produced = (b.produced ?? 0) + batches; // lifetime batches, for the Buildings tab (piece 4)
      break;
    }
  }
}
