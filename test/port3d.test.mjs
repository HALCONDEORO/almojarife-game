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
