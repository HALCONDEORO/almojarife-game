// Foreclosure on a loan that falls due unpaid. Optional rule, ON by default (newGame stores true when
// opts.foreclosure is undefined or true; explicit false keeps an off game, which carries no key).
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
 *  Whole units only, so the proceeds can exceed the shortfall. Money identity: cash after = cash before + proceeds - debt paid,
 *  nothing is lost. The proceeds pay the loan first (loan.left drops by up to the whole debt); any part of the proceeds beyond
 *  the debt is credited to g.cash here, once, so the caller must not credit it again. The caller then takes the remaining
 *  loan.left (often 0) from cash. Locks the lender and returns { proceeds, units, surplus }. */
export function foreclose(g, loan) {
  let need = r2(loan.left - Math.max(g.cash, 0)), proceeds = 0, units = 0, surplus = 0;
  if (need > 0) {
    const lots = [];
    for (const h of holds(g, loan.city)) for (const [good, q] of Object.entries(h.goods)) if (q > 0) lots.push({ h, good, q, unit: g.world.goods[good].base * SEIZE_RATE });
    lots.sort((a, b) => b.unit - a.unit || (a.good < b.good ? -1 : 1));
    for (const l of lots) {
      if (need <= 0) break;
      const n = Math.min(l.q, Math.ceil(need / l.unit)); if (!(n > 0)) continue;
      const had = l.h.goods[l.good], hb = l.h.hold.basis;
      l.h.goods[l.good] = had - n;
      if (hb?.[l.good] != null) hb[l.good] = Math.round(hb[l.good] * (had - n) / had); // what is left keeps only its own share of the cost paid
      if (!l.h.goods[l.good]) { delete l.h.goods[l.good]; if (hb) delete hb[l.good]; }
      const lb = g.basis?.[l.good]; // trade-log average cost: the seized units leave at their unit cost, so a later sale reports its true profit
      if (lb && lb.qty > 0) { const used = Math.min(n, lb.qty), unit = lb.cost / lb.qty; lb.qty -= used; lb.cost = Math.max(0, lb.cost - used * unit); }
      const v = r2(n * l.unit); proceeds = r2(proceeds + v); need = r2(need - v); units += n;
    }
    surplus = r2(Math.max(0, proceeds - loan.left)); // proceeds beyond the whole debt
    loan.left = r2(Math.max(0, loan.left - proceeds));
    if (surplus > 0) g.cash = r2(g.cash + surplus);
  }
  (g.loanLock ??= {})[loan.city] = g.day + LOCK_DAYS;
  return { proceeds, units, surplus };
}
