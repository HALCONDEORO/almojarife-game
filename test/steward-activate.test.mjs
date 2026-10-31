import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, buyWarehouse, warehouseCap } from "../src/game/game.mjs";
import { setStewardRule, clearStewardRule, setStewardRuleEnabled, stewardOf } from "../src/game/steward.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};
const twoBuyRules = (game) => {
  const cap = warehouseCap(game, "cadiz");
  game.market.cadiz.grain.stock = 100;
  game.market.cadiz.wine.stock = 100;
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 1000, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 1000, buyTo: 5 }, cap).ok);
};

test("pausing keeps the numbers untouched and resuming brings the order back as it was", () => {
  const game = setup();
  twoBuyRules(game);
  const before = JSON.parse(JSON.stringify(stewardOf(game, "cadiz").rules.wine));
  const off = setStewardRuleEnabled(game, "cadiz", "wine", false);
  assert.deepEqual(off, { ok: true, enabled: false, changed: true });
  assert.deepEqual(stewardOf(game, "cadiz").rules.wine, before, "the numbers survive the pause");
  const again = setStewardRuleEnabled(game, "cadiz", "wine", false);
  assert.deepEqual(again, { ok: true, enabled: false, changed: false }, "repeating the same state is accepted, not a toggle");
  const on = setStewardRuleEnabled(game, "cadiz", "wine", true);
  assert.deepEqual(on, { ok: true, enabled: true, changed: true });
  assert.deepEqual(stewardOf(game, "cadiz").rules.wine, before, "and the resume restores the very same order");
  assert.ok(stewardOf(game, "cadiz").off?.wine === undefined, "no paused marker remains");
});

test("only true and false are accepted; anything else is rejected, never decoded", () => {
  const game = setup();
  twoBuyRules(game);
  for (const bad of [1, 0, "true", null, undefined]) {
    const res = setStewardRuleEnabled(game, "cadiz", "wine", bad);
    assert.equal(res.ok, false);
    assert.equal(res.reason, "bad state");
  }
  assert.equal(setStewardRuleEnabled(game, "sevilla", "wine", false).reason, "no warehouse here");
  assert.equal(setStewardRuleEnabled(game, "cadiz", "iron", false).reason, "no rule");
  assert.equal(stewardOf(game, "cadiz").off?.wine, undefined, "rejections change nothing");
});

test("a paused order is not served; resuming serves it again (through the day tick)", () => {
  const game = setup();
  game.noGoal = true; // open-ended: a big purse must not end the game mid-test
  twoBuyRules(game);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "wine", false).ok);
  advanceDay(game);
  const goods = game.warehouses.cadiz.goods;
  assert.ok((goods.grain ?? 0) > 0, "the active order was served");
  assert.equal(goods.wine ?? 0, 0, "the paused order was skipped");
  game.market.cadiz.wine.stock = 100;
  assert.ok(setStewardRuleEnabled(game, "cadiz", "wine", true).ok);
  advanceDay(game);
  assert.ok((game.warehouses.cadiz.goods.wine ?? 0) > 0, "the resumed order trades again");
});

test("the paused state rides the save; an old save without it stays enabled", () => {
  const game = setup();
  twoBuyRules(game);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "wine", false).ok);
  const loaded = deserialize(serialize(game, "T"), world).g;
  assert.equal(stewardOf(loaded, "cadiz").off.wine, true, "paused survives the round-trip");
  delete stewardOf(game, "cadiz").off; // an old save's shape: no off record at all
  const loadedOld = deserialize(serialize(game, "T"), world).g;
  assert.ok(stewardOf(loadedOld, "cadiz").off === undefined, "old saves carry no off record");
  assert.ok(setStewardRuleEnabled(loadedOld, "cadiz", "wine", false).ok, "and the order can still be paused");
});

test("removing a paused order clears its marker, so a new order for the good starts enabled", () => {
  const game = setup();
  twoBuyRules(game);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "wine", false).ok);
  assert.ok(clearStewardRule(game, "cadiz", "wine").ok);
  assert.ok(stewardOf(game, "cadiz").off?.wine === undefined, "no paused marker remains");
  assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 1000, buyTo: 5 }, 999).ok);
  assert.equal(stewardOf(game, "cadiz").off.wine, undefined, "fresh order is enabled");
});

test("pausing never reorders the priority list", () => {
  const game = setup();
  twoBuyRules(game);
  const before = Object.keys(stewardOf(game, "cadiz").rules);
  setStewardRuleEnabled(game, "cadiz", "grain", false);
  setStewardRuleEnabled(game, "cadiz", "wine", false);
  setStewardRuleEnabled(game, "cadiz", "grain", true);
  assert.deepEqual(Object.keys(stewardOf(game, "cadiz").rules), before);
});
