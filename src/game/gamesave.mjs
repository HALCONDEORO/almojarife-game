// Versioned save format. Pure functions (no DOM) so they can be tested.
// A save is { version, savedAt, company, state } where state is the game without the (static) world.
import { campaignShapeOk, newCampaign } from "./campaigns.mjs";

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
  return { g: { world, ...JSON.parse(JSON.stringify(st)) }, company: cleanCompany(s.company) };
}
