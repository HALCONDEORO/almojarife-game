// Inactive integration seam. No game-loop imports or calls this module.
// The coordinator must supply an explicit investment cost and working-cash reserve.
import { netWorth } from './game.mjs';
import { loanRoom, takeLoan, repayLoan, loansOf, LOAN_STEP } from './bank.mjs';
import { dueNow, post } from './ledger.mjs';

/** Only shared world/market/clock, never the human's finances. Persist all private fields
 * on the house. This is a finance view, not a complete player/construction view. */
export function botFinanceView(g, bot) {
  const view = { world: g.world, market: g.market, day: g.day, tick: g.tick,
    over: g.over, ships: bot.ships ?? [bot.ship] };
  view.foreclosure = g.foreclosure === true; view.credit = g.credit === true; // the same flag, the same terms: a bot is judged by its own payment record like a player
  for (const field of ['payRep', 'cash', 'warehouses', 'loans', 'nextLoan', 'rankIdx', 'accrued',
    'loanLock', 'weekLoanInterest', 'weekLoanPrincipal', 'reports', 'inbox', 'nextMsg', 'weekTrade']) {
    Object.defineProperty(view, field, { enumerable: true,
      get: () => bot[field], set: (value) => { bot[field] = value; } });
  }
  return view;
}
const valid = (n) => Number.isFinite(n) && n >= 0;

/** Borrow only the shortfall BEFORE an explicitly selected investment. All costs already
 * accrued are protected as well. Refuse a second loan rather than refinance a failing plan.
 * This does not execute the investment or promise it is profitable. Requote at execution. */
export function prepareBotCredit(g, bot, city, cost, reserve) {
  if (!valid(cost) || !valid(reserve)) return { ok: false, reason: 'bad budget' };
  const view = botFinanceView(g, bot);
  if (view.over) return { ok: false, reason: 'game over' };
  const shortfall = cost + reserve + dueNow(view) - view.cash;
  if (shortfall <= 0) return { ok: true, borrowed: 0 };
  if (loansOf(view).length) return { ok: false, reason: 'existing loan' };
  const amount = Math.ceil(shortfall / LOAN_STEP) * LOAN_STEP;
  if (amount > loanRoom(view, netWorth(view))) return { ok: false, reason: 'over limit' };
  const result = takeLoan(view, city, amount, netWorth(view), post);
  return result.ok ? { ...result, borrowed: amount } : result;
}

/** Repay surplus after a sale, retaining the selected operating buffer and accrued bill.
 * Ordinary player repayment is allowed at sea too. Never write off or extend debt. */
export function repayBotCredit(g, bot, reserve) {
  if (!valid(reserve)) return { ok: false, reason: 'bad budget' };
  const view = botFinanceView(g, bot);
  if (view.over) return { ok: false, reason: 'game over' };
  let paid = 0;
  for (const loan of [...loansOf(view)]) {
    const surplus = Math.max(0, view.cash - reserve - dueNow(view));
    if (!(surplus > 0)) break;
    const result = repayLoan(view, loan.id, Math.min(surplus, loan.left), post);
    if (result.ok) paid += result.paid;
  }
  return { ok: true, paid };
}
