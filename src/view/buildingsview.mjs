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
      ? { type, ok: true, level: q.level, cost: q.cost, materials: q.materials, fee: q.fee, days: q.ticks / TICKS_PER_DAY, upkeep: spec.upkeep * q.level, affordable: g.cash >= q.cost, imported: q.imported }
      : { type, ok: false, reason: q.reason };
  });
}

/** Quote for the next level of an active building, or null when at max / not upgradeable. */
export function upgradeOffer(g, cityId, plotId) {
  const b = buildingAt(g, cityId, plotId);
  if (!b || b.state !== "active" || !b.type) return null;
  const q = quoteConstruction(g, cityId, plotId, b.type);
  if (!q.ok) return { type: b.type, ok: false, reason: q.reason, level: b.level };
  return { type: b.type, ok: true, level: q.level, cost: q.cost, materials: q.materials, fee: q.fee, days: q.ticks / TICKS_PER_DAY, upkeep: BUILDING_TYPES[b.type].upkeep * q.level, affordable: g.cash >= q.cost, maxLevel: BUILDING_TYPES[b.type].maxLevel, imported: q.imported };
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
  if (kind === "buy" || kind === "buypermit" || kind === "restart") return { kind, plotId }; // buypermit: the player chose to spend an almoneda building permit on this plot
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

/* P3 summary card for the owned-building window: name + state + only the stats that
 * apply, as scannable cells (swCard idiom from shipwindow.mjs). Pure: it renders a
 * buildingsRows row, nothing else. Own strings (BW) so the shared i18n sweep lines
 * stay untouched; building names and state words reuse the caller's T table. */
export const BW = {
  es: { rate: "{r} lotes/día", margin: "margen {m}/lote", produced: "{n} producidos", upkeep: "mantenimiento {u}/día", jobs: "{j} trabajadores", wages: "salarios {w}/día", pop: "+{n} habitantes", cap: "+{n} de depósito", toll: "-{n}% de peaje" },
  en: { rate: "{r} batches/day", margin: "margin {m}/batch", produced: "{n} produced", upkeep: "upkeep {u}/day", jobs: "{j} workers", wages: "wages {w}/day", pop: "+{n} citizens", cap: "+{n} storage", toll: "-{n}% toll" },
};
// Short visible captions under each stat cell: the card must explain itself without hover
// (the old text line spelled every figure out); the full labels above stay in title/aria-label.
export const BWL = {
  es: { rate: "lotes/día", margin: "margen/lote", produced: "producidos", upkeep: "mantenim./día", jobs: "trabajadores", wages: "salarios/día", pop: "habitantes", cap: "depósito", toll: "peaje" },
  en: { rate: "batches/day", margin: "margin/batch", produced: "produced", upkeep: "upkeep/day", jobs: "workers", wages: "wages/day", pop: "citizens", cap: "storage", toll: "toll" },
};
// Own flat icons (CREDITS.md style, 24x24): card icons for non-producer types and small
// stat glyphs. Producers use their good's icon from web/icons.mjs (imported by callers).
const BWI = {
  house: '<path d="M4 11l8-7 8 7v9h-6v-6h-4v6H4z" fill="#b0713a" stroke="#6e4423" stroke-width="1.2"/><path d="M2 12l10-8 10 8" fill="none" stroke="#6e4423" stroke-width="1.6"/>',
  warehouse: '<rect x="3" y="9" width="18" height="11" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M3 9l9-5 9 5" fill="#c08b4a" stroke="#6e4a22" stroke-width="1.2"/><path d="M9 20v-6h6v6" fill="#6e4a22"/>',
  dock: '<path d="M12 3v13" stroke="#5a4a33" stroke-width="1.8"/><path d="M7 8h10" stroke="#5a4a33" stroke-width="1.6"/><path d="M6 16c0 4 12 4 12 0" fill="none" stroke="#5a4a33" stroke-width="1.8"/><circle cx="12" cy="3" r="1.6" fill="#5a4a33"/>',
  building: '<rect x="5" y="7" width="14" height="13" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M8 10h2M8 13h2M14 10h2M14 13h2" stroke="#f6e9cc" stroke-width="1.4"/>',
  coin: '<circle cx="12" cy="12" r="7" fill="#d8b24a" stroke="#8a6a1f" stroke-width="1.4"/><path d="M12 8v8M9.5 10h5" stroke="#8a6a1f" stroke-width="1.3" fill="none"/>',
  worker: '<circle cx="12" cy="8" r="3.4" fill="#caa26a" stroke="#6e4a22" stroke-width="1.2"/><path d="M5 20c1-5 4-7 7-7s6 2 7 7" fill="#caa26a" stroke="#6e4a22" stroke-width="1.2"/>',
  box: '<rect x="4" y="8" width="16" height="12" fill="#b08947" stroke="#6e4a22" stroke-width="1.2"/><path d="M4 8l8-4 8 4" fill="#c9a35e" stroke="#6e4a22" stroke-width="1.2"/><path d="M12 4v16" stroke="#6e4a22" stroke-width="1"/>',
  gauge: '<path d="M4 16a8 8 0 0 1 16 0" fill="none" stroke="#6e4a22" stroke-width="1.6"/><path d="M12 16l4-6" stroke="#a11" stroke-width="1.8"/><circle cx="12" cy="16" r="1.6" fill="#6e4a22"/>',
};
const bwSvg = (paths, size) => `<svg class="gi" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const escBw = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Compact chip for the owned-buildings list in the Construir tab: icon, name and state
 *  (halted/fire stand out in red via CSS; works show their percent). The full card stays one
 *  click away in the plot panel. Returns the button's INNER html - the caller owns the
 *  <button data-bldact="sel|..."> wrapper and its behavior. */
export function bldChipInner(t, r, lang, iconForGood) {
  const def = r.type ? PRODUCERS[r.type] : null;
  const icon = def ? (iconForGood ? iconForGood(def.output, 20) : "") : bwSvg(BWI[r.type] ?? BWI.building, 20);
  const state = r.state === "construction"
    ? `${t.bldState.construction} ${Math.round(r.progress * 100)}%`
    : r.halted ? (r.fire ? t.bldState.fire : t.bldState.halted) : (t.bldState[r.state] ?? r.state);
  const bad = r.halted || r.fire;
  return `<span class="bldchip${bad ? " bldchip-bad" : ""}">${icon}<span class="bldchip-name">${escBw(buildingLabel(t, r))}</span><span class="bldchip-state">${escBw(state)}</span></span>`;
}

export function bldSummaryCard(t, r, lang, fmt, iconForGood) {
  const bw = BW[lang] ?? BW.es, bwl = BWL[lang] ?? BWL.es;
  const def = r.type ? PRODUCERS[r.type] : null;
  const cardIcon = def ? (iconForGood ? iconForGood(def.output, 40) : "") : bwSvg(BWI[r.type] ?? BWI.building, 40);
  const state = r.state === "construction"
    ? `${t.bldState.construction} ${r.nextLevel} · ${t.bldReady.replace("{d}", r.readyDay).replace("{p}", Math.round(r.progress * 100))}`
    : r.halted ? (r.fire ? t.bldState.fire : t.bldState.halted) : (t.bldState[r.state] ?? r.state);
  const cell = (glyph, label, val, short, bad = false) =>
    `<span class="bwc-stat${bad ? " bwc-bad" : ""}" role="img" aria-label="${escBw(label)}" title="${escBw(label)}"><span class="bwc-val">${bwSvg(glyph, 16)}<b>${val}</b></span><span class="bwc-lab">${escBw(short)}</span></span>`;
  const cells = [];
  if (r.state === "active" && !r.halted) {
    if (r.rate !== undefined) cells.push(cell(BWI.gauge, bw.rate.replace("{r}", r.rate), r.rate, bwl.rate));
    if (r.margin !== undefined) cells.push(cell(BWI.coin, bw.margin.replace("{m}", r.margin === null ? "—" : fmt(r.margin)), r.margin === null ? "—" : fmt(r.margin), bwl.margin, r.margin !== null && r.margin < 0));
    if (r.produced !== undefined) cells.push(cell(BWI.box, bw.produced.replace("{n}", fmt(r.produced)), fmt(r.produced), bwl.produced));
    if (r.popBonus) cells.push(cell(BWI.house, bw.pop.replace("{n}", fmt(r.popBonus)), `+${fmt(r.popBonus)}`, bwl.pop));
    if (r.capBonus) cells.push(cell(BWI.warehouse, bw.cap.replace("{n}", fmt(r.capBonus)), `+${fmt(r.capBonus)}`, bwl.cap));
    if (r.tollCut) cells.push(cell(BWI.dock, bw.toll.replace("{n}", r.tollCut), `-${r.tollCut}%`, bwl.toll));
    if (r.upkeep) cells.push(cell(BWI.coin, bw.upkeep.replace("{u}", fmt(r.upkeep)), fmt(r.upkeep), bwl.upkeep));
    if (r.jobs) cells.push(cell(BWI.worker, bw.jobs.replace("{j}", r.jobs), r.jobs, bwl.jobs));
    if (r.wages) cells.push(cell(BWI.coin, bw.wages.replace("{w}", fmt(r.wages)), fmt(r.wages), bwl.wages));
  }
  return `<div class="bwcard"><div class="bwc-icon">${cardIcon}</div><div class="bwc-main"><div class="bwc-name"><b>${escBw(buildingLabel(t, r))}</b> <small>${escBw(r.plotId)}</small></div><div class="bwc-state">${escBw(state)}</div>${cells.length ? `<div class="bwc-stats">${cells.join("")}</div>` : ""}</div></div>`;
}
