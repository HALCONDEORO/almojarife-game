import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld, route } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell, doSail, waitUntilArrival, buyCaravel, netWorth, GOAL_CASH } from "../src/game/game.mjs";
const world = loadWorld();

test("a new game starts with 2000, one cog, day 0", () => {
  const g = newGame(world);
  assert.equal(g.cash, 2000); assert.equal(g.ships.length, 1); assert.equal(g.day, 0);
});
test("buy, sail, arrive, sell: cash and cargo stay consistent", () => {
  const g = newGame(world), s = g.ships[0];
  const b = doBuy(g, s, "salt", 20); assert.ok(b.ok); assert.equal(g.cash, 2000 - b.cost);
  assert.ok(doSail(g, s, "lisboa").ok);
  assert.equal(doSell(g, s, "salt", 5).ok, false, "cannot sell at sea");
  waitUntilArrival(g, s); assert.equal(s.at, "lisboa");
  const r = doSell(g, s, "salt", 20); assert.ok(r.ok); assert.deepEqual(s.cargo, {});
});
test("player cannot overspend or buy a second ship without money", () => {
  const g = newGame(world); g.cash = 10;
  assert.equal(doBuy(g, g.ships[0], "pepper", 5).ok, false);
  assert.equal(buyCaravel(g, "cadiz").ok, false);
});
test("second ship purchase works at 3000", () => {
  const g = newGame(world); g.cash = 3500;
  assert.ok(buyCaravel(g, "cadiz").ok); assert.equal(g.cash, 500); assert.equal(g.ships.length, 2);
});
test("game ends at the deadline and cash never goes negative", () => {
  const g = newGame(world);
  for (let i = 0; i < 400; i++) advanceDay(g);
  assert.ok(g.over === "lose" || g.over === "win"); assert.ok(g.cash >= 0);
});
// Greedy bot: buy the best current-quote margin, sail there, repeat. Shows the game is winnable but not trivial.
function runBot() {
  const g = newGame(world), s = g.ships[0], goods = Object.keys(world.goods);
  const q = (e, gd) => Math.round(world.goods[gd].base * Math.min(3, Math.max(0.4, (e.target / Math.max(1, e.stock)) ** 0.6)));
  while (!g.over) {
    if (!s.voyage) {
      for (const good of Object.keys(s.cargo)) doSell(g, s, good, s.cargo[good]);
      let plan = null;
      for (const d of world.cities) { if (d.id === s.at) continue;
        for (const gd of goods) {
          const here = g.market[s.at][gd]; if (here.stock < 1) continue;
          const m = q(g.market[d.id][gd], gd) / q(here, gd);
          if (m > 1.1 && (!plan || m > plan.m)) plan = { d: d.id, gd, m };
        } }
      if (plan) { doBuy(g, s, plan.gd, 60); doSail(g, s, plan.d); }
    }
    advanceDay(g);
  }
  return g;
}
test("a greedy bot with one ship can win, but not in the first 100 days", () => {
  const g = runBot();
  console.log("greedy bot:", g.over, "day", g.day, "net worth", netWorth(g), "goal", GOAL_CASH);
  assert.equal(g.over, "win"); assert.ok(g.day > 100, "too easy: won on day " + g.day);
});
test("selling to the goal wins at once, before any upkeep, and ends the game", () => {
  const g = newGame(world), s = g.ships[0];
  assert.ok(doBuy(g, s, "salt", 10).ok);
  g.cash = GOAL_CASH - 1; // one sale away
  assert.ok(doSell(g, s, "salt", 10).ok);
  assert.equal(g.over, "win"); assert.ok(g.cash >= GOAL_CASH);
  const cash = g.cash; advanceDay(g); assert.equal(g.cash, cash, "no upkeep after the game is over");
  assert.equal(doBuy(g, s, "salt", 1).ok, false, "no actions after game over");
});
