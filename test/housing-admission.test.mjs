// Housing room limits new arrivals, not the continued existence of existing neighbours.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { citylifeDay } from "../src/game/citylife.mjs";
import { houseClassPop, housePopBonus } from "../src/game/buildings.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const scene = (extra = 0, buildings = {}) => {
  const game = newGame(world, "cadiz", { seed: 7, freePlay: true, calamities: false });
  game.day = 7;
  game.citylife.cities.cadiz.extra = extra;
  game.citylife.cities.cadiz.animo = { poor: 100, middle: 100, rich: 100 };
  for (const entry of Object.values(game.market.cadiz)) entry.stock = entry.target * 2;
  game.buildings = { cadiz: buildings };
  return game;
};
const house = (type = "house_poor", level = 1, halted = false) => ({ type, level, halted, state: "active" });
const extraOf = game => game.citylife.cities.cadiz.extra;

test("zero housing admits no new neighbours; unoccupied housing retains room", () => {
  const bare = scene();
  citylifeDay(bare);
  assert.equal(extraOf(bare), 0);
  const housed = scene(0, { poor: house() });
  citylifeDay(housed);
  assert.ok(extraOf(housed) > 0 && extraOf(housed) <= 100);
});

test("admission reaches but never crosses the room boundary", () => {
  for (const [before, after] of [[99, 100], [100, 100], [101, 101]]) {
    const game = scene(before, { poor: house() });
    citylifeDay(game);
    assert.equal(extraOf(game), after, `${before} residents against 100 room`);
  }
});

test("selling or halting housing blocks arrivals without deleting existing residents", () => {
  for (const buildings of [{}, { poor: house("house_poor", 1, true) }]) {
    const game = scene(100, buildings);
    citylifeDay(game);
    assert.equal(extraOf(game), 100);
    game.day = 14;
    citylifeDay(game);
    assert.equal(extraOf(game), 100, "repeated weeks cannot turn loss of room into evictions");
  }
});

test("over-capacity residents still emigrate in an actual acute food crisis", () => {
  const game = scene(100);
  game.citylife.cities.cadiz.animo = { poor: 0, middle: 0, rich: 0 };
  for (const entry of Object.values(game.market.cadiz)) entry.stock = 0;
  citylifeDay(game);
  assert.ok(extraOf(game) < 100, "real crisis migration remains enabled");
  assert.ok(extraOf(game) > 0, "migration, not an instantaneous clamp to no housing");
});

test("multiple classes contribute room once per eligible level, not their resident bonus", () => {
  const game = scene(299, { poor: house("house_poor"), rich: house("house_rich", 2), stopped: house("house_comfortable", 4, true) });
  assert.deepEqual(houseClassPop(game, "cadiz"), { poor: 60, middle: 200, rich: 80 });
  assert.equal(housePopBonus(game, "cadiz"), 340, "resident bonus and admission room are deliberately different scopes");
  citylifeDay(game);
  assert.equal(extraOf(game), 300, "three working levels admit only one more neighbour");
});

test("construction and plot states cannot admit residents", () => {
  const game = scene(0, { building: { ...house(), state: "construction" }, plot: { ...house(), state: "plot" } });
  citylifeDay(game);
  assert.equal(extraOf(game), 0);
});

test("JSON save continuation preserves over-capacity residents and future admission", () => {
  const original = scene(175, { poor: house() });
  const loaded = deserialize(JSON.parse(JSON.stringify(serialize(original, "Housing test", 1000))), world).g;
  for (const day of [7, 14, 21]) {
    original.day = day; loaded.day = day;
    citylifeDay(original); citylifeDay(loaded);
    assert.equal(extraOf(original), 175);
    assert.deepEqual(loaded.citylife, original.citylife);
  }
  original.buildings.cadiz.rich = house("house_rich");
  loaded.buildings.cadiz.rich = house("house_rich");
  original.day = 28; loaded.day = 28;
  citylifeDay(original); citylifeDay(loaded);
  assert.ok(extraOf(original) > 175 && extraOf(original) <= 200);
  assert.deepEqual(loaded.citylife, original.citylife);
});
