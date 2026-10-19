import test from "node:test";
import assert from "node:assert/strict";
import { loadLand, isLand, segmentLandHit, haversineKm } from "../tools/geo.mjs";
import { loadWorld, route } from "../src/sim/world.mjs";
import { makeMarket, price, tickMarket } from "../src/sim/market.mjs";
const land = loadLand();
const world = loadWorld();
test("10 cities, all on or next to the coast (river ports within 120 km)", () => {
  assert.equal(world.cities.length, 10);
  for (const c of world.cities) {
    let near = false;
    for (let a = 0; a < 360 && !near; a += 30)
      for (const km of c.river ? [5, 20, 60, 120] : [5, 10, 20, 25]) {
        const lat = c.lat + (km / 111) * Math.cos((a * Math.PI) / 180);
        const lon = c.lon + (km / (111 * Math.cos((c.lat * Math.PI) / 180))) * Math.sin((a * Math.PI) / 180);
        if (!isLand(land, lon, lat)) { near = true; break; }
      }
    assert.ok(near, c.name + " has no water nearby");
  }
});
test("waypoints are in water", () => {
  for (const [id, p] of Object.entries(world.waypoints)) assert.ok(!isLand(land, p.lon, p.lat), id + " is on land");
});
test("lane segments between waypoints do not cross land", () => {
  for (const [a, b] of world.lanes) {
    if (!a.startsWith("w_") || !b.startsWith("w_")) continue;
    const hit = segmentLandHit(land, world.nodes[a], world.nodes[b], 5);
    assert.equal(hit, null, `${a}-${b} crosses land at ${JSON.stringify(hit)}`);
  }
});
test("every city pair is reachable", () => {
  for (const a of world.cities) for (const b of world.cities) assert.ok(route(world, a.id, b.id), a.id + "->" + b.id);
});
test("route distance is at least great-circle distance", () => {
  const r = route(world, "london", "riga");
  assert.ok(r.km >= haversineKm(world.nodes.london, world.nodes.riga));
});
test("price rises when stock falls and stays within clamp", () => {
  const e = { stock: 100, target: 100 };
  const p0 = price(world, e, "beer");
  e.stock = 10; const p1 = price(world, e, "beer");
  e.stock = 1e6; const p2 = price(world, e, "beer");
  assert.equal(p0, 30); assert.ok(p1 > p0); assert.ok(p2 < p0); assert.ok(p1 <= 90 && p2 >= 12);
});
test("market 365 days: stocks never negative, prices stay bounded", () => {
  const m = makeMarket(world);
  for (let d = 0; d < 365; d++) tickMarket(m);
  for (const c of Object.values(m)) for (const [g, e] of Object.entries(c)) {
    assert.ok(e.stock >= 0); const p = price(world, e, g);
    assert.ok(p >= world.goods[g].base * 0.4 - 1 && p <= world.goods[g].base * 3 + 1);
  }
});
