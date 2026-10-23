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
