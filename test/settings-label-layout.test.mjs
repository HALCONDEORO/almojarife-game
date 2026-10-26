import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("Settings rows stay flex rows despite the generic '#title label' block rule", () => {
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  assert.match(html, /#title label\.st-row\{display:flex/);
});
