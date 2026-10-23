// Foreclosure on a loan that falls due unpaid. Optional rule, default OFF (newGame flag `foreclosure === true`, g.foreclosure).
// Same function for the player and for a bot finance view (botcredit.mjs): it reads only cash, loans, ships, warehouses.
// Design inference, no historical source yet: the lender may seize what the debtor holds in the lender's own port
// (warehouse stock there and the cargo of his ships docked there), sold at half base value like a bankruptcy sale,
// before the rest is taken from cash. After a default that port's lender lends nothing for LOCK_DAYS.
export const SEIZE_RATE = 0.5, LOCK_DAYS = 112;
const r2 = (x) => Math.round(x * 100) / 100;
/** Pure: is the lender of `city` shut to this debtor today? */
export const lenderLocked = (g, city) => g.foreclosure === true && (g.loanLock?.[city] ?? 0) > g.day;
function holds(g, city) {
  const out = [];
  const wh = g.warehouses?.[city]; if (wh?.goods) out.push({ goods: wh.goods, hold: wh });
  for (const s of g.ships ?? []) if (s.at === city && !s.voyage && s.cargo) out.push({ goods: s.cargo, hold: s });
  return out;
}
/** Seize goods in the lender's port until the shortfall (loan left minus positive cash) is covered, most valuable first.
 *  Whole units only, so the proceeds can exceed the shortfall by less than one unit. Nothing is lost by that: loan.left
 *  drops by the whole proceeds and the caller then takes only the rest from cash, so the surplus stays in the debtor's cash.
 *  Locks the lender and returns { proceeds, units }. */
export function foreclose(g, loan) {
  let need = r2(loan.left - Math.max(g.cash, 0)), proceeds = 0, units = 0;
  if (need > 0) {
    const lots = [];
    for (const h of holds(g, loan.city)) for (const [good, q] of Object.entries(h.goods)) if (q > 0) lots.push({ h, good, q, unit: g.world.goods[good].base * SEIZE_RATE });
    lots.sort((a, b) => b.unit - a.unit || (a.good < b.good ? -1 : 1));
    for (const l of lots) {
      if (need <= 0) break;
      const n = Math.min(l.q, Math.ceil(need / l.unit)); if (!(n > 0)) continue;
      l.h.goods[l.good] -= n; if (l.h.goods[l.good] <= 0) { delete l.h.goods[l.good]; if (l.h.hold.basis) delete l.h.hold.basis[l.good]; }
      const v = r2(n * l.unit); proceeds = r2(proceeds + v); need = r2(need - v); units += n;
    }
    loan.left = r2(Math.max(0, loan.left - proceeds));
  }
  (g.loanLock ??= {})[loan.city] = g.day + LOCK_DAYS;
  return { proceeds, units };
}
