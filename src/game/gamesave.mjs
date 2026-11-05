import {fillShipNames} from "../sim/shipnames.mjs";
import { cleanProfile } from "./profile.mjs";
import { cleanCompany, MAX_COMPANY } from "./clean-text.mjs";
// Versioned save format. Pure functions (no DOM) so they can be tested.
// A save is { version, savedAt, company, state } where state is the game without the (static) world.
import { campaignShapeOk, newCampaign } from "./campaigns.mjs";
import { fillMissingMarketRows } from "../sim/market.mjs";
import { SHIP_TYPES } from "../sim/trade.mjs";
import { CLASSES } from "../sim/classes.mjs";
import { withLegumes, withPottery } from "../sim/optional_goods.mjs";
import { isFreeId } from "./freenav.mjs";

export const SAVE_VERSION = 3; // v3: voyages run on ticks (ticksLeft/totalTicks); older test saves are not kept
export { cleanCompany, MAX_COMPANY };
export function serialize(g, company, now = Date.now()) {
  const { world, ...state } = g;
  return JSON.parse(JSON.stringify({ version: SAVE_VERSION, savedAt: now, company: cleanCompany(company), state }));
}
// Upgrade older saves one version at a time. Add a step here whenever SAVE_VERSION grows.
const MIGRATIONS = {};
export function migrate(save) {
  if (!save || typeof save !== "object" || !Number.isInteger(save.version)) throw new Error("not a save");
  if (save.version > SAVE_VERSION) throw new Error("save is from a newer version");
  let s = save;
  while (s.version < SAVE_VERSION) { const step = MIGRATIONS[s.version]; if (!step) throw new Error("no migration for v" + s.version); s = step(s); }
  return s;
}
// Ids retired from the catalogue and what they became. Saves written before the retirement keep loading:
// market rows are renamed (or dropped when a row for the new id exists), every other count (cargo, warehouses,
// cost basis) is added to the new id, and building types and stray id strings are renamed.
export const RETIRED_GOODS = Object.freeze({ dried_fish: "fish", kid_meat: "meat" }); // kid_meat retired: the good leaves the catalogue; stock, cost basis and route/order ids become common meat, no cash changes hands
export const RETIRED_BUILDINGS = Object.freeze({ smokehouse: "fishery" });
export function migrateRetired(g) {
  const addInto = (a, b) => (typeof a === "number" && typeof b === "number" ? a + b : a && b && typeof a === "object" && typeof b === "object" ? Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => [k, addInto(a[k], b[k])])) : a ?? b);
  for (const [city, row] of Object.entries(g.market ?? {})) for (const [from, to] of Object.entries(RETIRED_GOODS)) if (row && from in row) { if (!row[to]) row[to] = row[from]; delete row[from]; }
  const walk = (o, inMarket) => {
    if (Array.isArray(o)) { o.forEach((v, i) => { if (typeof v === "string") o[i] = RETIRED_GOODS[v] ?? RETIRED_BUILDINGS[v] ?? v; else walk(v); }); return; }
    if (!o || typeof o !== "object") return;
    for (const [from, to] of Object.entries(RETIRED_GOODS)) if (from in o) { o[to] = addInto(o[to], o[from]); delete o[from]; }
    for (const k of Object.keys(o)) {
      if (k === "market" || k === "world") continue;
      const v = o[k];
      if (typeof v === "string") o[k] = RETIRED_GOODS[v] ?? RETIRED_BUILDINGS[v] ?? v; else walk(v);
    }
  };
  for (const k of Object.keys(g)) if (k !== "market" && k !== "world") { const v = g[k]; if (typeof v === "string") g[k] = RETIRED_GOODS[v] ?? RETIRED_BUILDINGS[v] ?? v; else walk(v); }
  return g;
}

// Deep structures: a hand-edited or hostile import must fail here with a clear error, or be repaired,
// instead of throwing a TypeError inside a tick days later. Telemetry ledgers and the commerce
// account are rebuilt lazily, so a corrupt node is dropped; essentials (market rows, ships) reject.
function sanitizeMarketStructures(st) {
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const objOfObjs = (v) => isObj(v) && Object.values(v).every((x) => isObj(x));
const LEDGER_KEYS = ["need", "desired", "consumed", "spending", "balance"]; // recordNeeds accumulates each of these with +=; a missing one turns NaN
const ledgerLeavesOk = (v) => objOfObjs(v) && Object.values(v).every((leaf) => LEDGER_KEYS.every((k) => Number.isFinite(leaf[k])));
for (const row of Object.values(st.market)) if (!isObj(row)) throw new Error("save is damaged"); // before Object.values(row) below throws a raw TypeError on null
for (const city of Object.values(st.market)) for (const e of Object.values(city)) if (!Number.isFinite(e?.pop)) throw new Error("save is from a test build and is not kept");
for (const row of Object.values(st.market)) {
  for (const e of Object.values(row)) {
    if (!isObj(e) || !Number.isFinite(e.stock) || !Number.isFinite(e.target) || !Number.isFinite(e.rate)) throw new Error("save is damaged");
    const nl = e.needsLedger;
    // telemetry only: the next tick reopens it. recordNeeds needs a complete current-policy ledger:
    // a stale policyId throws mid-tick, missing or half-built totals/byClass crash its accumulators,
    // and non-numeric leaves or days poison every later reading (total[k] += d[k], prior.days + 1).
    const nlOk = isObj(nl) && nl.policyId === "legacy-telemetry-v1" && Number.isFinite(nl.days) && ledgerLeavesOk(nl.totals) && objOfObjs(nl.byClass) && Object.values(nl.byClass).every(ledgerLeavesOk);
    if (nl != null && !nlOk) delete e.needsLedger;
    const co = e.commerce;
    // openCommerce reopens a dropped account on the first tick. inventoryBasis is written by every
    // trade, so it must be an object; households rebuilds from null (??=) but an incomplete object
    // crashes settleHouseholdDay, so a present households needs a purse per class.
    const coOk = isObj(co) && isObj(co.inventoryBasis) && (co.households == null || (isObj(co.households) && CLASSES.every((c) => isObj(co.households[c]))));
    if (co != null && !coOk) delete e.commerce;
  }
}
}

const isPlainObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const ownShipType = (t) => typeof t === "string" && Object.hasOwn(SHIP_TYPES, t); // hasOwn: "constructor"/"__proto__"/"toString" are inherited, not ship classes
const cargoOk = (c) => isPlainObj(c) && Object.values(c).every((v) => Number.isFinite(v)); // netWorth and trades walk cargo with Object.entries/keys; non-numeric amounts poison prices with NaN
// Resolve every saved path reference before position/locate consume it. Free navigation stores
// synthetic pt: ids in pts with coordinates and a real lane attachment; ordinary nodes need no pts.
const knownNode = (world, id) => typeof id === "string" && Object.hasOwn(world.nodes ?? {}, id);
function freePointOk(world, point) {
  if (!isPlainObj(point) || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return false;
  if (Math.abs(point.lat) > 90 || Math.abs(point.lon) > 180) return false;
  return knownNode(world, point.a) && knownNode(world, point.b)
    && (world.lanes ?? []).some(([from, to]) => (from === point.a && to === point.b) || (from === point.b && to === point.a));
}
function nodeRefOk(world, pts, id) {
  if (knownNode(world, id)) return !Object.hasOwn(pts ?? {}, id); // pts must not shadow a real node's coordinates
  return isFreeId(id) && isPlainObj(pts) && Object.hasOwn(pts, id) && freePointOk(world, pts[id]);
}
const voyageOk = (world, voyage) => {
  if (voyage == null) return true;
  if (!isPlainObj(voyage) || !Array.isArray(voyage.path) || voyage.path.length < 2) return false;
  if (![voyage.totalTicks, voyage.ticksLeft, voyage.km].every(Number.isFinite)) return false;
  if (voyage.pts != null && !isPlainObj(voyage.pts)) return false;
  if (voyage.from !== voyage.path[0] || voyage.to !== voyage.path.at(-1)) return false;
  // sailTick docks non-free voyages at to, so only a city is a valid docking destination.
  if (!voyage.free && !world.cities?.some((city) => city.id === voyage.to)) return false;
  return Array.from(voyage.path).every((id) => nodeRefOk(world, voyage.pts, id));
};

// Negative cargo is impossible stock: it jams sells (the amount check never passes) and distorts
// netWorth and price impact. Clamp it away instead of rejecting the save over a rounding relic.
const clampCargo = (c) => { if (isPlainObj(c)) for (const k of Object.keys(c)) if (Number.isFinite(c[k]) && c[k] < 0) c[k] = 0; }; // only finite negatives: -Infinity stays for cargoOk to reject like NaN
// NaN hull stays NaN through sea wear and shows as "NaN%" in the UI; out-of-range hull breaks repairs and auctions.
const fixHull = (sh) => { sh.hull = Number.isFinite(sh.hull) ? Math.min(100, Math.max(0, sh.hull)) : 100; };

// Fleet ops (rename, convoys, encounters, sales) find ships by id: a missing or duplicated id makes them hit the wrong ship.
// Documented ceiling: reaching 1e9 ship ids takes ~1e9 purchases, unreachable in real play, so an id or
// counter past it marks a corrupt save. Then the whole fleet renumbers dense (1..n, nextId = n + 1) and
// every stored ship reference remaps. Below the ceiling only missing/duplicated ids reissue (smallest
// free) and nextId moves ahead of the fleet; overflowing safe integers would then take ~1e9 more buys.
const SHIP_ID_LIMIT = 1e9;
const fleetOverLimit = (st) => st.ships.some((sh) => Number.isSafeInteger(sh?.id) && sh.id > SHIP_ID_LIMIT) || (Number.isSafeInteger(st.nextId) && st.nextId > SHIP_ID_LIMIT);

function compactFleetIds(st) {
  const remap = new Map();
  // Duplicated old ids map to the FIRST ship that had one: every consumer resolves with find-first,
  // so references must keep hitting the same hull the game would have picked before the renumber.
  st.ships.forEach((sh, i) => { if (isPlainObj(sh)) { if (!remap.has(sh.id)) remap.set(sh.id, i + 1); sh.id = i + 1; } });
  st.nextId = st.ships.length + 1;
  remapShipReferences(st, remap);
}

// Every stored ship-id reference must follow the renumber (audited against each g.ships.find(s => s.id === ...) consumer).
function remapShipReferences(st, remap) {
  const remapId = (id) => remap.get(id) ?? id;
  const remapList = (list) => (Array.isArray(list) ? list.map(remapId) : list);
  const remapField = (o, field) => { if (isPlainObj(o) && remap.has(o[field])) o[field] = remap.get(o[field]); };
  const remapKeys = (o) => (isPlainObj(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [String(remap.get(Number(k)) ?? k), v])) : o);
  const eachItem = (list, fn) => { if (Array.isArray(list)) for (const item of list) fn(item); };
  remapField(st.pending, "ship"); // sea encounter awaiting a choice
  remapField(st.encounterReport, "ship"); // resolved encounter awaiting the report screen
  remapField(st.encounterReport?.prize, "shipId"); // history names the fleet ship the prize became
  if (isPlainObj(st.convoys)) for (const cv of Object.values(st.convoys)) if (isPlainObj(cv)) cv.ships = remapList(cv.ships);
  eachItem(st.repairs, (ord) => { if (isPlainObj(ord)) ord.ships = remapList(ord.ships); }); // a dangling id closes a paid yard order with the hull still damaged
  eachItem(st.voyages, (v) => remapField(v, "ship")); // the voyage diary keeps its ship
  eachItem(st.log, (entry) => remapField(entry, "ship")); // cosmetic: recordedShipName falls back to the snapshot anyway
  eachItem(st.inbox, (msg) => { remapField(msg, "ship"); if (isPlainObj(msg)) msg.ships = remapList(msg.ships); }); // display only: shipName is baked at post time
  if (isPlainObj(st.accrued)) for (const key of ["ships", "captains", "cannons", "wages"]) st.accrued[key] = remapKeys(st.accrued[key]); // the weekly settlement attributes upkeep by ship id (buildings key on plots)
}

function reissueFleetIds(st) {
  let maxShipId = 0;
  const seenIds = new Set();
  for (const sh of st.ships) {
    if (Number.isSafeInteger(sh.id) && sh.id > 0 && !seenIds.has(sh.id)) { seenIds.add(sh.id); if (sh.id > maxShipId) maxShipId = sh.id; continue; }
    sh.id = null; // reissued below
  }
  let candidate = 0;
  for (const sh of st.ships) {
    if (sh.id !== null) continue;
    do { candidate++; } while (seenIds.has(candidate)); // smallest free id keeps the fleet dense
    sh.id = candidate; seenIds.add(candidate);
    if (candidate > maxShipId) maxShipId = candidate;
  }
  // The counter must stay ahead of the fleet or new ships reuse live ids.
  if (!Number.isSafeInteger(st.nextId) || st.nextId <= maxShipId) st.nextId = maxShipId + 1;
}

function sanitizeFleetAndBots(st, world) {
const portOk = (at) => typeof at === "string" && Object.hasOwn(world.nodes ?? {}, at); // nodes covers cities and waypoints
for (const sh of st.ships) {
  clampCargo(sh?.cargo);
  if (!isPlainObj(sh) || !ownShipType(sh.type) || !cargoOk(sh.cargo)) throw new Error("save is damaged");
  fixHull(sh);
  // A ship moored at a port the world does not know can never trade or sail again (route() finds nothing).
  // The fallback home must itself be a known port; mirror cleanProfile, which snaps an unknown home to the first city.
  const home = portOk(st.profile.home) ? st.profile.home : world.cities?.[0]?.id;
  if (!portOk(sh.at)) sh.at = portOk(sh.voyage?.from) ? sh.voyage.from : home;
}
if (fleetOverLimit(st)) compactFleetIds(st); else reissueFleetIds(st);
// ambient bots: a corrupt entry is dropped, not kept to crash a tick or stall at sea (sailTick, aiStep and bot intel all dereference these)
for (const b of Array.isArray(st.ai) ? st.ai : []) { clampCargo(b?.ship?.cargo); if (isPlainObj(b?.ship)) fixHull(b.ship); }
const botOk = (b) => isPlainObj(b) && isPlainObj(b.ship) && ownShipType(b.ship.type) && cargoOk(b.ship.cargo)
  && voyageOk(world, b.ship.voyage)
  && portOk(b.ship.at) && (b.home == null || portOk(b.home))
  && (b.intel == null || isPlainObj(b.intel)) && (b.discovered == null || isPlainObj(b.discovered))
  && Number.isFinite(b.cash);
if (st.ai != null) st.ai = Array.isArray(st.ai) ? st.ai.filter(botOk) : [];
}

function sanitizeHistory(st) {
if (st.hist == null) return;
if (!isPlainObj(st.hist)) { st.hist = {}; return; } // price history re-records from the load day; wrong-typed nodes would crash recordPrices
for (const [city, goods] of Object.entries(st.hist)) {
  if (!isPlainObj(goods)) { delete st.hist[city]; continue; }
  for (const [good, prices] of Object.entries(goods)) if (!Array.isArray(prices)) delete goods[good];
}
}

function sanitizeDeepStructures(st, world) {
  sanitizeMarketStructures(st);
  sanitizeFleetAndBots(st, world);
  sanitizeHistory(st);
}

export function deserialize(save, world) {
  const s = migrate(save);
  const st = s.state;
  if (!st || !Array.isArray(st.ships) || typeof st.cash !== "number" || typeof st.day !== "number" || !st.market) throw new Error("save is damaged");
  // Pre-launch saves are not kept: reject them clearly instead of failing later with a TypeError.
  if (!st.profile || typeof st.profile.home !== "string") throw new Error("save is from a test build and is not kept");
  // Pre-engine campaign saves (flat {id,bought,sailed,...}) predate the mission data model: restart the arc cleanly instead of crashing campaignTick/campaignEvent later.
  if (st.campaign != null && !campaignShapeOk(st.campaign)) st.campaign = newCampaign();
  if (!Number.isFinite(st.tick)) throw new Error("save is from a test build and is not kept");
  for (const sh of st.ships) if (!voyageOk(world, sh?.voyage)) throw new Error("save is from a test build and is not kept");
  sanitizeDeepStructures(st, world);
  const g = { world, ...JSON.parse(JSON.stringify(st)) };
  const cityIds = Array.isArray(world.cities) && world.cities.length ? world.cities.map((city) => city.id) : [g.profile.home];
  g.profile = cleanProfile(g.profile, cityIds); // imported saves cannot carry markup into profile SVGs or unknown rules into play
  if (g.pottery === true) g.world = withPottery(g.world);
  if (g.legumes === true) g.world = withLegumes(g.world);
  delete g.kidMeat; // the retired optional-goods flag rides along in old saves; drop it
  fillShipNames(g.ships);
  migrateRetired(g);
  fillMissingMarketRows(g.world, g.market); // goods or ports added since the save was written get a fresh market row, so old saves keep loading
  return { g, company: cleanCompany(s.company) };
}
