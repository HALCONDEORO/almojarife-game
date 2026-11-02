// govtemplates.mjs: saved rule sets, a level 2 governor skill.
// A template is a named snapshot of one port's standing orders; applying it
// writes the same orders into another port (or back into this one after a
// rebuild). Kept in its own module so steward.mjs and governor.mjs never
// import each other.
import { governorOf } from "./governor.mjs";
import { setStewardRule } from "./steward.mjs";

/** Standing-order fields a template carries (the six keys setStewardRule stores). */
const RULE_KEYS = ["buyBelow", "buyTo", "sellAbove", "sellKeep", "buyBelowPct", "sellAbovePct"];
const NAME_MAX = 40;

/** Names that would fight the object prototype ("__proto__" would silently vanish from a save round trip). */
const UNSAFE_NAMES = new Set(["__proto__", "constructor", "prototype"]);
function templateNameOk(name) { const clean = typeof name === "string" ? name.trim() : ""; return clean.length >= 1 && clean.length <= NAME_MAX && !UNSAFE_NAMES.has(clean); }
/** Own-key read: a name inherited from Object.prototype ("toString") is not a saved template. */
function ownTemplate(g, name) { const templates = g.govTemplates; return templates && Object.prototype.hasOwnProperty.call(templates, name) ? templates[name] : null; }
function needsLevelTwo(g, city) {
  const governor = governorOf(g, city);
  if (!governor || governor.state !== "active" || governor.level < 2) return { ok: false, reason: "needs a working level 2 governor here" };
  return null;
}

/** Snapshot the port's standing orders under a name. Overwrites a same-named template. */
export function saveGovTemplate(g, city, name) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!templateNameOk(name)) return { ok: false, reason: "bad name" };
  const block = needsLevelTwo(g, city);
  if (block) return block;
  const rules = g.warehouses?.[city]?.admin?.rules ?? {};
  if (!Object.keys(rules).length) return { ok: false, reason: "no standing orders to save" };
  const snapshot = {};
  for (const [good, rule] of Object.entries(rules)) {
    const copy = {};
    for (const key of RULE_KEYS) if (Object.prototype.hasOwnProperty.call(rule, key)) copy[key] = rule[key];
    snapshot[good] = copy;
  }
  const key = name.trim();
  if (!g.govTemplates) g.govTemplates = {};
  Object.defineProperty(g.govTemplates, key, { value: snapshot, writable: true, enumerable: true, configurable: true }); // defineProperty: "__proto__" never reaches the setter; the name list already rejects it, this is the second lock
  return { ok: true, name: key, rules: Object.keys(snapshot).length };
}

/** Write a saved template into this port's orders. Validates every rule against a probe first: a bad rule leaves nothing half-applied. */
export function applyGovTemplate(g, city, name, cap) {
  if (g.over) return { ok: false, reason: "game over" };
  const block = needsLevelTwo(g, city);
  if (block) return block;
  const template = ownTemplate(g, name);
  if (!template) return { ok: false, reason: "no such template" };
  const wh = g.warehouses?.[city];
  if (!wh) return { ok: false, reason: "no warehouse here" };
  const probe = { warehouses: { [city]: { goods: wh.goods, admin: { rules: {}, reserve: wh.admin?.reserve ?? 0 } } }, world: g.world };
  for (const [good, rule] of Object.entries(template)) {
    const check = setStewardRule(probe, city, good, rule, cap);
    if (!check.ok) return { ok: false, reason: `${good}: ${check.reason}` };
  }
  for (const [good, rule] of Object.entries(template)) setStewardRule(g, city, good, rule, cap);
  return { ok: true, applied: Object.keys(template).length };
}

export function deleteGovTemplate(g, name) {
  if (!ownTemplate(g, name)) return { ok: false, reason: "no such template" };
  delete g.govTemplates[name];
  return { ok: true };
}
