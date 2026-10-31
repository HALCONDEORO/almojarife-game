// Works vs player buildings and materials-pause resume (follow-up contract pins):
// a council work and a player building of the same type coexist in their own
// registries, and a work paused for missing materials resumes once local stock
// returns, with deliveries and labour continuing exactly.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { proposeWork, councilWorksVote, worksDay, workOf } from "../src/game/works.mjs";
import { cajaOf, nextMeetingDay } from "../src/game/council.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // works flag ON by default
const richCaja = (gm, cityId = "cadiz") => { (gm.hallCaja ??= {})[cityId] = 1e6; return gm; };
const withRespect = (gm, cityId, coins) => { gm.repV = 2; (gm.rep ??= {})[cityId] = coins; return gm; }; // repV 2: respect = coins sold / 100

test("a council work and a player building of the same type coexist: separate registries, separate money, no coupling", () => {
  const gm = withRespect(richCaja(game(), "lisboa"), "lisboa", 5000);
  gm.buildings = { lisboa: { plot1: { type: "pozo", level: 2, state: "active" } } }; // the player's own pozo, level 2
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true, "the player's pozo does not bar the council petition");
  assert.equal(workOf(gm, "lisboa", "pozo").state, "solicitado");
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  assert.equal(workOf(gm, "lisboa", "pozo").state, "building", "the council work starts");
  assert.equal(gm.buildings.lisboa.plot1.level, 2, "the player record is untouched");
  assert.equal(gm.works.lisboa.pozo.level, 0, "the council record is its own");
  gm.works.lisboa.pozo = { level: 1, state: "active" }; // the council work completes
  const cashBefore = gm.cash, cajaBefore = cajaOf(gm, "lisboa");
  worksDay(gm);
  assert.equal(gm.cash, cashBefore, "the player is not billed for the council upkeep (council registry stays out of g.buildings)");
  assert.equal(cajaOf(gm, "lisboa"), cajaBefore - 1, "the chest pays the council pozo upkeep (1/day)");
  assert.equal(gm.buildings.lisboa.plot1.level, 2, "both pozos stand: the player keeps theirs");
});

test("a work paused for missing materials resumes once local stock returns: delivery and labour continue exactly", () => {
  const gm = withRespect(richCaja(game()), "cadiz", 5000);
  gm.works.cadiz = { pozo: { level: 0, state: "building", nextLevel: 1, needDays: 5, workedDays: 0, paidFee: 0, feeTotal: 150, need: { timber: 2 }, delivered: {} } };
  gm.market.cadiz.timber.stock = 0;
  worksDay(gm);
  const rec = workOf(gm, "cadiz", "pozo");
  assert.equal(rec.state, "paused", "no stock and no affordable unit pauses the work");
  assert.equal(rec.workedDays, 0);
  gm.market.cadiz.timber.stock = 5;
  worksDay(gm);
  assert.equal(rec.state, "building", "the work resumes with stock back and a flush chest");
  assert.deepEqual(rec.delivered, { timber: 2 }, "the pending units land on the resume pass");
  assert.equal(rec.workedDays, 1, "the completing delivery unlocks one labour unit the same pass");
  assert.equal(gm.market.cadiz.timber.stock, 3, "market conservation: 5 - 2 delivered");
  for (let i = 0; i < 4; i++) worksDay(gm); // the remaining four labour days
  assert.equal(workOf(gm, "cadiz", "pozo").state, "active");
  assert.equal(workOf(gm, "cadiz", "pozo").level, 1, "the work completes after the resume");
});
