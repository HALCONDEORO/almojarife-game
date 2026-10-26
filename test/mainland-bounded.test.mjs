import test from "node:test";
import assert from "node:assert/strict";
import { mainland } from "../src/view/city2d.mjs";
test("the landmass behind the town is bounded (about three town sizes), not eight", () => {
  const b = { minX: 0, minY: 0, maxX: 100, maxY: 80 };
  const pts = mainland(b), minX = Math.min(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1]));
  assert.ok(minX >= -3 * 100 - 1 && minY >= -3 * 100 - 1, `${minX},${minY}`);
  assert.ok(minX < 0 && minY < 0, "still extends inland past the town");
});
