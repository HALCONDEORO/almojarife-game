// Player-building 3D models: plot mapping onto the hillside, per-type models, scaffold, house clearing.
import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../web/vendor/three.module.min.js";
import { plotSceneRect, housesClearOf, makePlayerBuilding, makeScaffold, portLayout, slopeY, QUAY_TOP, FRONT_Z } from "../src/view3d/port3d.mjs";

const meshCount = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n++; }); return n; };
const bounds = (g) => { const b = new THREE.Box3().setFromObject(g); return { w: b.max.x - b.min.x, h: b.max.y - b.min.y, d: b.max.z - b.min.z }; };

test("plots map onto the hillside, deterministically, standing on the slope", () => {
  const a = plotSceneRect({ id: "cadiz:3", x: 12, y: 20, w: 4, d: 5 }, 48);
  assert.deepEqual(a, plotSceneRect({ id: "cadiz:3", x: 12, y: 20, w: 4, d: 5 }, 48));
  assert.ok(a.z <= -12 && a.z >= -42 && Math.abs(a.x) <= 28);
  assert.equal(a.y, slopeY(a.z));
  assert.ok(a.w > 0 && a.d > 0);
  assert.equal(plotSceneRect(null, 48), null);
  assert.equal(plotSceneRect({ x: 1, y: 1, w: 1 }, 0), null);
});

test("housesClearOf removes only the decorative houses that overlap a plot", () => {
  const L = portLayout("cadiz", 8000);
  const rects = [{ x: L.houses[0].x, z: L.houses[0].z, w: 5, d: 5 }];
  const kept = housesClearOf(L.houses, rects);
  assert.ok(kept.length < L.houses.length);
  assert.ok(!kept.some((h) => Math.abs(h.x - rects[0].x) < (5 + h.w) / 2 + 0.6 && Math.abs(h.z - rects[0].z) < (5 + h.d) / 2 + 0.6));
  assert.equal(housesClearOf(L.houses, []).length, L.houses.length);
});

test("each building type builds a model that grows with level and stays near its plot footprint", () => {
  for (const type of ["house", "workshop", "warehouse"]) {
    const m1 = makePlayerBuilding(THREE, type, 1, 4, 4), m3 = makePlayerBuilding(THREE, type, 3, 4, 4);
    const b1 = bounds(m1), b3 = bounds(m3);
    assert.ok(meshCount(m1) >= 3, `${type} L1 has walls and a roof`);
    assert.ok(b3.h > b1.h || meshCount(m3) > meshCount(m1), `${type} L3 reads bigger than L1`);
    assert.ok(b3.w <= 8.5 && b3.d <= 8.5, `${type} stays within a large plot`);
    assert.equal(m1.userData.buildingType, type); assert.equal(m3.userData.level, 3);
  }
  assert.notDeepEqual(bounds(makePlayerBuilding(THREE, "house", 2, 4, 4)), bounds(makePlayerBuilding(THREE, "workshop", 2, 4, 4)));
});

test("scaffold: four poles, planks, and a wall stub that rises with progress", () => {
  const low = makeScaffold(THREE, 4, 4, 0.1), high = makeScaffold(THREE, 4, 4, 0.9);
  assert.ok(bounds(low).h <= 3.4 && bounds(high).h <= 3.4); // poles cap the height
  assert.ok(bounds(high).h > 3.0); // poles present
  const stubH = (g) => { let mx = 0; g.traverse((o) => { if (o.isMesh && o.geometry.parameters?.width > 3 && o.geometry.parameters?.depth > 3) mx = Math.max(mx, o.position.y); }); return mx; }; // the wall stub is the only deep, wide piece
  assert.ok(stubH(high) > stubH(low));
});
