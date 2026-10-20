import test from "node:test";
import assert from "node:assert/strict";
import { portLayout, waveHeight, skyFor } from "../src/view3d/port3d.mjs";
test("the port layout is deterministic per port and grows with population", () => {
  assert.deepEqual(portLayout("cadiz", 8000), portLayout("cadiz", 8000));
  assert.notDeepEqual(portLayout("cadiz", 8000).houses, portLayout("lisboa", 8000).houses);
  assert.ok(portLayout("cadiz", 30000).houses.length > portLayout("cadiz", 5000).houses.length);
});
test("houses stay on land behind the quay, with sane sizes", () => {
  const L = portLayout("sevilla", 20000);
  for (const h of L.houses) { assert.ok(h.z < L.quayZ); assert.ok(h.w > 1 && h.h > 1 && h.h < 6); assert.ok(Math.abs(h.x) < 16); }
});
test("waves are small and move with time", () => {
  assert.ok(Math.abs(waveHeight(3, 4, 0)) <= 0.14);
  assert.notEqual(waveHeight(3, 4, 0), waveHeight(3, 4, 1));
});
test("sky is darker and redder at the edges of the day than at noon, and always valid colours", () => {
  const dawn = skyFor(0), noon = skyFor(0.5), dusk = skyFor(1);
  assert.ok(noon.sunPower > dawn.sunPower && noon.sunHeight > dusk.sunHeight);
  assert.ok(dawn.sky[0] > dawn.sky[2] && noon.sky[2] > noon.sky[0]);
  for (const t of [-1, 0, 0.3, 0.5, 1, 5]) for (const c of [...skyFor(t).sky, ...skyFor(t).sun]) assert.ok(Number.isInteger(c) && c >= 0 && c <= 255);
});
import { BUILDINGS, tabForBuilding, buildingOf, portLayout as pl } from "../src/view3d/port3d.mjs";
test("every building opens a real game panel and unknown ids open nothing", () => {
  assert.deepEqual(BUILDINGS.map((b) => b.tab).sort(), ["bank", "market", "tavern", "yard"]);
  assert.equal(tabForBuilding("shipyard"), "yard"); assert.equal(tabForBuilding("market"), "market");
  for (const bad of ["", "house", "__proto__", "constructor", undefined, null]) assert.equal(tabForBuilding(bad), null);
});
test("a hit part resolves to its building by walking up the parents", () => {
  const g = { userData: { building: "tavern" } }, part = { userData: {}, parent: { userData: {}, parent: g } };
  assert.equal(buildingOf(part), "tavern"); assert.equal(buildingOf({ userData: {}, parent: null }), null);
});
test("houses never stand on a building plot, in any port size", () => {
  for (const id of ["cadiz", "lisboa", "sevilla"]) for (const pop of [3000, 12000, 40000])
    for (const h of pl(id, pop).houses) for (const b of BUILDINGS) assert.ok(!(Math.abs(h.x - b.x) < (b.w + h.w) / 2 && Math.abs(h.z - b.z) < (b.d + h.d) / 2), `${id} ${pop}`);
});
test("a ray at a building picks it, a ray at the sky picks nothing", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene, pickBuilding } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 12000, ships: 0 });
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200); cam.position.set(2.5, 6, 20); cam.lookAt(2.5, 2, -5.6); cam.updateMatrixWorld(); scene.updateMatrixWorld(true);
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0), "shipyard");
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0.95), null);
});
