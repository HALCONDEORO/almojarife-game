import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("right panel has a Ciudad tab, shown only while the ship is docked", () => {
  assert.ok(src.includes('["city", "Ciudad", "City"]'));
  assert.ok(src.includes('id !== "city" || docked'));
});
test("Ciudad tab buttons open the existing city panels", () => {
  assert.ok(src.includes("data-city-open"));
  assert.ok(src.includes("openCityPanel(k)"));
});
