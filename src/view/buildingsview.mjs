// Rows and offers for the "Buildings" tab: owned plots and buildings, free plots to buy,
// build/upgrade quotes with live market prices. Pure data, no DOM (same pattern as cityview.mjs).
import { BUILDING_TYPES, buildingAt, plotPrice, quoteConstruction, sellQuote, housePopBonus, warehouseCapBonus, workshopRate, WORKSHOP_BATCH_PATTERN, HOUSE_POP_PER_LEVEL, WAREHOUSE_CAP_PER_LEVEL } from "../game/buildings.mjs";
import { quoteRecipe } from "../sim/recipes.mjs";
import { TICKS_PER_DAY } from "../sim/clock.mjs";

export const TYPE_KEYS = Object.keys(BUILDING_TYPES);

/** One row per owned plot/building in a city, ready to render. */
export function buildingsRows(g, cityId) {
  const plots = g.buildings?.[cityId] ?? {};
  return Object.entries(plots).map(([plotId, b]) => {
    const spec = b.type ? BUILDING_TYPES[b.type] : null;
    const row = { plotId, type: b.type, plotType: b.plotType, level: b.level, state: b.state, upkeep: b.state === "active" && spec ? spec.upkeep * b.level : 0 };
    if (b.state === "construction") {
      const total = spec.buildDays * b.nextLevel * TICKS_PER_DAY, left = Math.max(0, b.readyTick - g.tick);
      row.nextLevel = b.nextLevel; row.readyDay = Math.ceil(b.readyTick / TICKS_PER_DAY);
      row.progress = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 1;
    }
    if (b.state === "active" && b.type === "workshop") {
      row.produced = b.produced ?? 0;
      row.rate = workshopRate(b.level); // average batches/day when the margin holds
      const q = quoteRecipe(g.world, g.market, cityId, "weave", 1);
      row.margin = q.ok ? sellQuote(g.world, g.market, cityId, "cloth", 2) - q.cost : null; // coins per batch right now
    }
    if (b.state === "active" && b.type === "house") row.popBonus = HOUSE_POP_PER_LEVEL * b.level;
    if (b.state === "active" && b.type === "warehouse") row.capBonus = WAREHOUSE_CAP_PER_LEVEL * b.level;
    return row;
  }).sort((a, b2) => a.plotId.localeCompare(b2.plotId, undefined, { numeric: true }));
}

/** Free plots from the seeded layout, with prices, cheapest first. `layoutPlots` is cityPlots(...).plots. */
export function plotOffers(world, g, cityId, layoutPlots) {
  return (layoutPlots ?? [])
    .filter((p) => !buildingAt(g, cityId, p.id))
    .map((p) => ({ id: p.id, type: p.type, w: p.w, d: p.d, price: plotPrice(world, cityId, p) }))
    .filter((o) => o.price !== null)
    .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/** Build quotes for every type on an owned empty plot, with days and upkeep. */
export function buildOffers(g, cityId, plotId) {
  return TYPE_KEYS.map((type) => {
    const q = quoteConstruction(g, cityId, plotId, type), spec = BUILDING_TYPES[type];
    return q.ok
      ? { type, ok: true, level: q.level, cost: q.cost, materials: q.materials, fee: q.fee, days: q.ticks / TICKS_PER_DAY, upkeep: spec.upkeep * q.level, affordable: g.cash >= q.cost }
      : { type, ok: false, reason: q.reason };
  });
}

/** Quote for the next level of an active building, or null when at max / not upgradeable. */
export function upgradeOffer(g, cityId, plotId) {
  const b = buildingAt(g, cityId, plotId);
  if (!b || b.state !== "active" || !b.type) return null;
  const q = quoteConstruction(g, cityId, plotId, b.type);
  if (!q.ok) return { type: b.type, ok: false, reason: q.reason, level: b.level };
  return { type: b.type, ok: true, level: q.level, cost: q.cost, materials: q.materials, fee: q.fee, days: q.ticks / TICKS_PER_DAY, upkeep: BUILDING_TYPES[b.type].upkeep * q.level, affordable: g.cash >= q.cost, maxLevel: BUILDING_TYPES[b.type].maxLevel };
}

/** Headline numbers for the tab: effective population with the house bonus, storage cap with the warehouse bonus. */
export function cityEffects(g, cityId) {
  const base = g.world.nodes[cityId]?.pop ?? 8000;
  return { pop: base, popBonus: housePopBonus(g, cityId), capBonus: warehouseCapBonus(g, cityId) };
}
export { WORKSHOP_BATCH_PATTERN };

/** Parse a data-bldact attribute: "buy|<plotId>", "build|<plotId>|<type>", "upgrade|<plotId>|<type>".
 *  Plot ids contain ":", never "|". Returns null on anything malformed. */
export function parseBldAct(attr) {
  if (typeof attr !== "string") return null;
  const [kind, plotId, type] = attr.split("|");
  if (!plotId) return null;
  if (kind === "buy") return { kind, plotId };
  if ((kind === "build" || kind === "upgrade") && TYPE_KEYS.includes(type)) return { kind, plotId, type };
  return null;
}
