import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse, warehouseCap } from "../src/game/game.mjs";
import { setStewardRule, setStewardRuleEnabled, stewardOf } from "../src/game/steward.mjs";

const world = loadWorld();
const setup = () => {
  const game = newGame(world);
  game.cash = 100000;
  assert.ok(buyWarehouse(game, "cadiz").ok);
  return game;
};

test("non-finite values are rejected field by field and nothing is written", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  for (const bad of [NaN, Infinity, -Infinity]) {
    for (const key of ["buyBelow", "buyTo", "sellAbove", "sellKeep"]) {
      const res = setStewardRule(game, "cadiz", "grain", { [key]: bad }, cap);
      assert.equal(res.ok, false);
      assert.equal(res.reason, "bad number");
    }
  }
  assert.equal(stewardOf(game, "cadiz")?.rules?.grain, undefined, "no order was left behind");
});

test("negative values fail, a signed zero is accepted and stored as plain zero", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: -1 }, cap).reason, "bad number");
  const res = setStewardRule(game, "cadiz", "grain", { buyBelow: -0, buyTo: 5 }, cap);
  assert.ok(res.ok);
  assert.ok(Object.is(stewardOf(game, "cadiz").rules.grain.buyBelow, 0), "-0 normalizes to 0");
});

test("quantities are whole units: fractional targets are floored", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 10, buyTo: 7.9, sellKeep: 3.7 }, cap).ok);
  const rule = stewardOf(game, "cadiz").rules.grain;
  assert.equal(rule.buyTo, 7);
  assert.equal(rule.sellKeep, 3);
});

test("a rejected configuration never replaces the order in force", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 10, buyTo: 5 }, cap).ok);
  const before = JSON.parse(JSON.stringify(stewardOf(game, "cadiz").rules.grain));
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: 10, buyTo: cap + 1 }, cap).reason, "target above warehouse capacity");
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: 10, buyTo: 5, sellAbove: 9 }, cap).reason, "buy cap must stay below sell floor");
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: null, buyTo: 5 }, cap).reason, "bad number", "a present null is not a default");
  assert.deepEqual(stewardOf(game, "cadiz").rules.grain, before);
});

test("missing keys mean that side is off; a present key must be a real number", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { sellAbove: 20 }, cap).ok);
  const rule = stewardOf(game, "cadiz").rules.grain;
  assert.deepEqual(rule, { buyBelow: 0, buyTo: 0, sellAbove: 20, sellKeep: 0 });
});

test("re-setting a good keeps its priority position and its paused state", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 10, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRule(game, "cadiz", "wine", { buyBelow: 10, buyTo: 5 }, cap).ok);
  assert.ok(setStewardRuleEnabled(game, "cadiz", "grain", false).ok);
  assert.ok(setStewardRule(game, "cadiz", "grain", { buyBelow: 12, buyTo: 8 }, cap).ok);
  assert.deepEqual(Object.keys(stewardOf(game, "cadiz").rules), ["grain", "wine"], "position in the list is kept");
  assert.equal(stewardOf(game, "cadiz").off.grain, true, "the pause survives a configuration update");
  assert.equal(stewardOf(game, "cadiz").rules.grain.buyBelow, 12, "and the new numbers apply");
});

test("a huge but finite price is a valid cap", () => {
  const game = setup();
  const cap = warehouseCap(game, "cadiz");
  const res = setStewardRule(game, "cadiz", "grain", { buyBelow: 1e12, buyTo: 5 }, cap);
  assert.ok(res.ok);
});
