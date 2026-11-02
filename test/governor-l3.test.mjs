import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, buyWarehouse, advanceDay } from "../src/game/game.mjs";
import { setStewardRule, stewardTick, goalTick } from "../src/game/steward.mjs";
import { price } from "../src/sim/market.mjs";
import { governorOf, hireGovernor, upgradeGovernor, dismissGovernor, setGovernorBudget, setGovernorGoal, clearGovernorGoal, GOVERNOR_LEVELS } from "../src/game/governor.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();

function house() {
  const game = newGame(world); game.eventsOn = false;
  buyWarehouse(game, "cadiz");
  game.cash = 100000; // after the purchase, so the numbers below are round
  game.day = 10;
  game.warehouses.cadiz.goods = { grain: 20 };
  return game;
}

function withGovernor3(game) {
  game.warehouses.cadiz.governor = { level: 3, state: "active", hiredDay: 10 };
  return game;
}

test("level 3 hires and promotes for the listed fee and draws its wage", () => {
  const game = house();
  const hired = hireGovernor(game, "cadiz", 3);
  assert.equal(hired.ok, true);
  assert.equal(governorOf(game, "cadiz").level, 3);
  assert.equal(game.cash, 100000 - GOVERNOR_LEVELS[3].fee);
  dismissGovernor(game, "cadiz"); hireGovernor(game, "cadiz", 1); const cashAfterHire = game.cash;
  const up = upgradeGovernor(game, "cadiz", 3);
  assert.equal(up.ok, true);
  assert.equal(game.cash, cashAfterHire - (GOVERNOR_LEVELS[3].fee - GOVERNOR_LEVELS[1].fee));
});

test("the daily budget needs a working level 3 governor and a non-negative number", () => {
  const game = house();
  hireGovernor(game, "cadiz", 2);
  assert.equal(setGovernorBudget(game, "cadiz", 500).reason, "needs a working level 3 governor here");
  upgradeGovernor(game, "cadiz", 3);
  game.warehouses.cadiz.governor.state = "suspended";
  assert.equal(setGovernorBudget(game, "cadiz", 500).reason, "needs a working level 3 governor here");
  game.warehouses.cadiz.governor.state = "active";
  for (const bad of [-1, Number.NaN, Infinity, "500"]) assert.equal(setGovernorBudget(game, "cadiz", bad).reason, "bad number", String(bad));
  assert.equal(setGovernorBudget(game, "lisboa", 500).reason, "needs a working level 3 governor here");
  assert.deepEqual(setGovernorBudget(game, "cadiz", 500), { ok: true, budget: 500 });
  assert.deepEqual(setGovernorBudget(game, "cadiz", 0), { ok: true, budget: 0 }); // 0 lifts the cap
});

test("a daily budget caps the day's buys, sales never count, and the count resets next day", () => {
  const game = withGovernor3(house());
  const entry = game.market.cadiz.grain, today = price(world, entry, "grain");
  entry.stock = 500;
  assert.equal(setGovernorBudget(game, "cadiz", 60).ok, true);
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: today + 1, buyTo: 60, sellAbove: 0, sellKeep: 0 }).ok, true);
  stewardTick(game, "cadiz", 200);
  const firstDay = game.warehouses.cadiz.governor.spent;
  assert.equal(firstDay.day, game.day);
  assert.ok(firstDay.coins > 0 && firstDay.coins <= 60, String(firstDay.coins)); // spent to the cap, not past it
  const afterCap = game.warehouses.cadiz.goods.grain;
  assert.ok(afterCap > 20);
  assert.equal(setGovernorBudget(game, "cadiz", 1).ok, true); // lowered below what is already spent: further buys just stop
  stewardTick(game, "cadiz", 200);
  assert.equal(game.warehouses.cadiz.goods.grain, afterCap);
  assert.equal(setGovernorBudget(game, "cadiz", 60).ok, true);
  game.day = 11; // a new day restarts the count
  stewardTick(game, "cadiz", 200);
  assert.ok(game.warehouses.cadiz.goods.grain > afterCap);
  assert.equal(game.warehouses.cadiz.governor.spent.day, 11);
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: 0, buyTo: 0, sellAbove: 1, sellKeep: 0 }).ok, true); // sales never count against the cap
  const coinsBeforeSell = game.warehouses.cadiz.governor.spent.coins;
  stewardTick(game, "cadiz", 200);
  assert.equal(game.warehouses.cadiz.governor.spent.coins, coinsBeforeSell);
  assert.equal(game.warehouses.cadiz.goods.grain ?? 0, 0);
});

test("a stockpile goal posts one notice the day it is met and stays quiet after", () => {
  const game = withGovernor3(house());
  assert.equal(setGovernorGoal(game, "cadiz", "dragon_spice", 30).reason, "unknown good"); // cadiz knows no pepper here
  for (const bad of [0, -5, 3.5, Number.NaN]) assert.equal(setGovernorGoal(game, "cadiz", "grain", bad).reason, "bad number", String(bad));
  game.warehouses.cadiz.governor.level = 2;
  assert.equal(setGovernorGoal(game, "cadiz", "grain", 30).reason, "needs a working level 3 governor here");
  game.warehouses.cadiz.governor.level = 3;
  const entry = game.market.cadiz.grain, today = price(world, entry, "grain");
  entry.stock = 500;
  assert.equal(setGovernorGoal(game, "cadiz", "grain", 30).ok, true);
  assert.deepEqual(governorOf(game, "cadiz").goal, { good: "grain", qty: 30, done: false });
  assert.equal(setStewardRule(game, "cadiz", "grain", { buyBelow: today + 1, buyTo: 40, sellAbove: 0, sellKeep: 0 }).ok, true);
  const before = game.inbox.filter((m) => m.topic === "governor").length;
  stewardTick(game, "cadiz", 200); // buys to 40: the goal is met
  goalTick(game, "cadiz");
  assert.equal(game.inbox.filter((m) => m.topic === "governor").length - before, 1);
  assert.match(game.inbox.find((m) => m.topic === "governor").txt.es, /meta de acopio/);
  assert.equal(governorOf(game, "cadiz").goal.done, true);
  stewardTick(game, "cadiz", 200); // already announced: no repeat
  goalTick(game, "cadiz");
  assert.equal(game.inbox.filter((m) => m.topic === "governor").length - before, 1);
  assert.equal(setGovernorGoal(game, "cadiz", "grain", 50).ok, true); // a new goal resets the flag
  assert.equal(governorOf(game, "cadiz").goal.done, false);
  assert.equal(clearGovernorGoal(game, "cadiz").ok, true);
  assert.equal(governorOf(game, "cadiz").goal, null);
  assert.equal(clearGovernorGoal(game, "cadiz").reason, "no goal");
});

test("the stockpile goal is watched without steward orders: stocking by hand completes it", () => {
  const game = withGovernor3(house()); // no setStewardRule: the warehouse has no standing orders at all
  assert.equal("admin" in game.warehouses.cadiz, false);
  assert.equal(setGovernorGoal(game, "cadiz", "grain", 30).ok, true);
  game.warehouses.cadiz.goods.grain = 50; // unloaded by hand, not by any order
  const before = game.inbox.filter((mail) => mail.topic === "governor").length;
  assert.equal(goalTick(game, "cadiz"), true); // the monitor runs even where stewardTick would stop
  assert.equal(game.inbox.filter((mail) => mail.topic === "governor").length - before, 1);
  assert.equal(governorOf(game, "cadiz").goal.done, true);
  assert.equal(goalTick(game, "cadiz"), false); // one notice, once
  assert.equal(game.inbox.filter((mail) => mail.topic === "governor").length - before, 1);
});

test("the daily loop reaches the goal monitor without steward orders", () => {
  const game = withGovernor3(house());
  assert.equal("admin" in game.warehouses.cadiz, false);
  assert.equal(setGovernorGoal(game, "cadiz", "grain", 30).ok, true);
  game.warehouses.cadiz.goods.grain = 50;
  const before = game.inbox.filter((mail) => mail.topic === "governor").length;
  advanceDay(game);
  assert.equal(game.inbox.filter((mail) => mail.topic === "governor").length - before, 1);
  assert.equal(governorOf(game, "cadiz").goal.done, true);
  advanceDay(game); // stays quiet on the following days
  assert.equal(game.inbox.filter((mail) => mail.topic === "governor").length - before, 1);
});

test("budget and goal survive the save round trip and junk never leaks through the read model", () => {
  const game = withGovernor3(house());
  setGovernorBudget(game, "cadiz", 150); setGovernorGoal(game, "cadiz", "grain", 99);
  const { g: loaded } = deserialize(serialize(game, "Prueba"), world);
  assert.equal(governorOf(loaded, "cadiz").budget, 150);
  assert.deepEqual(governorOf(loaded, "cadiz").goal, { good: "grain", qty: 99, done: false });
  loaded.warehouses.cadiz.governor.budget = "oops"; loaded.warehouses.cadiz.governor.goal = { good: "nope", qty: 10 };
  assert.equal(governorOf(loaded, "cadiz").budget, 0);
  assert.equal(governorOf(loaded, "cadiz").goal, null);
});
