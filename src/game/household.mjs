// Household cost: a yearly share of net worth, charged weekly. One rule for the player and every trader bot.
// Optional rule, default OFF (newGame flag `household === true`, stored as g.household).
// The rate is a tuning knob, not a historical figure: no source yet.
export const HOUSEHOLD_RATE_YEAR = 0.02;
export const HOUSEHOLD_WEEKS = 52;
const r2 = (x) => Math.round(x * 100) / 100;
/** Pure: what one weekly charge costs for a holder with this cash and net worth. Never charges below zero worth, never more than the cash in hand. */
export function householdCharge(cash, worth, rate = HOUSEHOLD_RATE_YEAR) {
  if (!(worth > 0) || !(cash > 0)) return 0;
  return r2(Math.min(cash, worth * rate / HOUSEHOLD_WEEKS));
}
const botWorth = (g, t) => t.cash + Object.entries(t.ship?.cargo ?? {}).reduce((s, [k, q]) => s + q * g.world.goods[k].base, 0);
/** Weekly hook: the same householdCharge for the player (cash, netWorth) and for each bot (cash, cash plus cargo at base). */
export function householdWeek(g, playerWorth) {
  if (g.household !== true || !g.day || g.day % 7 !== 0) return 0;
  const c = householdCharge(g.cash, playerWorth(g)); g.cash = r2(g.cash - c);
  for (const t of g.ai ?? []) t.cash = r2(t.cash - householdCharge(t.cash, botWorth(g, t)));
  return c;
}
