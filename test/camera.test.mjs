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
import {resizeCamera,centerCamera} from '../src/view/camera.mjs';
test('wide viewport fills its aspect without changing world geography',()=>{const c=newCamera(800,1000);resizeCamera(c,2);centerCamera(c,300,800);const[x,y,w,h]=viewBox(c);assert.equal(w/h,2);assert.ok(y>0);assert.ok(y+h<=1000);});
test('resize preserves centre when away from edges',()=>{const c=newCamera(800,1000);zoomAt(c,2);resizeCamera(c,2);centerCamera(c,400,500);resizeCamera(c,1);const[x,y,w,h]=viewBox(c);assert.equal(x+w/2,400);assert.equal(y+h/2,500);});
test('portrait keeps the complete world and legacy has no aspect override',()=>{const c=newCamera(800,1000);resizeCamera(c,.4);assert.equal(viewBox(c)[3],1000);const legacy=newCamera(800,1000);assert.deepEqual(viewBox(legacy),[0,0,800,1000]);});
