import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("fleet list stays open on wide screens and the same breakpoint is used in CSS and JS", () => {
  const css = html.match(/@media\(min-width:(\d+)px\)\{#fleet summary\{pointer-events:none/);
  const js = main.match(/FLEET_WIDE = matchMedia\("\(min-width: (\d+)px\)"\)/);
  assert.ok(css && js);
  assert.equal(css[1], js[1]);
  assert.match(main, /if \(FLEET_WIDE\.matches\) \$\("fleet"\)\.open = true/);
});
test('wide fleet rule is not nested inside the narrow-screen rule',()=>{
 assert.match(html, /@media\(max-width:600px\)\{#maparea>#fleet\{bottom:auto\}\}@media\(min-width:1280px\)/);
});

test('fleet panel is bounded by its map area, not the viewport',()=>{
 assert.match(html, /#maparea>#fleet\{top:8px;right:12px;max-height:calc\(100% - 16px\);overflow:auto\}/);
});
