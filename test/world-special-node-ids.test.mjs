import test from "node:test";
import assert from "node:assert/strict";
import { buildWorld, route } from "../src/sim/world.mjs";

const city = (id, lat = 0, lon = 0) => ({ id, name: id, lat, lon, pop: 10, makes: [], needs: [] });
// Small sea graph: home - special - destination, with coordinates 1 degree apart
// so haversineKm sees real node records, never inherited Object.prototype members.
const worldWith = (id, { waypoint = false, disconnected = false } = {}) => ({
  cities: [city("home", 0, 0), city("destination", 0, 2), ...(!waypoint ? [city(id, 10, 10)] : [])],
  goods: {},
  waypoints: waypoint ? { [id]: { lat: 0, lon: 1 } } : {},
  lanes: disconnected
    ? [["home", "destination"]]
    : waypoint
      ? [["home", id], [id, "destination"]]
      : [["home", id], [id, "destination"]],
});

for (const id of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
  test(`routing reaches a city named ${id}`, () => {
    const w = buildWorld(worldWith(id));
    const r = route(w, "home", id);
    assert.ok(r, `no route to ${id}`);
    assert.equal(typeof r.km, "number");
    assert.ok(Number.isFinite(r.km));
    assert.deepEqual(r.path, ["home", id]);
  });

  test(`routing traverses a waypoint named ${id}`, () => {
    const w = buildWorld(worldWith(id, { waypoint: true }));
    const r = route(w, "home", "destination");
    assert.ok(r, `no route via waypoint ${id}`);
    assert.deepEqual(r.path, ["home", id, "destination"]);
  });

  test(`a disconnected city named ${id} still reports no route`, () => {
    const w = buildWorld(worldWith(id, { disconnected: true }));
    assert.equal(route(w, "home", id), null);
  });
}

test("building and routing special-ID worlds does not modify Object.prototype", () => {
  const w = buildWorld(worldWith("__proto__"));
  route(w, "home", "__proto__");
  assert.equal({}.constructor, Object);
  assert.equal(Object.prototype.__proto__, null);
});
