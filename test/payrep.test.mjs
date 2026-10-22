import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { takeLoan, repayLoan, processLoans, loanRoom, loanInterestRaw, LOAN_RATE, LOAN_TERM_DAYS } from "../src/game/bank.mjs";
import { termsFor, payRepOf, PAY_MIN, PAY_MAX } from "../src/game/payrep.mjs";
import { netWorth } from "../src/game/game.mjs";
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
  repayLoan(h, l2.id, 500);
  assert.equal(payRepOf(h, "cadiz"), 1);
  for (let i = 0; i < 5; i++) { const x = takeLoan(h, "cadiz", 100, netWorth(h)); if (x.ok) repayLoan(h, x.loan.id, 100); }
  assert.ok(payRepOf(h, "cadiz") <= PAY_MAX);
  assert.equal(takeLoan(h, "cadiz", 100, netWorth(h)).loan.rate, LOAN_RATE * 0.75);
});
test("the interest of a loan signed at a worse rate is charged at that rate", () => {
  const g = mk(true); g.payRep = { cadiz: -2 };
  const l = takeLoan(g, "cadiz", 100, netWorth(g)).loan;
  assert.equal(loanInterestRaw(g), 100 * LOAN_RATE * 1.5);
  assert.equal(l.rate, LOAN_RATE * 1.5);
});
