import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { mapLabelPlacement } from "../src/view/historicalmap.mjs";
import { markerScale, portHitRadius, labelFontSize } from "../src/view/camera.mjs";

// Map label audit over the LIVE chart: bounds come from world.nodes (cities + waypoints),
// exactly like web/main.mjs, and the label box model mirrors the DOM: a g.city group at
// translate(port) scale(markerScale(zoom)) with a text at the raw placement offsets whose
// font-size is labelFontSize(zoom). Checked at several zooms: no port label may cover
// another port's click target (regression: labels captured neighbour clicks), no two
// labels may overlap, and click targets of different ports never overlap.
const world = loadWorld();
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, , y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, 0, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const ports = world.cities.map((c) => ({ id: c.id, name: c.name, px: X(c.lon), py: Y(c.lat) }));
const hit = new Map(ports.map((p) => {
  let best = Infinity;
  for (const q of ports) if (q.id !== p.id) best = Math.min(best, Math.hypot(p.px - q.px, p.py - q.py));
  return [p.id, portHitRadius(best)];
}));
const ZOOMS = [1, 1.5, 2, 4, 8];
// 0.571 = 8px per char at font-size 14: conservative bound over browser font metrics.
const labelBox = (p, zoom) => {
  const fs = labelFontSize(zoom), k = markerScale(zoom), l = mapLabelPlacement(p.id);
  const w = p.name.length * fs * 0.571 * k, h = 1.214 * fs * k;
  const tx = p.px + k * l.x, ty = p.py + k * l.y;
  return { x: tx - (l.anchor === "end" ? w : l.anchor === "middle" ? w / 2 : 0), y: ty - 13 * (fs / 14) * k, w, h };
};

test("no port label covers another port's click target at any zoom", () => {
  for (const zoom of ZOOMS) for (const a of ports) {
    const b = labelBox(a, zoom), r = (id) => hit.get(id) * markerScale(zoom);
    for (const c of ports) {
      if (c.id === a.id) continue;
      const nx = Math.max(b.x, Math.min(c.px, b.x + b.w)), ny = Math.max(b.y, Math.min(c.py, b.y + b.h));
      assert.ok(Math.hypot(c.px - nx, c.py - ny) >= r(c.id), `z${zoom}: ${a.id} label over ${c.id}`);
    }
  }
});
test("no two port labels overlap at any zoom", () => {
  for (const zoom of ZOOMS) {
    const boxes = ports.map((p) => ({ id: p.id, b: labelBox(p, zoom) }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i].b, B = boxes[j].b;
      assert.ok(!(A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h), `z${zoom}: ${boxes[i].id} vs ${boxes[j].id}`);
    }
  }
});
test("click targets of different ports never overlap", () => {
  for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) {
    const d = Math.hypot(ports[i].px - ports[j].px, ports[i].py - ports[j].py);
    assert.ok(d >= hit.get(ports[i].id) + hit.get(ports[j].id), `${ports[i].id} vs ${ports[j].id}`);
  }
});
