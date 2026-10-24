import { test } from "node:test";
import assert from "node:assert/strict";
import { industrySpots, industryClusters } from "../src/view/industry2d.mjs";
import { cityPlots } from "../src/view3d/cityplots.mjs";
import { urbanLayout } from "../src/view/urbanlayout.mjs";
import { townIndustry } from "../src/game/townindustry.mjs";
import { harbourLayout } from "../src/view/city2d.mjs";
import { readFileSync } from "node:fs";

const world = JSON.parse(readFileSync(new URL("../data/world.json", import.meta.url), "utf8"));

const overlap = (a, b, pad = 0) =>
  a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.d && a.y + a.d + pad > b.y;

function segDist(x, y, s) {
  const dx = s.end.x - s.beg.x, dy = s.end.y - s.beg.y;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - s.beg.x) * dx + (y - s.beg.y) * dy) / len2));
  return Math.hypot(x - (s.beg.x + t * dx), y - (s.beg.y + t * dy));
}

const RURAL = new Set(["farm", "pasture", "vineyard", "esparto_field", "ranch", "mine", "molino", "sawmill", "orchard", "saltworks"]);

for (const [cityId, pop] of [["huelva", 8000], ["sevilla", 45000], ["valencia", 30000], ["lisboa", 60000]]) {
  test(`industrySpots ${cityId}: every roster establishment placed, none dropped`, async () => {
    const layout = urbanLayout(await cityPlots(cityId, pop), pop);
    const bounds = layout.visualBounds;
    const roster = townIndustry(world, cityId);
    assert.ok(roster.length > 0, `${cityId} roster must not be empty`);
    const clusters = industryClusters(roster);
    assert.ok(clusters.length <= roster.length, "clusters never exceed the roster");
    assert.equal(clusters.reduce((a, c) => a + c.count, 0), roster.length, "cluster counts sum to the roster: no works dropped");
    const spots = industrySpots(bounds, layout, clusters);
    assert.equal(spots.length, clusters.length, "one spot per cluster");
    for (const s of spots) {
      assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y) && s.w > 0 && s.d > 0, `finite box for ${s.id}`);
    }
    // No two establishments overlap.
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++)
        assert.ok(!overlap(spots[i], spots[j], 0.5), `${spots[i].id} vs ${spots[j].id} must not overlap`);
  });

  test(`industrySpots ${cityId}: urban spots clear plots, plaza, paths and the quay`, async () => {
    const layout = urbanLayout(await cityPlots(cityId, pop), pop);
    const bounds = layout.visualBounds;
    const edge = harbourLayout(bounds).edge;
    const roster = townIndustry(world, cityId);
    const spots = industrySpots(bounds, layout, industryClusters(roster));
    const solid = [...layout.plots, ...layout.residential];
    for (const s of spots) {
      if (RURAL.has(s.type)) continue;
      const inside = s.x >= bounds.minX && s.x + s.w <= bounds.maxX && s.y >= bounds.minY && s.y + s.d <= bounds.maxY;
      if (!inside) continue; // fell back to the outskirts ring: outside the fabric by design
      assert.ok(s.x + s.w <= edge - 2.2 + 1e-9, `${s.id} clear of the quay apron`);
      for (const p of solid) assert.ok(!overlap(s, p, 1.0), `${s.id} overlaps ${p.id}`);
      if (layout.plaza) assert.ok(!overlap(s, layout.plaza, 1.4), `${s.id} overlaps the plaza`);
      for (const pth of layout.paths)
        assert.ok(segDist(s.x + s.w / 2, s.y + s.d / 2, pth) >= 3.0, `${s.id} sits on a street`);
    }
  });

  test(`industrySpots ${cityId}: deterministic`, async () => {
    const layout = urbanLayout(await cityPlots(cityId, pop), pop);
    const roster = townIndustry(world, cityId);
    assert.deepEqual(industrySpots(layout.visualBounds, layout, industryClusters(roster)), industrySpots(layout.visualBounds, layout, industryClusters(roster)));
  });
}

test("industrySpots: bad input returns empty, never throws", () => {
  assert.deepEqual(industrySpots(null, null, null), []);
  assert.deepEqual(industrySpots({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, {}, "x"), []);
});

test("industrySpots: a huge roster is still fully placed (fallback ring works)", async () => {
  const layout = urbanLayout(await cityPlots("huelva", 8000), 8000);
  const big = Array.from({ length: 60 }, (_, i) => ({ id: `x:${i}`, type: i % 2 ? "brewery" : "pottery", level: 1 + (i % 3) }));
  const spots = industrySpots(layout.visualBounds, layout, big);
  assert.equal(spots.length, 60);
  for (let i = 0; i < spots.length; i++)
    for (let j = i + 1; j < spots.length; j++)
      assert.ok(!overlap(spots[i], spots[j], 0.5), `fallback ${i} vs ${j} overlaps`);
});
