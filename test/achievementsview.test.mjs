import test from "node:test";
import assert from "node:assert/strict";
import { achievementsHtml } from "../src/view/achievementsview.mjs";
import { ACHIEVEMENTS } from "../src/game/achievements.mjs";

test("the ES view lists earned and pending milestones", () => {
  const h = achievementsHtml({ achievements: { unlocked: { first_sale: 3 } } }, "es");
  assert.match(h, /Logros/);
  assert.match(h, /Primer trueque/);
  assert.match(h, new RegExp("1 de " + ACHIEVEMENTS.length));
  assert.match(h, /día 3/);
  assert.match(h, /Por conseguir/); // the rest stay pending, faded
  assert.match(h, /style="opacity:.55"/);
  assert.match(h, /Casa poderosa/);
});
test("the EN view and a missing state render without it", () => {
  const h = achievementsHtml({}, "en");
  assert.match(h, /Achievements/);
  assert.match(h, /First trade/);
  assert.match(h, new RegExp("0 of " + ACHIEVEMENTS.length));
});
