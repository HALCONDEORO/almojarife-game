import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("toast stack sits above the bottom-left city note, not on top of it", () => {
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  const m = html.match(/#toasts\{[^}]*bottom:(\d+)px/);
  assert.ok(m && Number(m[1]) >= 48);
});
