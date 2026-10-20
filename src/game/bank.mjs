// The moneylender (bank). Pure game logic: no DOM. Any port has one; you borrow while a ship of yours is docked there.
// Loans cost LOAN_RATE of what is left, every weekly settlement (cheaper than the 2% overdraft, so asking is better than falling short).
// Total borrowing is capped at half of your net worth, rounded down to LOAN_STEP, and never above LOAN_MAX.
// A loan has a term. When it falls due the bank takes what is left from your cash, even if that makes it negative.
export const LOAN_RATE = 0.01, LOAN_TERM_DAYS = 56, LOAN_MAX = 5000, LOAN_STEP = 100;
const r2 = (x) => Math.round(x * 100) / 100;
export const loansOf = (g) => g.loans ?? [];
export const loansOwed = (g) => r2(loansOf(g).reduce((x, l) => x + l.left, 0));
/** Weekly interest on the open loans. */
export const loanInterest = (g) => r2(loansOwed(g) * LOAN_RATE);
/** How much more the bank would lend now. `netWorth` is the player's net worth (already net of loans). */
export function loanRoom(g, netWorth) {
  const owed = loansOwed(g);
  // Based on net worth, which borrowing does not change (cash goes up, debt goes up), so you cannot lend yourself more by borrowing.
  const total = Math.min(LOAN_MAX, Math.floor(Math.max(netWorth, 0) * 0.5 / LOAN_STEP) * LOAN_STEP);
  return Math.max(0, total - owed);
}
const docked = (g, city) => g.ships.some((s) => s.at === city && !s.voyage);
/** Borrow `amount` (a multiple of LOAN_STEP). Returns { ok, reason?, loan? }. */
export function takeLoan(g, city, amount, netWorth, post = () => {}) {
  amount = Math.floor(Number(amount));
  if (!Number.isFinite(amount) || amount < LOAN_STEP || amount % LOAN_STEP) return { ok: false, reason: "bad amount" };
  if (!docked(g, city)) return { ok: false, reason: "no ship here" };
  if (amount > loanRoom(g, netWorth)) return { ok: false, reason: "over limit" };
  const loan = { id: (g.nextLoan = (g.nextLoan ?? 0) + 1), city, principal: amount, left: amount, taken: g.day, due: g.day + LOAN_TERM_DAYS };
  (g.loans ??= []).push(loan); g.cash += amount;
  post(g, "loan", { city, amt: amount, rate: Math.round(LOAN_RATE * 100), dueDay: loan.due });
  return { ok: true, loan };
}
/** Pay back up to `amount` of one loan, from positive cash only. */
export function repayLoan(g, id, amount, post = () => {}) {
  const l = loansOf(g).find((x) => x.id === id);
  if (!l) return { ok: false, reason: "no loan" };
  const pay = r2(Math.min(Number(amount), l.left, Math.max(g.cash, 0)));
  if (!(pay > 0)) return { ok: false, reason: "no cash" };
  g.cash = r2(g.cash - pay); l.left = r2(l.left - pay);
  if (l.left <= 0) g.loans.splice(g.loans.indexOf(l), 1);
  post(g, "loanPaid", { amt: pay });
  return { ok: true, paid: pay };
}
/** At settlement: warn about loans due within a week, and collect the ones that fell due. */
export function processLoans(g, post = () => {}) {
  let taken = 0;
  for (const l of [...loansOf(g)]) {
    if (l.due <= g.day) { g.weekLoanInterest = (g.weekLoanInterest ?? 0) + l.left * LOAN_RATE; /* keep the last interest of a loan that is closed before settlement */ taken += l.left; g.cash = r2(g.cash - l.left); g.loans.splice(g.loans.indexOf(l), 1); post(g, "loanLate", { amt: l.left }); }
    else if (l.due - g.day <= 7 && !l.warned) { l.warned = true; post(g, "loanDue", { amt: l.left, dueDay: l.due }); }
  }
  return r2(taken);
}
