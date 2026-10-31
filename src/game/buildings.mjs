// Construction engine, sim slice (docs/design/city-builder.md piece 2): plot ownership,
// construction timing on ticks, and daily upkeep accrued into the weekly ledger.
// Building effects (production, population, storage) land in later pieces. Own design. Desktop only.
import { quoteRecipe, consumeRecipe, quoteUnitsImport, consumeUnitsImport, RECIPES } from "../sim/recipes.mjs";
import { recordLocalSupply, recordMarketPurchase, recordWholesaleSale } from "../sim/procurement.mjs";
import { price, seasonMul } from "../sim/market.mjs";
import { FEE, floor2 } from "../sim/trade.mjs";
import { TICKS_PER_DAY } from "../sim/clock.mjs";
import { post } from "./ledger.mjs";
import { repOf, addRespect } from "./rank.mjs";
import { wallsAllow } from "./plague.mjs";
import { whLocked } from "./whlock.mjs";

/** First-slice types (design doc section 3). Costs scale per level: materials x level, fee x level, time x level. */
export const BUILDING_TYPES = Object.freeze({
  house: Object.freeze({ recipe: "house", fee: 150, buildDays: 8, upkeep: 1, maxLevel: 3 }),
  workshop: Object.freeze({ recipe: "workshop", fee: 300, buildDays: 13, upkeep: 3, maxLevel: 3 }),
  warehouse: Object.freeze({ recipe: "warehouse", fee: 250, buildDays: 15, upkeep: 2, maxLevel: 3 }),
  farm: Object.freeze({ recipe: "farm", fee: 200, buildDays: 19, upkeep: 2, maxLevel: 3 }),
  pasture: Object.freeze({ recipe: "pasture", fee: 200, buildDays: 19, upkeep: 2, maxLevel: 3 }),
  sawmill: Object.freeze({ recipe: "sawmill", fee: 250, buildDays: 22, upkeep: 2, maxLevel: 3 }),
  mine: Object.freeze({ recipe: "mine", fee: 300, buildDays: 26, upkeep: 3, maxLevel: 3 }),
  // Town houses by class (P3 11.2.2: half-timbered for the poor, gabled for the well off, merchant
  // houses for the rich). Each shelters residents of ITS class, who buy by that class's basket
  // (houseClassPop). The legacy generic house stays for old saves and auction lots; new builds pick
  // a class below. buildDays follow the calibration formula ceil(units/3) + ceil(fee/100).
  house_poor: Object.freeze({ recipe: "house_poor", fee: 100, buildDays: 5, upkeep: 1, maxLevel: 3 }),
  house_comfortable: Object.freeze({ recipe: "house", fee: 150, buildDays: 8, upkeep: 1, maxLevel: 3 }),
  house_rich: Object.freeze({ recipe: "house_rich", fee: 300, buildDays: 13, upkeep: 2, maxLevel: 3 }),
  // Primary producers (PR3 of the materials plan): buildable only where the city makes the good.
  oil_mill: Object.freeze({ recipe: "oil_mill", fee: 250, buildDays: 24, upkeep: 2, maxLevel: 3 }),
  vineyard: Object.freeze({ recipe: "vineyard", fee: 250, buildDays: 22, upkeep: 2, maxLevel: 3 }),
  saltworks: Object.freeze({ recipe: "saltworks", fee: 200, buildDays: 20, upkeep: 1, maxLevel: 3 }),
  brewery: Object.freeze({ recipe: "brewery", fee: 250, buildDays: 28, upkeep: 2, maxLevel: 3 }),
  soapworks: Object.freeze({ recipe: "soapworks", fee: 250, buildDays: 22, upkeep: 2, maxLevel: 3 }),
  // Brickworks (chains study PR3): fires timber into bricks, the construction material PR5 wires into every build quote.
  pottery: Object.freeze({ recipe: "pottery", fee: 250, buildDays: 25, upkeep: 2, maxLevel: 3 }), // only offered in games with the pottery flag (the good must exist)
  brickworks: Object.freeze({ recipe: "brickworks", fee: 250, buildDays: 22, upkeep: 2, maxLevel: 3 }),
  esparto_field: Object.freeze({ recipe: "esparto_field", fee: 200, buildDays: 18, upkeep: 1, maxLevel: 3 }),
  ranch: Object.freeze({ recipe: "ranch", fee: 250, buildDays: 20, upkeep: 2, maxLevel: 3 }),
  // Armory: sells ship weapons and sailors' gear; outside the 16-building production cap like dock and office (docs/design/armory.md).
  armory: Object.freeze({ recipe: "armory", fee: 250, buildDays: 13, upkeep: 2, maxLevel: 3 }),
  // Private dock: your ships pay less port toll in this city per active level (docs/design/dock-building.md).
  dock: Object.freeze({ recipe: "dock", fee: 150, buildDays: 32, upkeep: 1, maxLevel: 3 }),
  // Fishery: huts, nets and small boats; yields fresh fish where the city catches it (docs/design/fish-chain.md).
  fishery: Object.freeze({ recipe: "fishery", fee: 150, buildDays: 16, upkeep: 1, maxLevel: 3 }),
  // Ironworks: processor, iron and timber into ironware (docs/design/production-chains-study.md).
  ironworks: Object.freeze({ recipe: "ironworks", fee: 250, buildDays: 23, upkeep: 2, maxLevel: 3 }),
  // Civic buildings of the city-life module (src/game/citylife.mjs); names from the documented
  // record (posito, hospital, alhondiga). Effects live in that module and only apply when the
  // citylife flag created its state; the view never offers them in a flag-off game.
  posito: Object.freeze({ recipe: "posito", fee: 200, buildDays: 10, upkeep: 1, maxLevel: 3 }),
  hospital: Object.freeze({ recipe: "hospital", fee: 300, buildDays: 17, upkeep: 3, maxLevel: 3 }),
  alhondiga: Object.freeze({ recipe: "alhondiga", fee: 250, buildDays: 14, upkeep: 2, maxLevel: 3 }),
  // Sanitation and faith against calamity (block C2, plague module): caminos and pozo stand
  // anywhere; hospital and capilla only inside expanded walls (wallsAllow in plague.mjs).
  caminos: Object.freeze({ recipe: "caminos", fee: 150, buildDays: 5, upkeep: 1, maxLevel: 3 }),
  pozo: Object.freeze({ recipe: "pozo", fee: 150, buildDays: 5, upkeep: 1, maxLevel: 3 }),
  capilla: Object.freeze({ recipe: "capilla", fee: 250, buildDays: 13, upkeep: 2, maxLevel: 3 }),
  // Second civic batch (docs/design/civic-buildings-2.md): the carniceria steadies the meat and fish
  // supply, the molino turns grain into bread, the corral de comedias lifts spirits in the big ports
  // (it needs a large audience: minPop gate, engine-enforced like the walls rule).
  carniceria: Object.freeze({ recipe: "carniceria", fee: 250, buildDays: 14, upkeep: 2, maxLevel: 3 }),
  molino: Object.freeze({ recipe: "molino", fee: 250, buildDays: 14, upkeep: 2, maxLevel: 3 }),
  corral: Object.freeze({ recipe: "corral", fee: 400, buildDays: 22, upkeep: 4, maxLevel: 3, minPop: 15000 }),
});

/** Display names for each building type, for game-layer text (auction and purchase messages) so no
 *  message shows a raw type key. Spanish entries carry their article ("la granja") because every
 *  current sentence wants it ("se lleva la granja", "compras la granja"); English entries are bare
 *  and each sentence adds "the"/"a" as it needs. The web panel keeps its own bare table (T.bldTypes). */
export const BUILDING_NAMES = Object.freeze({
  house: Object.freeze({ es: "la casa", en: "house" }),
  workshop: Object.freeze({ es: "el taller", en: "workshop" }),
  warehouse: Object.freeze({ es: "el almacén", en: "warehouse" }),
  farm: Object.freeze({ es: "la granja", en: "farm" }),
  pasture: Object.freeze({ es: "la dehesa", en: "pasture" }),
  sawmill: Object.freeze({ es: "el aserradero", en: "sawmill" }),
  mine: Object.freeze({ es: "la mina", en: "mine" }),
  house_poor: Object.freeze({ es: "la casa pobre", en: "poor house" }),
  house_comfortable: Object.freeze({ es: "la casa acomodada", en: "well-off house" }),
  house_rich: Object.freeze({ es: "la casa rica", en: "rich house" }),
  oil_mill: Object.freeze({ es: "la almazara", en: "oil mill" }),
  vineyard: Object.freeze({ es: "el viñedo", en: "vineyard" }),
  saltworks: Object.freeze({ es: "la salina", en: "saltworks" }),
  brewery: Object.freeze({ es: "la cervecería", en: "brewery" }),
  soapworks: Object.freeze({ es: "la jabonería", en: "soapworks" }),
  pottery: Object.freeze({ es: "la alfarería", en: "pottery works" }),
  brickworks: Object.freeze({ es: "la ladrillería", en: "brickworks" }),
  esparto_field: Object.freeze({ es: "el espartizal", en: "esparto field" }),
  ranch: Object.freeze({ es: "la ganadería", en: "ranch" }),
  armory: Object.freeze({ es: "la armería", en: "armory" }),
  dock: Object.freeze({ es: "el muelle", en: "dock" }),
  fishery: Object.freeze({ es: "la pesca", en: "fishery" }),
  ironworks: Object.freeze({ es: "la fragua", en: "ironworks" }),
  posito: Object.freeze({ es: "el pósito", en: "granary" }),
  hospital: Object.freeze({ es: "el hospital", en: "hospital" }),
  alhondiga: Object.freeze({ es: "la alhóndiga", en: "corn exchange" }),
  caminos: Object.freeze({ es: "los caminos", en: "streets" }),
  pozo: Object.freeze({ es: "el pozo", en: "well" }),
  capilla: Object.freeze({ es: "la capilla", en: "chapel" }),
  carniceria: Object.freeze({ es: "la carnicería", en: "butcher's" }),
  molino: Object.freeze({ es: "el molino", en: "mill" }),
  corral: Object.freeze({ es: "el corral de comedias", en: "playhouse" }),
});

/** The display name of a building type in one language, raw key as fallback (never throws). */
export function buildingName(type, lang) {
  const n = BUILDING_NAMES[type];
  return (n && (lang === "en" ? n.en : n.es)) || type;
}

/** Types owned by the city-life and plague modules: offered to build only while g.citylife exists. */
export const CIVIC_BUILDINGS = Object.freeze(["posito", "hospital", "alhondiga", "caminos", "pozo", "capilla", "carniceria", "molino", "corral"]);

/* Public-building rules after the P3 record (manual ch. 11.3, docs/design/p3-civic-construction.md):
 * city buildings are funded by a citizen the port already knows - not just anyone - and the
 * city-scale works ask for real standing. One facility per city-serving type (the record allows
 * a single school and mint per town); hospital and capilla may repeat once, like the record's
 * balanced chapels and hospitals; pozo and caminos stay unlimited, like wells and roads.
 * Gates apply to NEW works; upgrading what you already built stays a matter of cash and walls. */
export const CIVIC_MIN_RESPECT = 20; // "known" (rank.mjs RESPECT) before a port lets you fund public works
export const CIVIC_BIG_RESPECT = 100; // "trusted" for the city-scale works
const CIVIC_BIG = new Set(["hospital", "alhondiga", "corral"]);
const CIVIC_CITY_CAP = { posito: 1, alhondiga: 1, carniceria: 1, molino: 1, corral: 1, hospital: 2, capilla: 2 };
/** New civic works only: standing gate and per-city cap, from the P3 record. No mutation. */
function civicAllow(g, cityId, type) {
  if (!CIVIC_BUILDINGS.includes(type)) return null;
  const need = CIVIC_BIG.has(type) ? CIVIC_BIG_RESPECT : CIVIC_MIN_RESPECT;
  if (repOf(g, cityId) < need) return { ok: false, reason: "respect required", need };
  const cap = CIVIC_CITY_CAP[type];
  if (cap) {
    const have = Object.values(g.buildings?.[cityId] ?? {}).filter((x) => x.type === type && x.state !== "plot").length;
    if (have >= cap) return { ok: false, reason: cap === 1 ? "one per city" : "city limit" };
  }
  return null;
}

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

export function buyPlot(g, cityId, plot, opts = {}) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!g.world.cities.some((c) => c.id === cityId)) return { ok: false, reason: "unknown city" };
  const price = plotPrice(g.world, cityId, plot);
  if (price === null || !PLOT_ID.test(plot.id)) return { ok: false, reason: "bad plot" };
  if (!hasOffice(g, cityId)) return { ok: false, reason: "office required" };
  if (buildingAt(g, cityId, plot.id)) return { ok: false, reason: "already owned" };
  // A municipal permit won at the almoneda pays this plot - but only when the caller asks for it
  // explicitly: the paper is never spent silently on a plot the player did not mean to use it on.
  const wantsPermit = opts?.permit === true;
  const permit = wantsPermit && (g.almonedaPermits?.[cityId] ?? 0) > 0;
  if (wantsPermit && !permit) return { ok: false, reason: "no permit" };
  if (!permit && g.cash < price) return { ok: false, reason: "no cash", cost: price };
  if (permit) g.almonedaPermits[cityId] -= 1; else g.cash -= price;
  const maps = (g.buildings ??= Object.create(null)); (maps[cityId] ??= Object.create(null))[plot.id] = { type: null, level: 0, state: "plot", plotType: plot.type, paidPlot: price };
  return permit ? { ok: true, price, permit: true } : { ok: true, price }; // cash path keeps its old shape
}

/** Quote for building or upgrading on an owned plot: materials at the local market plus the labor fee. No mutation.
 *  Upgrade policy: a new level pays the FULL level cost (materials x level, fee x level),
 *  not the difference from the previous one - a level-3 workshop is a bigger building, not a patch. */
export function quoteConstruction(g, cityId, plotId, type) {
  if (!hasOffice(g, cityId)) return { ok: false, reason: "office required" };
  const spec = BUILDING_TYPES[type];
  if (!spec) return { ok: false, reason: "unknown type" };
  if (CIVIC_BUILDINGS.includes(type) && !g.citylife) return { ok: false, reason: "unknown type" }; // civic types exist only with the city-life flag (off games cannot build them even by direct call)
  if (!wallsAllow(g, cityId, type)) return { ok: false, reason: "walls required" }; // hospital and capilla stand inside expanded walls (plague module)
  if (spec.minPop && (g.world.nodes[cityId]?.pop ?? 8000) < spec.minPop) return { ok: false, reason: "town too small" }; // a corral de comedias needs a big-city audience
  if (PRODUCERS[type] && !cityAllowsProducer(g.world, cityId, type)) return { ok: false, reason: "good not producible in this city" };
  const b = buildingAt(g, cityId, plotId);
  if (!b) return { ok: false, reason: "plot not owned" };
  if (b.state === "construction") return { ok: false, reason: "already building" };
  const civicNo = b.level === 0 ? civicAllow(g, cityId, type) : null; // gates gate new works, not upgrades
  if (civicNo) return civicNo;
  const level = b.level + 1;
  if (b.type && b.type !== type) return { ok: false, reason: "plot has another building" };
  if (level > spec.maxLevel) return { ok: false, reason: "max level" };
  const inputs = {}, fromStore = {}, missing = {};
  const storeWh = g.warehouses?.[cityId], store = storeWh?.goods ?? {};
  for (const [good, qty] of Object.entries(RECIPES[spec.recipe])) {
    inputs[good] = qty * level;
    fromStore[good] = whLocked(storeWh, good) ? 0 : Math.min(inputs[good], Math.max(0, store[good] ?? 0)); // a locked good never leaves the store: the works buy it at the market instead
    missing[good] = inputs[good] - fromStore[good];
  }
  const q = quoteUnitsImport(g.world, g.market, cityId, missing); // warehouse first, then the market; what the port lacks is imported at IMPORT_MUL
  if (!q.ok) return q;
  const fee = spec.fee * level, ticks = spec.buildDays * level * TICKS_PER_DAY;
  return { ok: true, type, level, cost: q.cost + fee, materials: q.cost, fee, ticks, inputs, fromStore, missing, imported: q.imported };
}

/** Pay and start construction; the building turns active exactly at readyTick (tickBuildings). */
export function startConstruction(g, cityId, plotId, type) {
  if (g.over) return { ok: false, reason: "game over" };
  const q = quoteConstruction(g, cityId, plotId, type);
  if (!q.ok) return q;
  if (g.cash < q.cost) return { ok: false, reason: "no cash", cost: q.cost };
  const spec = BUILDING_TYPES[type];
  const c = consumeUnitsImport(g.world, g.market, cityId, q.missing, g.cash - q.fee); // local stock down; imported units never touch the market
  if (!c.ok) return c; // re-quoted inside; cannot fail after the checks above, but never mutate half-way
  const w = g.warehouses?.[cityId];
  for (const [good, qty] of Object.entries(q.fromStore)) {
    if (!qty) continue;
    const had = w.goods[good], transferred = Math.round((w.basis?.[good] ?? 0) * qty / had);
    if (w.basis) w.basis[good] = (w.basis[good] ?? 0) - transferred;
    w.goods[good] -= qty;
    if (!w.goods[good]) { delete w.goods[good]; if (w.basis) delete w.basis[good]; }
  }
  g.cash -= q.cost;

  const b = buildingAt(g, cityId, plotId);
  Object.assign(b, { type, state: "construction", nextLevel: q.level, readyTick: g.tick + q.ticks, ...(CIVIC_BUILDINGS.includes(type) ? { invest: q.cost } : {}) });
  post(g, "info", { txt: { es: `Obra iniciada en ${cityId} (${type} nivel ${q.level})`, en: `Construction started in ${cityId} (${type} level ${q.level})` } });
  return { ok: true, ...q, readyTick: b.readyTick };
}

/** Exact-tick completion: buildings whose readyTick has passed turn active. Runs inside advanceTick. */
export function tickBuildings(g) {
  for (const [cityId, plots] of Object.entries(g.buildings ?? {})) for (const [plotId, b] of Object.entries(plots)) {
    if (b.state === "construction" && g.tick >= b.readyTick) {
      b.state = "active"; b.level = b.nextLevel; delete b.nextLevel; delete b.readyTick;
      if (b.invest != null) { addRespect(g, cityId, b.invest); delete b.invest; } // the benefactor is remembered: funding public works earns the port's respect (P3 11.3)
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
      if (b.halted === "incendio") continue; // a burnt building stays closed until the fire is declared out (calamities lifts it); it accrues nothing meanwhile
      if (g.cash - committed < cost * 2) continue;
      b.halted = false; post(g, "restart", { city: cityId, plot: plotId });
    }
    if (g.cash - committed < cost) { b.halted = true; post(g, "halt", { city: cityId, plot: plotId }); continue; } // no cash at charge time: the workers walk
    const a = (g.accrued ??= { ships: {} });
    (a.buildings ??= {})[key(cityId, plotId)] = (a.buildings[key(cityId, plotId)] ?? 0) + cost;
    committed += cost;
  }
  return committed; // shared with accrueWalls: one daily budget across both consumers
}
/** Restart a halted building once there is cash to pay its upkeep and people again. */
export function restartBuilding(g, cityId, plotId) {
  const b = buildingAt(g, cityId, plotId);
  if (!b || !b.halted) return { ok: false, reason: "not halted" };
  if (b.halted === "incendio") return { ok: false, reason: "fire" }; // only the fire being put out reopens a burnt building
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
  for (let i = 0; i < qty; i++) { revenue += floor2(price(world, sim, good) * (1 - FEE)); sim.stock++; }
  return revenue;
}

/** Employment (city-builder follow-up: jobs). The workers ARE the port's inhabitants: the town's own
 *  economy (fishing, farming, shops, the harbour) already employs most of the base population, and the
 *  player's active building levels hire from whoever is left - which includes every inhabitant of the
 *  player's houses, all of them newcomers looking for work. When jobs outnumber free inhabitants, EVERY
 *  producer in the port runs at the same staffing ratio - a labour shortage slows the whole port, not
 *  one unlucky building. The ratio is computed from live state on each tick, never stored. */
export const JOBS_PER_LEVEL = Object.freeze({
  house: 0, house_poor: 0, house_comfortable: 0, house_rich: 0, // houses need no workers
  warehouse: 3, workshop: 8, farm: 6, pasture: 6, sawmill: 8, mine: 10,
  oil_mill: 6, vineyard: 6, saltworks: 5, brewery: 6, brickworks: 6, pottery: 6, soapworks: 6, esparto_field: 5, armory: 4, ranch: 6, dock: 0, fishery: 4, ironworks: 6,
  posito: 2, hospital: 6, alhondiga: 3, // city-life civic types (own tuning; only buildable with the flag on)
  caminos: 1, pozo: 1, capilla: 3,
  carniceria: 3, molino: 4, corral: 5, // second civic batch (own tuning; only buildable with the flag on)
});
/** Share of the base population already working the town's own economy; the rest can be hired. */
export const TOWN_JOBS_SHARE = 0.9;
/** Wages: one coin per worker per day, accrued daily together with the upkeep into the weekly
 *  book (employment piece c). A building that cannot be paid halts until the player restarts it. */
export const WAGE_PER_WORKER = 1;
/** Total workers the port's active buildings want. */
export const jobsNeeded = (g, cityId) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && !b.halted && b.type ? (JOBS_PER_LEVEL[b.type] ?? 0) * b.level : 0), 0);
/** Hands that left the town's own economy when their establishment was sold to the player
 *  (docs/design/town-industry-and-auctions.md piece 2): they now work the buyer's building, so the
 *  town's 90% share shrinks by exactly their count. 0 unless the town-industry flag is on. */
export const townJobsFreed = (g, cityId) => (g?.townIndustry === true ? g.townSales?.[cityId]?.jobs ?? 0 : 0);
/** Inhabitants available for hire: effective population (city pop + house bonus) minus the town's own jobs. */
// The extra terms are the city-life population drift and the hands that came with bought establishments
// (state contracts of citylife.mjs and townindustry.mjs): both 0 in a flag-off game.
export const freeLabor = (g, cityId) => { const pop = g.world?.nodes?.[cityId]?.pop ?? 8000; return Math.max(0, pop + housePopBonus(g, cityId) + (g.citylife?.cities?.[cityId]?.extra ?? 0) + townJobsFreed(g, cityId) - Math.round(pop * TOWN_JOBS_SHARE)); };
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
  brewery: Object.freeze({ recipe: "brew", output: "beer", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
  soapworks: Object.freeze({ recipe: "boil", output: "soap", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
  pottery: Object.freeze({ recipe: "kiln", output: "pottery", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
  brickworks: Object.freeze({ recipe: "firing", output: "bricks", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
  // Primary producers: the land yields the good, no inputs. yield = units per batch; seasonal goods
  // follow the market's own seasonMul (harvest/shearing peaks), the rest produce evenly all year.
  farm: Object.freeze({ output: "grain", primary: true, yield: 4, pattern: WORKSHOP_BATCH_PATTERN }),
  pasture: Object.freeze({ output: "wool", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  sawmill: Object.freeze({ output: "timber", primary: true, yield: 3, pattern: WORKSHOP_BATCH_PATTERN }),
  mine: Object.freeze({ output: "iron", primary: true, yield: 1, pattern: WORKSHOP_BATCH_PATTERN }),
  oil_mill: Object.freeze({ output: "olive_oil", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  vineyard: Object.freeze({ output: "wine", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  saltworks: Object.freeze({ output: "salt", primary: true, yield: 2, pattern: WORKSHOP_BATCH_PATTERN }),
  esparto_field: Object.freeze({ output: "esparto", primary: true, yield: 3, pattern: WORKSHOP_BATCH_PATTERN }),
  // byproducts: extra goods the same building yields per batch (no inputs, same stock cap, same staffing).
  ranch: Object.freeze({ output: "meat", primary: true, yield: 2, byproducts: Object.freeze({ leather: 1 }), pattern: WORKSHOP_BATCH_PATTERN }),
  fishery: Object.freeze({ output: "fish", primary: true, yield: 3, pattern: WORKSHOP_BATCH_PATTERN }),
  ironworks: Object.freeze({ recipe: "forge", output: "ironware", primary: false, pattern: WORKSHOP_BATCH_PATTERN }),
});
/** Where a producer type may be built. Primary producers (farms, mines: no inputs, the land yields
 *  the good) only go where the city MAKES that good - local resources per city, the rest is imported,
 *  like the classic Hansa model. Processors (primary: false) run on market inputs and build anywhere.
 *  Makes-lists come from world.json; no city list is hardcoded here. */
export const producerCities = (world, type) => {
  const def = PRODUCERS[type];
  if (!def || !world.goods?.[def.output]) return []; // an optional good that is not in this game: nowhere to build
  if (!def.primary) return world.cities.map((c) => c.id);
  return world.cities.filter((c) => c.makes.includes(def.output)).map((c) => c.id);
};
/** Whether a producer type may be built in a city (see producerCities). */
export const cityAllowsProducer = (world, cityId, type) => producerCities(world, type).includes(cityId);
/** Average batches a level produces per day when the margin holds, from the type's pattern. */
export const producerRate = (type, level) => { const p = PRODUCERS[type]?.pattern?.[level]; return p ? p.reduce((a, b) => a + b, 0) / p.length : 0; };
/** Average batches a workshop level produces per day when the margin holds. */
export const workshopRate = (level) => producerRate("workshop", level);
/** Days of negative margin before the game warns (feed + weekly report + red card mark). */
export const MARGIN_WARN_DAYS = 3;
/** One production day of a port's active producers, run inside that port's (staggered) market tick so
 *  it sees fresh prices. Each producer runs the largest batch count (up to its pattern cap) that still
 *  turns a profit after both market fees: inputs are bought and output sold at the local market, so
 *  dear inputs slow production and missing stock, cash or margin stop it. The market decides; no magic numbers. */
/** Daily batch contract: the batch identity is (city, day) - batches come from the pattern
 * at the day's parity, applied at most once per day through the daily tick, and a quiet day
 * (zero batches) erases nothing: produced is a lifetime payload that never decreases, and
 * each building owns its own batch. Margin streak state follows the same rule: an
 * unquotable day (no input stock) is not a margin signal and keeps the state, a negative
 * quotable day counts and warns once, and one profitable day clears the streak and re-arms
 * the warning. */
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
  for (const [plotId, b] of Object.entries(plots)) {
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
      const beforeSupply = e.stock;
      e.stock = Math.max(e.stock, Math.min(e.target * 4, e.stock + amount)); // same stock cap as city production, but never clip stock already above it
      if (e.stock > beforeSupply) recordLocalSupply(g.market[cityId], def.output, e.stock - beforeSupply, g.world.goods[def.output]?.base); // telemetry: the land yields inventory nobody was paid for
      b.produced = (b.produced ?? 0) + amount; // lifetime units, for the Buildings tab
      for (const [good, perBatch] of Object.entries(def.byproducts ?? {})) { // by-products: same batches and staffing, own season, own stock cap
        const be = g.market[cityId]?.[good];
        if (!be) continue;
        const beforeByproduct = be.stock;
        be.stock = Math.max(be.stock, Math.min(be.target * 4, be.stock + Math.max(1, Math.round(perBatch * batches * seasonMul(good, day)))));
        if (be.stock > beforeByproduct) recordLocalSupply(g.market[cityId], good, be.stock - beforeByproduct, g.world.goods[good]?.base);
      }
      continue;
    }
    const mq = quoteRecipe(g.world, g.market, cityId, def.recipe, 1);
    const marginNow = mq.ok ? sellQuote(g.world, g.market, cityId, def.output, mq.outputs[def.output]) - mq.cost : null; // same quote the Buildings tab shows
    if (marginNow !== null && marginNow <= 0) { // unquotable (no input stock) is not a margin signal
      b.negDays = (b.negDays ?? 0) + 1;
      if (b.negDays >= MARGIN_WARN_DAYS && !b.negWarned) { b.negWarned = 1; post(g, "bldMargin", { city: cityId, plot: plotId, type: b.type, margin: Math.round(marginNow) }); }
    } else if (marginNow !== null) { b.negDays = 0; b.negWarned = 0; } // one profitable day clears the streak and re-arms the warning; an unquotable day (no stock) keeps the state
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
      for (const [good, qty] of Object.entries(c.inputs)) recordMarketPurchase(g.market[cityId], good, qty, c.lineCosts[good], g.market[cityId][good].stock + qty); // telemetry: materials paid the purse
      recordWholesaleSale(g.market[cityId], def.output, c.outputs[def.output] ?? 0, revenue); // telemetry: the purse bought the output
      b.produced = (b.produced ?? 0) + batches; // lifetime batches, for the Buildings tab (piece 4)
      break;
    }
  }
}

/** Building effects (design doc piece 5). Houses raise the port's effective population a little
 *  (more of the existing class demand, nothing new); warehouse buildings extend its storage cap. */
export const HOUSE_POP_PER_LEVEL = 50, WAREHOUSE_CAP_PER_LEVEL = 300;
export const activeLevels = (g, cityId, type) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && b.type === type ? b.level : 0), 0);
/** Every house type, legacy generic first. Residents per active level: the poor cram more under one
 *  roof, a merchant house lodges fewer but wealthier mouths. */
export const HOUSE_TYPES_ALL = Object.freeze(["house", "house_poor", "house_comfortable", "house_rich"]);
export const HOUSE_POP_BY_TYPE = Object.freeze({ house: HOUSE_POP_PER_LEVEL, house_poor: 60, house_comfortable: HOUSE_POP_PER_LEVEL, house_rich: 40 });
/** Class of residents a house type shelters (the legacy generic house stays mixed, split by the town's shares). */
export const HOUSE_CLASS = Object.freeze({ house_poor: "poor", house_comfortable: "middle", house_rich: "rich" });
/** Two distinct housing sets, named after the P3 housing study (Estudios P3-05, 30/10):
 *  RESIDENTS are the people an active house shelters - a halted house keeps its residents
 *  (unpaid upkeep never evicts). ROOM is the shelter only an active AND KEPT house offers
 *  newcomers. Mixing the two sets is what let a lost house silently wipe neighbours (#737). */
export const HOUSE_ROOM_PER_LEVEL = 100; // newcomers each kept house level can shelter (on top of the hands it already staffs)
export const houseResidents = (g, cityId) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" ? (HOUSE_POP_BY_TYPE[b.type] ?? 0) * b.level : 0), 0);
export const housingRoom = (g, cityId) => Object.values(g.buildings?.[cityId] ?? {}).reduce((a, b) => a + (b.state === "active" && !b.halted && HOUSE_TYPES_ALL.includes(b.type) ? b.level : 0), 0) * HOUSE_ROOM_PER_LEVEL;
export const housePopBonus = houseResidents; // every existing caller reads the residents set
/** Residents of each class sheltered by the TYPED houses (legacy houses excluded: they stay in the
 *  shared pool). The market adds their demand class by class instead of re-splitting by town shares. */
export function houseClassPop(g, cityId) {
  const out = { poor: 0, middle: 0, rich: 0 };
  for (const b of Object.values(g.buildings?.[cityId] ?? {})) {
    const cls = HOUSE_CLASS[b.type];
    if (cls && b.state === "active") out[cls] += HOUSE_POP_BY_TYPE[b.type] * b.level;
  }
  return out;
}
export const warehouseCapBonus = (g, cityId) => WAREHOUSE_CAP_PER_LEVEL * activeLevels(g, cityId, "warehouse");
/** Dock: share of the port toll your ships still pay there, by summed ACTIVE dock levels (capped at 3:
 *  one good dock is enough; extra piers add nothing). Like the warehouse cap it is a passive effect:
 *  a halted dock keeps it (no workers needed to tie a rope), consistent with the storage bonus. */
export const DOCK_TOLL_DISCOUNT = Object.freeze([0, 0.5, 0.75, 1]); // by level: 0, 1, 2, 3
export const dockTollFactor = (g, cityId) => 1 - DOCK_TOLL_DISCOUNT[Math.min(3, activeLevels(g, cityId, "dock"))];
