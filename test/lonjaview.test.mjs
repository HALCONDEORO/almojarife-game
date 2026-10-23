import test from "node:test";
import assert from "node:assert/strict";
import { lonjaEnabled, lonjaChart, lonjaHtml } from "../src/view/lonjaview.mjs";

const g = {
  world: { goods: { grain: { base: 30 }, fish: { base: 12 } }, nodes: { cadiz: {} } },
  market: { cadiz: { grain: { stock: 10, target: 300 }, fish: { stock: 5, target: 60 } } },
  hist: { cadiz: { grain: Array.from({ length: 30 }, (_, i) => 30 + (i % 7)), fish: [12] } },
};

test("flag: lonja defaults ON (owner order 23/10), only ?lonja=0 opts out, independent of ui2d", () => {
  assert.equal(lonjaEnabled("?lonja=1"), true);
  assert.equal(lonjaEnabled("?lonja=0"), false);
  assert.equal(lonjaEnabled(""), true);
  assert.equal(lonjaEnabled("?ui2d=1"), true);
  assert.equal(lonjaEnabled("?ui2d=0"), true);
});

test("chart: one polyline for a real series, empty for a short one", () => {
  assert.match(lonjaChart([10, 12, 11, 14]), /<svg class="lonja-chart".*<polyline/);
  assert.equal(lonjaChart([12]), "");
  assert.equal(lonjaChart([]), "");
});

test("lonja table: every good with price, signed 7d change and chart; short history shows the note", () => {
  const es = lonjaHtml(g, "cadiz", { lang: "es", goodLabel: (x) => `<b>${x}</b>` });
  assert.match(es, /Últimos 30 días/);
  assert.ok(es.includes("<b>grain</b>") && es.includes("<b>fish</b>"));
  assert.match(es, /[+\-—]\s?\d*\s?%|—/);
  assert.ok((es.match(/lonja-chart/g) ?? []).length >= 1, "at least one chart");
  assert.match(es, /Sin cuenta suficiente todavía/); // fish has one day only
  const en = lonjaHtml(g, "cadiz", { lang: "en", goodLabel: (x) => x });
  assert.match(en, /Last 30 days/);
});

test("labels are inserted as given; no history object at all still renders", () => {
  const bare = { world: g.world, market: g.market, hist: {} };
  const h = lonjaHtml(bare, "cadiz", { lang: "es", goodLabel: (x) => x });
  assert.match(h, /Sin cuenta suficiente todavía/);
  assert.doesNotMatch(h, /undefined|NaN/);
});
