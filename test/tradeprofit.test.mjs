import test from "node:test";
import assert from "node:assert/strict";
import { logBuy, logSell } from "../src/game/ledger.mjs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { reportsHtml } from "../src/view/ledgerview.mjs";
import { loadWorld } from "../src/sim/world.mjs";
const world = loadWorld();
const fmt = (n) => String(Math.round(n));

test("profit uses the average purchase price", () => {
  const g = { };
  logBuy(g, "wool", 10, 100); logBuy(g, "wool", 10, 300); // average 20 each
  logSell(g, "wool", 5, 150);                               // cost 100, profit 50
  assert.equal(g.weekTrade.wool.profit, 50);
  assert.equal(g.basis.wool.qty, 15);
  logSell(g, "wool", 15, 200);                              // cost 300, loss 100
  assert.equal(g.weekTrade.wool.profit, -50);
});
test("selling more than was logged does not invent cost", () => {
  const g = {}; logSell(g, "salt", 4, 40);
  assert.equal(g.weekTrade.salt.profit, 40);
});
test("the weekly report lists profit per good, best first, and resets", () => {
  const g = newGame(world); g.eventsOn = false;
  logBuy(g, "wool", 10, 100); logSell(g, "wool", 10, 180);
  logBuy(g, "salt", 10, 100); logSell(g, "salt", 10, 70);
  for (let d = 0; d < 7; d++) advanceDay(g);
  const r = g.reports[0];
  assert.deepEqual(r.trades.map((x) => [x.good, x.profit]), [["wool", 80], ["salt", -30]]);
  assert.deepEqual(g.weekTrade, {});
  const h = reportsHtml(g, "es", fmt, (k) => ({ wool: "Lana", salt: "Sal" })[k]);
  assert.ok(h.includes("Comercio de la semana") && h.includes("Lana") && h.includes("<b>-30</b>") && h.includes("<b>50</b>"));
  assert.ok(reportsHtml(g, "en", fmt).includes("Trade this week"));
  for (let d = 0; d < 7; d++) advanceDay(g);
  assert.deepEqual(g.reports[0].trades, []);
});
