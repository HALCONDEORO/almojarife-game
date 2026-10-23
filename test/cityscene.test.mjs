import test from "node:test";
import assert from "node:assert/strict";
import { citySceneSvg, houseCount, daylight, seeded } from "../src/view/cityscene.mjs";
import { shipDescriptor } from "../src/view/shipvisual.mjs";
test("the same port always looks the same, and different ports differ", () => {
  const a = { id: "cadiz", pop: 12000, day: 10 };
  assert.equal(citySceneSvg(a), citySceneSvg({ ...a }));
  assert.notEqual(citySceneSvg(a), citySceneSvg({ ...a, id: "sevilla" }));
  const r = seeded("x"), r2 = seeded("x"); assert.equal(r(), r2());
});
test("bigger ports have more houses, within limits", () => {
  assert.equal(houseCount(500), 5); assert.ok(houseCount(50000) > houseCount(8000)); assert.equal(houseCount(1e7), 18);
});
test("warehouse and docked ships only appear when they exist", () => {
  const base = { id: "lisboa", pop: 30000, shipyard: false };
  const plain = citySceneSvg(base), full = citySceneSvg({ ...base, warehouse: true, ships: 2 });
  assert.ok(full.length > plain.length);
  assert.ok(!plain.includes('width="62" height="36"') && full.includes('width="62" height="36"'));
  assert.equal((full.match(/translate\(\d+ 150\)/g) || []).length, 2);
});
test("night is darker than noon, shows stars, and seasons change the sky", () => {
  assert.ok(daylight(0.5) > 0.95 && daylight(0.0) < 0.1);
  const night = citySceneSvg({ id: "a", pop: 9000, tod: 0 }), noon = citySceneSvg({ id: "a", pop: 9000, tod: 0.5 });
  assert.ok(night.includes("opacity=") && night.split("<circle").length > 10 && noon.split("<circle").length === 1);
  assert.notEqual(citySceneSvg({ id: "a", pop: 9000, day: 0 }), citySceneSvg({ id: "a", pop: 9000, day: 200 }));
});
test("output is a well-formed svg string", () => {
  const s = citySceneSvg({ id: "bilbao", pop: 6000, warehouse: true, ships: 3 });
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"));
  assert.equal(s.split("<svg").length, 2);
});


// Strict tag mini-parser: every tag must be <name attr="value" ...> with no stray
// text inside. Catches malformed markup that substring asserts swallow (e.g. an
// attribute missing its closing quote).
function tags(svg) {
  const out = [];
  for (const m of svg.matchAll(/<[^<>]*>/g)) {
    const tm = m[0].match(/^<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>$/);
    assert.ok(tm, `well-formed tag, got: ${m[0].slice(0, 90)}`);
    const attrs = {};
    for (const a of tm[3].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    out.push({ name: tm[2], attrs });
  }
  return out;
}
const num = (v) => Number.isFinite(Number(v));

test("docked ships follow the real ship descriptors: class, damage, armament and gear", () => {
  const mk = (over) => shipDescriptor({ id: 1, type: "cog", hull: 100, weapons: {}, gunCond: 100, gear: 0, crew: 8, ...over });
  const one = (d) => citySceneSvg({ id: "cadiz", pop: 12000, ships: [d] });
  const intact = one(mk({})), nao = one(mk({ type: "nao" }));
  assert.notEqual(intact, nao, "class changes the docked silhouette");
  assert.ok(one(mk({ hull: 40 })).includes('y="2" width="9" height="6"'), "worn hull draws a plank patch");
  assert.ok(one(mk({ hull: 20 })).includes('y="3" width="9" height="6"'), "battered hull draws a second patch");
  const armed = one(mk({ weapons: { cannon: 2 } }));
  assert.ok((armed.match(/height="2.4"/g) || []).length === 2, "one gunport tick per mounted piece");
  assert.ok(one(mk({ gear: 2 })).includes('y="-6"'), "sailors' gear shows as deck crates");
});
test("docked list still accepts a plain count and caps at three", () => {
  const s = citySceneSvg({ id: "cadiz", pop: 12000, ships: 9 });
  assert.equal((s.match(/translate\(\d+ 150\)/g) || []).length, 3);
});

test("ship state markers are well-formed SVG with correct parsed attributes", () => {
  const d = shipDescriptor({ id: 1, type: "nao", hull: 20, weapons: { cannon: 2 }, gunCond: 40, gear: 2, crew: 30 });
  const rects = tags(citySceneSvg({ id: "cadiz", pop: 12000, ships: [d] })).filter((t) => t.name === "rect");
  for (const r of rects) for (const a of ["x", "y", "width", "height"]) if (a in r.attrs) assert.ok(num(r.attrs[a]), `numeric ${a} in <rect>`);
  const patches = rects.filter((r) => r.attrs.fill === "#3a2a1a" && r.attrs.opacity === ".8" && Number(r.attrs.width) === 9);
  assert.equal(patches.length, 2, "worn + battered hull: two plank patches");
  const gunports = rects.filter((r) => r.attrs.fill === "#1a0d06" && Number(r.attrs.height) === 2.4);
  assert.equal(gunports.length, 2, "one gunport tick per mounted cannon");
  assert.ok(gunports.every((r) => Number(r.attrs.width) === 2), "worn pieces are short dashes");
  const crates = rects.filter((r) => r.attrs.fill === "#8a6a3a" && Number(r.attrs.y) === -6);
  assert.equal(crates.length, 2, "one deck crate per gear level");
});
