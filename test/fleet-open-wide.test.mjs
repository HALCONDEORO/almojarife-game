import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("fleet list is pinned open by the chart-area width, not the window width", () => {
  assert.match(main, /area\.clientWidth >= FLEET_PIN_MIN/);
  assert.match(main, /new ResizeObserver\(fitFleet\)\.observe\(\$\("maparea"\)\)/);
  assert.match(main, /else if \(was\) f\.open = false/);
  assert.doesNotMatch(main, /FLEET_WIDE/);
  assert.match(html, /#fleet\.fleet-pinned summary\{pointer-events:none/);
  assert.match(html, /#fleet\.fleet-pinned summary::before\{display:none\}/);
});
test('the pin rule is not nested inside the narrow-screen rule',()=>{
 assert.match(html, /@media\(max-width:600px\)\{#maparea>#fleet\{bottom:auto\}\}[^@]*#fleet\.fleet-pinned summary/);
});

test('fleet panel is bounded by its map area, not the viewport',()=>{
 assert.match(html, /#maparea>#fleet\{top:8px;right:12px;max-height:calc\(100% - 16px\);overflow:auto\}/);
});
