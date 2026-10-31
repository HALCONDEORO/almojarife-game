import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth, borrow, repay, bankRoom, loansOwed } from "../src/game/game.mjs";
import { LOAN_RATE, LOAN_TERM_DAYS, LOAN_MAX, loanInterest, processLoans } from "../src/game/bank.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { post } from "../src/game/ledger.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const idle = () => { const g = newGame(world, "cadiz", {household:false,calamities:false,regionalRivals:false}); g.eventsOn = false; return g; };
const fmt = (n) => String(Math.round(n));

test("the limit is half of net worth in steps of 100, capped, and needs a docked ship", () => {
  const g = idle(); const room = bankRoom(g);
  assert.equal(room, Math.min(LOAN_MAX, Math.floor(netWorth(g) * 0.5 / 100) * 100));
  assert.equal(borrow(g, "lisboa", 100).reason, "no ship here"); // the ship is elsewhere
  assert.equal(borrow(g, g.ships[0].at, 150).reason, "bad amount");
  assert.equal(borrow(g, g.ships[0].at, room + 100).reason, "over limit");
});
test("borrowing adds cash and debt, and the money does not count as worth", () => {
  const g = idle(), c0 = g.cash, w0 = netWorth(g), city = g.ships[0].at, room0 = bankRoom(g);
  const r = borrow(g, city, 500); assert.ok(r.ok);
  assert.equal(g.cash, c0 + 500); assert.equal(loansOwed(g), 500); assert.equal(netWorth(g), w0);
  assert.equal(g.inbox[0].kind, "loan"); assert.equal(r.loan.due, g.day + LOAN_TERM_DAYS);
  assert.equal(bankRoom(g), room0 - 500); // the total limit does not grow by borrowing
});
test("borrowed money cannot win the game", () => {
  const g = idle(); g.cash = 49990; g.loans = [{ id: 1, city: g.ships[0].at, principal: 100, left: 100, taken: 0, due: 99 }];
  advanceDay(g); assert.equal(g.over, null);
});
test("interest is part of the weekly bill and shows in the report", () => {
  const g = idle(); borrow(g, g.ships[0].at, 1000); const c = g.cash;
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.reports[0].loanInterest, 10); assert.equal(g.cash, c - 14 - 10);
  assert.equal(loanInterest(g), 10);
});
test("repaying: partial, full, and never from negative cash", () => {
  const g = idle(), city = g.ships[0].at; borrow(g, city, 500);
  const id = g.loans[0].id;
  assert.ok(repay(g, id, 100).ok); assert.equal(g.loans[0].left, 400);
  assert.ok(repay(g, id, 1e9).ok); assert.equal(g.loans.length, 0); assert.equal(loansOwed(g), 0);
  assert.equal(repay(g, id, 10).reason, "no loan");
  borrow(g, city, 100); g.cash = -5; assert.equal(repay(g, g.loans[0].id, 50).reason, "no cash");
});
test("a loan falls due: warning a week before, then the bank takes it from cash even if that goes negative", () => {
  const g = idle(); borrow(g, g.ships[0].at, 1000); g.cash = 50; // spent it all
  for (let d = 0; d < LOAN_TERM_DAYS - 7; d++) advanceDay(g);
  assert.ok(g.inbox.some((m) => m.kind === "loanDue"), "warned about the due date");
  assert.equal(g.loans.length, 1);
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.loans.length, 0); assert.ok(g.inbox.some((m) => m.kind === "loanLate"));
  assert.ok(g.cash < 0);
});
test("saves keep loans", () => {
  const g = idle(); borrow(g, g.ships[0].at, 300);
  const back = deserialize(serialize(g, "X"), world).g;
  assert.equal(loansOwed(back), 300); assert.equal(back.loans[0].due, g.loans[0].due);
});
test("messages read well in both languages", () => {
  const m = { kind: "loan", city: "cadiz", amt: 500, rate: 1, dueDay: 56 };
  assert.equal(messageText(m, "en", fmt, (c) => "Cadiz"), "Bank of Cadiz: you received 500. Interest 1% a week. Due on day 56.");
  assert.equal(messageText(m, "es", fmt, (c) => "Cádiz"), "Banco de Cádiz: recibiste 500. Interés 1 % a la semana. Vence el día 56.");
  assert.ok(messageText({ kind: "loanLate", amt: 200 }, "es", fmt).includes("cobró 200"));
  assert.ok(messageText({ kind: "loanDue", amt: 200, dueDay: 9 }, "en", fmt).includes("day 9"));
  assert.equal(messageText({ kind: "loanPaid", amt: 40 }, "en", fmt), "You paid back 40 to the bank.");
});
test("loans are collected on their due day and shown as principal in the report", async () => {
  const { newGame, advanceDay } = await import("../src/game/game.mjs"); const { loadWorld } = await import("../src/sim/world.mjs");
  const g = newGame(loadWorld()); g.eventsOn = false; g.cash = 5000;
  g.loans = [{ id: 1, city: g.ships[0].at, principal: 1000, left: 1000, taken: 0, due: 3 }];
  for (let i = 0; i < 3; i++) advanceDay(g);
  assert.equal(g.loans.length, 0, "collected on day 3, not at day 7");
  for (let i = 0; i < 4; i++) advanceDay(g);
  assert.equal(g.reports[0].loanPrincipal, 1000);
  assert.ok(g.reports[0].paid >= 1000);
});
test("a loan collected before settlement still pays its last weekly interest", async () => {
  const { newGame, advanceDay } = await import("../src/game/game.mjs"); const { loadWorld } = await import("../src/sim/world.mjs");
  const g = newGame(loadWorld()); g.eventsOn = false; g.cash = 5000;
  g.loans = [{ id: 1, city: g.ships[0].at, principal: 1000, left: 1000, taken: 0, due: 3 }];
  for (let i = 0; i < 7; i++) advanceDay(g);
  assert.equal(g.reports[0].loanInterest, 10);
});
test("the estimate of what is due includes the interest of loans collected this week", async () => {
  const { newGame, advanceDay, } = await import("../src/game/game.mjs"); const { dueNow } = await import("../src/game/ledger.mjs"); const { loadWorld } = await import("../src/sim/world.mjs");
  const g = newGame(loadWorld()); g.eventsOn = false; g.cash = 5000;
  g.loans = [{ id: 1, city: g.ships[0].at, principal: 1000, left: 1000, taken: 0, due: 3 }];
  for (let i = 0; i < 3; i++) advanceDay(g);
  assert.ok(dueNow(g) >= 10, "includes the 10 coins of last interest");
});
test("interest of open loans and of loans collected this week is rounded once", async () => {
  const { dueNow, settleWeek } = await import("../src/game/ledger.mjs"); const { newGame } = await import("../src/game/game.mjs"); const { loadWorld } = await import("../src/sim/world.mjs");
  const g = newGame(loadWorld()); g.eventsOn = false; g.ships = []; g.cash = 100;
  g.loans = [{ id: 1, city: "cadiz", principal: 0.5, left: 0.5, taken: 0, due: 99 }, { id: 2, city: "cadiz", principal: 0.5, left: 0.5, taken: 0, due: 99 }];
  g.weekLoanInterest = 0.5 * 0.01;
  assert.equal(dueNow(g), 0.02); // 0.01 open + 0.005 collected = 0.015 -> 0.02 once
  g.day = 7; const r = settleWeek(g); assert.equal(r.loanInterest, 0.02);
});
test("tiny loan interest is rounded once across open and collected loans (old code gave 0)", async () => {
  const { dueNow } = await import("../src/game/ledger.mjs"); const { newGame } = await import("../src/game/game.mjs"); const { loadWorld } = await import("../src/sim/world.mjs");
  const g = newGame(loadWorld()); g.eventsOn = false; g.ships = []; g.cash = 100;
  g.loans = [{ id: 1, city: "cadiz", principal: 0.3, left: 0.3, taken: 0, due: 99 }]; g.weekLoanInterest = 0.003;
  assert.equal(dueNow(g), 0.01);
});

test("submission is acceptance: failed guards write nothing, the returned loan is the applied record, retries get fresh identities", () => {
  const g = idle(), city = g.ships[0].at;
  // a failed submission writes nothing: no record, no cash, no message
  const cash0 = g.cash, box0 = (g.inbox ?? []).length;
  assert.equal(borrow(g, city, 150).reason, "bad amount");
  assert.equal(borrow(g, "lisboa", 100).reason, "no ship here");
  assert.equal(borrow(g, city, bankRoom(g) + 100).reason, "over limit");
  assert.equal(g.loans ?? null, null, "no record from a failed submission");
  assert.equal(g.cash, cash0);
  assert.equal((g.inbox ?? []).length, box0, "no message from a failed submission");
  // acceptance is atomic: the returned loan IS the record, terms fixed at signing
  const room0 = bankRoom(g);
  const r = borrow(g, city, 500);
  assert.ok(r.ok);
  assert.equal(g.loans.length, 1);
  assert.equal(g.loans[0], r.loan, "the returned handle is the applied record, not a copy or a pending request");
  assert.equal(r.loan.left, 500);
  assert.equal(r.loan.due, g.day + LOAN_TERM_DAYS);
  assert.equal(g.cash, cash0 + 500);
  assert.equal(bankRoom(g), room0 - 500, "the room reflects the applied loan at once");
  // a duplicate retry is a second loan with its own identity, never a deduplication
  const r2 = borrow(g, city, 500);
  assert.ok(r2.ok);
  assert.notEqual(r2.loan.id, r.loan.id);
  assert.equal(g.loans.length, 2);
  // there is no queued-but-unconsumed state: a reload carries exactly the applied loans
  const back = deserialize(serialize(g, "X"), world).g;
  assert.equal(back.loans.length, 2);
  assert.deepEqual(back.loans.map((l) => [l.id, l.left, l.due]), g.loans.map((l) => [l.id, l.left, l.due]));
});

test("typed dispatch: payload coercion boundaries, staged effects, warn-once and collection past zero", () => {
  const g = idle(), city = g.ships[0].at;
  // payload roles validated separately: non-numbers, negatives and off-step values rejected; decimals truncate
  for (const bad of [0, -100, 99, NaN, Infinity, 150]) assert.equal(borrow(g, city, bad).reason, "bad amount", String(bad));
  const dec = borrow(g, city, 100.9); assert.ok(dec.ok); assert.equal(dec.loan.left, 100, "decimals truncate to the step");
  const str = borrow(g, city, "200"); assert.ok(str.ok); assert.equal(str.loan.left, 200, "numeric strings are coerced");
  // staged effects: ok means the record AND the money moved, together
  const cash0 = g.cash;
  const r = borrow(g, city, 300);
  assert.equal(g.loans.length, 3); assert.equal(g.cash, cash0 + 300, "record and money complete together");
  // the maximum encoded amount is the room itself
  const room = bankRoom(g);
  assert.equal(borrow(g, city, room + 100).reason, "over limit");
  // warn-once: the approaching due date is posted exactly one time
  g.loans.forEach((l) => { l.due = g.day + 5; });
  const box0 = (g.inbox ?? []).length;
  processLoans(g, post);
  const warns = (g.inbox ?? []).slice(0, (g.inbox ?? []).length - box0).filter((m) => m.kind === "loanDue");
  assert.equal(warns.length, 3, "one warning per loan");
  processLoans(g, post);
  assert.equal((g.inbox ?? []).filter((m) => m.kind === "loanDue").length, 3, "no re-warning");
  // collection: an unsigned debt can drive the signed balance negative, by design
  g.cash = 0; g.loans.forEach((l) => { l.due = g.day; });
  processLoans(g, post);
  assert.equal(g.loans.length, 0, "every due loan is collected and closed");
  assert.ok(g.cash < 0, "the balance can go negative collecting an unsigned debt");
  assert.ok((g.inbox ?? []).some((m) => m.kind === "loanLate"));
});

test("repay validates and normalizes before effects: the record only sees the final amount", () => {
  const g = idle(), city = g.ships[0].at;
  const r = borrow(g, city, 500), id = r.loan.id;
  // a payment with no possible effect writes nothing: no cash moved, no record touched, no message
  const box0 = (g.inbox ?? []).length;
  assert.equal(repay(g, id, 0).reason, "no cash");
  assert.equal(repay(g, id, NaN).reason, "no cash");
  assert.equal(repay(g, 999, 100).reason, "no loan");
  assert.equal(r.loan.left, 500); assert.equal((g.inbox ?? []).length, box0, "failed repayments are silent");
  // overpayment normalizes to what is owed; the record and the post see the same final amount
  const cash0 = g.cash;
  const p = repay(g, id, 99999);
  assert.ok(p.ok); assert.equal(p.paid, 500, "clamped to the debt");
  assert.equal(g.cash, cash0 - 500);
  assert.equal(g.loans.length, 0, "a fully paid loan closes");
  const paid = (g.inbox ?? []).find((m) => m.kind === "loanPaid");
  assert.equal(paid.amt, 500, "ledger and record use the same final terms");
  // replaying the closed id is a miss, not a second payment
  const cash1 = g.cash;
  assert.equal(repay(g, id, 100).reason, "no loan");
  assert.equal(g.cash, cash1);
  // partial payment: cash floor is zero and sub-cent offers normalize to nothing
  const r2 = borrow(g, city, 500);
  g.cash = 0.004;
  assert.equal(repay(g, r2.loan.id, 0.004).reason, "no cash", "sub-cent normalizes to zero");
  g.cash = 120.5;
  const p2 = repay(g, r2.loan.id, 200);
  assert.ok(p2.ok); assert.equal(p2.paid, 120.5, "clamped to the cash on hand");
  assert.equal(r2.loan.left, 379.5); assert.equal(g.cash, 0);
});

test("paired legs and separate score: cancel-out transfer with a lasting score, floating interest accumulation", () => {
  const g = idle(); g.credit = true; const city = g.ships[0].at;
  // same-account debit and credit cancel in money while the score update remains
  const cash0 = g.cash, rep0 = (g.payRep ?? {})[city] ?? 0;
  const r = borrow(g, city, 500);
  r.loan.taken = g.day - 100; r.loan.paidInt = 500; // lived long and paid real interest
  assert.ok(repay(g, r.loan.id, 99999).ok);
  assert.equal(g.cash, cash0, "borrow and repay cancel out");
  assert.equal((g.payRep ?? {})[city], rep0 + 1, "but the lender remembers the good payer");
  // a default moves the score the other way, separately from the money leg
  const r2 = borrow(g, city, 500);
  r2.loan.due = g.day; g.cash = 0;
  const rep1 = (g.payRep ?? {})[city];
  processLoans(g, post);
  assert.equal((g.payRep ?? {})[city], rep1 - 1, "the default is recorded");
  assert.equal(g.cash, -500, "and the money leg still collected the full debt");
  // the default's consequence: this lender is shut for a while
  assert.equal(borrow(g, city, 100).reason, "over limit", "the lender stays shut after the default");
  g.day = g.loanLock[city]; g.cash = 10000; // the lock expires; cash first: the room reads net worth
  // collection with cash covers the debt and never touches the score
  const r3 = borrow(g, city, 300);
  assert.ok(r3.ok, "borrowing works again once the lock expires");
  r3.loan.due = g.day;
  const rep2 = (g.payRep ?? {})[city];
  processLoans(g, post);
  assert.equal((g.payRep ?? {})[city], rep2, "a covered collection leaves the score alone");
  assert.equal(g.cash, 10000, "the paired legs match exactly: +300 borrowed, -300 collected");
  // floating accumulation: weekly interest accrues as a float and settles rounded
  g.cash = 10000; g.weekLoanInterest = 0;
  const a = borrow(g, city, 500), b = borrow(g, city, 300);
  a.loan.due = g.day; b.loan.due = g.day;
  processLoans(g, post);
  const rate = a.loan.rate ?? LOAN_RATE;
  assert.ok(Math.abs(g.weekLoanInterest - (500 * rate + 300 * rate)) < 1e-9, "interest accumulates per loan as a float");
  // rounding: sub-cent payment parts round to cents
  const r4 = borrow(g, city, 500);
  const p = repay(g, r4.loan.id, 33.333);
  assert.ok(p.ok); assert.equal(p.paid, 33.33); assert.equal(r4.loan.left, 466.67);
});

test("record reservation: failed requests consume no id, ids are never reused, stale handles commit nothing", () => {
  const g = idle(), city = g.ships[0].at;
  // a refused request reserves nothing: the sequence does not move
  const a = borrow(g, city, 100); assert.ok(a.ok);
  const seq = g.nextLoan;
  assert.equal(borrow(g, city, 150).reason, "bad amount");
  assert.equal(borrow(g, "lisboa", 100).reason, "no ship here");
  assert.equal(g.nextLoan, seq, "failed requests consume no id");
  const b = borrow(g, city, 100);
  assert.equal(b.loan.id, seq + 1, "the next accepted request gets the next id");
  // a closed record frees no id: reservation is monotonic across the whole game
  assert.ok(repay(g, a.loan.id, 99999).ok);
  assert.equal(g.loans.length, 1);
  const c = borrow(g, city, 100);
  assert.ok(c.loan.id > a.loan.id, "no id is ever reused after closing");
  // a stale handle commits nothing: the closed record is out of the pool
  const stale = b.loan;
  assert.ok(repay(g, b.loan.id, 99999).ok);
  stale.left = 12345; // mutating the old handle
  assert.equal(g.loans.some((l) => l.left === 12345), false, "stale writes do not reach the pool");
  assert.equal(repay(g, stale.id, 100).reason, "no loan");
  // reload: the sequence survives, fresh ids never collide with reloaded records
  const back = deserialize(serialize(g, "X"), world).g;
  const d = (() => { const bb = borrow(back, city, 100); return bb; })();
  assert.ok(d.ok);
  assert.ok(back.loans.filter((l) => l !== d.loan).every((l) => l.id !== d.loan.id), "fresh id after reload: no collision with the reloaded records");
  assert.ok(d.loan.id >= g.nextLoan, "the sequence continues, never rewinds");
});
