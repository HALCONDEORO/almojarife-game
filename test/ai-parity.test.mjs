// Bot/player parity in the live game (Marco's standing rule: bots play by the player's rules).
// The concejo's sisa applies to bot deals and every derecho a bot pays feeds the same caja;
// bots pay the same portazgo when they make port. The fee was always priced into their deals;
// now the coins land in the town's chest instead of vanishing, and the toll is a real cost.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket } from "../src/sim/market.mjs";
import { makeShip, sell, FEE } from "../src/sim/trade.mjs";
import { aiStep } from "../src/sim/ai.mjs";
import { newGame, advanceTick, advanceDay } from "../src/game/game.mjs";
import { cajaOf, cajaTarget } from "../src/game/council.mjs";
import { aiTollFor, baseToll } from "../src/game/tolls.mjs";
const world = loadWorld();
const game = () => { const g = newGame(world); g.eventsOn = false; return g; };

test("bots pay the concejo's sisa on their deals and every derecho is reported", () => {
  const good = Object.keys(world.goods)[0], f = FEE * 1.5; // a concejo at sisa +2 (the cap)
  const m0 = makeMarket(world), s0 = makeShip(0, "caravel", "cadiz");
  s0.cargo = { [good]: 10 };
  const ref = sell(world, m0, s0, good, 10, f);
  assert.ok(ref.ok);
  const m = makeMarket(world), ship = makeShip(0, "caravel", "cadiz");
  ship.cargo = { [good]: 10 };
  const trader = { cash: 0, ship }, sales = [], buys = [];
  aiStep(world, m, trader, ship, { feeMul: () => 1.5, onSale: (c, g2, s, rev) => sales.push([c, rev]), onBuy: (c, g2, s, cost) => buys.push([c, cost]) });
  assert.equal(sales.length, 1, "the sale is reported");
  assert.equal(sales[0][0], "cadiz");
  assert.ok(Math.abs(sales[0][1] - ref.revenue) < 0.02, JSON.stringify({ got: sales[0][1], want: ref.revenue }));
  for (const [c] of [...sales, ...buys]) assert.equal(c, "cadiz");
});

test("without hooks the bots trade exactly as before (plain fee, no chest)", () => {
  const run = (hooks) => {
    const m = makeMarket(world), ship = makeShip(1, "cog", "sevilla"), t = { cash: 500, ship };
    aiStep(world, m, t, ship, hooks);
    return JSON.stringify([t, m]);
  };
  assert.equal(run(), run({ feeMul: () => 1, onSale: () => {}, onBuy: () => {} }));
});

test("a bot that makes port pays the same portazgo, straight into the caja", () => {
  const g = game(), t = g.ai[0], dest = world.cities.find((c) => c.id !== t.ship.at).id;
  t.ship.cargo = {};
  t.ship.voyage = { from: t.ship.at, to: dest, ticksLeft: 1, totalTicks: 1, path: [t.ship.at, dest], km: 1 };
  const toll = aiTollFor(g, t.ship, dest), before = cajaOf(g, dest);
  assert.ok(toll > 0);
  assert.equal(toll, baseToll(t.ship)); // a neutral concejo charges the plain arqueo
  t.cash = toll; // exactly the toll: no cash left for a purchase, so the toll is the whole story
  advanceTick(g);
  assert.equal(t.ship.at, dest);
  assert.equal(t.cash, 0);
  assert.ok(cajaOf(g, dest) >= before + toll - 0.02, JSON.stringify({ caja: cajaOf(g, dest), before, toll }));
});

test("a concejo's portazgo steps raise the bot toll like the player's", () => {
  const g = game(), s = g.ai[0].ship;
  g.hallTax = { lisboa: { sisa: 0, portazgo: 2 } };
  assert.ok(Math.abs(aiTollFor(g, s, "lisboa") - baseToll(s) * 1.5) < 0.02);
  g.hallTax = { lisboa: { sisa: 0, portazgo: -2 } };
  assert.ok(Math.abs(aiTollFor(g, s, "lisboa") - baseToll(s) * 0.5) < 0.02);
});

test("bot derechos reach the town chests in a normal day tick", () => {
  const g = game();
  advanceDay(g);
  const gains = world.cities.map((c) => cajaOf(g, c.id) - cajaTarget(world, c.id));
  assert.ok(gains.some((x) => x > 0), JSON.stringify(gains));
});
