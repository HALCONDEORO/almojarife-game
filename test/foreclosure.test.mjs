import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { logSell } from "../src/game/ledger.mjs";
import { takeLoan, processLoans, loanRoom, loansOwed, LOAN_RATE } from "../src/game/bank.mjs";
import { foreclose, lenderLocked, SEIZE_RATE, LOCK_DAYS } from "../src/game/foreclosure.mjs";
import { botFinanceView } from "../src/game/botcredit.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
const world = loadWorld();
const mk = (o = {}) => { const g = newGame(world, "cadiz", { freePlay: true, foreclosure: true, ...o }); g.ships[0].at = "cadiz"; g.ships[0].voyage = null; return g; };
const base = (g, k) => g.world.goods[k].base;
const due = (g) => { g.day = g.loans[0].due; };
test("flag off by default: an unpaid loan behaves as before, no lock, goods untouched", () => {
  const g = mk({ foreclosure: false }); assert.ok(!("foreclosure" in g), "OFF adds no key to the state"); assert.ok(!("loanLock" in g));
  takeLoan(g, "cadiz", 1000, 5000); g.cash = 100; g.ships[0].cargo = { grain: 50 }; due(g);
  processLoans(g); assert.equal(g.cash, -900); assert.equal(g.ships[0].cargo.grain, 50); assert.equal(g.loanLock, undefined);
});
test("seizure: whole units, most valuable first, half base value, proceeds reduce the debt, money is conserved", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 100;
  g.ships[0].cargo = { grain: 20, silk: 30 }; g.warehouses = { cadiz: { goods: { iron: 40 } } };
  const gB = { ...g.ships[0].cargo }, worthBefore = (x) => Object.entries(x.ships[0].cargo).reduce((s, [k, q]) => s + q * base(g, k) * SEIZE_RATE, 0) + Object.entries(x.warehouses.cadiz.goods).reduce((s, [k, q]) => s + q * base(g, k) * SEIZE_RATE, 0);
  const w0 = worthBefore(g), cash0 = g.cash; due(g);
  processLoans(g);
  const w1 = worthBefore(g), proceeds = w0 - w1;
  assert.ok(proceeds > 0); assert.equal(loansOwed(g), 0);
  assert.ok(Math.abs((cash0 - g.cash) - (1000 - proceeds)) < 0.02, "cash fell by the debt minus what the seizure paid");
  const seized = Object.keys(gB).concat("iron").filter((k) => (g.ships[0].cargo[k] ?? g.warehouses.cadiz.goods[k] ?? 0) < (gB[k] ?? 40));
  const unit = (k) => base(g, k);
  assert.ok(unit(seized[0]) >= unit(seized[seized.length - 1]), "most valuable seized first");
});
test("cash is used first: with enough cash nothing is seized, and the lender is not locked", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 5000; g.ships[0].cargo = { silk: 10 }; due(g);
  processLoans(g); assert.equal(g.ships[0].cargo.silk, 10); assert.equal(g.cash, 4000); assert.equal(g.loanLock, undefined);
});
test("only the lender's own port: cargo at sea or docked elsewhere and other warehouses are safe", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 0;
  g.ships.push({ ...g.ships[0], id: 9, at: "sevilla", voyage: null, cargo: { silk: 99 } });
  g.warehouses = { sevilla: { goods: { silk: 99 } } }; g.ships[0].cargo = {}; due(g);
  processLoans(g); assert.equal(g.ships[1].cargo.silk, 99); assert.equal(g.warehouses.sevilla.goods.silk, 99); assert.equal(g.cash, -1000);
});
test("after a default that lender lends nothing for LOCK_DAYS; others still do; flag off never locks", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 20000); g.cash = 0; due(g); processLoans(g);
  assert.ok(lenderLocked(g, "cadiz")); assert.equal(loanRoom(g, 20000, "cadiz"), 0);
  g.ships[0].at = "sevilla"; assert.ok(loanRoom(g, 20000, "sevilla") > 0);
  g.day += LOCK_DAYS; assert.ok(!lenderLocked(g, "cadiz")); assert.ok(loanRoom(g, 20000, "cadiz") > 0);
  const off = mk({ foreclosure: false }); off.loanLock = { cadiz: 1e9 }; assert.ok(!lenderLocked(off, "cadiz"));
});
test("a bot finance view gets the same rule through the same function", () => {
  const g = mk(); const bot = { cash: 0, loans: [], ships: [{ id: 50, at: "cadiz", voyage: null, cargo: { silk: 30 } }], ship: null, warehouses: {} };
  bot.ship = bot.ships[0]; const v = botFinanceView(g, bot);
  takeLoan(v, "cadiz", 500, 5000); v.cash = 0; g.day = v.loans[0].due; v.day = g.day;
  processLoans(v); assert.ok(bot.ships[0].cargo.silk < 30); assert.ok(bot.loanLock.cadiz > g.day); assert.equal(g.loanLock, undefined);
});
test("message in ES and EN; save round trip keeps the lock", () => {
  const m = { kind: "loanSeized", city: "cadiz", amt: 300, units: 12 };
  assert.match(messageText(m, "es", String), /embargó 12 unidades/); assert.match(messageText(m, "en", String), /seized 12 units/);
  const g = mk(); g.loanLock = { cadiz: 99 }; assert.deepEqual(JSON.parse(JSON.stringify({ ...g, world: undefined })).loanLock, { cadiz: 99 });
});
test("money identity: cash after = cash before + proceeds - debt, for partial and total cover, no surplus lost or doubled", () => {
  for (const [cash, silk, grain] of [[0, 10, 0], [0, 12, 30], [0, 3, 3], [500, 10, 0], [999, 5, 60], [-200, 10, 0], [0, 0, 0]]) {
    const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = cash; g.ships[0].cargo = { silk, grain }; g.warehouses = {};
    const val = () => (g.ships[0].cargo.silk ?? 0) * base(g, "silk") * SEIZE_RATE + (g.ships[0].cargo.grain ?? 0) * base(g, "grain") * SEIZE_RATE;
    const v0 = val(), c0 = g.cash; due(g); processLoans(g);
    const proceeds = v0 - val(), debtPaid = 1000;
    assert.ok(Math.abs(g.cash - (c0 + proceeds - debtPaid)) < 0.02, `cash ${cash} silk ${silk} grain ${grain}: ${g.cash} vs ${c0 + proceeds - debtPaid}`);
    assert.equal(loansOwed(g), 0);
  }
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 0; g.ships[0].cargo = { silk: 10 }; g.warehouses = {}; due(g);
  const f = foreclose(g, g.loans[0]); assert.equal(f.surplus, 1100 - 1000); assert.equal(g.loans[0].left, 0); assert.equal(g.cash, 100);
  processLoans(g); assert.equal(g.cash, 100, "the caller takes nothing more and credits nothing again");
});
test("a default with nothing to seize still shuts the lender (proceeds 0)", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 0; g.ships[0].cargo = {}; g.warehouses = {}; due(g); const d = g.day;
  processLoans(g); assert.equal(g.cash, -1000); assert.equal(g.loanLock.cadiz, d + LOCK_DAYS); assert.equal(loanRoom(g, 20000, "cadiz"), 0);
  assert.ok(!g.inbox?.some((m) => m.kind === "loanSeized"), "no seizure message when nothing was seized");
});
test("the last interest of a defaulted loan is charged on what is left after the seizure (intended)", () => {
  const rate = (g) => g.loans[0].rate ?? LOAN_RATE;
  for (const [cash, expectLeft] of [[0, 0], [999, null]]) {
    const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = cash; g.ships[0].cargo = { silk: 10 }; g.warehouses = {}; due(g);
    const r = rate(g), w0 = g.weekLoanInterest ?? 0, loan = g.loans[0], f = foreclose(structuredClone ? { ...g, loans: g.loans.map((l) => ({ ...l })), ships: g.ships.map((s) => ({ ...s, cargo: { ...s.cargo } })), warehouses: {}, loanLock: {} } : g, { ...loan });
    const leftAfter = Math.max(0, 1000 - f.proceeds);
    processLoans(g);
    assert.ok(Math.abs((g.weekLoanInterest ?? 0) - w0 - leftAfter * r) < 0.01, `cash ${cash}: interest ${g.weekLoanInterest} vs ${leftAfter * r}`);
    if (expectLeft === 0) assert.equal(g.weekLoanInterest ?? 0, 0);
  }
});
test("partial seizure keeps the cost basis of what is left (hold basis and trade log), so a later sale reports its true profit", () => {
  const g = mk(); takeLoan(g, "cadiz", 1000, 5000); g.cash = 999; g.warehouses = {};
  const s = g.ships[0]; s.cargo = { silk: 10 }; s.basis = { silk: 1000 }; g.basis = { silk: { qty: 10, cost: 1000 } };
  due(g); processLoans(g);
  assert.equal(s.cargo.silk, 9); assert.equal(s.basis.silk, Math.round(1000 * 9 / 10));
  assert.equal(g.basis.silk.qty, 9); assert.ok(Math.abs(g.basis.silk.cost - 900) < 1e-9);
  const profit = logSell(g, "silk", 9, 2000); assert.ok(Math.abs(profit - (2000 - 900)) < 1e-9, "profit " + profit);
  const h = mk(); takeLoan(h, "cadiz", 1000, 5000); h.cash = 0; h.ships[0].cargo = {}; h.warehouses = { cadiz: { goods: { silk: 20 }, basis: { silk: 2000 } } };
  due(h); processLoans(h); const left = h.warehouses.cadiz.goods.silk;
  assert.equal(left, 20 - Math.ceil(1000 / (h.world.goods.silk.base * SEIZE_RATE))); assert.equal(h.warehouses.cadiz.basis.silk, Math.round(2000 * left / 20));
  const all = mk(); takeLoan(all, "cadiz", 1000, 5000); all.cash = 0; all.ships[0].cargo = { silk: 3 }; all.ships[0].basis = { silk: 300 }; all.warehouses = {}; due(all); processLoans(all);
  assert.ok(!("silk" in all.ships[0].cargo) && !("silk" in all.ships[0].basis), "fully seized: both keys go");
});
