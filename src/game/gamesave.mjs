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
for (const row of Object.values(st.market)) if (!isObj(row)) throw new Error("save is damaged"); // before Object.values(row) below throws a raw TypeError on null
for (const city of Object.values(st.market)) for (const e of Object.values(city)) if (!Number.isFinite(e?.pop)) throw new Error("save is from a test build and is not kept");
for (const row of Object.values(st.market)) {
  for (const e of Object.values(row)) {
    if (!isObj(e) || !Number.isFinite(e.stock) || !Number.isFinite(e.target) || !Number.isFinite(e.rate)) throw new Error("save is damaged");
    const nl = e.needsLedger;
    // telemetry only: the next tick reopens it. recordNeeds needs a complete current-policy ledger:
    // a stale policyId throws mid-tick, and missing or half-built totals/byClass crash its accumulators.
    const nlOk = isObj(nl) && nl.policyId === "legacy-telemetry-v1" && objOfObjs(nl.totals) && objOfObjs(nl.byClass) && Object.values(nl.byClass).every(objOfObjs);
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

function sanitizeFleetAndBots(st) {
for (const sh of st.ships) if (!isPlainObj(sh) || !ownShipType(sh.type) || !cargoOk(sh.cargo)) throw new Error("save is damaged");
// ambient bots: a corrupt entry is dropped, not kept to crash a tick (sailTick, aiStep and bot intel all dereference these)
const botOk = (b) => isPlainObj(b) && isPlainObj(b.ship) && ownShipType(b.ship.type) && cargoOk(b.ship.cargo)
  && (b.ship.voyage == null || isPlainObj(b.ship.voyage))
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

function sanitizeDeepStructures(st) {
  sanitizeMarketStructures(st);
  sanitizeFleetAndBots(st);
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
  for (const sh of st.ships) if (sh?.voyage && (!Array.isArray(sh.voyage.path) || !Number.isFinite(sh.voyage.totalTicks) || !Number.isFinite(sh.voyage.ticksLeft) || !Number.isFinite(sh.voyage.km))) throw new Error("save is from a test build and is not kept");
  sanitizeDeepStructures(st);
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
