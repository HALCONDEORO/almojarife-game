// Household tribute: a yearly share of net worth, charged weekly, paid by every house (the player and each trader bot)
// into the funds of the port where the house stands (g.cityFunds). Each quarter the funds are spent on city works,
// which raise that port's health counter; health lowers the chance a plague scare closes the port (shocks.mjs).
// Optional rule, default OFF (newGame flag `household === true`, stored as g.household).
// The rate and the cost of a health point are tuning knobs. Design inference: neighbours with a house pay tribute
// to the city treasury. No historical source yet.
export const HOUSEHOLD_RATE_YEAR = 0.02;
export const HOUSEHOLD_WEEKS = 52;
export const WORKS_EVERY = 91;       // days between city works (one quarter)
export const WORKS_COST = 5000;      // coins of works for one health point
export const HEALTH_DECAY = 0.97;    // per-point shield factor: shield = 1 - 0.97^health
export const SHIELD_MAX = 0.6;
const r2 = (x) => Math.round(x * 100) / 100;
/** Pure: what one weekly charge costs for a holder with this cash and net worth. Never charges below zero worth, never more than the cash in hand. */
export function householdCharge(cash, worth, rate = HOUSEHOLD_RATE_YEAR) {
  if (!(worth > 0) || !(cash > 0)) return 0;
  return r2(Math.min(cash, worth * rate / HOUSEHOLD_WEEKS));
}
/** Pure: share of plague scares a port's health turns away. */
export const healthShield = (health) => Math.min(SHIELD_MAX, 1 - Math.pow(HEALTH_DECAY, Math.max(0, health ?? 0)));
export const cityHealth = (g, city) => g.cityHealth?.[city] ?? 0;
function pay(g, city, c) { if (c > 0 && city) { const f = (g.cityFunds ??= {}); f[city] = r2((f[city] ?? 0) + c); } return c; }
/** Quarterly: every port spends its whole fund on works. Money moves to g.citySpent, health grows by spent / WORKS_COST. */
export function cityWorks(g) {
  if (g.household !== true || !g.day || g.day % WORKS_EVERY !== 0) return 0;
  let total = 0;
  for (const [city, f] of Object.entries(g.cityFunds ?? {})) {
    if (!(f > 0)) continue;
    (g.cityHealth ??= {})[city] = (g.cityHealth[city] ?? 0) + f / WORKS_COST;
    g.citySpent = r2((g.citySpent ?? 0) + f); total += f; g.cityFunds[city] = 0;
  }
  return r2(total);
}
/** Weekly hook: the same householdCharge for the player and for each bot. Returns the player's charge. */
export function householdWeek(g, playerWorth, botWorth) {
  if (g.household !== true || !g.day || g.day % 7 !== 0) return 0;
  const home = g.profile?.home;
  const c = householdCharge(g.cash, playerWorth(g)); g.cash = r2(g.cash - c); pay(g, home, c);
  for (const t of g.ai ?? []) { const b = householdCharge(t.cash, botWorth(g, t)); t.cash = r2(t.cash - b); pay(g, t.home, b); }
  cityWorks(g);
  return c;
}
