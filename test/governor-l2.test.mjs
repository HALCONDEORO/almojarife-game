import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse } from "../src/game/game.mjs";
import { setStewardRule, stewardTick, effectiveBounds } from "../src/game/steward.mjs";
import { price } from "../src/sim/market.mjs";
import { governorOf, hireGovernor, upgradeGovernor, GOVERNOR_LEVELS } from "../src/game/governor.mjs";
import { saveGovTemplate, applyGovTemplate, deleteGovTemplate } from "../src/game/govtemplates.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();

function house() {
  const game = newGame(world); game.eventsOn = false; game.cash = 50000;
  buyWarehouse(game, "cadiz");
  return game;
}

test("percent fields are validated and stored next to the absolute numbers", () => {
  const game = house();
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelowPct: 0.5 }).reason, "bad percent");
  assert.equal(setStewardRule(game, "cadiz", "grain", { sellAbovePct: 1001 }).reason, "bad percent");
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelowPct: Number.NaN }).reason, "bad number");
  const set = setStewardRule(game, "cadiz", "grain", { buyBelow: 5, buyTo: 10, buyBelowPct: 90 });
  assert.equal(set.ok, true);
  const rule = game.warehouses.cadiz.admin.rules.grain;
  assert.equal(rule.buyBelowPct, 90);
  assert.equal(rule.buyBelow, 5); // the absolute number stays as the level-0/1 fallback
});

test("effectiveBounds resolves percents of the mean only with a level 2+ governor and enough history", () => {
  const rule = { buyBelow: 4, buyTo: 10, sellAbove: 9, sellKeep: 0, buyBelowPct: 50, sellAbovePct: 150 };
  const hist = [6, 8, 10]; // mean 8
  assert.deepEqual(effectiveBounds(rule, hist, 2), { buyBelow: 4, sellAbove: 12 }); // 50%/150% of 8
  assert.deepEqual(effectiveBounds(rule, hist, 1), { buyBelow: 4, sellAbove: 9 }); // level 1: absolute numbers rule
  assert.deepEqual(effectiveBounds(rule, [8, 8], 2), { buyBelow: 4, sellAbove: 9 }); // not enough history: absolute numbers rule
  const noPct = { buyBelow: 4, buyTo: 10, sellAbove: 9, sellKeep: 0, buyBelowPct: 0, sellAbovePct: 0 };
  assert.deepEqual(effectiveBounds(noPct, hist, 2), { buyBelow: 4, sellAbove: 9 });
});

test("an inverted resolved window pauses the buy side instead of churning goods", () => {
  const rule = { buyBelow: 0, buyTo: 10, sellAbove: 0, sellKeep: 0, buyBelowPct: 120, sellAbovePct: 110 };
  const bounds = effectiveBounds(rule, [10, 10, 10], 2); // buy 12 vs sell 11
  assert.equal(bounds.buyBelow, 0);
  assert.equal(bounds.sellAbove, 11);
});

test("the tick serves a percent order at the resolved price with a level 2 governor", () => {
  const game = house();
  hireGovernor(game, "cadiz", 2);
  const entry = game.market.cadiz.grain;
  const today = price(world, entry, "grain");
  game.hist = { cadiz: { grain: [today, today, today] } };
  entry.stock = 200;
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelowPct: 200, buyTo: 5 }).ok, true); // double the mean: buys now
  stewardTick(game, "cadiz", 100);
  assert.equal(game.warehouses.cadiz.goods.grain, 5);
  // And the same percent stops serving once the price rises past the resolved bound.
  const game2 = house();
  hireGovernor(game2, "cadiz", 2);
  game2.hist = { cadiz: { grain: [1, 1, 1] } }; // mean 1, resolved buy bound 0.5: today's real price is far above
  game2.market.cadiz.grain.stock = 200;
  assert.equal(setStewardRule(game2, "cadiz", "grain", { buyBelowPct: 50, buyTo: 5 }).ok, true);
  stewardTick(game2, "cadiz", 100);
  assert.equal(game2.warehouses.cadiz.goods.grain ?? 0, 0);
});

test("a percent order is dormant without a governor: the absolute number rules", () => {
  const game = house(); // no governor hired: governor level 0
  game.hist = { cadiz: { grain: [1000, 1000, 1000] } }; // a huge mean would resolve an absurd bound
  game.market.cadiz.grain.stock = 200;
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: 0.01, buyBelowPct: 900, buyTo: 5 }).ok, true);
  stewardTick(game, "cadiz", 100);
  assert.equal(game.warehouses.cadiz.goods.grain ?? 0, 0); // absolute buyBelow 0.01 governs, the percent stayed dormant
});

test("templates save, apply atomically, delete and survive a save round trip", () => {
  const game = house();
  assert.equal(saveGovTemplate(game, "cadiz", "grano").reason, "needs a working level 2 governor here");
  hireGovernor(game, "cadiz", 2);
  assert.equal(saveGovTemplate(game, "cadiz", "grano").reason, "no standing orders to save");
  setStewardRule(game, "cadiz", "grain", { buyBelow: 5, buyTo: 20, buyBelowPct: 90 });
  setStewardRule(game, "cadiz", "wine", { sellAbove: 12, sellKeep: 4 });
  assert.equal(saveGovTemplate(game, "cadiz", "  grano  ").ok, true);
  assert.deepEqual(Object.keys(game.govTemplates), ["grano"]);

  game.ships[0].at = "lisboa"; // a warehouse needs a docked ship
  buyWarehouse(game, "lisboa");
  hireGovernor(game, "lisboa", 2);
  const applied = applyGovTemplate(game, "lisboa", "grano", 200);
  assert.equal(applied.ok, true);
  assert.equal(applied.applied, 2);
  assert.equal(game.warehouses.lisboa.admin.rules.grain.buyBelowPct, 90);
  assert.equal(game.warehouses.lisboa.admin.rules.wine.sellKeep, 4);

  game.govTemplates.bad = { not_a_good: { buyBelow: 1 } };
  const before = JSON.stringify(game.warehouses.lisboa.admin.rules);
  assert.match(applyGovTemplate(game, "lisboa", "bad", 200).reason, /unknown good/);
  assert.equal(JSON.stringify(game.warehouses.lisboa.admin.rules), before); // nothing half-applied

  const { g: round } = deserialize(serialize(game, "Prueba"), world);
  assert.equal(round.govTemplates.grano.wine.sellKeep, 4);
  assert.equal(deleteGovTemplate(round, "grano").ok, true);
  assert.equal(deleteGovTemplate(round, "grano").reason, "no such template");
});

test("level 3 is not for sale yet: hiring or promoting to it is refused", () => {
  const game = house();
  assert.equal(hireGovernor(game, "cadiz", 3).reason, "bad level");
  hireGovernor(game, "cadiz", 2);
  const cash = game.cash;
  assert.equal(upgradeGovernor(game, "cadiz", 3).reason, "unknown or not higher level");
  assert.equal(game.cash, cash); // no coin left the box for an undelivered level
  assert.equal(governorOf(game, "cadiz").level, 2);
});

test("template names never fight the object prototype", () => {
  const game = house();
  hireGovernor(game, "cadiz", 2);
  setStewardRule(game, "cadiz", "grain", { buyBelow: 5, buyTo: 20 });
  for (const bad of ["__proto__", "constructor", "prototype"]) assert.equal(saveGovTemplate(game, "cadiz", bad).reason, "bad name");
  assert.equal(applyGovTemplate(game, "cadiz", "toString", 100).reason, "no such template"); // inherited name is not a template
  assert.equal(applyGovTemplate(game, "cadiz", "hasOwnProperty", 100).reason, "no such template");
  assert.equal(deleteGovTemplate(game, "cadiz", "valueOf").reason, "no such template");
  assert.equal(saveGovTemplate(game, "cadiz", "grano").ok, true);
  const { g: round } = deserialize(serialize(game, "Prueba"), world);
  assert.equal(applyGovTemplate(round, "cadiz", "grano", 100).ok, true); // a normal name survives the save round trip
  assert.equal(applyGovTemplate(round, "cadiz", "toString", 100).reason, "no such template");
});

test("upgrading charges only the fee difference and needs a sitting governor", () => {
  const game = house();
  assert.equal(upgradeGovernor(game, "cadiz", 2).reason, "no governor hired");
  hireGovernor(game, "cadiz", 1);
  assert.equal(upgradeGovernor(game, "cadiz", 1).reason, "unknown or not higher level");
  const cash = game.cash;
  const up = upgradeGovernor(game, "cadiz", 2);
  assert.equal(up.ok, true);
  assert.equal(up.fee, GOVERNOR_LEVELS[2].fee - GOVERNOR_LEVELS[1].fee);
  assert.equal(game.cash, cash - 100);
  assert.equal(governorOf(game, "cadiz").level, 2);
});
