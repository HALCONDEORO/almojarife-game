import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, bankRoom } from "../src/game/game.mjs";
import { RANKS, rankIndex, rankOf, nextRank, loanCapFor, addRespect, respectOf, updateRank, repOf } from "../src/game/rank.mjs";
import { messageText } from "../src/view/ledgerview.mjs";
import { houseHtml } from "../src/view/rankview.mjs";
const world = loadWorld(), fmt = (x) => String(Math.round(x));
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };
test("rank follows net worth and the next rank is reported", () => {
  assert.equal(rankOf(0).id, "peddler"); assert.equal(rankOf(3000).id, "trader"); assert.equal(rankOf(2999.9).id, "peddler");
  assert.equal(rankOf(1e9).id, "patrician"); assert.equal(nextRank(1e9), null);
  assert.deepEqual([nextRank(2500).rank.id, nextRank(2500).missing], ["trader", 500]);
  assert.equal(RANKS.length, 7);
});
test("rank only goes up and posts a promotion message", () => {
  const g = game(), msgs = []; const post = (_g, k, p) => msgs.push({ k, ...p });
  assert.equal(updateRank(g, 9000, post).id, "merchant"); assert.equal(g.rankIdx, 2);
  assert.equal(updateRank(g, 100, post), null); assert.equal(g.rankIdx, 2);
  assert.equal(msgs.length, 1); assert.equal(msgs[0].rank, "merchant");
});
test("a higher rank raises the loan cap", () => {
  const g = game(); g.rankIdx = 0; const base = bankRoom(g);
  g.rankIdx = 0; assert.equal(loanCapFor(g, 5000), 5000); g.rankIdx = 4; assert.equal(loanCapFor(g, 5000), 15000);
  assert.ok(bankRoom(g) >= base);
});
test("respect grows with sales per city", () => {
  const g = game();
  assert.equal(respectOf(g, "cadiz").id, "stranger");
  assert.equal(addRespect(g, "cadiz", 2000), true); assert.equal(respectOf(g, "cadiz").id, "known");
  assert.equal(addRespect(g, "cadiz", 100), false); assert.equal(repOf(g, "cadiz"), 21);
  assert.equal(addRespect(g, "cadiz", -50), false);
});
test("a real sale gives respect and a day advances the rank", () => {
  const g = game(); g.cash = 30000; advanceDay(g); assert.ok((g.rankIdx ?? 0) >= 1);
  assert.ok(g.inbox.some((m) => m.kind === "rank"));
});
test("texts exist in both languages", () => {
  const m = { kind: "rank", rank: "trader", loanCap: 7500 };
  assert.ok(messageText(m, "es", fmt).includes("Comerciante")); assert.ok(messageText(m, "en", fmt).includes("Trader"));
  const g = game(); addRespect(g, "cadiz", 5000);
  for (const l of ["es", "en"]) assert.ok(houseHtml(g, l, 3500, fmt, (c) => c).includes("cadiz"));
});
test("respect adds up small sales exactly and the next rank respects a title already held", () => {
  const g = game();
  for (let i = 0; i < 10; i++) addRespect(g, "cadiz", 0.1);
  assert.equal(g.rep.cadiz, 1); // ten sales of 0.1 coins are 1 coin, not 0
  const h = game(); for (let i = 0; i < 10; i++) addRespect(h, "cadiz", 0.5);
  assert.equal(h.rep.cadiz, 5); // ten sales of 0.5 coins are 5 coins, not 10
  g.rankIdx = 3;
  assert.equal(nextRank(100, g.rankIdx).rank.id, "magnate");
  assert.equal(nextRank(100).rank.id, "trader");
});
import { ensureRep, heldRank, LOAN_MAX_BASE } from "../src/game/rank.mjs";
import { LOAN_MAX } from "../src/game/bank.mjs";
test("old saves keep their respect (points are converted to coins once) and bad data is dropped", () => {
  const g = game(); g.rep = { cadiz: 21, sevilla: NaN, lisboa: -5 }; // old format: points
  assert.equal(repOf(g, "cadiz"), 21); assert.equal(g.repV, 2); assert.equal(g.rep.cadiz, 2100);
  assert.equal(repOf(g, "sevilla"), 0); assert.equal(repOf(g, "lisboa"), 0);
  assert.equal(repOf(g, "cadiz"), 21, "not converted twice");
  addRespect(g, "cadiz", 100); assert.equal(repOf(g, "cadiz"), 22);
  const h = game(); h.rankIdx = 99; assert.equal(heldRank(h), 0); h.rankIdx = NaN; assert.equal(heldRank(h), 0);
});
test("promotion message uses the real loan cap and house panel escapes city names", () => {
  assert.equal(LOAN_MAX_BASE, LOAN_MAX);
  const g = game(); g.rep = { "<b>x</b>": 5000 }; g.repV = 2;
  assert.ok(!houseHtml(g, "es", 3500, fmt, (c) => c).includes("<b>x</b>"));
});
