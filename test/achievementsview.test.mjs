import test from "node:test";
import assert from "node:assert/strict";
import { achievementsHtml } from "../src/view/achievementsview.mjs";
import { ACHIEVEMENTS } from "../src/game/achievements.mjs";

test("the ES view lists earned and pending milestones", () => {
  const html = achievementsHtml({ achievements: { unlocked: { first_sale: 3 } } }, "es");
  assert.match(html, /Logros/);
  assert.match(html, /Primer trueque/);
  assert.match(html, new RegExp(`1 de ${ACHIEVEMENTS.length}`));
  assert.match(html, /día 3/);
  assert.match(html, /Por conseguir/); // the rest stay pending, faded
  assert.match(html, /style="opacity:.55"/);
  assert.match(html, /Casa poderosa/);
});
test("the EN view and a missing state render without it", () => {
  const html = achievementsHtml({}, "en");
  assert.match(html, /Achievements/);
  assert.match(html, /First trade/);
  assert.match(html, new RegExp(`0 of ${ACHIEVEMENTS.length}`));
});
