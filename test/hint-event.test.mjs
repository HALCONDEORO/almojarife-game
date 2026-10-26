import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
test("at sea with a pending event the hint says to resolve it instead of 'wait to arrive'", () => {
  assert.match(main, /pendingEvent\(g\) \? t\.hintEvent : t\.hintSea/);
  assert.equal((main.match(/hintEvent: "/g) || []).length, 2, "both locales");
  assert.match(main, /hintEvent: "Hay un suceso pendiente/);
});
