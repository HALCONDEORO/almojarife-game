import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cityPlots } from "../src/view3d/cityplots.mjs";
import { urbanLayout, housingScale } from "../src/view/urbanlayout.mjs";
const world = JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url)));
test("every residential group is its own drawn neighbour house, apart from the lots for sale", async () => {
  for (const c of world.cities.slice(0, 12)) {
    const v = urbanLayout(await cityPlots(c.id, c.pop), c.pop);
    assert.equal(v.residential.length, housingScale(c.pop).groups, c.id);
    const lotIds = new Set(v.plots.map((p) => p.id));
    for (const r of v.residential) { assert.ok(r.id.startsWith("residential-")); assert.ok(!lotIds.has(r.id)); assert.equal(r.type, "house"); }
    assert.ok(v.plots.every((p) => !p.id.startsWith("residential-")), "lots keep their canonical ids");
  }
});
