import test from "node:test";
import assert from "node:assert/strict";
import { seasonTint, atmosphereSvg } from "../src/view/atmosphere.mjs";
test("each season has its own wash, and the opacity stays gentle", () => {
  const seen = new Set();
  for (const d of [0, 100, 200, 290]) { const t = seasonTint(d); seen.add(t.season); assert.ok(t.opacity > 0 && t.opacity <= 0.2); }
  assert.equal(seen.size, 4);
});
test("clouds animate only when motion is allowed, and the picture depends on the day alone", () => {
  assert.ok(atmosphereSvg(800, 600, 5, true).includes("<animate"));
  assert.ok(!atmosphereSvg(800, 600, 5, false).includes("<animate"));
  assert.equal(atmosphereSvg(800, 600, 5, true), atmosphereSvg(800, 600, 5, true));
  assert.notEqual(atmosphereSvg(800, 600, 5, true), atmosphereSvg(800, 600, 40, true));
});
test("winter has more clouds than summer", () => {
  const c = (d) => (atmosphereSvg(800, 600, d, false).match(/class="(cloud|fog|wind)/g) || []).length;
  assert.ok(c(10) > c(200));
});
test("winter draws storms, autumn fog, summer neither, and no layer takes pointer events", () => {
  assert.match(atmosphereSvg(800, 600, 10, false), /class="cloud storm"/);
  assert.match(atmosphereSvg(800, 600, 290, false), /class="fog"/);
  const summer = atmosphereSvg(800, 600, 200, false);
  assert.doesNotMatch(summer, /storm|class="fog"/);
  assert.match(summer, /pointer-events="none"/);
});
test("a storm placed over ports moves to the nearest spot that covers none", async () => {
  const { clearSpot, portClearance } = await import("../src/view/atmosphere.mjs");
  const ports = []; for (let x = 100; x < 800; x += 260) for (let y = 120; y < 800; y += 220) ports.push({ x, y });
  for (const [cx, cy] of [[100, 100], [400, 400], [700, 700], [250, 600]]) {
    const [x, y] = clearSpot(cx, cy, 150, 800, 829, ports);
    assert.ok(portClearance(x, y, 150, ports) >= 1, `(${cx},${cy}) -> (${x},${y}) is clear`);
    assert.deepEqual(clearSpot(cx, cy, 150, 800, 829, ports), [x, y], "deterministic");
  }
  const { readFileSync } = await import("node:fs");
  const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.ok(main.indexOf("atmosphereSvg(800, VH") < main.indexOf('<g id="static">${m}</g>'), "layer sits under ports and labels");
});
