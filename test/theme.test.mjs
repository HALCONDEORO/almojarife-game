import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const html = fs.readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
test("the page loads nothing from other sites (textures are inline, generated)", () => {
  const urls = [...html.matchAll(/(?:src|href)=["'](https?:)?\/\/[^"']+/g)].map((m) => m[0]);
  assert.deepEqual(urls, []);
  assert.ok(!/url\(["']?https?:/.test(html), "no remote url() in CSS");
});
test("the theme keeps keyboard focus visible and honours reduced motion", () => {
  assert.ok(html.includes(":focus-visible") && html.includes("prefers-reduced-motion"));
});
