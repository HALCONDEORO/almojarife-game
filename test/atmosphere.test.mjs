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
  const c = (d) => (atmosphereSvg(800, 600, d, false).match(/<ellipse/g) || []).length;
  assert.ok(c(10) > c(200));
});
