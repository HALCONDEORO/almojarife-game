import test from "node:test";
import assert from "node:assert/strict";
import { loadLand, isLand, segmentLandHit, haversineKm } from "../tools/geo.mjs";
import { loadWorld, route } from "../src/sim/world.mjs";
import { makeMarket, price, tickMarket } from "../src/sim/market.mjs";
const land = loadLand();
const world = loadWorld();
test("8 ports, all on or next to the coast (river ports within 120 km)", () => {
  assert.equal(world.cities.length, 8);
  assert.equal(Object.keys(world.goods).length, 12);
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
test("port lanes only touch land within 10 km of a non-river port, river ports stay under 120 km", () => {
  for (const [a, b] of world.lanes) {
    const port = a.startsWith("w_") ? (b.startsWith("w_") ? null : b) : a;
    if (!port) continue;
    const other = port === a ? b : a;
    const c = world.cities.find((x) => x.id === port);
    const hit = segmentLandHit(land, world.nodes[other], world.nodes[port], 2);
    if (!hit) continue;
    assert.ok(c, "unknown port " + port);
    const len = haversineKm(world.nodes[port], world.nodes[other]);
    if (c.river) assert.ok(len < 120, `${port}-${other} river lane too long: ${len}`);
    else assert.ok(haversineKm(world.nodes[port], hit) < 10, `${port}-${other} crosses land ${haversineKm(world.nodes[port], hit).toFixed(1)} km from port`);
  }
});
test("data integrity: ids exist, no duplicates", () => {
  const ids = world.cities.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of world.cities) for (const g of [...c.makes, ...c.needs]) assert.ok(world.goods[g], c.id + " unknown good " + g);
  for (const c of world.cities) {
    assert.equal(new Set(c.makes).size, c.makes.length); assert.equal(new Set(c.needs).size, c.needs.length);
  }
  const seen = new Set();
  for (const [a, b] of world.lanes) {
    assert.ok(world.nodes[a] && world.nodes[b], `lane endpoint missing ${a}-${b}`);
    const k = [a, b].sort().join("|"); assert.ok(!seen.has(k), "duplicate lane " + k); seen.add(k);
  }
});
test("routes are not absurd detours (km / great-circle <= 2.6)", () => {
  for (const a of world.cities) for (const b of world.cities) {
    if (a.id === b.id) continue;
    const r = route(world, a.id, b.id);
    const g = haversineKm(a, b);
    const med = new Set(["valencia", "barcelona", "palma"]);
    if (med.has(a.id) !== med.has(b.id)) continue; // crossing Gibraltar is legitimately long
    if (g > 150) assert.ok(r.km / g <= 2.6, `${a.id}->${b.id} ratio ${(r.km / g).toFixed(2)}`);
  }
});
test("every city pair is reachable", () => {
  for (const a of world.cities) for (const b of world.cities) assert.ok(route(world, a.id, b.id), a.id + "->" + b.id);
});
test("route distance is at least great-circle distance", () => {
  const r = route(world, "bilbao", "barcelona");
  assert.ok(r.km >= haversineKm(world.nodes.bilbao, world.nodes.barcelona));
});
test("price rises when stock falls and stays within clamp", () => {
  const e = { stock: 100, target: 100 };
  const p0 = price(world, e, "grain");
  e.stock = 10; const p1 = price(world, e, "grain");
  e.stock = 1e6; const p2 = price(world, e, "grain");
  const base = world.goods.grain.base;
  assert.equal(p0, base); assert.ok(p1 > p0); assert.ok(p2 < p0); assert.ok(p1 <= base * 3 && p2 >= base * 0.4 - 1);
});
test("market 365 days: stocks never negative, prices stay bounded", () => {
  const m = makeMarket(world);
  for (let d = 0; d < 365; d++) tickMarket(m);
  for (const c of Object.values(m)) for (const [g, e] of Object.entries(c)) {
    assert.ok(e.stock >= 0); const p = price(world, e, g);
    assert.ok(p >= world.goods[g].base * 0.4 - 1 && p <= world.goods[g].base * 3 + 1);
  }
});
test("every good has at least one producer and one consumer", () => {
  for (const g of Object.keys(world.goods)) {
    assert.ok(world.cities.some((c) => c.makes.includes(g)), g + " has no producer");
    assert.ok(world.cities.some((c) => c.needs.includes(g)), g + " has no consumer");
  }
});
test("no port both makes and needs the same good", () => {
  for (const c of world.cities) for (const g of c.makes) assert.ok(!c.needs.includes(g), c.id + " " + g);
});
test("Cadiz to Palma route is plausible (1050-1200 km)", () => {
  const r = route(world, "cadiz", "palma");
  assert.ok(r.km > 1050 && r.km < 1200, String(r.km));
});
test("after a year producers sell at or below base, consumers at or above base, nobody is pinned at the floor", () => {
  const m = makeMarket(world);
  for (let d = 0; d < 365; d++) tickMarket(m);
  for (const [cid, c] of Object.entries(m)) for (const [g, e] of Object.entries(c)) {
    const p = price(world, e, g), base = world.goods[g].base;
    if (e.makes) assert.ok(p <= base, `${cid} ${g} producer price ${p} > base ${base}`);
    if (e.needs) assert.ok(p >= base, `${cid} ${g} consumer price ${p} < base ${base}`);
    if (e.makes) assert.ok(e.stock <= e.target * 4, `${cid} ${g} stock unbounded`);
    assert.ok(p > Math.round(base * 0.4), `${cid} ${g} price ${p} pinned at floor`);
  }
});
test("no drift: day 365 and day 730 give the same stocks and prices", () => {
  const m = makeMarket(world);
  for (let d = 0; d < 365; d++) tickMarket(m);
  const snap = JSON.parse(JSON.stringify(m));
  for (let d = 0; d < 365; d++) tickMarket(m);
  for (const [cid, c] of Object.entries(m)) for (const [g, e] of Object.entries(c)) {
    assert.equal(e.stock, snap[cid][g].stock, `${cid} ${g} stock drifts`);
    assert.equal(price(world, e, g), price(world, snap[cid][g], g), `${cid} ${g} price drifts`);
  }
});
test("a producer already at the cap stays at the cap after one tick", () => {
  const m = makeMarket(world);
  const e = Object.values(m).flatMap((c) => Object.values(c)).find((x) => x.makes && !x.needs);
  e.stock = e.target * 4;
  tickMarket(m);
  assert.ok(e.stock <= e.target * 4, "exceeded cap: " + e.stock);
  assert.ok(e.stock >= e.target * 4 - e.rate, "dropped too far below the cap: " + e.stock);
});
