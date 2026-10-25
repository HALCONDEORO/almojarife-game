import { test } from "node:test";
import assert from "node:assert/strict";
import { initTutorial, tutorialNote, tutorialStep, tutorialHint, TUT_TEXT } from "../src/game/tutorial.mjs";

test("tutorial off: no key, no step, no hint", () => {
  const g = {};
  assert.equal(tutorialStep(g), null);
  assert.equal(tutorialHint(g, "en"), null);
  assert.equal(tutorialNote(g, "buy"), false);
  assert.deepEqual(g, {});
});
test("steps go buy -> sell -> sail -> done, in order only", () => {
  const g = {}; initTutorial(g);
  assert.equal(tutorialStep(g), "buy");
  assert.equal(tutorialNote(g, "sell"), false); // too early
  assert.equal(tutorialNote(g, "sail"), false);
  assert.equal(tutorialStep(g), "buy");
  assert.equal(tutorialNote(g, "buy"), true);
  assert.equal(tutorialStep(g), "sell");
  assert.equal(tutorialNote(g, "sail"), false);
  assert.equal(tutorialNote(g, "sell"), true);
  assert.equal(tutorialStep(g), "sail");
  assert.equal(tutorialNote(g, "sail"), true);
  assert.equal(tutorialStep(g), "done");
});
test("every step has es and en text, no leftover placeholders", () => {
  for (const l of ["es", "en"]) for (const k of ["buy", "sell", "sail", "done"]) assert.match(TUT_TEXT[l][k], /\S{3}/), assert.doesNotMatch(TUT_TEXT[l][k], /[{}]/);
  const g = {}; initTutorial(g);
  assert.equal(tutorialHint(g, "xx"), TUT_TEXT.es.buy);
});

import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSell, doSail, quote } from "../src/game/game.mjs";
const world = loadWorld();
test("a real game: off by default, on with opts.tutorial, advances on real trades", () => {
  assert.equal(newGame(world, "cadiz").tut, undefined);
  const g = newGame(world, "cadiz", { tutorial: true }), ship = g.ships[0];
  assert.equal(tutorialStep(g), "buy");
  const good = Object.keys(world.goods).find((k) => doBuy(g, ship, k, 1).ok);
  assert.ok(good, "bought something");
  assert.equal(tutorialStep(g), "sell");
  assert.ok(doSell(g, ship, good, 1).ok);
  assert.equal(tutorialStep(g), "sail");
  const to = world.cities.find((c) => c.id !== ship.at).id;
  const r = doSail(g, ship, to);
  if (r.ok) assert.equal(tutorialStep(g), "done");
});
test("failed actions do not advance the tutorial", () => {
  const g = newGame(world, "cadiz", { tutorial: true });
  assert.equal(doSell(g, g.ships[0], "grain", 5).ok, false);
  assert.equal(tutorialStep(g), "buy");
});
