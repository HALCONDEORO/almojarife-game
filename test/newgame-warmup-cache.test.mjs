// Repeated new games reuse the deterministic 60-day warm-up without sharing mutable state.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";

const world = loadWorld();

test("same world and options return identical but independent day-0 economies", () => {
  const first = newGame(world, "cadiz", { seed: 42, freePlay: true });
  const second = newGame(world, "lisboa", { seed: 42, freePlay: true });
  assert.notEqual(first.market, second.market);
  assert.notEqual(first.hist, second.hist);
  assert.notEqual(first.ai, second.ai);
  assert.notEqual(first.world, second.world);
  assert.deepEqual(first.market, second.market);
  assert.deepEqual(first.hist, second.hist);
  assert.deepEqual(first.ai, second.ai);
  first.market.cadiz.grain.stock = 1;
  first.ai[0].cash = -999;
  first.world.nodes.cadiz.pop = 1;
  const third = newGame(world, "cadiz", { seed: 42, freePlay: true });
  assert.deepEqual(third.market, second.market);
  assert.deepEqual(third.ai, second.ai);
  assert.notEqual(third.world.nodes.cadiz.pop, 1);
});

test("cache keys preserve seeds, NPC modes and optional goods", () => {
  const seededA = newGame(world, "cadiz", { seed: 7, freePlay: true });
  const seededB = newGame(world, "cadiz", { seed: 8, freePlay: true });
  assert.notDeepEqual(seededA.ai, seededB.ai);
  const houses = newGame(world, "cadiz", { seed: 7, freePlay: true, regionalRivals: true });
  const classic = newGame(world, "cadiz", { seed: 7, freePlay: true, regionalRivals: false });
  assert.ok(houses.ai.every((bot) => bot.house));
  assert.ok(classic.ai.every((bot) => !bot.house));
  const noPottery = newGame(world, "cadiz", { seed: 7, freePlay: true, pottery: false });
  assert.equal(noPottery.world.goods.pottery, undefined);
  assert.equal(noPottery.market.cadiz.pottery, undefined);
  assert.ok(newGame(world, "cadiz", { seed: 7, freePlay: true }).market.cadiz.pottery);
});

test("a changed source world gets a fresh warm-up instead of stale cached state", () => {
  const changed = loadWorld();
  const before = newGame(changed, "cadiz", { seed: 9, freePlay: true, regionalRivals: false });
  changed.goods.grain.npcTrade = false;
  const after = newGame(changed, "cadiz", { seed: 9, freePlay: true, regionalRivals: false });
  try {
    assert.notDeepEqual(after.ai, before.ai);
  } finally {
    delete changed.goods.grain.npcTrade;
  }
});
