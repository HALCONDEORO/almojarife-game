// Works petition contract (study block P2/P5/P11, own design): a refused petition is
// consumed with its cause and leaves no residue, a live work bars a petition for a
// DIFFERENT work without creating state, a duplicate motion changes nothing, and a
// save/load round-trip preserves each resolution exactly once.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { proposeWork, councilWorksVote, worksDay, workOf } from "../src/game/works.mjs";
import { cajaOf, nextMeetingDay } from "../src/game/council.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // works flag ON by default
const richCaja = (gm, cityId) => { (gm.hallCaja ??= {})[cityId] = 1e6; return gm; };
const withRespect = (gm, cityId, coins) => { gm.repV = 2; (gm.rep ??= {})[cityId] = coins; return gm; }; // repV 2: respect = coins sold / 100
const posts = (gm, re) => gm.inbox.filter((m) => re.test(m.txt?.es ?? ""));
// An in-progress pozo level 1 in cadiz (the works.test.mjs fixture: fee 150 over 5 days, recipe timber 2, bricks 6, ironware 1).
const buildingPozo = (gm, over = {}) => { (gm.works ??= {}).cadiz = { pozo: { level: 0, state: "building", nextLevel: 1, needDays: 5, workedDays: 0, paidFee: 0, feeTotal: 150, need: { timber: 2, bricks: 6, ironware: 1 }, delivered: { timber: 2, bricks: 6, ironware: 1 }, ...over } }; return gm; };

test("P2 rejection: a refused petition is consumed with its cause, charges nothing, leaves a clean record, and the same petition can be re-proposed and win", () => {
  const gm = withRespect(game(), "lisboa", 5000);
  (gm.hallCaja ??= {}).lisboa = 100; // under the 745.20 flush margin for a pozo (1.5 x 496.80)
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  assert.deepEqual(workOf(gm, "lisboa", "pozo"), { level: 0, state: "active" }, "the refusal builds nothing and leaves no residue");
  assert.equal(cajaOf(gm, "lisboa"), 100, "a refusal charges the chest nothing");
  assert.equal(posts(gm, /rechaza tu petición de el pozo/).length, 1, "the refusal is recorded once, with its cause");
  councilWorksVote(gm); // a duplicate vote on the same meeting day must not refuse twice
  assert.equal(posts(gm, /rechaza tu petición de el pozo/).length, 1, "the consumed petition is not refused again");
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true, "rejection is not permanent: the merchant can petition again");
  richCaja(gm, "lisboa");
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  assert.equal(workOf(gm, "lisboa", "pozo").state, "building", "the re-proposed petition wins with a flush chest");
});

test("P5 petition different from the active work: a live work bars any other petition without creating state, and the bar lifts exactly at completion", () => {
  const gm = withRespect(richCaja(game()), "cadiz", 5000);
  buildingPozo(gm);
  for (const other of ["hospital", "capilla", "alhondiga"]) {
    assert.equal(proposeWork(gm, "cadiz", other).reason, "already building", `${other} petition barred while the pozo builds`);
    assert.equal(gm.works.cadiz[other], undefined, `the barred ${other} petition creates no record`);
  }
  assert.equal(posts(gm, /una petición/).length, 0, "no petition was handed in");
  workOf(gm, "cadiz", "pozo").state = "paused"; // a paused work is still live
  assert.equal(proposeWork(gm, "cadiz", "hospital").reason, "already building", "a paused work holds the city too");
  workOf(gm, "cadiz", "pozo").state = "building";
  for (let i = 0; i < 5; i++) worksDay(gm); // finish the pozo
  assert.equal(workOf(gm, "cadiz", "pozo").state, "active");
  assert.equal(proposeWork(gm, "cadiz", "hospital").ok, true, "once the work completes, a different petition is heard");
  assert.equal(workOf(gm, "cadiz", "hospital").state, "solicitado");
  assert.equal(proposeWork(gm, "cadiz", "capilla").reason, "already building", "the new petition is itself live");
});

test("P5 duplicate motion: a repeated petition of the same work is refused without a second post, and a repeated vote on the meeting day starts the work once", () => {
  const gm = withRespect(richCaja(game()), "lisboa", 5000);
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  assert.equal(posts(gm, /una petición/).length, 1);
  assert.equal(proposeWork(gm, "lisboa", "pozo").reason, "already building", "the duplicate motion is rejected");
  assert.equal(workOf(gm, "lisboa", "pozo").state, "solicitado", "the original petition stands");
  assert.equal(posts(gm, /una petición/).length, 1, "no second petition post");
  const cajaBefore = cajaOf(gm, "lisboa");
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  councilWorksVote(gm); // duplicate vote on the same meeting day
  const rec = workOf(gm, "lisboa", "pozo");
  assert.equal(rec.state, "building");
  assert.equal(posts(gm, /vota construir el pozo/).length, 1, "one start decision, recorded once");
  assert.equal(cajaOf(gm, "lisboa"), cajaBefore, "the repeated vote charges nothing twice");
});

test("P11 reload: a pending petition survives a save/load round-trip and is resolved exactly once; a refused petition stays refused after reload", () => {
  const gm = withRespect(richCaja(game()), "lisboa", 5000);
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  gm.day = nextMeetingDay(world, "lisboa", gm.day) - 1; // the day before the meeting
  const copy = JSON.parse(JSON.stringify(gm)); // the save format
  copy.day = nextMeetingDay(world, "lisboa", copy.day);
  councilWorksVote(copy);
  const rec = workOf(copy, "lisboa", "pozo");
  assert.equal(rec.state, "building", "the reloaded petition is voted");
  assert.equal(posts(copy, /vota construir el pozo/).length, 1, "the resolution posts once after reload");
  const again = JSON.parse(JSON.stringify(copy)); // a second save/load after the vote
  councilWorksVote(again);
  assert.equal(posts(again, /vota construir el pozo/).length, 1, "no duplicate resolution across another round-trip");
  assert.equal(workOf(gm, "lisboa", "pozo").state, "solicitado", "the pre-save game is untouched");
  const refused = withRespect(game(), "lisboa", 5000);
  (refused.hallCaja ??= {}).lisboa = 50;
  assert.equal(proposeWork(refused, "lisboa", "pozo").ok, true);
  refused.day = nextMeetingDay(world, "lisboa", refused.day);
  councilWorksVote(refused);
  assert.equal(workOf(refused, "lisboa", "pozo").state, "active");
  const copyRefused = JSON.parse(JSON.stringify(refused));
  councilWorksVote(copyRefused); // still the meeting day after reload: nothing may happen
  assert.deepEqual(workOf(copyRefused, "lisboa", "pozo"), { level: 0, state: "active" }, "the refusal survives reload without re-firing");
  assert.equal(posts(copyRefused, /rechaza tu petición/).length, 1, "one refusal post in total");
  assert.equal(proposeWork(copyRefused, "lisboa", "pozo").ok, true, "after reload the merchant can petition again");
});
