import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// The chart stays clean: no arrival time or hours text over the destination port. ETA lives in the ship card.
test("map markup has no ETA labels", () => {
  const src = fs.readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /class="eta"/);
});
