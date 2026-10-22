import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { takeLoan, repayLoan, processLoans, loanRoom, loanInterestRaw, accrueWeeklyLoanInterest, LOAN_RATE, LOAN_TERM_DAYS } from "../src/game/bank.mjs";
import { termsFor, payRepOf, PAY_MIN, PAY_MAX } from "../src/game/payrep.mjs";
import { netWorth, bankRoom } from "../src/game/game.mjs";
const world = loadWorld();
const mk = (credit) => { const g = newGame(world, "cadiz", { freePlay: true, credit }); g.ships[0].at = "cadiz"; g.ships[0].voyage = null; return g; };
test("flag OFF: payment reputation never changes anything, even after a default", () => {
  const g = mk(false), nw = netWorth(g);
  const room = loanRoom(g, nw, "cadiz");
  assert.equal(takeLoan(g, "cadiz", 1000, nw).loan.rate, undefined);
  g.cash = 0; g.day += LOAN_TERM_DAYS + 1; processLoans(g);
  assert.equal(g.payRep, undefined);
  assert.equal(payRepOf(g, "cadiz"), 0);
  assert.equal(loanRoom(g, nw, "cadiz"), room);
});
test("flag ON: a default lowers the terms, paying on time raises them, levels are bounded", () => {
  const g = mk(true), nw = netWorth(g);
  assert.equal(termsFor(g, "cadiz").rate, 1);
  const l = takeLoan(g, "cadiz", 1000, nw).loan;
  g.cash = 0; g.day = l.due; processLoans(g);
  assert.equal(payRepOf(g, "cadiz"), -1);
  assert.ok(loanRoom(g, nw, "cadiz") < loanRoom(mk(true), nw, "cadiz"));
  assert.equal(takeLoan(g, "cadiz", 100, nw).loan.rate, LOAN_RATE * 1.25);
  for (let i = 0; i < 6; i++) { takeLoan(g, "cadiz", 100, nw); g.cash = 0; g.day += LOAN_TERM_DAYS + 1; processLoans(g); }
  assert.equal(payRepOf(g, "cadiz"), PAY_MIN);
  assert.equal(takeLoan(g, "cadiz", 100, nw).ok, false); // the lender refuses
  assert.equal(payRepOf(g, "sevilla"), 0); // per city
  const h = mk(true), l2 = takeLoan(h, "cadiz", 500, netWorth(h)).loan;
  repayLoan(h, l2.id, 500); // repaid on day 0: no interest paid, no standing
  assert.equal(payRepOf(h, "cadiz"), 0);
  const l3 = takeLoan(h, "cadiz", 500, netWorth(h)).loan;
  h.day += 14; for (let i = 0; i < 2; i++) accrueWeeklyLoanInterest(h); repayLoan(h, l3.id, 500); // too short, too little interest
  assert.equal(payRepOf(h, "cadiz"), 0);
  const honest = () => { const l = takeLoan(h, "cadiz", 500, netWorth(h)).loan; h.day += 28; for (let i = 0; i < 4; i++) accrueWeeklyLoanInterest(h); repayLoan(h, l.id, 500); };
  honest();
  assert.equal(payRepOf(h, "cadiz"), 1);
  honest(); // same port again within 56 days: no second level
  assert.equal(payRepOf(h, "cadiz"), 1);
  h.day += 60; honest();
  assert.equal(payRepOf(h, "cadiz"), 2);
  h.day += 60; honest();
  assert.ok(payRepOf(h, "cadiz") <= PAY_MAX);
  assert.equal(takeLoan(h, "cadiz", 100, netWorth(h)).loan.rate, LOAN_RATE * 0.75);
});
test("the interest of a loan signed at a worse rate is charged at that rate", () => {
  const g = mk(true); g.payRep = { cadiz: -2 };
  const l = takeLoan(g, "cadiz", 100, netWorth(g)).loan;
  assert.equal(loanInterestRaw(g), 100 * LOAN_RATE * 1.5);
  assert.equal(l.rate, LOAN_RATE * 1.5);
});
test("the terms the bank tab shows are the port's real terms", () => {
  const g = mk(true), nw = netWorth(g); g.payRep = { cadiz: 1, sevilla: -3 };
  assert.equal(bankRoom(g, "cadiz"), loanRoom(g, nw, "cadiz"));
  assert.ok(bankRoom(g, "cadiz") > bankRoom(g, "lisboa"));
  assert.equal(bankRoom(g, "sevilla"), 0); // refused: the tab offers no amounts
  const off = mk(false); assert.equal(bankRoom(off, "cadiz"), bankRoom(off));
});
