import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse } from "../src/game/game.mjs";
import { buy, previewBuy } from "../src/sim/trade.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  const ship = game.ships[0];
  game.market.cadiz.grain.stock = game.market.cadiz.grain.target * 4; // clamp-low, plenty
  return { game, ship };
};

test("an exactly sufficient balance buys the full amount", () => {
  const { game, ship } = setup();
  const quote = previewBuy(world, game.market, ship, game.cash, "grain", 5);
  assert.equal(quote.qty, 5);
  const exact = buy(world, game.market, ship, quote.cost, "grain", 5);
  assert.ok(exact.ok);
  assert.equal(exact.qty, 5, "cost == balance is affordable");
  assert.ok(Math.abs(exact.cost - quote.cost) < 1e-9);
});

test("a cent short buys one unit less, never a negative balance", () => {
  const { game, ship } = setup();
  const quote = previewBuy(world, game.market, ship, game.cash, "grain", 5);
  const short = buy(world, game.market, ship, quote.cost - 0.01, "grain", 5);
  assert.ok(short.ok);
  assert.equal(short.qty, 4, "the last unit no longer fits the purse");
  assert.ok(short.cost <= quote.cost - 0.01);
});

test("the inverse is maximal: one more unit than proposed would exceed the budget", () => {
  const { game, ship } = setup();
  const budget = 37;
  const quote = previewBuy(world, game.market, ship, budget, "grain", Infinity);
  assert.ok(quote.qty > 0);
  assert.ok(quote.cost <= budget, "the proposal fits the budget");
  const greedy = buy(world, game.market, ship, budget, "grain", quote.qty + 1);
  assert.ok(greedy.ok);
  assert.equal(greedy.qty, quote.qty, "the commit cannot afford the extra unit either");
});

test("bad quantities and bad balances are rejected before anything moves", () => {
  const { game, ship } = setup();
  const stockBefore = game.market.cadiz.grain.stock;
  for (const qty of [0, -3, 2.5, NaN]) {
    const res = buy(world, game.market, ship, game.cash, "grain", qty);
    assert.equal(res.ok, false);
    assert.equal(res.reason, "bad quantity");
  }
  for (const cash of [NaN, Infinity, -1, "100"]) {
    const res = buy(world, game.market, ship, cash, "grain", 5);
    assert.equal(res.ok, false);
    assert.equal(res.reason, "bad cash");
  }
  assert.equal(game.market.cadiz.grain.stock, stockBefore, "rejections never touch the market");
  assert.equal(ship.cargo.grain ?? 0, 0);
});


test("quote and commit agree on fractional fees and budgets", () => {
  for (const fee of [0, 0.015, 0.02, 0.0375]) {
    for (const budget of [0, 0.01, 7.99, 37.11, 1000.25]) {
      const { game, ship } = setup();
      const quote = previewBuy(world, game.market, ship, budget, "grain", Infinity, fee);
      const result = buy(world, game.market, ship, budget, "grain", Math.max(1, quote.qty + 1), fee);
      assert.equal(result.qty ?? 0, quote.qty);
      assert.ok(Math.abs((result.cost ?? 0) - quote.cost) < 1e-9);
      assert.ok((result.cost ?? 0) <= budget);
    }
  }
});
