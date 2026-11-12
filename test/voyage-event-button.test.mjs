import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression (found in the year-long playtest, 26/10): the "Resolver suceso" button of
// #542 never reached the player - render() paints the voyage card twice and the second,
// winning call dropped eventPending, wiping the button before its listener was wired.
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");

test("every voyage-card render in render() carries eventPending, so the resolve button cannot be wiped", () => {
  const block = main.slice(main.indexOf('  $("voyage-card").innerHTML=voyageCardHtml'), main.indexOf('  $("cash-card").innerHTML'));
  const calls = block.split('\n').filter(line=>line.includes('$("voyage-card").innerHTML=voyageCardHtml'));
  assert.ok(calls.length >= 1, "the voyage card renders at least once");
  for (const c of calls) assert.match(c, /eventPending:!!pendingEvent\(g\)/, `render call misses eventPending: ${c.slice(0, 80)}…`);
});

test("the button's listener is wired after the card renders", () => {
  assert.match(main, /\$\("voyage-event"\)\?\.addEventListener\("click"/);
});
