// Missions stay hidden and frozen until the tutorial is completed or skipped
// (owner decision, 25 Oct 2026): no HUD line, no event progress, no activation,
// no deadlines. Once the tutorial is done or skipped the arc resumes untouched.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { difficultyOpts } from "../src/game/difficulty.mjs";
import { newGame, advanceDay, doBuy, MISSION } from "../src/game/game.mjs";
import { campaignEvent, campaignTick, missionView } from "../src/game/campaigns.mjs";
import { initTutorial, skipTutorial, tutorialNote } from "../src/game/tutorial.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();
const withTut = () => newGame(world, "cadiz", { ...difficultyOpts("easy"), tutorial: true, events: true, seed: 1 });

test("a game in the tutorial shows no missions and mission events do not count", () => {
  const g = withTut();
  assert.deepEqual(missionView(g, "es", MISSION), []);
  assert.deepEqual(missionView(g, "en", MISSION), []);
  assert.equal(campaignEvent(g, { kind: "buy", good: "salt", qty: 40, city: "cadiz" }, MISSION), false);
  assert.equal(g.campaign.missions["m1-oficio"].step, 0);
  assert.equal(g.campaign.missions["m1-oficio"].count, 0);
});

test("no activation, progress or deadlines while the tutorial runs", () => {
  const g = withTut();
  for (let i = 0; i < 70; i++) campaignTick(g, MISSION); // past the m1 deadline (day 60)
  g.day = 90; campaignTick(g, MISSION);
  assert.deepEqual(g.campaign.active, ["m1-oficio"]); // nothing activated, nothing failed
  assert.equal(g.campaign.missions["m1-oficio"].failed, false);
  assert.equal(g.campaign.missions["m2-nombre"], undefined);
});

test("skipping the tutorial releases the mission arc the same day", () => {
  const g = withTut();
  skipTutorial(g);
  const view = missionView(g, "es", MISSION);
  assert.equal(view.length, 1);
  assert.equal(view[0].id, "m1-oficio");
  assert.match(view[0].stepLabel, /sal/);
  assert.equal(campaignEvent(g, { kind: "buy", good: "salt", qty: 40, city: "cadiz" }, MISSION), true);
  assert.equal(g.campaign.missions["m1-oficio"].step, 1);
});

test("finishing the tutorial by hand releases the mission arc", () => {
  const g = withTut();
  for (const k of ["buy", "sell", "sail", "yard", "hall", "contract"]) tutorialNote(g, k, { profit: 1, spent: 10 });
  assert.equal(missionView(g, "es", MISSION).length, 1);
  campaignTick(g, MISSION); // deadlines and activation run again
  assert.equal(g.campaign.missions["m1-oficio"].failed, false);
});

test("a game without the tutorial keeps the old behaviour (missions from day one)", () => {
  const g = newGame(world, "cadiz", { ...difficultyOpts("easy"), events: true, seed: 1 });
  assert.equal(missionView(g, "es", MISSION).length, 1);
  assert.equal(campaignEvent(g, { kind: "buy", good: "salt", qty: 40, city: "cadiz" }, MISSION), true);
});

test("tutorial state (running or skipped) survives the save file", () => {
  const g = withTut();
  tutorialNote(g, "buy");
  const back = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa"))), world).g;
  assert.deepEqual(missionView(back, "es", MISSION), []); // still in the tutorial
  const g2 = withTut();
  skipTutorial(g2);
  const back2 = deserialize(JSON.parse(JSON.stringify(serialize(g2, "Casa"))), world).g;
  assert.equal(missionView(back2, "es", MISSION).length, 1); // the skip persists
});

test("a real purchase does not advance missions while the tutorial runs", () => {
  const g = withTut();
  const good = Object.keys(world.goods).find((k) => doBuy(g, g.ships[0], k, 1).ok);
  assert.ok(good);
  assert.equal(g.campaign.missions["m1-oficio"].count, 0);
  assert.equal(g.tut.bought, true); // the tutorial itself did notice
});
