import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapLabelPlacement } from "../src/view/historicalmap.mjs";
import { portHitRadius } from "../src/view/camera.mjs";

// Map label geometry audit over the real chart: no port label may sit on another port's
// click target (regression: labels captured neighbour clicks) and no two labels may overlap.
const world = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url)));
const lons = world.cities.map((c) => c.lon), lats = world.cities.map((c) => c.lat);
const [x0, x1, , y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, 0, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const ports = world.cities.map((c) => ({ id: c.id, name: c.name, px: X(c.lon), py: Y(c.lat) }));
const hit = new Map(ports.map((p) => {
  let best = Infinity;
  for (const q of ports) if (q.id !== p.id) best = Math.min(best, Math.hypot(p.px - q.px, p.py - q.py));
  return [p.id, portHitRadius(best)];
}));
const labelBox = (p) => {
  const l = mapLabelPlacement(p.id), w = p.name.length * 8, h = 17; // 8px/char: conservative bound over browser font metrics at font-size 14
  return { x: p.px + l.x - (l.anchor === "end" ? w : l.anchor === "middle" ? w / 2 : 0), y: p.py + l.y - 13, w, h };
};

test("no port label covers another port's click target", () => {
  for (const a of ports) {
    const b = labelBox(a);
    for (const c of ports) {
      if (c.id === a.id) continue;
      const nx = Math.max(b.x, Math.min(c.px, b.x + b.w)), ny = Math.max(b.y, Math.min(c.py, b.y + b.h));
      assert.ok(Math.hypot(c.px - nx, c.py - ny) >= hit.get(c.id), `${a.id} label over ${c.id}`);
    }
  }
});
test("no two port labels overlap", () => {
  const boxes = ports.map((p) => ({ id: p.id, b: labelBox(p) }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const A = boxes[i].b, B = boxes[j].b;
    assert.ok(!(A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h), `${boxes[i].id} vs ${boxes[j].id}`);
  }
});
test("click targets of different ports never overlap", () => {
  for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) {
    const d = Math.hypot(ports[i].px - ports[j].px, ports[i].py - ports[j].py);
    assert.ok(d >= hit.get(ports[i].id) + hit.get(ports[j].id), `${ports[i].id} vs ${ports[j].id}`);
  }
});
