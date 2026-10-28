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

import { portHitRadius } from "../src/view/camera.mjs";
test("port hit radius: capped at 14, halved in dense clusters, floor 8 (Lisboa/Setubal are 17.9 apart)", () => {
  assert.equal(portHitRadius(Infinity), 14);
  assert.equal(portHitRadius(40), 14);
  assert.equal(portHitRadius(22.6), 11.3); // Ceuta/Tetuan: clicks stay unambiguous
  assert.equal(portHitRadius(17.9), 8.95); // Lisboa/Setubal: 9 would overlap by 0.1
  assert.equal(portHitRadius(10), 8);
  assert.equal(portHitRadius(0), 8);
});

import { labelFontSize } from "../src/view/camera.mjs";
test("label font size grows gently with zoom (screen size ~ zoom^0.5)", () => {
  assert.equal(labelFontSize(1), 20);
  assert.ok(labelFontSize(8) > labelFontSize(4) && labelFontSize(4) > labelFontSize(2) && labelFontSize(2) > labelFontSize(1));
  assert.ok(labelFontSize(8) < 45); // bounded: close zoom does not blow names up
});

import {centerOn,panTo,minimapPoint,mapKey} from '../src/view/camera.mjs';
test('centerOn uses minimum 2x, clamps edges and preserves a closer zoom',()=>{
  const c=newCamera(800,600);centerOn(c,400,300);assert.deepEqual(viewBox(c),[200,150,400,300]);
  centerOn(c,-100,999);assert.deepEqual(viewBox(c),[0,300,400,300]);
  c.zoom=4;centerOn(c,400,300);assert.deepEqual(viewBox(c),[300,225,200,150]);
});
test('minimap coordinates cover full chart; panTo preserves zoom and clamps',()=>{
  const c=newCamera(800,600);assert.deepEqual(minimapPoint(c,.25,.5),[200,300]);
  assert.deepEqual(minimapPoint(c,-1,2),[0,600]);c.zoom=4;panTo(c,...minimapPoint(c,.25,.5));assert.deepEqual(viewBox(c),[100,225,200,150]);
  panTo(c,0,600);assert.deepEqual(viewBox(c),[0,450,200,150]);
});
test('map keyboard ignores editable controls and keeps numeric ship keys',()=>{
  for(const key of ['Home','c','a','ArrowDown','+','-'])assert.equal(mapKey(key,true),null);
  for(const key of ['1','2','9','Escape',' '])assert.equal(mapKey(key),null);
  assert.deepEqual(mapKey('Home'),{kind:'ship'});assert.deepEqual(mapKey('C'),{kind:'port'});
  assert.equal(mapKey('w').dy,.15);assert.equal(mapKey('ArrowRight').dx,-.15);
});
