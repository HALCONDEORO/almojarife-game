import test from "node:test";
import assert from "node:assert/strict";
import { portLayout, waveHeight, skyFor } from "../src/view3d/port3d.mjs";
test("the port layout is deterministic per port and grows with population", () => {
  assert.deepEqual(portLayout("cadiz", 8000), portLayout("cadiz", 8000));
  assert.notDeepEqual(portLayout("cadiz", 8000).houses, portLayout("lisboa", 8000).houses);
  assert.ok(portLayout("cadiz", 30000).houses.length > portLayout("cadiz", 5000).houses.length);
});
test("houses stand on the hillside behind the building row, with sane sizes", () => {
  const L = portLayout("sevilla", 20000);
  for (const h of L.houses) { assert.ok(h.z < FRONT_Z - 5); assert.ok(h.w >= 4 && h.h >= 3 && h.h < 5); assert.ok(Math.abs(h.x) < 36); assert.equal(h.y, slopeY(h.z)); }
  assert.ok(slopeY(-45) > slopeY(-19) && slopeY(-9) === QUAY_TOP);
});
test("waves are small and move with time", () => {
  assert.ok(Math.abs(waveHeight(3, 4, 0)) <= 0.15);
  assert.notEqual(waveHeight(3, 4, 0), waveHeight(3, 4, 1));
});
test("sky is darker and redder at the edges of the day than at noon, and always valid colours", () => {
  const dawn = skyFor(0), noon = skyFor(0.5), dusk = skyFor(1);
  assert.ok(noon.sunPower > dawn.sunPower && noon.sunHeight > dusk.sunHeight);
  assert.ok(dawn.sky[0] > dawn.sky[2] && noon.sky[2] > noon.sky[0]);
  for (const t of [-1, 0, 0.3, 0.5, 1, 5]) for (const c of [...skyFor(t).sky, ...skyFor(t).sun]) assert.ok(Number.isInteger(c) && c >= 0 && c <= 255);
});
import { BUILDINGS, tabForBuilding, buildingOf, portLayout as pl, FRONT_Z, slopeY, QUAY_TOP, cameraPose, CAMERA } from "../src/view3d/port3d.mjs";
test("every building opens a real game panel and unknown ids open nothing", () => {
  assert.deepEqual(BUILDINGS.map((b) => b.tab).sort(), ["bank", "market", "tavern", "yard"]);
  assert.equal(tabForBuilding("shipyard"), "yard"); assert.equal(tabForBuilding("market"), "market");
  for (const bad of ["", "house", "__proto__", "constructor", undefined, null]) assert.equal(tabForBuilding(bad), null);
});
test("a hit part resolves to its building by walking up the parents", () => {
  const g = { userData: { building: "tavern" } }, part = { userData: {}, parent: { userData: {}, parent: g } };
  assert.equal(buildingOf(part), "tavern"); assert.equal(buildingOf({ userData: {}, parent: null }), null);
});
test("building plots are 2 m apart even at level 3 and never overlap houses", () => {
  const sorted = [...BUILDINGS].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].x - sorted[i].w / 2 - (sorted[i - 1].x + sorted[i - 1].w / 2) >= 2, sorted[i].id);
  for (const id of ["cadiz", "lisboa", "sevilla"]) for (const pop of [3000, 12000, 40000]) for (const h of pl(id, pop).houses) for (const b of BUILDINGS) assert.ok(!(Math.abs(h.x - b.x) < (b.w + h.w) / 2 && h.z > FRONT_Z - b.d - h.d / 2), `${id} ${pop} ${b.id}`);
});
test("camera pose follows the guide: FOV 35, zoom and yaw are clamped", () => {
  assert.equal(CAMERA.fov, 35);
  const a = cameraPose(1, 0); assert.deepEqual([a.x, a.y, a.z], [0, 22, 42]);
  const far = cameraPose(5, 0), near = cameraPose(0.01, 0); assert.ok(far.y <= 4 + 18 * 1.3 + 1e-9 && near.y >= 4 + 18 * 0.7 - 1e-9);
  const y1 = cameraPose(1, 9), y2 = cameraPose(1, CAMERA.yawMax); assert.ok(Math.abs(y1.x - y2.x) < 1e-9);
});
test("a ray at a building picks it, a ray at the sky picks nothing", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene, pickBuilding } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 12000, ships: 0 });
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200); cam.position.set(-22, 12, 25); cam.lookAt(-22, 4.5, -14); cam.updateMatrixWorld(); scene.updateMatrixWorld(true);
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0), "shipyard");
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0.95), null);
});
import { buildingLevel } from "../src/view3d/port3d.mjs";
test("building level grows with city size, keeps upgrades and stays in 1..3", () => {
  assert.deepEqual([3000, 12000, 40000].map((p) => buildingLevel("market", p)), [1, 2, 3]);
  assert.equal(buildingLevel("market", 3000, { market: 3 }), 3); assert.equal(buildingLevel("market", 40000, { market: 1 }), 3);
  for (const bad of [{ market: 99 }, { market: -2 }, { market: "x" }, null, undefined]) assert.ok(buildingLevel("market", 3000, bad) >= 1 && buildingLevel("market", 3000, bad) <= 3);
});
test("every level builds a clickable building", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene } = await import("../src/view3d/port3d.mjs");
  for (const pop of [3000, 12000, 40000]) { const { scene } = buildPortScene(THREE, { id: "cadiz", pop, ships: 0 }); const bs = scene.children.filter((c) => c.userData.building); assert.equal(bs.length, 4); for (const b of bs) assert.equal(b.userData.level, buildingLevel(b.userData.building, pop)); }
});
