import test from "node:test";
import assert from "node:assert/strict";
import { validateWorld } from "../src/sim/validate.mjs";

const city = (id) => ({ id, name: id, lat: 0, lon: 0, pop: 10, makes: [], needs: [] });
const world = (id, waypoint = false) => ({
  cities: [city("home"), city(waypoint ? "destination" : id)],
  goods: {},
  waypoints: waypoint ? { [id]: { lat: 1, lon: 1 } } : {},
  lanes: waypoint ? [["home", id], [id, "destination"]] : [["home", id]],
});

for (const id of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
  test(`connectivity accepts a city named ${id} without inherited properties`, () => {
    assert.deepEqual(validateWorld(world(id)), []);
  });
  test(`connectivity traverses a waypoint named ${id}`, () => {
    assert.deepEqual(validateWorld(world(id, true)), []);
  });
  test(`connectivity still reports an unreachable city when ${id} is present`, () => {
    const w = world(id);
    w.cities.push(city("isolated"));
    assert.deepEqual(validateWorld(w), ["city isolated: no sea route from home"]);
  });
}

test("connectivity keeps isolated special IDs separate from Object.prototype", () => {
  const w = world("constructor");
  w.lanes = [];
  assert.deepEqual(validateWorld(w), ["city constructor: no sea route from home"]);
});

test("validating special IDs does not modify Object.prototype", () => {
  const before = Object.getOwnPropertyDescriptors(Object.prototype);
  assert.deepEqual(validateWorld(world("__proto__", true)), []);
  assert.deepEqual(Object.getOwnPropertyDescriptors(Object.prototype), before);
});
