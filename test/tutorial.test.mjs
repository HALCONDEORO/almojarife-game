import { test } from "node:test";
import assert from "node:assert/strict";
import { initTutorial, tutorialNote, tutorialStep, tutorialHint, tutorialLine, tutorialActive, skipTutorial, TUT_TEXT } from "../src/game/tutorial.mjs";

test("tutorial off: no key, no step, no hint", () => {
  const g = {};
  assert.equal(tutorialStep(g), null);
  assert.equal(tutorialHint(g, "en"), null);
  assert.equal(tutorialNote(g, "buy"), false);
  assert.deepEqual(g, {});
});
test("steps go buy -> sell -> sail -> route -> hall -> done, in order only", () => {
  const g = {}; initTutorial(g);
  assert.equal(tutorialStep(g), "buy");
  assert.equal(tutorialNote(g, "sell"), false); // too early
  assert.equal(tutorialNote(g, "sail"), false);
  assert.equal(tutorialNote(g, "route"), false);
  assert.equal(tutorialNote(g, "hall"), false);
  assert.equal(tutorialStep(g), "buy");
  assert.equal(tutorialNote(g, "buy"), true);
  assert.equal(tutorialStep(g), "sell");
  assert.equal(tutorialNote(g, "route"), false);
  assert.equal(tutorialNote(g, "sell", {profit:1,spent:10}), true);
  assert.equal(tutorialStep(g), "sail");
  assert.equal(tutorialNote(g, "hall"), false); // the council visit only counts after the route
  assert.equal(tutorialNote(g, "route"), false);
  assert.equal(tutorialNote(g, "sail"), true);
  assert.equal(tutorialStep(g), "route");
  assert.equal(tutorialNote(g, "hall"), false);
  assert.equal(tutorialNote(g, "route"), true);
  assert.equal(tutorialStep(g), "hall");
  assert.equal(tutorialNote(g, "hall"), true);
  assert.equal(tutorialStep(g), "done");
});
test("a completed v1 tutorial (bought/sold/sailed, no v field) stays complete", () => {
  assert.equal(tutorialStep({ tut: { bought: true, sold: true, sailed: true } }), "done");
  assert.equal(tutorialLine({ tut: { bought: true, sold: true, sailed: true } }), null);
  // a half-done v1 tutorial keeps its progress and finishes under the original three steps
  const part = { tut: { bought: true, sold: true } };
  assert.equal(tutorialStep(part), "sail");
  assert.equal(tutorialNote(part, "route"), false); // v1 never had a route step
  assert.equal(tutorialNote(part, "sail"), true);
  assert.equal(tutorialStep(part), "done");
});
test("skip: one click finishes the tutorial from any step, only while it runs", () => {
  const g = {}; initTutorial(g);
  assert.equal(tutorialActive(g), true);
  assert.equal(skipTutorial(g), true);
  assert.equal(tutorialStep(g), "done");
  assert.equal(tutorialActive(g), false);
  assert.equal(tutorialLine(g), null);
  assert.equal(skipTutorial(g), false); // already skipped: nothing left to skip
  assert.equal(tutorialNote(g, "buy"), false); // a skipped tutorial does not come back
  assert.equal(skipTutorial({}), false); // no tutorial: nothing to skip
  const done = {}; initTutorial(done); for (const k of ["buy", "sell", "sail", "route", "hall"]) tutorialNote(done, k, {profit:1,spent:10});
  assert.equal(skipTutorial(done), false); // already done on its own
});
test("every step has es and en text, no leftover placeholders", () => {
  for (const l of ["es", "en"]) for (const k of ["buy", "sell", "sail", "route", "hall", "done"]) assert.match(TUT_TEXT[l][k], /\S{3}/), assert.doesNotMatch(TUT_TEXT[l][k], /[{}]/);
  const g = {}; initTutorial(g);
  assert.equal(tutorialHint(g, "xx"), TUT_TEXT.es.buy);
});

import { loadWorld } from "../src/sim/world.mjs";
import { difficultyOpts } from "../src/game/difficulty.mjs";
import { advanceDay, newGame, doBuy, doSell, doSail, doGoTo, quote } from "../src/game/game.mjs";
const world = loadWorld();
test("a real game: off by default, on with opts.tutorial, advances on real trades", () => {
  assert.equal(newGame(world, "cadiz").tut, undefined);
  const g = newGame(world, "cadiz", { ...difficultyOpts("easy"), tutorial: true }), ship = g.ships[0];
  assert.equal(tutorialStep(g), "buy");
  const good = Object.keys(world.goods).find((k) => doBuy(g, ship, k, 1).ok);
  assert.ok(good, "bought something");
  assert.equal(tutorialStep(g), "sell");
  assert.ok(doSell(g, ship, good, 1).ok);
  assert.equal(tutorialStep(g), "sell");
  assert.ok(doBuy(g,ship,good,1).ok);
  // Carry paid cargo to a genuinely scarce port, then sell at a gain.
  const to = "huelva";
  assert.ok(doSail(g, ship, to).ok);
  for (let i=0;ship.voyage && i<20;i++) advanceDay(g);
  assert.equal(ship.at,to);
  g.market[to][good].stock = 0; // deterministic shortage fixture, not a playthrough claim
  assert.ok(doSell(g, ship, good, ship.cargo[good]).ok);
  assert.equal(tutorialStep(g), "route");
  assert.ok(setRoute(g, ship, to, "cadiz", good).ok);
  assert.equal(tutorialStep(g), "hall");
  assert.equal(tutorialNote(g, "hall"), true); // the UI fires this when the player opens the Town hall tab
  assert.equal(tutorialStep(g), "done");
});
test("failed actions do not advance the tutorial", () => {
  const g = newGame(world, "cadiz", { ...difficultyOpts("easy"), tutorial: true });
  assert.equal(doSell(g, g.ships[0], "grain", 5).ok, false);
  assert.equal(tutorialStep(g), "buy");
});

test("engine rule: the tutorial starts on any difficulty, only when asked for", () => {
  for (const d of ["easy", "normal", "hard"]) assert.ok(newGame(world, "cadiz", { ...difficultyOpts(d), tutorial: true }).tut, d);
  assert.equal(newGame(world, "cadiz", { tutorial: true }).tut !== undefined, true);
  assert.equal(newGame(world, "cadiz", { ...difficultyOpts("easy") }).tut, undefined); // a difficulty alone does not turn it on
  assert.equal(newGame(world, "cadiz", {}).tut, undefined); // OFF by default: no key
});
test("damaged g.tut never throws and trading still works", () => {
  for (const bad of [true, 5, "x", [], null, 0]) {
    assert.equal(tutorialStep({ tut: bad }), null);
    assert.equal(tutorialNote({ tut: bad }, "buy"), false);
    assert.equal(tutorialHint({ tut: bad }, "en"), null);
    const g = newGame(world, "cadiz"); g.tut = bad;
    const ship = g.ships[0], good = Object.keys(world.goods).find((k) => doBuy(g, ship, k, 1).ok);
    assert.ok(good, "buy works with g.tut=" + JSON.stringify(bad));
    assert.ok(doSell(g, ship, good, 1).ok);
  }
  const part = { tut: { bought: "yes", sold: 1 } }; // non-boolean flags are not progress
  assert.equal(tutorialStep(part), "buy");
});
test("free navigation counts as sailing", () => {
  const g = newGame(world, "cadiz", { ...difficultyOpts("easy"), tutorial: true }), ship = g.ships[0];
  g.freeNav = true;
  const good = Object.keys(world.goods).find((k) => doBuy(g, ship, k, 1).ok);
  assert.ok(doSell(g, ship, good, 1).ok);
  const node = world.nodes.w_cadiz_off; // a sea point next to Cadiz, not a port
  const r = doGoTo(g, ship, node.lat, node.lon);
  assert.ok(r.ok && !r.toPort, JSON.stringify(r));
  assert.equal(g.tut.sailed,true);
  assert.equal(tutorialStep(g), "sell"); // voyage is remembered but a losing sale still does not teach profit
});

import { cleanProfile, startOptions } from "../src/game/profile.mjs";
import { setRoute } from "../src/game/game.mjs";
// (tutorialLine already imported above)
test("the real start path: every difficulty starts in the tutorial, with no 50,000 goal and no deadline", () => {
  const ids = world.cities.map((c) => c.id);
  for (const d of ["easy", "normal", "hard"]) {
    const p = cleanProfile({ difficulty: d }, ids);
    const g = newGame(world, p.home, { ...startOptions(p), profile: p, events: true, seed: 1 });
    assert.ok(g.tut, d); assert.equal(tutorialLine(g, "en") !== null, true, d);
    assert.ok(g.noGoal && !g.freePlay, d); assert.ok(g.campaign, d + ": the mission campaign stays");
    g.cash += 1e6; for (let i = 0; i < 400; i++) advanceDay(g); // far past the old 365-day deadline, far over the old goal
    assert.ok(!g.over, d + ": no win and no lose from the old goal/deadline");
  }
});
test("open-ended keeps bankruptcy as a real defeat", () => {
  const p = cleanProfile({ difficulty: "normal" }, world.cities.map((c) => c.id)), g = newGame(world, p.home, { ...startOptions(p), seed: 1 });
  g.cash = -1e7; advanceDay(g);
  assert.equal(g.over, "lose"); assert.equal(g.overReason, "bankrupt");
});
test("a game without openended keeps the old 50,000 / 365 rules (existing saves)", () => {
  const g = newGame(world, "cadiz", { seed: 1 });
  assert.ok(!g.freePlay && !g.noGoal);
  for (let i = 0; i < 366 && !g.over; i++) advanceDay(g);
  assert.ok(g.over === "win" || g.over === "lose");
});
test("the tutorial step order on a started game", () => {
  const ids = world.cities.map((c) => c.id);
  const p = cleanProfile({ difficulty: "easy" }, ids), g = newGame(world, p.home, { ...startOptions(p), profile: p, events: true, seed: 1 });
  assert.equal(tutorialStep(g), "buy");
});
test("automated trading (standing routes) does not advance the tutorial", () => {
  const g = newGame(world, "cadiz", { ...difficultyOpts("easy"), tutorial: true }), ship = g.ships[0];
  const b = world.cities.map((c) => c.id).find((c) => c !== ship.at && Object.keys(world.goods).some((k) => g.market[c]?.[k] && g.market[ship.at]?.[k]));
  const good = Object.keys(world.goods).find((k) => g.market[b]?.[k] && g.market[ship.at]?.[k]);
  assert.ok(setRoute(g, ship, ship.at, b, good).ok);
  const cash0 = g.cash;
  for (let i = 0; i < 60; i++) advanceDay(g);
  assert.ok(g.cash !== cash0 || ship.route?.legs > 0, "the route really traded");
  assert.equal(tutorialStep(g), "buy");
});

 test("v2 sale needs finite positive profit and known cost; v1 stays compatible",()=>{
 const g={};initTutorial(g);tutorialNote(g,"buy");
 for(const trade of [{},{profit:0,spent:1},{profit:-1,spent:1},{profit:Infinity,spent:1},{profit:1,spent:0},{profit:1,spent:NaN}])assert.equal(tutorialNote(g,"sell",trade),false);
 assert.equal(tutorialNote(g,"sail"),true);assert.equal(tutorialStep(g),"sell");
 assert.equal(tutorialNote(g,"sell",{profit:1,spent:10}),true);assert.equal(tutorialStep(g),"route");
 assert.equal(tutorialNote({tut:{bought:true}},"sell"),true);
 });
