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
import { markerScale } from "../src/view/camera.mjs";
test("markers stay near constant on screen", () => {
  assert.equal(markerScale(1), 1);
  assert.ok(markerScale(8) < 0.2 && markerScale(8) > 0.1);
  assert.ok(markerScale(2) < markerScale(1));
});
import { contentFraction, contentScale } from "../src/view/camera.mjs";
test("content fractions are identity when the content fills the viewport", () => {
  const rect = { left: 0, top: 0, width: 800, height: 829 };
  assert.deepEqual(contentFraction(rect, [0, 0, 800, 829], 400, 414.5), [0.5, 0.5]);
  assert.deepEqual(contentFraction(rect, [0, 0, 800, 829], 0, 0), [0, 0]);
});
test("content fractions skip the letterbox margins of a wide short pane", () => {
  const rect = { left: 20, top: 227, width: 1240, height: 352 }; // pane wider than the map aspect
  const vb = [0, 0, 800, 829], s = 352 / 829, ox = (1240 - 800 * s) / 2;
  const [fx, fy] = contentFraction(rect, vb, 20 + ox + 400 * s, 227 + 176);
  assert.ok(Math.abs(fx - 0.5) < 1e-9 && Math.abs(fy - 0.5) < 1e-9);
  // a point over the left margin clamps to the content's left edge
  assert.equal(contentFraction(rect, vb, 20, 227 + 176)[0], 0);
  assert.equal(contentFraction(rect, vb, 20 + 1240, 227 + 176)[0], 1);
});
test("content scale picks the limiting dimension", () => {
  assert.equal(contentScale({ width: 1240, height: 352 }, [0, 0, 800, 829]), 352 / 829);
  assert.equal(contentScale({ width: 400, height: 900 }, [0, 0, 800, 829]), 0.5);
});
