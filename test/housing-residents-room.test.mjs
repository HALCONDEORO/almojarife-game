// Residents and room are two distinct, named housing sets (Estudios P3-05, 30/10):
// an active house keeps its residents even while halted; only a kept house shelters newcomers.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { houseResidents, housePopBonus, housingRoom, HOUSE_POP_BY_TYPE, HOUSE_ROOM_PER_LEVEL, HOUSE_TYPES_ALL } from "../src/game/buildings.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const scene = (buildings = {}) => {
  const game = newGame(world, "cadiz", { seed: 7, freePlay: true, calamities: false });
  game.buildings = { cadiz: buildings };
  return game;
};
const house = (type = "house_poor", level = 1, extra = {}) => ({ type, level, state: "active", ...extra });

test("an empty group has neither residents nor room", () => {
  const game = scene();
  assert.equal(houseResidents(game, "cadiz"), 0);
  assert.equal(housingRoom(game, "cadiz"), 0);
});

test("a kept house shelters its residents and offers room, once per level", () => {
  const game = scene({ a: house("house_poor", 2), b: house("house_rich", 3) });
  assert.equal(houseResidents(game, "cadiz"), 2 * HOUSE_POP_BY_TYPE.house_poor + 3 * HOUSE_POP_BY_TYPE.house_rich);
  assert.equal(housingRoom(game, "cadiz"), (2 + 3) * HOUSE_ROOM_PER_LEVEL);
});

test("a halted house keeps its residents but offers no room to newcomers", () => {
  const game = scene({ a: house("house_comfortable", 2, { halted: true }) });
  assert.equal(houseResidents(game, "cadiz"), 2 * HOUSE_POP_BY_TYPE.house_comfortable, "unpaid upkeep never evicts");
  assert.equal(housingRoom(game, "cadiz"), 0, "buildings exist, yet no eligible shelter");
  assert.equal(housePopBonus(game, "cadiz"), houseResidents(game, "cadiz"), "the legacy name reads the residents set");
});

test("construction and empty plots count in neither set", () => {
  const game = scene({
    a: { type: "house_poor", level: 1, state: "construction" },
    b: { type: null, level: 0, state: "plot" },
    c: house("house", 1),
  });
  assert.equal(houseResidents(game, "cadiz"), HOUSE_POP_BY_TYPE.house);
  assert.equal(housingRoom(game, "cadiz"), HOUSE_ROOM_PER_LEVEL);
});

test("non-house buildings are in neither set, however active", () => {
  const game = scene({ a: { type: "workshop", level: 3, state: "active" }, b: { type: "warehouse", level: 2, state: "active" } });
  assert.equal(houseResidents(game, "cadiz"), 0);
  assert.equal(housingRoom(game, "cadiz"), 0);
});

test("every house class is eligible for room, legacy generic included", () => {
  const game = scene(Object.fromEntries(HOUSE_TYPES_ALL.map((t, i) => [i, house(t, 1)])));
  assert.equal(housingRoom(game, "cadiz"), HOUSE_TYPES_ALL.length * HOUSE_ROOM_PER_LEVEL);
});

test("save/load preserves both readings", () => {
  const game = scene({ a: house("house_poor", 2), b: house("house_rich", 1, { halted: true }) });
  const before = [houseResidents(game, "cadiz"), housingRoom(game, "cadiz")];
  const loaded = deserialize(JSON.parse(JSON.stringify(serialize(game, "Housing sets test", 1000))), world).g;
  assert.equal(houseResidents(loaded, "cadiz"), before[0]);
  assert.equal(housingRoom(loaded, "cadiz"), before[1]);
});
