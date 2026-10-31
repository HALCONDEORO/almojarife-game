import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, buyWarehouse, warehouseCap } from "../src/game/game.mjs";
import { setStewardRule, moveStewardRule } from "../src/game/steward.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};
const threeRules = (game) => {
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { sellAbove: 1, sellKeep: 0 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "wine", { sellAbove: 1, sellKeep: 0 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "cloth", { sellAbove: 1, sellKeep: 0 }, cap).ok);
};
const orderOf = (game) => Object.keys(game.warehouses.cadiz.admin.rules);

test("moving a rule lands it at the final index and keeps the relative order of the rest", () => {
  const game = setup();
  threeRules(game);
  assert.deepEqual(orderOf(game), ["grain", "wine", "cloth"]);
  const before = JSON.parse(JSON.stringify(game.warehouses.cadiz.admin.rules));
  const up = moveStewardRule(game, "cadiz", "cloth", -1);
  assert.deepEqual(up, { ok: true, from: 2, to: 1 });
  assert.deepEqual(orderOf(game), ["grain", "cloth", "wine"]);
  const down = moveStewardRule(game, "cadiz", "grain", 1);
  assert.deepEqual(down, { ok: true, from: 0, to: 1 });
  assert.deepEqual(orderOf(game), ["cloth", "grain", "wine"]);
  moveStewardRule(game, "cadiz", "cloth", 1); // one step back down
  assert.deepEqual(orderOf(game), ["grain", "cloth", "wine"]);
  for (const good of ["grain", "wine", "cloth"]) assert.deepEqual(game.warehouses.cadiz.admin.rules[good], before[good], "the move never touches the rule contents");
});

test("invalid moves fail explicitly and leave the list untouched", () => {
  const game = setup();
  threeRules(game);
  const before = orderOf(game);
  assert.equal(moveStewardRule(game, "sevilla", "grain", -1).reason, "no warehouse here");
  assert.equal(moveStewardRule(game, "cadiz", "iron", -1).reason, "no rule");
  assert.equal(moveStewardRule(game, "cadiz", "grain", 0).reason, "bad direction");
  assert.equal(moveStewardRule(game, "cadiz", "grain", 2).reason, "bad direction");
  assert.equal(moveStewardRule(game, "cadiz", "grain", -1).reason, "already first");
  assert.equal(moveStewardRule(game, "cadiz", "cloth", 1).reason, "already last");
  assert.deepEqual(orderOf(game), before);
});

test("a warehouse without standing orders (an old save's shape) rejects the move without crashing", () => {
  const game = setup();
  assert.equal(moveStewardRule(game, "cadiz", "grain", -1).reason, "no rule");
});

test("the steward executes the orders in list order, and reordering flips it", () => {
  const game = setup();
  game.market.cadiz.grain.stock = 100;
  game.market.cadiz.wine.stock = 100;
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  advanceDay(game); // real wiring: the steward runs on the day tick
  const goods1 = Object.keys(game.warehouses.cadiz.goods);
  assert.deepEqual(goods1, ["grain", "wine"], "grain was bought first, so it is stored first");
  const game2 = setup();
  game2.market.cadiz.grain.stock = 100;
  game2.market.cadiz.wine.stock = 100;
  assert.ok(setStewardRule(game2, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRule(game2, "cadiz", "wine", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(moveStewardRule(game2, "cadiz", "wine", -1).ok);
  advanceDay(game2);
  const goods2 = Object.keys(game2.warehouses.cadiz.goods);
  assert.deepEqual(goods2, ["wine", "grain"], "after the move, wine is bought first");
});

test("when the store runs out of room, only the first-listed order is served", () => {
  const run = (reorder) => {
    const game = setup();
    const cap = warehouseCap(game, "cadiz");
    game.warehouses.cadiz.goods.bricks = cap - 1; // one free slot left
    game.market.cadiz.grain.stock = 100;
    game.market.cadiz.wine.stock = 100;
    assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 10 }, cap).ok);
    assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 1000, buyTo: 10 }, cap).ok);
    if (reorder) assert.ok(moveStewardRule(game, "cadiz", "wine", -1).ok);
    advanceDay(game);
    return game.warehouses.cadiz.goods;
  };
  const plain = run(false);
  assert.equal(plain.grain, 1, "the first order takes the last slot");
  assert.equal(plain.wine ?? 0, 0, "the second order finds no room");
  const moved = run(true);
  assert.equal(moved.wine, 1, "after the move, wine takes the last slot");
  assert.equal(moved.grain ?? 0, 0, "and grain finds no room");
});

test("the priority order survives a save/load round-trip", () => {
  const game = setup();
  threeRules(game);
  assert.ok(moveStewardRule(game, "cadiz", "cloth", -1).ok);
  const loaded = deserialize(serialize(game, "T"), world).g;
  assert.deepEqual(Object.keys(loaded.warehouses.cadiz.admin.rules), ["grain", "cloth", "wine"]);
});
