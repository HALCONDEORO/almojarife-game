// Works across cities and on the board (follow-up contract pins): petitions in two
// cities live and resolve independently, and the board reflects a live petition and a
// building work with their real state, level and estimate.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { proposeWork, councilWorksVote, worksBoard, workOf } from "../src/game/works.mjs";
import { nextMeetingDay } from "../src/game/council.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // works flag ON by default
const richCaja = (gm, cityId) => { (gm.hallCaja ??= {})[cityId] = 1e6; return gm; };
const withRespect = (gm, cityId, coins) => { gm.repV = 2; (gm.rep ??= {})[cityId] = coins; return gm; }; // repV 2: respect = coins sold / 100

test("petitions in two cities live and resolve independently: each city votes its own petition on its own meeting day", () => {
  const gm = withRespect(withRespect(richCaja(game(), "cadiz"), "cadiz", 5000), "lisboa", 5000);
  richCaja(gm, "lisboa");
  assert.equal(proposeWork(gm, "cadiz", "pozo").ok, true);
  assert.equal(proposeWork(gm, "lisboa", "hospital").ok, true, "a live petition in cadiz does not bar lisboa");
  assert.equal(workOf(gm, "cadiz", "pozo").state, "solicitado");
  assert.equal(workOf(gm, "lisboa", "hospital").state, "solicitado");
  const meetCadiz = nextMeetingDay(world, "cadiz", gm.day), meetLisboa = nextMeetingDay(world, "lisboa", gm.day);
  gm.day = Math.min(meetCadiz, meetLisboa);
  councilWorksVote(gm); // only the city whose meeting day it is votes
  const first = meetCadiz <= meetLisboa ? "cadiz" : "lisboa", second = first === "cadiz" ? "lisboa" : "cadiz";
  const firstType = first === "cadiz" ? "pozo" : "hospital", secondType = second === "cadiz" ? "pozo" : "hospital";
  if (meetCadiz === meetLisboa) {
    assert.equal(workOf(gm, "cadiz", "pozo").state, "building");
    assert.equal(workOf(gm, "lisboa", "hospital").state, "building");
  } else {
    assert.equal(workOf(gm, first, firstType).state, "building", `${first} voted on its meeting day`);
    assert.equal(workOf(gm, second, secondType).state, "solicitado", `${second} still waits for its own meeting`);
    gm.day = Math.max(meetCadiz, meetLisboa);
    councilWorksVote(gm);
    assert.equal(workOf(gm, second, secondType).state, "building", `${second} votes on its own meeting day`);
  }
  const refusal = withRespect(withRespect(game(), "lisboa", 5000), "cadiz", 5000); // cadiz needs explicit respect too: the founding nudge is below the 20 bar
  (refusal.hallCaja ??= {}).lisboa = 50; // lisboa's chest cannot start
  richCaja(refusal, "cadiz");
  assert.equal(proposeWork(refusal, "cadiz", "pozo").ok, true);
  assert.equal(proposeWork(refusal, "lisboa", "pozo").ok, true);
  const lastMeeting = Math.max(nextMeetingDay(world, "cadiz", refusal.day), nextMeetingDay(world, "lisboa", refusal.day));
  while (refusal.day < lastMeeting) { refusal.day += 1; councilWorksVote(refusal); } // the real loop never skips a day: each city meets on its own day
  councilWorksVote(refusal); // a duplicate vote on the last meeting day changes nothing
  assert.equal(workOf(refusal, "cadiz", "pozo").state, "building", "cadiz starts with its own flush chest");
  assert.deepEqual(workOf(refusal, "lisboa", "pozo"), { level: 0, state: "active" }, "lisboa's refusal is its own: cadiz is untouched");
});

test("the board reflects a live petition and a building work with real state, level and estimate", () => {
  const gm = withRespect(richCaja(game()), "lisboa", 5000);
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  let board = worksBoard(gm, "lisboa");
  const pending = board.candidates.find((x) => x.type === "pozo");
  assert.equal(pending.state, "solicitado", "the board shows the live petition");
  assert.equal(pending.level, 0);
  assert.equal(pending.estimate, 496.8, "the quoted next level is still level 1");
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  board = worksBoard(gm, "lisboa");
  const building = board.candidates.find((x) => x.type === "pozo");
  assert.equal(building.state, "building", "the board shows the work in progress");
  assert.equal(building.level, 0, "the level rises only at completion");
  const others = board.candidates.filter((x) => x.type !== "pozo");
  for (const o of others) assert.equal(o.state, "active", "unpetitioned works stay active on the board");
  gm.works.lisboa.pozo = { level: 1, state: "active" }; // a finished level 1
  board = worksBoard(gm, "lisboa");
  assert.equal(board.candidates.find((x) => x.type === "pozo").estimate, 993.6, "with level 1 standing the board quotes level 2 (2 x 496.8)");
});
