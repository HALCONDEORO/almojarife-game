// Rows and offers for the "Buildings" tab: owned plots and buildings, free plots to buy,
// build/upgrade quotes with live market prices. Pure data, no DOM (same pattern as cityview.mjs).
import { BUILDING_TYPES, CIVIC_BUILDINGS, buildingAt, plotPrice, quoteConstruction, sellQuote, housePopBonus, warehouseCapBonus, producerRate, PRODUCERS, WORKSHOP_BATCH_PATTERN, HOUSE_POP_BY_TYPE, HOUSE_CLASS, WAREHOUSE_CAP_PER_LEVEL, DOCK_TOLL_DISCOUNT, JOBS_PER_LEVEL, WAGE_PER_WORKER, jobsNeeded, freeLabor, staffingRatio } from "../game/buildings.mjs";
import { quoteRecipe, RECIPES, OUTPUTS } from "../sim/recipes.mjs";
import { SEASON_PEAK } from "../sim/market.mjs";
import { assetKey } from "./city2d.mjs";
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
    if (b.state === "active" && HOUSE_POP_BY_TYPE[b.type]) row.popBonus = HOUSE_POP_BY_TYPE[b.type] * b.level;
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
  return TYPE_KEYS.filter((type) => type !== "house") // the legacy generic house is not offered: new builds pick a class (poor / comfortable / rich); old houses and auction lots still upgrade
    .filter((type) => !PRODUCERS[type] || g.world.goods?.[PRODUCERS[type].output]) // a type whose good is not in this game is not offered
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
/** Reasons the shared T table does not carry, own strings so the sweep lines stay untouched. */
export const WHY = {
  es: { "one per city": "esta ciudad ya tiene uno", "city limit": "la ciudad no admite más", "town too small": "la ciudad es aún demasiado pequeña" },
  en: { "one per city": "this city already has one", "city limit": "the city has room for no more", "town too small": "the town is still too small" },
};
export function whyText(t, reason, lang) {
  return t.bldWhy?.[reason] ?? WHY[lang]?.[reason] ?? reason;
}

/** Rejected offers still worth showing (disabled, with the reason) so the player sees how to
 *  unlock them - Main design call 25/10. "good not producible" stays hidden: the player cannot
 *  change what a city's soil yields, so that card would be noise. */
export const OFFER_LOCKED_SHOW = new Set(["respect required", "one per city", "city limit", "walls required", "town too small"]);
/** Card inner HTML for a refused offer row: drawing, name, and the reason it is locked. */
export function bldOfferLocked(t, o, lang, art) {
  const name = t.bldTypes[o.type] ?? o.type;
  const fig = art?.src ? `<img class="bldoffer-art" src="${escBw(art.src)}" alt="" loading="lazy"${art.filter ? ` style="filter:${escBw(art.filter)}"` : ""}>` : bwSvg(BOI[o.type] ?? BWI[o.type] ?? BWI.building, 44);
  return `<span class="bldoffer" title="${escBw(name)}: ${escBw(whyText(t, o.reason, lang))}">${fig}<b class="bldoffer-name">${escBw(name)}</b>`
    + `<span class="bldoffer-block bldoffer-why">${escBw(whyText(t, o.reason, lang))}</span></span>`;
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


/* P3-style build-offer cards for an owned empty plot (Construir flow): one framed card per
 * buildable type with its own drawing, the investment (price, materials with quantities, days,
 * labor fee) in one block, the running costs (upkeep and wages per day) in another, and what it
 * makes in a third - base rates labeled "up to" (a producer only runs when inputs, hands, cash
 * and margin hold), seasonal goods called out. Everything is visible text; nothing load-bearing
 * hides in title/aria. Groups follow the classic Hansa build menu: own buildings, raw-material
 * producers, processors, civic. Pure: renders buildOffers() rows; all number formatting stays
 * with the caller's fmt/fmtM (immune to decimal cash), names/state reuse the caller's T table.
 * The card drawing is the same isometric model the city view draws for that building (Marco
 * 25/10: use the city's real building models on the cards) via bldOfferArt(); the own flat
 * icons (BOI, CREDITS.md style - original work) stay as the fallback when no art is passed. */
export const BO = {
  es: {
    days: "{d} días de obra", fee: "mano de obra {p}", imported: "con importación",
    ops: "mantenim. {u}/día", wages: "salarios {w}/día",
    makes: "≈{n}/día de media", uses: "gasta ≈{n}/día de media", seasonal: "según temporada",
    armory: "vende armas y equipo",
    civic: { posito: "estabiliza el grano", hospital: "contra la peste", alhondiga: "mercado cubierto", caminos: "saneamiento", pozo: "agua limpia", capilla: "amparo en calamidades", carniceria: "carne y pescado estables", molino: "asegura el grano", corral: "alegra la ciudad" },
    groups: { own: "Casa y puerto", primary: "Materias primas", workshop: "Talleres y oficios", civic: "Edificios cívicos" },
    fxClass: { poor: "+{n} vecinos pobres", middle: "+{n} vecinos acomodados", rich: "+{n} vecinos ricos" },
  },
  en: {
    days: "{d} days to build", fee: "labor {p}", imported: "partly imported",
    ops: "upkeep {u}/day", wages: "wages {w}/day",
    makes: "≈{n}/day on average", uses: "uses ≈{n}/day on average", seasonal: "seasonal",
    armory: "sells arms and gear",
    civic: { posito: "steadies the grain supply", hospital: "against the plague", alhondiga: "a covered market", caminos: "sanitation", pozo: "clean water", capilla: "shelter in calamity", carniceria: "steady meat and fish", molino: "secures the grain", corral: "lifts the city's spirits" },
    groups: { own: "Home and harbour", primary: "Raw materials", workshop: "Workshops and crafts", civic: "Civic buildings" },
    fxClass: { poor: "+{n} poor tenants", middle: "+{n} well-off tenants", rich: "+{n} rich tenants" },
  },
};
/** Isometric art for a build offer: the same sprite the city view draws for that building
 * (Marco 25/10). Same mapping as the scene - assetKey() picks the level art and the
 * plot-deterministic house style, and the scene's REP_ART stand-ins keep a reused sprite from
 * passing for a different factory. Returns the webp path under web/ plus the CSS filter the
 * scene applies; the caller falls back to the flat SVG when it passes no art. */
const OFFER_ART_REP = { tannery: ["soapworks:1", "sepia(.4) brightness(.9)"], trading_post: ["office:1", "brightness(.94) hue-rotate(-12deg)"] };
export function bldOfferArt(plotId, type, level) {
  const rep = OFFER_ART_REP[type];
  const key = rep ? rep[0] : assetKey({ id: plotId, type: null }, { type, level: level ?? 1, state: "active" });
  return { src: `city2d/assets/${key.replace(":", "-")}.webp`, filter: rep ? rep[1] : "" };
}
/** Menu family of a buildable type, for the grouped offer list (classic build-menu order). */
export function bldOfferGroup(type) {
  const def = PRODUCERS[type];
  if (def) return def.primary ? "primary" : "workshop";
  return CIVIC_BUILDINGS.includes(type) ? "civic" : "own";
}
// Own flat drawings for every buildable type (24x24, BWI palette). Each building gets its own
// picture; the existing good icons stay for the goods themselves.
const BOI = {
  workshop: '<rect x="4" y="4" width="16" height="3" fill="#a8733a" stroke="#6e4a22" stroke-width="1"/><path d="M6 7v11M12 7v11M18 7v11" stroke="#b2403f" stroke-width="1.4"/><rect x="4" y="18" width="16" height="2.4" fill="#6e4a22"/>',
  farm: '<path d="M4 10l8-6 8 6v10H4z" fill="#a8533a" stroke="#6e3423" stroke-width="1.2"/><rect x="9" y="13" width="6" height="7" fill="#6e4a22"/><path d="M9 13l6 7M15 13l-6 7" stroke="#a8733a" stroke-width="1"/>',
  pasture: '<path d="M3 9h18M3 15h18" stroke="#8a6a3f" stroke-width="1.6"/><path d="M6 6v14M12 6v14M18 6v14" stroke="#8a6a3f" stroke-width="1.6"/>',
  sawmill: '<circle cx="15" cy="9" r="5" fill="#b9c0c7" stroke="#6c737b" stroke-width="1.2"/><circle cx="15" cy="9" r="1.4" fill="#6c737b"/><rect x="2" y="15" width="16" height="5" rx="2.5" fill="#a8733a" stroke="#6e4a22" stroke-width="1"/>',
  mine: '<path d="M6 4l9 7" stroke="#6e4a22" stroke-width="1.8"/><path d="M3 8c3-4 8-4 11-1" fill="none" stroke="#6c737b" stroke-width="1.8"/><path d="M4 20l4-6h8l4 6z" fill="#7a828a" stroke="#4a4f55" stroke-width="1.2"/>',
  oil_mill: '<circle cx="12" cy="14" r="7" fill="#b9b09a" stroke="#6e4a22" stroke-width="1.2"/><circle cx="12" cy="14" r="2" fill="#6e4a22"/><path d="M12 2c1.5 2 2 3.5 0 5-2-1.5-1.5-3 0-5z" fill="#9aa83a"/>',
  vineyard: '<path d="M5 4v16M19 4v16M4 8h16" stroke="#8a6a3f" stroke-width="1.5"/><g fill="#7a4a8a" stroke="#5a3f6a" stroke-width="0.8"><circle cx="10" cy="12" r="1.8"/><circle cx="14" cy="12" r="1.8"/><circle cx="12" cy="15" r="1.8"/></g><path d="M12 6v4" stroke="#3d7a2a" stroke-width="1.4"/>',
  saltworks: '<rect x="3" y="12" width="18" height="8" fill="#cfe4ee" stroke="#8fa3ad" stroke-width="1.2"/><path d="M7 12l5-6 5 6z" fill="#fff" stroke="#8fa3ad" stroke-width="1.2"/>',
  brewery: '<rect x="5" y="8" width="14" height="12" rx="2" fill="#b06a3e" stroke="#4d2813" stroke-width="1.2"/><path d="M5 8c0-2 3-3 7-3s7 1 7 3" fill="#f5ead0" stroke="#8a6a1f" stroke-width="1"/><path d="M8 12v4M12 12v4M16 12v4" stroke="#4d2813" stroke-width="1"/>',
  soapworks: '<path d="M5 10h14v6a4 4 0 01-4 4h-6a4 4 0 01-4-4z" fill="#8a8f95" stroke="#4a4f55" stroke-width="1.2"/><circle cx="10" cy="5" r="2" fill="#cfe4ee" stroke="#9db4c0" stroke-width="1"/><circle cx="15" cy="4" r="1.4" fill="#cfe4ee" stroke="#9db4c0" stroke-width="1"/>',
  pottery: '<path d="M5 20V10a7 7 0 0114 0v10z" fill="#b5583a" stroke="#7d3a24" stroke-width="1.2"/><path d="M12 13c2 2 2 4 0 5-2-1-2-3 0-5z" fill="#e0a73a"/>',
  brickworks: '<rect x="5" y="6" width="6" height="14" fill="#b5583a" stroke="#7d3a24" stroke-width="1.2"/><g fill="#b5583a" stroke="#7d3a24" stroke-width="1"><rect x="13" y="15" width="8" height="4"/><rect x="15" y="11" width="6" height="4"/></g>',
  esparto_field: '<path d="M4 21c1-8 3-13 5-17M9 21c0-8 1-13 3-17M14 21c-1-8-1-12 0-17M19 21c-2-7-3-11-3-16" stroke="#a89a4f" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M3 21h18" stroke="#7c6f33" stroke-width="1.4"/>',
  ranch: '<path d="M4 11l8-6 8 6v9H4z" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M8 6c-1-2-3-2-4-1M16 6c1-2 3-2 4-1" stroke="#d8cdb4" stroke-width="1.4" fill="none"/><rect x="10" y="14" width="4" height="6" fill="#6e4a22"/>',
  armory: '<path d="M5 4l12 14M19 4L7 18" stroke="#b9c0c7" stroke-width="2"/><path d="M4 3l3 1-1 1zM20 3l-3 1 1 1z" fill="#b9c0c7"/><path d="M9 17l-2 3M15 17l2 3" stroke="#6e4a22" stroke-width="2"/>',
  fishery: '<rect x="7" y="6" width="10" height="7" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M7 6l5-3 5 3" fill="#c08b4a" stroke="#6e4a22" stroke-width="1.2"/><path d="M8 13v6M16 13v6" stroke="#6e4a22" stroke-width="1.6"/><path d="M3 19h18" stroke="#3d7364" stroke-width="1.4"/>',
  ironworks: '<path d="M3 8h18c-2 3-5 4-8 4v3h4v4H7v-4h4v-3c-3 0-6-1-8-4z" fill="#4a4f55" stroke="#2e3236" stroke-width="1.2"/>',
  posito: '<rect x="5" y="7" width="14" height="8" fill="#c9a35e" stroke="#6e4a22" stroke-width="1.2"/><path d="M5 7l7-4 7 4" fill="#a8733a" stroke="#6e4a22" stroke-width="1.2"/><path d="M8 15v5M16 15v5" stroke="#6e4a22" stroke-width="1.6"/><path d="M9 10h6" stroke="#8a6a1f" stroke-width="1.4"/>',
  hospital: '<rect x="4" y="8" width="16" height="12" fill="#e8e2d0" stroke="#8a7a5a" stroke-width="1.2"/><path d="M4 8l8-5 8 5" fill="#c9a35e" stroke="#8a7a5a" stroke-width="1.2"/><path d="M12 11v6M9 14h6" stroke="#a11" stroke-width="2"/>',
  alhondiga: '<path d="M3 9l2-4h14l2 4z" fill="#b2403f" stroke="#6e3423" stroke-width="1.2"/><path d="M7 5l-1 4M12 5v4M17 5l1 4" stroke="#f6e9cc" stroke-width="1.4"/><path d="M5 9v11h14V9" fill="none" stroke="#6e4a22" stroke-width="1.4"/><path d="M9 20v-5h6v5" fill="#6e4a22"/>',
  caminos: '<path d="M7 21L10 3h4l3 18" fill="none" stroke="#8a7a5a" stroke-width="1.8"/><path d="M12 5v3M12 10.5v3M12 16v3" stroke="#b7aa8d" stroke-width="1.6"/>',
  pozo: '<path d="M6 20v-8h12v8" fill="#b9b09a" stroke="#6e4a22" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="6" ry="2" fill="#3d7364" stroke="#6e4a22" stroke-width="1.2"/><path d="M6 12V6M18 12V6M6 6h12" stroke="#6e4a22" stroke-width="1.4"/>',
  capilla: '<path d="M6 21V10l6-5 6 5v11z" fill="#e8e2d0" stroke="#8a7a5a" stroke-width="1.2"/><path d="M12 2v4M10.5 4h3" stroke="#8a6a1f" stroke-width="1.4"/><path d="M10 21v-4a2 2 0 014 0v4" fill="#6e4a22"/>',
  carniceria: '<path d="M4 8l2-4h12l2 4z" fill="#c4574f" stroke="#7a2a26" stroke-width="1.2"/><path d="M4 8v12h16V8" fill="none" stroke="#6e4a22" stroke-width="1.4"/><path d="M12 8v3a2 2 0 104 0" fill="none" stroke="#4a4f55" stroke-width="1.4"/>',
  molino: '<path d="M9 21l1-10h4l1 10z" fill="#e8e2d0" stroke="#8a7a5a" stroke-width="1.2"/><path d="M12 11L5 4M12 11l7-7M12 11l-7 7M12 11l7 7" stroke="#a8733a" stroke-width="1.8"/><circle cx="12" cy="11" r="1.6" fill="#6e4a22"/>',
  corral: '<path d="M4 5h16v8a8 8 0 01-16 0z" fill="#e8e2d0" stroke="#8a7a5a" stroke-width="1.2"/><circle cx="9" cy="10" r="1.2" fill="#2e3236"/><circle cx="15" cy="10" r="1.2" fill="#2e3236"/><path d="M8 14c2 2 6 2 8 0" fill="none" stroke="#2e3236" stroke-width="1.4"/><path d="M4 21h16" stroke="#8a7a5a" stroke-width="1.6"/>',
};
/** Card inner HTML for one ok buildOffers() row; the caller wraps it in the build button.
 *  art: optional bldOfferArt() result - the city's isometric model replaces the flat drawing. */
export function bldOfferCard(t, o, lang, fmt, fmtM, iconForGood, art) {
  const bo = BO[lang] ?? BO.es;
  const level = o.level ?? 1;
  const name = t.bldTypes[o.type] ?? o.type;
  const spec = BUILDING_TYPES[o.type];
  const gi = (good, size) => (iconForGood ? iconForGood(good, size) : "");
  const fig = art?.src ? `<img class="bldoffer-art" src="${escBw(art.src)}" alt="" loading="lazy"${art.filter ? ` style="filter:${escBw(art.filter)}"` : ""}>` : bwSvg(BOI[o.type] ?? BWI[o.type] ?? BWI.building, 44);
  const mats = Object.entries(RECIPES[spec.recipe] ?? {})
    .map(([good, qty]) => `<span class="bldoffer-mat" title="${escBw(t.goods?.[good] ?? good)}">${gi(good, 14)}${fmt(qty * level)}</span>`).join(" ");
  const jobs = (JOBS_PER_LEVEL[o.type] ?? 0) * level, wages = jobs * WAGE_PER_WORKER;
  const importedN = Object.values(o.imported ?? {}).reduce((a, b) => a + b, 0); // same rule as the confirm card: imported quantities, not object truthiness ({} is truthy)
  const ops = [bo.ops.replace("{u}", fmt(o.upkeep ?? spec.upkeep * level))];
  if (wages) ops.push(bo.wages.replace("{w}", fmt(wages)));
  const def = PRODUCERS[o.type];
  const parts = [], textParts = []; // html for the card, plain words for the title (no tag-stripping: CodeQL js/incomplete-multi-character-sanitization)
  if (def) {
    const rate = producerRate(o.type, level);
    if (def.primary) {
      for (const [good, per] of [[def.output, def.yield], ...Object.entries(def.byproducts ?? {})]) {
        const out = bo.makes.replace("{n}", fmtM(rate * per)); // averages keep their decimals (fmtM): a rounded average would read as a false figure
        parts.push(`<span class="bldoffer-out" title="${escBw(t.goods?.[good] ?? good)}">${gi(good, 16)}${escBw(out)}</span>`);
        textParts.push(`${t.goods?.[good] ?? good} ${out}`);
      }
      if (SEASON_PEAK[def.output] !== undefined) { parts.push(`<span class="bldoffer-note">${bo.seasonal}</span>`); textParts.push(bo.seasonal); }
    } else {
      const out = bo.makes.replace("{n}", fmtM(rate * (OUTPUTS[def.recipe]?.[def.output] ?? 0)));
      parts.push(`<span class="bldoffer-out" title="${escBw(t.goods?.[def.output] ?? def.output)}">${gi(def.output, 16)}${escBw(out)}</span>`);
      textParts.push(`${t.goods?.[def.output] ?? def.output} ${out}`);
      for (const [good, qty] of Object.entries(RECIPES[def.recipe] ?? {})) {
        const use = bo.uses.replace("{n}", fmtM(rate * qty));
        parts.push(`<span class="bldoffer-in" title="${escBw(t.goods?.[good] ?? good)}">${gi(good, 14)}${escBw(use)}</span>`);
        textParts.push(`${t.goods?.[good] ?? good} ${use}`);
      }
    }
  } else if (HOUSE_CLASS[o.type]) { const x = bo.fxClass[HOUSE_CLASS[o.type]].replace("{n}", fmt(HOUSE_POP_BY_TYPE[o.type] * level)); parts.push(escBw(x)); textParts.push(x); }
  else if (o.type === "house" && t.bldFxH) { const x = t.bldFxH.replace("{n}", fmt(HOUSE_POP_BY_TYPE.house * level)); parts.push(escBw(x)); textParts.push(x); }
  else if (o.type === "warehouse" && t.bldFxS) { const x = t.bldFxS.replace("{n}", fmt(WAREHOUSE_CAP_PER_LEVEL * level)); parts.push(escBw(x)); textParts.push(x); }
  else if (o.type === "dock" && t.bldFxD) { const x = t.bldFxD.replace("{n}", Math.round(DOCK_TOLL_DISCOUNT[level] * 100)); parts.push(escBw(x)); textParts.push(x); }
  else if (o.type === "armory") { parts.push(bo.armory); textParts.push(bo.armory); }
  else if (bo.civic[o.type]) { parts.push(bo.civic[o.type]); textParts.push(bo.civic[o.type]); }
  const title = `${name}: ${fmtM(o.cost)} (${bo.days.replace("{d}", fmt(o.days))}, ${bo.fee.replace("{p}", fmtM(o.fee))}), ${ops.join(", ")}, ${textParts.join(", ")}`;
  return `<span class="bldoffer" title="${escBw(title)}">${fig}<b class="bldoffer-name">${escBw(name)}</b>`
    + `<span class="bldoffer-block"><span class="bldoffer-cost">${bwSvg(BWI.coin, 14)}<b>${fmtM(o.cost)}</b> · ${escBw(bo.days.replace("{d}", fmt(o.days)))}</span>`
    + `<span class="bldoffer-mats">${mats}</span>`
    + `<span class="bldoffer-fee">${escBw(bo.fee.replace("{p}", fmtM(o.fee)))}${importedN > 0 ? ` · <i>${bo.imported}</i>` : ""}</span></span>`
    + `<span class="bldoffer-block bldoffer-ops">${ops.map((x) => escBw(x)).join(" · ")}</span>`
    + (parts.length ? `<span class="bldoffer-block bldoffer-prod">${parts.join(" ")}</span>` : "")
    + `</span>`;
}
