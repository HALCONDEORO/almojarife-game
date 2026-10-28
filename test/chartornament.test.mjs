import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWorld } from '../src/sim/world.mjs';
import { escapeSvg, ornamentGeometry, chartOrnamentSvg } from '../src/view/chartornament.mjs';

const world = loadWorld(), nodes = Object.values(world.nodes);
const x0 = Math.min(...nodes.map(n => n.lon)) - 1;
const x1 = Math.max(...nodes.map(n => n.lon)) + 1;
const y1 = Math.max(...nodes.map(n => n.lat)) + 1;
const sc = 800 / (x1 - x0);
const x = lon => (lon - x0) * sc, y = lat => (y1 - lat) * sc * 1.25;
const args = { enabled: true, x, y };

test('SVG text escaping covers all markup delimiters', () => {
  assert.equal(escapeSvg(`<a x="'">&`), '&lt;a x=&quot;&apos;&quot;&gt;&amp;');
});

test('ornaments are opt-in, geographic only, finite and localized', () => {
  assert.equal(chartOrnamentSvg(), '');
  assert.equal(chartOrnamentSvg({ ...args, mode: 'political' }), '');
  assert.equal(chartOrnamentSvg({ ...args, x: () => NaN }), '');
  const es = chartOrnamentSvg({ ...args, lang: 'es' });
  const en = chartOrnamentSvg({ ...args, lang: 'en' });
  assert.match(es, /CARTA DE NAVEGACIÓN/);
  assert.match(es, />O<\/text>/);
  assert.match(en, /NAVIGATION CHART/);
  assert.match(en, />W<\/text>/);
  for (const svg of [es, en]) {
    assert.match(svg, /pointer-events="none"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.equal((svg.match(/transform="rotate\(/g) ?? []).length, 8);
    assert.doesNotMatch(svg, /NaN|undefined|href=|<image|<script|<foreignObject|\bkm\b/);
    // Balanced SVG elements, including the nested rose groups.
    assert.equal((svg.match(/<g\b/g) ?? []).length, (svg.match(/<\/g>/g) ?? []).length);
    assert.equal((svg.match(/<text\b/g) ?? []).length, (svg.match(/<\/text>/g) ?? []).length);
  }
});

test('live chart geometry leaves clearance from every node and lane', () => {
  const boxes = Object.values(ornamentGeometry(x, y));
  for (const b of boxes) {
    assert.ok(b.x - b.w / 2 > 0 && b.x + b.w / 2 < 800);
    const distance = p => Math.hypot(Math.max(0, Math.abs(x(p.lon) - b.x) - b.w / 2), Math.max(0, Math.abs(y(p.lat) - b.y) - b.h / 2));
    for (const n of nodes) assert.ok(distance(n) > 45, n.id);
    // Sample each straight SVG lane at intervals below one chart unit.
    for (const [a, z] of world.lanes) {
      const A = world.nodes[a], B = world.nodes[z];
      for (let i = 0; i <= 1600; i++) {
        const t = i / 1600;
        assert.ok(distance({ lon: A.lon + (B.lon - A.lon) * t, lat: A.lat + (B.lat - A.lat) * t }) > 20, `${a}-${z}`);
      }
    }
  }
  const [a, b] = boxes;
  assert.ok(Math.abs(a.y - b.y) > (a.h + b.h) / 2);
});
