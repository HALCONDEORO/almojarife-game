import test from "node:test";
import assert from "node:assert/strict";
import { portLayout, waveHeight } from "../src/view3d/port3d.mjs";
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
