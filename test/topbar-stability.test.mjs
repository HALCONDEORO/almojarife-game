import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
test("the top bar clock and counters use tabular figures so the bar does not shake as time passes", () => {
  assert.match(css, /header #day,header #cash,header #goal,header #ships\{font-variant-numeric:tabular-nums;white-space:nowrap\}/);
});
