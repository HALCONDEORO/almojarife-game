// Reputation trazabilidad (Estudios 5, Marco 30/10): the port's welcome (reputation.mjs) and the
// cumulative sales record (rank.mjs respect) are two separate ledgers answering two questions -
// "did you help this port?" (scarcity-based, fades when you stay away) and "how much have you
// traded here?" (never fades). These tests pin that trade without real supply help earns no port
// fame, that the two ledgers never leak into each other, that monthly decay fires exactly once
// through the real day tick, and that a save/load at the boundary neither skips nor repeats a
// temporal effect (decay) nor resets a daily one (the per-port cap).
// The base scarcity/round-trip/day-cap contracts live in reputation.test.mjs; nothing duplicated.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doSell, advanceDay, TICKS_PER_DAY } from "../src/game/game.mjs";
import { addRep, repOnSale, repOnBuy, noteTrade, decayRep, portRep, REP_DAY_CAP } from "../src/game/reputation.mjs";
import { repOf } from "../src/game/rank.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const fresh = () => newGame(world, "cadiz", { freePlay: true }); // free play: no campaign noise in the log
const balanced = (gm, good = "grain") => { const row = gm.market.cadiz[good]; row.stock = row.target; return row; }; // scarcity exactly 1: the port is not short
const r2 = (num) => Math.round(num * 100) / 100;

test("a balanced sale counts in the sales record but earns no port fame: two ledgers, two questions", () => {
  const gm = fresh();
  const sh = gm.ships[0];
  balanced(gm);
  sh.cargo.grain = 5; sh.basis = { grain: 100 };
  const sold = doSell(gm, sh, "grain", 5);
  assert.ok(sold.ok, "the sale went through");
  assert.equal(portRep(gm, "cadiz"), 0, "no supply help, no reputation: trade alone does not reward automatically");
  assert.equal(r2(repOf(gm, "cadiz")), r2(sold.revenue / 100), "the cumulative sales record still counts the trade");
});

test("decay fades the port name but never touches the sales record", () => {
  const gm = fresh();
  const sh = gm.ships[0];
  balanced(gm);
  sh.cargo.grain = 5; sh.basis = { grain: 100 };
  const sold = doSell(gm, sh, "grain", 5); // respect now; noteTrade marks the port active
  assert.ok(sold.ok);
  addRep(gm, "cadiz", 30); // an earned name from earlier shortages
  const record = repOf(gm, "cadiz");
  gm.repTrade.cadiz = 0; // force the idle clock: no trade for a month
  gm.day = 30; decayRep(gm);
  assert.equal(portRep(gm, "cadiz"), 20, "the idle month fades 10 points of reputation");
  assert.equal(repOf(gm, "cadiz"), record, "respect is a sales record: it does not decay");
});

test("through the real day tick, decay fires exactly once on the monthly boundary", () => {
  const gm = fresh();
  addRep(gm, "cadiz", 40);
  noteTrade(gm, "cadiz"); // traded on day 0
  gm.day = 29; gm.tick = 29 * TICKS_PER_DAY; // the day counter and the clock agree
  advanceDay(gm);
  assert.equal(gm.day, 30, "one real day passed");
  assert.equal(portRep(gm, "cadiz"), 30, "one idle month: exactly 10 points, once");
  advanceDay(gm);
  assert.equal(gm.day, 31);
  assert.equal(portRep(gm, "cadiz"), 30, "no second decay the next day");
});

test("a save/load at the boundary neither skips nor repeats decay, and the daily cap survives the reload", () => {
  const gm = fresh();
  addRep(gm, "cadiz", 40);
  noteTrade(gm, "cadiz");
  gm.day = 29; gm.tick = 29 * TICKS_PER_DAY;
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(gm, "T"))), world).g;
  advanceDay(restored);
  assert.equal(restored.day, 30);
  assert.equal(portRep(restored, "cadiz"), 30, "the pending decay fires exactly once after the reload");
  advanceDay(restored);
  assert.equal(portRep(restored, "cadiz"), 30, "and the reloaded state does not decay again");

  const capped = fresh();
  repOnSale(capped, "cadiz", 3, 100000); // +5: the per-sale cap
  repOnSale(capped, "cadiz", 3, 100000); // +5: the per-port daily cap REP_DAY_CAP reached
  assert.equal(portRep(capped, "cadiz"), REP_DAY_CAP);
  assert.equal(repOnSale(capped, "cadiz", 3, 100000), 0, "the daily cap binds the same day");
  const reloaded = deserialize(JSON.parse(JSON.stringify(serialize(capped, "T"))), world).g;
  assert.equal(repOnSale(reloaded, "cadiz", 3, 100000), 0, "a reload does not reset the daily cap for more farming");
  advanceDay(reloaded);
  assert.ok(repOnSale(reloaded, "cadiz", 3, 100000) > 0, "the next day can earn again");
});

test("contributions aggregate additively, fractions included, gains and losses alike", () => {
  const gm = fresh();
  assert.equal(repOnSale(gm, "cadiz", 1.5, 100), 1);
  assert.equal(repOnSale(gm, "cadiz", 1.5, 250), 2.5, "fractional contributions are kept, not rounded away");
  assert.equal(portRep(gm, "cadiz"), 3.5, "the aggregate is the exact sum, not a max and not integer-truncated");
  assert.equal(repOnBuy(gm, "cadiz", 1.5, 100), -1, "losses aggregate the same way");
  assert.equal(portRep(gm, "cadiz"), 2.5);
});

test("the doubling boundary is exact: balanced is nothing, just under critical earns the single rate", () => {
  const gm = fresh();
  assert.equal(repOnSale(gm, "cadiz", 1, 500), 0, "scarcity exactly 1: no gift");
  assert.equal(repOnSale(gm, "cadiz", 1.99, 100), 1, "short but not critical: single rate, no rounding up to double");
  assert.equal(repOnSale(gm, "cadiz", 2, 100), 2, "critical doubles");
});
