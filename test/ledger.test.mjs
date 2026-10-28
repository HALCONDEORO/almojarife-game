import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, netWorth } from "../src/game/game.mjs";
import { SETTLE_EVERY, dueNow, accruedTotal, post, unread, markRead, markAllRead, settleWeek, MAX_INBOX, MAX_REPORTS, OVERDRAFT_LIMIT } from "../src/game/ledger.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const idle = () => { const g = newGame(world, "cadiz", { cityIdentity: false }); g.eventsOn = false; return g; }; // one cog, docked, no events

test("upkeep is not charged on ordinary days, only on settlement day", () => {
  const g = idle(), c0 = g.cash, per = SHIP_TYPES.cog.upkeepPerDay;
  for (let d = 1; d < SETTLE_EVERY; d++) { advanceDay(g); assert.equal(g.cash, c0, "day " + d + ": cash untouched"); }
  assert.equal(accruedTotal(g), per * (SETTLE_EVERY - 1));
  advanceDay(g);
  assert.equal(g.cash, c0 - per * SETTLE_EVERY);
  assert.equal(accruedTotal(g), 0);
});
test("settlement writes a report with one line per ship and the exact totals", () => {
  const g = idle();
  for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  const r = g.reports[0];
  assert.equal(r.week, 1); assert.equal(r.day, 7); assert.equal(r.lines.length, 1);
  assert.equal(r.upkeep, SHIP_TYPES.cog.upkeepPerDay * 7); assert.equal(r.paid, r.upkeep); assert.equal(r.debt, 0);
  assert.equal(r.cashAfter, g.cash);
});
test("upkeepMul still applies to the weekly bill", () => {
  const g = newGame(world, "cadiz", { upkeepMul: 0.5 }); const c0 = g.cash;
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.cash, c0 - SHIP_TYPES.cog.upkeepPerDay * 7 * 0.5);
});
test("when cash is short the balance goes negative; next week pays 2% interest on the deficit", () => {
  const g = idle(); g.cash = 5;
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.cash, -9); assert.equal(g.reports[0].paid, 14); assert.equal(g.reports[0].debt, 9); assert.equal(g.reports[0].interest, 0);
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.reports[0].carried, 9); assert.equal(g.reports[0].interest, 0.18); assert.equal(g.cash, -9 - 14 - 0.18); assert.equal(g.reports[0].debt, 23.18);
});
test("going back to positive cash stops the interest", () => {
  const g = idle(); g.cash = -50; g.day = 6; advanceDay(g); // settlement on day 7: interest 1 + one day of upkeep (2)
  assert.equal(g.reports[0].interest, 1); assert.equal(g.cash, -53);
  g.cash = 500; for (let d = 0; d < 7; d++) advanceDay(g);
  assert.equal(g.reports[0].interest, 0); assert.equal(g.cash, 486);
});
test("bankruptcy: a deficit past the limit ends the game, a smaller one does not", () => {
  const g = idle(); g.cash = -(OVERDRAFT_LIMIT - 5); advanceDay(g);
  assert.equal(g.over, null);
  g.cash = -(OVERDRAFT_LIMIT + 1); advanceDay(g);
  assert.equal(g.over, "lose"); assert.equal(g.overReason, "bankrupt");
});
test("money owed counts against net worth, so waiting for settlement day gives no free money", () => {
  const g = idle(); const w0 = netWorth(g);
  for (let d = 0; d < 3; d++) advanceDay(g);
  assert.equal(netWorth(g), w0 - 3 * SHIP_TYPES.cog.upkeepPerDay);
  for (let d = 0; d < 4; d++) advanceDay(g);
  assert.equal(netWorth(g), w0 - 7 * SHIP_TYPES.cog.upkeepPerDay);
});
test("dueNow shows accrued upkeep plus the interest on a negative balance", () => {
  const g = idle(); g.cash = 0;
  for (let d = 0; d < 7; d++) advanceDay(g);
  for (let d = 0; d < 2; d++) advanceDay(g);
  assert.equal(dueNow(g), 4 + 0.28);
});
test("a settlement posts a message; reading it clears the unread count", () => {
  const g = idle();
  for (let d = 0; d < 7; d++) advanceDay(g);
  const m = g.inbox.find((x) => x.kind === "report");
  assert.ok(m); assert.equal(m.week, 1); assert.equal(unread(g) >= 1, true);
  assert.equal(markRead(g, m.id), true); assert.equal(markRead(g, 99999), false);
  markAllRead(g); assert.equal(unread(g), 0);
});
test("arrival and ship delivery post messages", () => {
  const g = idle(); g.cash = 1e6; g.orders = [{ type: "barca", at: "cadiz", readyDay: 1 }];
  advanceDay(g);
  assert.ok(g.inbox.some((m) => m.kind === "order" && m.type === "barca"));
});
test("inbox and report history are capped", () => {
  const g = idle();
  for (let i = 0; i < MAX_INBOX + 20; i++) post(g, "info", { txt: "x" });
  assert.equal(g.inbox.length, MAX_INBOX);
  g.accrued = { ships: {} };
  for (let w = 1; w <= MAX_REPORTS + 5; w++) { g.day = w * SETTLE_EVERY; settleWeek(g); }
  assert.equal(g.reports.length, MAX_REPORTS);
});
test("no settlement off the weekly rhythm, and none on day 0", () => {
  const g = idle(); assert.equal(settleWeek(g), null); g.day = 8; assert.equal(settleWeek(g), null);
});
test("reports, inbox and accrued survive save and load; an old save without them still plays", () => {
  const g = idle();
  for (let d = 0; d < 9; d++) advanceDay(g);
  const back = deserialize(serialize(g, "Casa"), world).g;
  assert.deepEqual(back.reports, g.reports); assert.deepEqual(back.inbox, g.inbox); assert.deepEqual(back.accrued, g.accrued);
  delete back.reports; delete back.inbox; delete back.accrued; delete back.nextMsg;
  for (let d = 0; d < 7; d++) advanceDay(back);
  assert.ok(back.reports.length >= 1);
});

import { reportsHtml, inboxHtml, messageText, daysToSettle, badge, LT } from "../src/view/ledgerview.mjs";
const fmt = (n) => String(Math.round(n));
test("view: reports screen shows the next payment, each ship line and both languages", () => {
  const g = idle(); for (let d = 0; d < 9; d++) advanceDay(g);
  for (const lang of ["es", "en"]) {
    const h = reportsHtml(g, lang, fmt);
    assert.ok(h.includes(LT[lang].reports)); assert.ok(h.includes(g.ships[0].name)); assert.ok(h.includes(LT[lang].nextIn.replace("{n}", 5)));
  }
  assert.ok(reportsHtml(idle(), "es", fmt).includes(LT.es.none));
});
test("view: days to the next settlement", () => {
  assert.equal(daysToSettle(0), 7); assert.equal(daysToSettle(3), 4); assert.equal(daysToSettle(6), 1); assert.equal(daysToSettle(7), 7);
});
test("view: inbox lists messages, marks unread, and escapes text", () => {
  const g = idle(); post(g, "info", { txt: "<b>x</b> & \"y\"" }); post(g, "respect", { city: "lisboa" }); post(g, "halt", { ship: 1, city: "lisboa" }); // only action messages (halt) carry the unread tag
  const h = inboxHtml(g, "en", fmt, (c) => c.toUpperCase());
  assert.ok(h.includes("LISBOA")); assert.ok(h.includes("unread")); assert.ok(!h.includes("<b>x</b>")); assert.ok(h.includes("&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;"));
  markAllRead(g); assert.ok(!inboxHtml(g, "en", fmt).includes('class="msg unread"'));
  assert.ok(inboxHtml(idle(), "es", fmt).includes(LT.es.noMsg));
});
test("view: message text with debt, event text per language, and unread badge", () => {
  assert.equal(messageText({ kind: "report", week: 2, paid: 5, debt: 9 }, "en", fmt), "Weekly report 2: paid 5, still owed 9");
  assert.equal(messageText({ kind: "event", txt: { es: "Tormenta", en: "Storm" } }, "es", fmt), "Tormenta");
  assert.equal(badge("Mensajes", 3), "Mensajes (3)"); assert.equal(badge("Mensajes", 0), "Mensajes");
});

import { warnLowCash } from "../src/game/ledger.mjs";
test("warning: the day before settlement, low cash posts one warning with the amounts", () => {
  const g = idle(); g.cash = 3; // far below a week of upkeep
  for (let d = 0; d < SETTLE_EVERY - 1; d++) advanceDay(g);
  const w = g.inbox.filter((m) => m.kind === "warn");
  assert.equal(w.length, 1); assert.equal(w[0].day, SETTLE_EVERY - 1);
  assert.equal(w[0].cash, 3); assert.equal(w[0].due, Math.round(SHIP_TYPES.cog.upkeepPerDay * SETTLE_EVERY * 100) / 100);
  assert.equal(warnLowCash(g), true); // same day again would repeat; the game calls it once per day
});
test("warning: no message when cash covers the bill, and none on other days", () => {
  const g = idle(); for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  assert.equal(g.inbox.filter((m) => m.kind === "warn").length, 0);
  const h = idle(); h.cash = 0; h.day = 2; assert.equal(warnLowCash(h), false);
});
test("debt: a settlement that cannot be paid in full posts a debt message", () => {
  const g = idle(); g.cash = 5; for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(g);
  const m = g.inbox.find((x) => x.kind === "debt"); assert.ok(m); assert.equal(m.owed, g.reports[0].debt); assert.ok(m.owed > 0);
  const ok = idle(); for (let d = 0; d < SETTLE_EVERY; d++) advanceDay(ok); assert.ok(!ok.inbox.some((x) => x.kind === "debt"));
});
test("view: warning and debt messages read well in both languages", () => {
  assert.equal(messageText({ kind: "warn", due: 70, cash: 3 }, "en", fmt), "Upkeep is due tomorrow: 70. You have 3 in cash. If it is not enough, your cash goes negative and pays interest.");
  assert.ok(messageText({ kind: "warn", due: 70, cash: 3 }, "es", fmt).startsWith("Mañana toca pagar el mantenimiento: 70."));
  assert.equal(messageText({ kind: "debt", owed: 12, rate: 2, limit: 3000 }, "en", fmt), "Cash is negative: you owe 12. Every week 2% interest is charged on that debt. Past 3000, you go bankrupt.");
  assert.ok(messageText({ kind: "debt", owed: 12, rate: 2, limit: 3000 }, "es", fmt).includes("debes 12"));
});
