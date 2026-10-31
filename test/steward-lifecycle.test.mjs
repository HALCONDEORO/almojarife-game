import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, buyWarehouse, warehouseCap } from "../src/game/game.mjs";
import { setStewardRule, setStewardReserve, setStewardRuleEnabled, dismissSteward, stewardOf } from "../src/game/steward.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};

test("dismissing removes orders, paused markers and the reserve in one command", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "wine", false).ok);
  assert.ok(setStewardReserve(game, "cadiz", 500).ok);
  const res = dismissSteward(game, "cadiz");
  assert.deepEqual(res, { ok: true, rules: 2, reserve: 500 });
  assert.equal(stewardOf(game, "cadiz"), null, "the whole automation record is gone");
});

test("a stale or repeated dismissal fails explicitly and changes nothing", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.equal(dismissSteward(game, "cadiz").reason, "nothing to dismiss", "never hired");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(dismissSteward(game, "cadiz").ok);
  assert.equal(dismissSteward(game, "cadiz").reason, "nothing to dismiss", "already dismissed");
  assert.equal(dismissSteward(game, "sevilla").reason, "no warehouse here");
});

test("a lone reserve also counts as something to dismiss", () => {
  const game = setup();
  assert.ok(setStewardReserve(game, "cadiz", 250).ok);
  const res = dismissSteward(game, "cadiz");
  assert.deepEqual(res, { ok: true, rules: 0, reserve: 250 });
});

test("the goods in the store are never touched by a dismissal", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  game.warehouses.cadiz.goods.grain = 40;
  assert.ok(setStewardRule(game, "cadiz", "grain", { sellAbove: 1, sellKeep: 0 }, cap).ok);
  assert.ok(dismissSteward(game, "cadiz").ok);
  assert.equal(game.warehouses.cadiz.goods.grain, 40);
});

test("re-hiring is just setting orders again, with no trace of the old record", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  game.market.cadiz.grain.stock = 100;
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "grain", false).ok);
  assert.ok(dismissSteward(game, "cadiz").ok);
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.equal(stewardOf(game, "cadiz").off, undefined, "the new record starts enabled");
  game.noGoal = true;
  advanceDay(game);
  assert.ok((game.warehouses.cadiz.goods.grain ?? 0) > 0, "and the new order trades on the day tick");
});

test("a dismissed warehouse loads like an old save that never had orders", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(dismissSteward(game, "cadiz").ok);
  const loaded = deserialize(serialize(game, "T"), world).g;
  assert.equal(stewardOf(loaded, "cadiz"), null);
  assert.equal(dismissSteward(loaded, "cadiz").reason, "nothing to dismiss");
});
