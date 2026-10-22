// Versioned save format. Pure functions (no DOM) so they can be tested.
// A save is { version, savedAt, company, state } where state is the game without the (static) world.
import { campaignShapeOk, newCampaign } from "./campaigns.mjs";
import { fillMissingMarketRows } from "../sim/market.mjs";
import { withKidMeat, withLegumes, withPottery } from "../sim/optional_goods.mjs";

export const SAVE_VERSION = 3; // v3: voyages run on ticks (ticksLeft/totalTicks); older test saves are not kept
export const MAX_COMPANY = 30;
export const cleanCompany = (s) => String(s ?? "").replace(/[\u0000-\u001f<>&"]/g, "").trim().slice(0, MAX_COMPANY);
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
export const RETIRED_GOODS = Object.freeze({ dried_fish: "fish" });
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
  for (const city of Object.values(st.market)) for (const e of Object.values(city)) if (!Number.isFinite(e?.pop)) throw new Error("save is from a test build and is not kept");
  const g = { world, ...JSON.parse(JSON.stringify(st)) };
  if (g.pottery === true) g.world = withPottery(g.world);
  if (g.legumes === true) g.world = withLegumes(g.world);
  if (g.kidMeat === true) g.world = withKidMeat(g.world); // a save made with the optional goods flag keeps its goods
  migrateRetired(g);
  fillMissingMarketRows(g.world, g.market); // goods or ports added since the save was written get a fresh market row, so old saves keep loading
  return { g, company: cleanCompany(s.company) };
}
