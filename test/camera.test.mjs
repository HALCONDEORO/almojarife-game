import test from "node:test";
import assert from "node:assert/strict";
import { newCamera, zoomAt, panBy, viewBox, clampCamera, MAX_ZOOM } from "../src/view/camera.mjs";

test("starts showing the whole map", () => assert.deepEqual(viewBox(newCamera(800, 600)), [0, 0, 800, 600]));
test("zoom keeps the point under the cursor fixed", () => {
  const c = newCamera(800, 600); zoomAt(c, 2, 0.25, 0.5);
  const [x, y, w, h] = viewBox(c);
  assert.equal(x + 0.25 * w, 200); assert.equal(y + 0.5 * h, 300); assert.equal(c.zoom, 2);
});
test("zoom is limited", () => { const c = newCamera(800, 600); zoomAt(c, 100); assert.equal(c.zoom, MAX_ZOOM); zoomAt(c, 0.0001); assert.equal(c.zoom, 1); });
test("cannot pan outside the map", () => {
  const c = newCamera(800, 600); zoomAt(c, 2); panBy(c, 5, 5);
  assert.deepEqual(viewBox(c), [0, 0, 400, 300]);
  panBy(c, -5, -5); assert.deepEqual(viewBox(c), [400, 300, 400, 300]);
});
test("zoom at 1 cannot be panned", () => { const c = newCamera(800, 600); panBy(c, 0.3, 0.3); assert.deepEqual(viewBox(c), [0, 0, 800, 600]); });
test("clamp fixes a bad state", () => { const c = { W: 800, H: 600, x: 999, y: -5, zoom: 2 }; clampCamera(c); assert.deepEqual(viewBox(c), [400, 0, 400, 300]); });
