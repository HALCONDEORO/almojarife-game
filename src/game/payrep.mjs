// Payment reputation (flag `credit`, default OFF): the lender's memory of how a house pays, per city.
// Sources: docs in Estudio's "Credito y ligas 1480-1600", section 3 (merchant credit rested on the fame of paying; a defaulter was recorded).
// The numbers below are tuning knobs, NOT historical rates (interest rates and discounts by place and year are not verified).
// Internal: the player sees only the terms (room, rate, refusal), never the level. With the flag OFF nothing here runs.
export const PAY_MIN = -3, PAY_MAX = 2;
/** Anti-farming: a loan earns standing only if it lived at least half its term, the house really paid at least four weeks of its interest, and the same port credits at most one level per 56 days. */
export const REP_MIN_LIFE_DAYS = 28, REP_MIN_WEEKS_PAID = 4, REP_GAIN_COOLDOWN_DAYS = 56;
/** Terms by level: how much of the normal credit room is offered, how the rate scales, and whether the lender refuses. */
export const TERMS = Object.freeze({
  2: { room: 1.25, rate: 0.75 }, 1: { room: 1.1, rate: 0.9 }, 0: { room: 1, rate: 1 },
  [-1]: { room: 0.75, rate: 1.25 }, [-2]: { room: 0.5, rate: 1.5 }, [-3]: { room: 0, rate: 1.5, refuse: true },
});
export const payRepOf = (g, city) => (g.credit === true ? g.payRep?.[city] ?? 0 : 0);
/** Terms the city's lender offers this house now. Neutral (and zero effect) unless the credit flag is on. */
export const termsFor = (g, city) => (g.credit === true ? TERMS[payRepOf(g, city)] : TERMS[0]);
const clamp = (x) => Math.max(PAY_MIN, Math.min(PAY_MAX, x));
/** A loan fell due and the house could not pay it from cash: the lender records it. */
export function recordDefault(g, city) { if (g.credit !== true) return; (g.payRep ??= {})[city] = clamp(payRepOf(g, city) - 1); }
/** A loan was repaid in full before its term ran out: the lender remembers that too (slower than it forgets).
 *  `loan` must have lived long enough and paid real interest (loan.paidInt, summed at each weekly settlement), and the port must not have credited a level in the last 56 days. */
export function recordPaid(g, loan) {
  if (g.credit !== true) return false;
  const city = loan.city;
  if (g.day - loan.taken < REP_MIN_LIFE_DAYS) return false;
  if ((loan.paidInt ?? 0) < loan.principal * (loan.rate ?? 0) * REP_MIN_WEEKS_PAID - 1e-9) return false;
  const last = g.payRepGain?.[city];
  if (last !== undefined && g.day - last < REP_GAIN_COOLDOWN_DAYS) return false;
  if (payRepOf(g, city) >= PAY_MAX) return false;
  (g.payRep ??= {})[city] = clamp(payRepOf(g, city) + 1); (g.payRepGain ??= {})[city] = g.day;
  return true;
}
/** Weekly settlement: add to each loan the interest it was just charged (only with the flag on, so OFF games are unchanged). */
export function accrueLoanInterest(g, loans) { if (g.credit !== true) return; for (const l of loans) l.paidInt = Math.round(((l.paidInt ?? 0) + l.left * (l.rate ?? 0)) * 100) / 100; }
