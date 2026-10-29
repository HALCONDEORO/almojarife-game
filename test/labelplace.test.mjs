import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { placeLabels, CANDIDATES, LANDMARKS, LANDMARK_FONT } from "../src/view/labelplace.mjs";
import { markerScale, portHitRadius, labelFontSize } from "../src/view/camera.mjs";

// Same chart projection as web/main.mjs and maplabels.test.mjs.
const world = loadWorld();
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0), VH = Math.round((y1 - y0) * sc * 1.25);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const bounds = { width: 800, height: VH };
const items = () => [
  ...world.cities.map((c) => ({ id: c.id, name: c.name, x: X(c.lon), y: Y(c.lat), pop: c.pop, kind: "port" })),
  ...LANDMARKS.map((l) => ({ id: l.id, name: l.name, x: X(l.lon), y: Y(l.lat), kind: "landmark" })),
];
const ports = items().filter((i) => i.kind === "port");
const hitR = (id) => {
  const a = ports.find((p) => p.id === id); let best = Infinity;
  for (const q of ports) if (q.id !== id) best = Math.min(best, Math.hypot(a.x - q.x, a.y - q.y));
  return portHitRadius(best);
};
const ZOOMS = [1, 1.5, 2, 4, 8];
// Box rebuilt here from the returned offsets, independently of the module's own box.
const boxOf = (it, r, zoom) => {
  const k = markerScale(zoom), fs = labelFontSize(zoom) * (it.kind === "landmark" ? LANDMARK_FONT : 1);
  const w = it.name.length * fs * 0.571 * k, h = 1.214 * fs * k, tx = it.x + k * r.x, ty = it.y + k * r.y;
  return { x: tx - (r.anchor === "end" ? w : r.anchor === "middle" ? w / 2 : 0), y: ty - 13 * (fs / 14) * k, w, h };
};

test("eight distinct candidate positions", () => {
  assert.equal(CANDIDATES.length, 8);
  assert.equal(new Set(CANDIDATES.map((c) => c.pos)).size, 8);
});

test("Cádiz, Tánger, Ceuta and Gibraltar are all labelled at zoom 1", () => {
  const out = placeLabels(items(), { zoom: 1, hitR, bounds });
  for (const id of ["cadiz", "tanger", "ceuta", "gibraltar"]) assert.equal(out.find((r) => r.id === id).hidden, false, id);
});

test("visible labels never overlap, never cover another port's click target and stay on the chart", () => {
  for (const zoom of ZOOMS) {
    const its = items(), out = placeLabels(its, { zoom, hitR, bounds }), k = markerScale(zoom);
    const vis = out.map((r, i) => ({ r, it: its[i] })).filter((v) => !v.r.hidden).map((v) => ({ ...v, b: boxOf(v.it, v.r, zoom) }));
    for (const { it, b } of vis) {
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= bounds.width && b.y + b.h <= bounds.height, `z${zoom}: ${it.id} off chart`);
      for (const p of ports) {
        if (p.id === it.id) continue;
        const nx = Math.max(b.x, Math.min(p.x, b.x + b.w)), ny = Math.max(b.y, Math.min(p.y, b.y + b.h));
        assert.ok(Math.hypot(p.x - nx, p.y - ny) >= hitR(p.id) * k, `z${zoom}: ${it.id} label over ${p.id}`);
      }
    }
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const A = vis[i].b, B = vis[j].b;
      assert.ok(!(A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h), `z${zoom}: ${vis[i].it.id} vs ${vis[j].it.id}`);
    }
  }
});

test("placement is deterministic and independent of input order", () => {
  const a = placeLabels(items(), { zoom: 1, hitR, bounds });
  const b = placeLabels(items(), { zoom: 1, hitR, bounds });
  assert.deepEqual(a, b);
  const rev = items().reverse(), c = placeLabels(rev, { zoom: 1, hitR, bounds });
  const byId = (rs) => Object.fromEntries(rs.map((r) => [r.id, r]));
  assert.deepEqual(byId(c), byId(a));
});

test("passing the previous result keeps every choice (stable across re-renders)", () => {
  for (const zoom of ZOOMS) {
    const first = placeLabels(items(), { zoom, hitR, bounds });
    const prev = new Map(first.map((r) => [r.id, r]));
    assert.deepEqual(placeLabels(items(), { zoom, hitR, bounds, prev }), first);
  }
});

test("when two labels cannot both fit, the less important one hides", () => {
  // Two ports 2 units apart in a tiny chart: only one label fits anywhere.
  const its = [
    { id: "small", name: "Pueblo", x: 60, y: 30, pop: 100, kind: "port" },
    { id: "big", name: "Ciudad", x: 62, y: 30, pop: 9000, kind: "port" },
  ];
  const out = placeLabels(its, { zoom: 1, hitR: () => 1, bounds: { width: 140, height: 60 } });
  assert.equal(out.find((r) => r.id === "big").hidden, false);
  assert.equal(out.find((r) => r.id === "small").hidden, true);
});

import {candidatesFor} from '../src/view/labelplace.mjs';
test('each port has exactly eight candidates, including stable prior choice',()=>{
 for(const item of items()){
  assert.equal(candidatesFor(item).length,8);
  assert.equal(candidatesFor(item,{pos:'W'}).length,8);
 }
});
test('placement never reuses stale mutable inputs or click-radius constraints',()=>{
 const its=items(),a=placeLabels(its,{hitR,bounds});
 its[0].name='X'.repeat(100);const b=placeLabels(its,{hitR,bounds});assert.notDeepEqual(a,b);
 const c=placeLabels(its,{hitR:()=>10000,bounds});assert.notDeepEqual(b,c);
});
