import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
test("top bar stays on one row between 1100 and 1400px by dropping the redundant ship counter", () => {
  assert.match(html, /@media\(max-width:1400px\) and \(min-width:1100px\)\{body:not\(\.in-city-3d\)>header\{gap:10px;flex-wrap:nowrap\}body:not\(\.in-city-3d\)>header #ships\{display:none\}\}/);
});
