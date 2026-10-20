import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth, borrow, repay, bankRoom, loansOwed } from "../src/game/game.mjs";
import { LOAN_RATE, LOAN_TERM_DAYS, LOAN_MAX, loanInterest } from "../src/game/bank.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const idle = () => { const g = newGame(world); g.eventsOn = false; return g; };
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
