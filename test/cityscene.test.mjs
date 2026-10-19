import test from "node:test";
import assert from "node:assert/strict";
import { citySceneSvg, houseCount, daylight, seeded } from "../src/view/cityscene.mjs";
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
