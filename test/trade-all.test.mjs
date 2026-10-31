import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse, warehouseCap, takeGoods } from "../src/game/game.mjs";
import { buy, previewBuy, shipCapacity } from "../src/sim/trade.mjs";
import { price } from "../src/sim/market.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};

test("the typed all: takeGoods(Infinity) fills the hold exactly, never a sentinel amount", () => {
  const game = setup();
  const ship = game.ships[0];
  const room = shipCapacity(ship);
  game.warehouses.cadiz.goods.grain = room + 50; // more stored than fits
  const first = takeGoods(game, ship, "grain", Infinity);
  assert.ok(first.ok);
  assert.equal(first.qty, room, "limited by the hold, not by 9999");
  assert.equal(ship.cargo.grain, room);
  const second = takeGoods(game, ship, "grain", Infinity);
  assert.equal(second.ok, false, "a full hold is 'nothing to take', not a phantom transfer");
  ship.cargo = {};
  game.warehouses.cadiz.goods.grain = 7; // less stored than fits
  const third = takeGoods(game, ship, "grain", Infinity);
  assert.equal(third.qty, 7, "limited by the store");
  assert.equal(game.warehouses.cadiz.goods.grain ?? 0, 0);
});

test("previewBuy(Infinity) proposes the effective quantity after stock, room and cash caps", () => {
  const game = setup();
  const ship = game.ships[0];
  const entry = game.market.cadiz.grain;
  entry.stock = entry.target * 4; // clamp-low price, plenty of stock
  const quote = previewBuy(world, game.market, ship, game.cash, "grain", Infinity);
  assert.equal(quote.qty, shipCapacity(ship), "room is the binding cap here");
  assert.equal(quote.limit, "room");
  entry.stock = 5; // less stock than room
  const quote2 = previewBuy(world, game.market, ship, game.cash, "grain", Infinity);
  assert.equal(quote2.qty, 5);
  assert.equal(quote2.limit, "stock");
  const quote3 = previewBuy(world, game.market, ship, 3, "grain", Infinity);
  assert.ok(quote3.qty < 5 && quote3.limit === "cash", "a small purse caps by cash");
});

test("a quote is not a transaction: the commit re-validates against the live state", () => {
  const game = setup();
  const ship = game.ships[0];
  const entry = game.market.cadiz.grain;
  entry.stock = entry.target * 4;
  const quote = previewBuy(world, game.market, ship, game.cash, "grain", Infinity);
  // unchanged state: the commit matches the quote exactly
  const same = buy(world, game.market, ship, game.cash, "grain", quote.qty);
  assert.ok(same.ok);
  assert.equal(same.qty, quote.qty);
  assert.ok(Math.abs(same.cost - quote.cost) < 0.02, "same curve, same fee: the quote held");
  // stale quote: less cash at commit time -> the commit clamps, it does not overdraw
  const game2 = setup();
  const ship2 = game2.ships[0];
  game2.market.cadiz.grain.stock = game2.market.cadiz.grain.target * 4;
  const quote2 = previewBuy(world, game2.market, ship2, game2.cash, "grain", Infinity);
  const tight = Math.max(1, Math.floor(quote2.cost / 2)); // about half the quoted cost
  const stale = buy(world, game2.market, ship2, tight, "grain", quote2.qty);
  assert.ok(stale.ok);
  assert.ok(stale.qty < quote2.qty, "the commit bought only what the live cash covers");
  assert.ok(stale.cost <= tight);
});

test("zero, partial and full are distinct outcomes", () => {
  const game = setup();
  const ship = game.ships[0];
  const entry = game.market.cadiz.grain;
  entry.stock = entry.target * 4;
  const full = buy(world, game.market, ship, game.cash, "grain", 5);
  assert.deepEqual([full.ok, full.qty], [true, 5], "full fill");
  const partial = buy(world, game.market, ship, Math.ceil(price(world, entry, "grain") * 3), "grain", 20);
  assert.ok(partial.ok && partial.qty < 20 && partial.qty > 0, "partial fill when the cash runs short");
  const noCash = buy(world, game.market, ship, 0, "grain", 5);
  assert.equal(noCash.ok, false);
  assert.equal(noCash.reason, "no cash");
  entry.stock = 0;
  const noStock = buy(world, game.market, ship, 1000, "grain", 5);
  assert.equal(noStock.ok, false);
  assert.equal(noStock.reason, "nothing to buy");
});
