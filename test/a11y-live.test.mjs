import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8"), main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const tag = (src, id) => src.match(new RegExp(`<[a-z]+ [^>]*id="${id}"[^>]*>`))?.[0] ?? "";
test("the map hint and the city mission line are polite live regions (tutorial and mission steps reach screen readers)", () => {
  for (const [src, id] of [[html, "hint"], [main, "city-mission"]]) {
    const t = tag(src, id);
    assert.ok(t, id + " exists");
    assert.match(t, /role="status"/, id);
    assert.match(t, /aria-live="polite"/, id);
  }
});

import { setLiveText } from "../web/livetext.mjs";
test("a live region is written only when its text changes", () => {
  let writes = 0, v = "";
  const el = { get textContent() { return v; }, set textContent(x) { writes++; v = x; } };
  assert.equal(setLiveText(el, "Tutorial 1/3"), true);
  assert.equal(setLiveText(el, "Tutorial 1/3"), false);
  assert.equal(setLiveText(el, "Tutorial 2/3"), true);
  assert.equal(setLiveText(el, null), true);
  assert.equal(setLiveText(el, ""), false);
  assert.equal(writes, 3);
  assert.equal(setLiveText(null, "x"), false);
});
test("main.mjs writes #hint and #city-mission through setLiveText", () => {
  assert.match(main, /setLiveText\(\$\("hint"\)/);
  assert.match(main, /setLiveText\(cm,/);
});
