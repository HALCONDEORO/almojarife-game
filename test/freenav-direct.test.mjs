import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("free navigation: a right click sails at once, with no confirmation menu", () => {
  assert.ok(!src.includes("Zarpar aquí"));
  assert.ok(!src.includes("Sail here"));
});
