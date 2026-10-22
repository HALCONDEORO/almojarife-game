import { post } from "./ledger.mjs";
import { sisaMul } from "./council.mjs";

// Reputation per port: a merchant who sells what a port lacks is welcome; one who buys up
// what is already scarce is not. Reputation moves the market fee and the shipyard bill.
// Own design; per-city respect (rank.mjs) stays as the cumulative sales record. No DOM here.
export const REP_MIN = -50, REP_MAX = 100;
/** Points gained or lost per 100 coins traded while the port is short of the good (double when critically short). */
export const REP_PER_100 = 1, REP_CRIT_RATIO = 2, REP_TRADE_CAP = 5;
/** Most reputation one port will GRANT in a single day: one honest round trip is worth more than fifty split sales. */
export const REP_DAY_CAP = 10;
/** Fee multiplier per tier index (0 ill-seen .. 4 renowned). */
export const REP_FEE_MUL = [1.5, 1, 0.75, 0.5, 0.25];
/** Shipyard repair price multiplier per tier index. */
export const REP_REPAIR_MUL = [1, 1, 1, 0.9, 0.8];
export const REP_TIERS = [
  { id: "illseen", from: -50 },
  { id: "neutral", from: 0 },
  { id: "appreciated", from: 20 },
  { id: "esteemed", from: 50 },
  { id: "renowned", from: 80 },
];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/** Reputation points in a port (0 when never traded there). */
export const portRep = (g, city) => {
  const n = Number(g.portRep?.[city]);
  return Number.isFinite(n) ? clamp(n, REP_MIN, REP_MAX) : 0;
};
export const repTierIndex = (pts) => { let i = 0; REP_TIERS.forEach((t, k) => { if (pts >= t.from) i = k; }); return i; };
export const repTierOf = (g, city) => REP_TIERS[repTierIndex(portRep(g, city))];
/** Market fee multiplier the port applies to the player. */
export const feeMul = (g, city) => REP_FEE_MUL[repTierIndex(portRep(g, city))] * sisaMul(g, city); // the concejo moves the fee in discrete sisa steps
/** Shipyard repair price multiplier in the port. */
export const repairMul = (g, city) => REP_REPAIR_MUL[repTierIndex(portRep(g, city))];
const TIER_NAMES = {
  es: { illseen: "mal visto", neutral: "neutral", appreciated: "apreciado", esteemed: "estimado", renowned: "renombrado" },
  en: { illseen: "ill-seen", neutral: "neutral", appreciated: "appreciated", esteemed: "esteemed", renowned: "renowned" },
};
/** Log + ledger notice when a trade moves the port into another tier. `before` is the tier index before the move. */
function noteTier(g, city, before) {
  const after = repTierIndex(portRep(g, city));
  if (after === before) return;
  const name = g.world.nodes[city]?.name ?? city, tier = REP_TIERS[after].id, up = after > before;
  const txt = {
    es: up ? `Tu reputación en ${name} mejora: ahora eres ${TIER_NAMES.es[tier]}.` : `Tu reputación en ${name} empeora: ahora eres ${TIER_NAMES.es[tier]}.`,
    en: up ? `Your name in ${name} rises: you are now ${TIER_NAMES.en[tier]}.` : `Your name in ${name} suffers: you are now ${TIER_NAMES.en[tier]}.`,
  };
  g.log.unshift({ day: g.day, key: "reputation", txt }); if (g.log.length > 30) g.log.pop();
  post(g, "reputation", { city, txt });
}
/** Move reputation, clamped. Returns true if the tier changed. */
export function addRep(g, city, delta) {
  if (!Number.isFinite(delta) || !delta) return false;
  const before = repTierIndex(portRep(g, city));
  (g.portRep ??= {})[city] = clamp(Math.round((portRep(g, city) + delta) * 100) / 100, REP_MIN, REP_MAX);
  return repTierIndex(portRep(g, city)) !== before;
}
/** Scarcity of a good right before a trade: target/stock (1 = balanced, 2+ = critically short). */
export const scarcityOf = (entry) => entry.target / Math.max(1, entry.stock);
/** Apply a signed reputation delta: gains are capped per port and day (REP_DAY_CAP), losses are not. */
function award(g, city, d) {
  if (d > 0) {
    const t = g.repToday?.day === g.day ? g.repToday : (g.repToday = { day: g.day, cities: {} });
    const used = t.cities[city] ?? 0, room = Math.max(0, REP_DAY_CAP - used);
    d = Math.min(d, room); t.cities[city] = used + d;
    if (d <= 0) return 0;
  }
  const before = repTierIndex(portRep(g, city));
  addRep(g, city, d);
  noteTier(g, city, before);
  return d;
}
/**
 * Selling into a shortage earns reputation: nothing for a balanced market,
 * REP_PER_100 per 100 coins when short, double when critically short, capped per sale and per day.
 */
export function repOnSale(g, city, scarcity, revenue) {
  if (scarcity <= 1) return 0;
  return award(g, city, Math.min(REP_TRADE_CAP, (revenue / 100) * REP_PER_100 * (scarcity >= REP_CRIT_RATIO ? 2 : 1)));
}
/** Buying what the port lacks costs reputation (same ladder, negative). Abundant stock is free. */
export function repOnBuy(g, city, scarcity, cost) {
  if (scarcity <= 1) return 0;
  const d = Math.min(REP_TRADE_CAP, (cost / 100) * REP_PER_100 * (scarcity >= REP_CRIT_RATIO ? 2 : 1));
  award(g, city, -d);
  return -d;
}

/** Reputation fades in ports where the trader has not traded for a month: points lost per month, moving toward 0. */
export const REP_DECAY_PER_MONTH = 10, REP_DECAY_DAYS = 30;
/** Remember the day of the last trade in a port (a trade, even without reputation change, keeps the name alive). */
export function noteTrade(g, city) { (g.repTrade ??= {})[city] = g.day; }
/** Monthly decay: only ports without trade for REP_DECAY_DAYS lose points, so an active merchant is never punished. */
export function decayRep(g) {
  if (g.day % REP_DECAY_DAYS !== 0) return;
  for (const city of Object.keys(g.portRep ?? {})) {
    const v = portRep(g, city);
    if (!v || g.day - (g.repTrade?.[city] ?? -Infinity) < REP_DECAY_DAYS) continue;
    const before = repTierIndex(v);
    g.portRep[city] = v > 0 ? Math.max(0, v - REP_DECAY_PER_MONTH) : Math.min(0, v + REP_DECAY_PER_MONTH);
    noteTier(g, city, before);
  }
}
