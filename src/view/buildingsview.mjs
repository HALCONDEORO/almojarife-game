// Rows and offers for the "Buildings" tab: owned plots and buildings, free plots to buy,
// build/upgrade quotes with live market prices. Pure data, no DOM (same pattern as cityview.mjs).
import { BUILDING_TYPES, CIVIC_BUILDINGS, buildingAt, plotPrice, quoteConstruction, sellQuote, housePopBonus, warehouseCapBonus, producerRate, PRODUCERS, WORKSHOP_BATCH_PATTERN, HOUSE_POP_PER_LEVEL, WAREHOUSE_CAP_PER_LEVEL, DOCK_TOLL_DISCOUNT, JOBS_PER_LEVEL, WAGE_PER_WORKER, jobsNeeded, freeLabor, staffingRatio } from "../game/buildings.mjs";
import { quoteRecipe } from "../sim/recipes.mjs";
import { TICKS_PER_DAY } from "../sim/clock.mjs";

export const TYPE_KEYS = Object.keys(BUILDING_TYPES);

/** One row per owned plot/building in a city, ready to render. */
export function buildingsRows(g, cityId) {
  const plots = g.buildings?.[cityId] ?? {};
  return Object.entries(plots).map(([plotId, b]) => {
    const spec = b.type ? BUILDING_TYPES[b.type] : null;
    const halted = b.state === "active" && !!b.halted; // halted: workers walked for lack of cash, no costs and no output
    const fire = b.state === "active" && b.halted === "incendio"; // fire-halted: closed until the fire is out (not a cash problem)
    const row = { plotId, type: b.type, plotType: b.plotType, level: b.level, state: b.state, halted, fire, upkeep: b.state === "active" && !halted && spec ? spec.upkeep * b.level : 0 };
    if (b.state === "construction") {
      const total = spec.buildDays * b.nextLevel * TICKS_PER_DAY, left = Math.max(0, b.readyTick - g.tick);
      row.nextLevel = b.nextLevel; row.readyDay = Math.ceil(b.readyTick / TICKS_PER_DAY);
      row.progress = total > 0 ? Math.min(1, Math.max(0, 1 - left / total)) : 1;
    }
    if (b.state === "active" && !halted && PRODUCERS[b.type]) {
      const def = PRODUCERS[b.type];
      row.produced = b.produced ?? 0;
      row.rate = producerRate(b.type, b.level); // average batches/day at full running
      row.primary = def.primary;
      if (!def.primary) {
        const q = quoteRecipe(g.world, g.market, cityId, def.recipe, 1);
        row.margin = q.ok ? sellQuote(g.world, g.market, cityId, def.output, q.outputs[def.output]) - q.cost : null; // coins per batch right now
      }
    }
    if (b.state === "active" && !halted && b.type) {
      row.jobs = (JOBS_PER_LEVEL[b.type] ?? 0) * b.level; // workers this building hires from the port
      if (row.jobs) row.wages = row.jobs * WAGE_PER_WORKER; // coins per day, accrued with the upkeep
    }
    if (b.state === "active" && b.type === "house") row.popBonus = HOUSE_POP_PER_LEVEL * b.level;
    if (b.state === "active" && b.type === "warehouse") row.capBonus = WAREHOUSE_CAP_PER_LEVEL * b.level;
    if (b.state === "active" && b.type === "dock") row.tollCut = Math.round(DOCK_TOLL_DISCOUNT[b.level] * 100);
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
  return TYPE_KEYS.filter((type) => !PRODUCERS[type] || g.world.goods?.[PRODUCERS[type].output]) // a type whose good is not in this game is not offered
    .filter((type) => !CIVIC_BUILDINGS.includes(type) || g.citylife).map((type) => { // civic types belong to the city-life flag
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
  const jobs = jobsNeeded(g, cityId), free = freeLabor(g, cityId);
  return { pop: base, popBonus: housePopBonus(g, cityId), capBonus: warehouseCapBonus(g, cityId), jobs, free, staffing: staffingRatio(g, cityId) };
}
export { WORKSHOP_BATCH_PATTERN };

/** Parse a data-bldact attribute: "buy|<plotId>", "build|<plotId>|<type>", "upgrade|<plotId>|<type>".
 *  Plot ids contain ":", never "|". Returns null on anything malformed. */
export function parseBldAct(attr) {
  if (typeof attr !== "string") return null;
  const [kind, plotId, type] = attr.split("|");
  if (!plotId) return null;
  if (kind === "buy" || kind === "restart") return { kind, plotId };
  if ((kind === "build" || kind === "upgrade") && TYPE_KEYS.includes(type)) return { kind, plotId, type };
  return null;
}

/** Short floating label over a building in the 3D view: type and level, or "empty plot". */
export function buildingLabel(t, row) {
  if (!row?.type) return t.bldState.plot;
  const name = t.bldTypes[row.type] ?? row.type;
  if (row.state === "construction") return `${name} (${row.nextLevel ?? 1})`;
  const base = row.level > 1 ? `${name} ${row.level}` : name;
  return row.halted ? `${base} (${row.fire ? t.bldState.fire : t.bldState.halted})` : base;
}

// What the single-plot view (a click in the 3D port) should show for a city/plot,
// including whether the plots layout still has to load. Pure; the UI calls ensurePlots
// whenever this is not driven from an already-populated cache.
export function plotViewState(plotsCache, world, g, cityId, selPlot) {
  const lay = plotsCache[cityId];
  if (lay === "error") return { kind: "error" };
  if (!Array.isArray(lay)) return { kind: "loading" };
  const row = buildingsRows(g, cityId).find((x) => x.plotId === selPlot);
  if (row) return { kind: "owned", row };
  const offer = plotOffers(world, g, cityId, lay).find((x) => x.id === selPlot);
  return offer ? { kind: "offer", offer } : { kind: "none" };
}

// Localised "why not" for a failed build/upgrade offer; falls back to the raw reason
// so a missing locale key can never throw inside the confirm card.
export function whyText(t, reason) {
  return t.bldWhy?.[reason] ?? reason;
}
