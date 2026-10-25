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
