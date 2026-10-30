// Council works department (Marco 30/10 20:04: "implementa las obras del concejo con cobro por
// día según el diseño propuesto"): the concejo votes civic works, pays them out of the town
// chest PER DAY WORKED, takes partial material deliveries from the local market, pauses on a
// thin chest instead of rejecting, and keeps the finished works with a daily upkeep. The
// player never pays: at most a known merchant (respect 20, "Conocido") hands in a petition.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { quoteUnits } from "../src/sim/recipes.mjs";
import { quoteWork, workScore, workOf, worksBoard, proposeWork, councilWorksVote, worksDay, WORKS_MIN_RESPECT, WORKS_CAJA_FLUSH, WORKS_MIN_SCORE, WORKS_MAX_LEVEL, WORKS_AUTONOMOUS } from "../src/game/works.mjs";
import { cajaOf, nextMeetingDay } from "../src/game/council.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // works flag is ON by default
const richCaja = (gm, cityId = "cadiz") => { (gm.hallCaja ??= {})[cityId] = 1e6; return gm; }; // a chest that can pay any work
const withRespect = (gm, cityId, coins) => { gm.repV = 2; (gm.rep ??= {})[cityId] = coins; return gm; }; // rep is stored as coins sold (repV 2), 100 coins = 1 respect point
// An in-progress pozo level 1 in cadiz: fee 150 over 5 days = 30/day, recipe timber 2, bricks 6, ironware 1.
const buildingPozo = (gm, over = {}) => { (gm.works ??= {}).cadiz = { pozo: { level: 0, state: "building", nextLevel: 1, needDays: 5, workedDays: 0, paidFee: 0, feeTotal: 150, need: { timber: 2, bricks: 6, ironware: 1 }, delivered: {}, ...over } }; return gm; };
const setStock = (gm, cityId, good, n) => { gm.market[cityId][good].stock = n; return gm; };
const lastPosts = (gm, re) => gm.inbox.filter((m) => re.test(m.txt?.es ?? ""));

test("flag OFF (false or 1): no state, quote says unknown, day and vote no-op", () => {
  for (const off of [false, 1]) {
    const gm = newGame(world, "cadiz", { freePlay: true, seed: 7, works: off });
    assert.ok(!("works" in gm), "off game keeps no key");
    assert.equal(quoteWork(gm, "cadiz", "pozo", 1).reason, "unknown");
    worksDay(gm); councilWorksVote(gm); // must not throw, must not create state
    assert.ok(!("works" in gm), "works passes create no state");
    assert.equal(workOf(gm, "cadiz", "pozo"), null);
  }
  assert.notEqual(game().works, undefined, "absent opts: ON");
  assert.notEqual(game({ works: true }).works, undefined, "explicit true: ON");
});

test("the quote scales fee, days and recipe by level; the estimate is fee + recipe at base price + market fee", () => {
  const gm = game();
  const q1 = quoteWork(gm, "cadiz", "pozo", 1);
  assert.deepEqual({ fee: q1.fee, days: q1.days, need: q1.need, estimate: q1.estimate }, { fee: 150, days: 5, need: { timber: 2, bricks: 6, ironware: 1 }, estimate: 496.8 }); // 150 + 2*25.5 + 6*30.6 + 112.2
  const q3 = quoteWork(gm, "cadiz", "pozo", 3);
  assert.deepEqual({ fee: q3.fee, days: q3.days, need: q3.need, estimate: q3.estimate }, { fee: 450, days: 15, need: { timber: 6, bricks: 18, ironware: 3 }, estimate: 1490.4 }); // 3x everything (kills level-scaling mutants)
  assert.equal(quoteWork(gm, "cadiz", "pozo", 0).reason, "bad level");
  assert.equal(quoteWork(gm, "cadiz", "pozo", 4).reason, "bad level");
  assert.equal(quoteWork(gm, "cadiz", "muralla", 1).reason, "unknown work", "walls keep their own module");
  assert.equal(quoteWork(gm, "nowhere", "pozo", 1).reason, "unknown city");
});

test("petition bar is exactly 20 respect: 19.99 rejected, 20 and 20.01 pass (kills the WORKS_MIN_RESPECT +1 mutant)", () => {
  for (const [coins, ok] of [[1999, false], [2000, true], [2001, true]]) {
    const gm = withRespect(game(), "lisboa", coins); // non-home: no founding respect nudge
    assert.equal(proposeWork(gm, "lisboa", "pozo").ok, ok, `respect ${coins / 100} at the bar`);
    if (!ok) assert.equal(proposeWork(gm, "lisboa", "pozo").need, WORKS_MIN_RESPECT, "the refusal says what the concejo asks");
  }
});

test("petition guards: unknown city, unknown work, game over, one live work per city, max level", () => {
  const gm = withRespect(richCaja(game()), "lisboa", 5000);
  assert.equal(proposeWork(gm, "nowhere", "pozo").reason, "unknown city");
  assert.equal(proposeWork(gm, "lisboa", "muralla").reason, "unknown work");
  gm.over = true; assert.equal(proposeWork(gm, "lisboa", "pozo").reason, "game over"); gm.over = false;
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  assert.equal(proposeWork(gm, "lisboa", "hospital").reason, "already building", "a live petition holds the city");
  assert.equal(workOf(gm, "lisboa", "pozo").state, "solicitado");
  const gm2 = withRespect(game(), "lisboa", 5000);
  gm2.works.lisboa = { pozo: { level: WORKS_MAX_LEVEL, state: "active" } };
  assert.equal(proposeWork(gm2, "lisboa", "pozo").reason, "max level");
});

test("meeting vote starts the petitioned work: state, schedule and the chest pays, never the player", () => {
  const gm = withRespect(richCaja(game()), "lisboa", 5000);
  const cashBefore = gm.cash, cajaBefore = cajaOf(gm, "lisboa");
  assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  const rec = workOf(gm, "lisboa", "pozo");
  assert.equal(rec.state, "building");
  assert.deepEqual({ nextLevel: rec.nextLevel, needDays: rec.needDays, workedDays: rec.workedDays, paidFee: rec.paidFee, feeTotal: rec.feeTotal }, { nextLevel: 1, needDays: 5, workedDays: 0, paidFee: 0, feeTotal: 150 });
  assert.equal(gm.cash, cashBefore, "the player never pays (Marco 30/10)");
  assert.equal(cajaOf(gm, "lisboa"), cajaBefore, "the vote itself charges nothing: the chest pays per day worked");
  assert.equal(lastPosts(gm, /vota construir el pozo/).length, 1, "ES+EN start message");
  assert.equal(WORKS_AUTONOMOUS, false, "documented: petitions only (the WALL_AUTONOMOUS lesson)");
});

test("NO-BUILD is explicit: a petition under the score floor is refused with its cause and consumed; a work over the floor starts (both directions kill threshold mutants)", () => {
  const gm = withRespect(richCaja(game(), "lisboa"), "lisboa", 5000); // the chest that votes is lisboa's
  gm.works.lisboa = { capilla: { level: 2, state: "active" }, hospital: { level: 2, state: "active" } };
  assert.ok(workScore(gm, "lisboa", "capilla") < WORKS_MIN_SCORE, `capilla L3 score ${workScore(gm, "lisboa", "capilla")} under the floor`);
  assert.ok(workScore(gm, "lisboa", "hospital") >= WORKS_MIN_SCORE, `hospital L3 score ${workScore(gm, "lisboa", "hospital")} over the floor`);
  assert.equal(proposeWork(gm, "lisboa", "capilla").ok, true); // one petition at a time: capilla first
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  assert.equal(workOf(gm, "lisboa", "capilla").state, "active", "refused petitions do not linger");
  assert.equal(workOf(gm, "lisboa", "capilla").level, 2, "the refusal builds nothing");
  assert.equal(lastPosts(gm, /decide NO construir la capilla/).length, 1, "the NO-BUILD decision is recorded, not silent");
  assert.equal(workOf(gm, "lisboa", "hospital").state, "active", "not petitioned yet");
  assert.equal(proposeWork(gm, "lisboa", "hospital").ok, true);
  gm.day = nextMeetingDay(world, "lisboa", gm.day);
  councilWorksVote(gm);
  assert.equal(workOf(gm, "lisboa", "hospital").state, "building", "a candidate over the floor starts");
  assert.equal(workOf(gm, "lisboa", "hospital").nextLevel, 3);
});

test("the chest margin is exactly 1.5x the estimate: 745.19 refused, 745.20 starts (kills the rounding mutant)", () => {
  for (const [caja, ok] of [[745.19, false], [745.2, true]]) {
    const gm = withRespect(game(), "lisboa", 5000);
    (gm.hallCaja ??= {}).lisboa = caja;
    assert.equal(proposeWork(gm, "lisboa", "pozo").ok, true);
    gm.day = nextMeetingDay(world, "lisboa", gm.day);
    councilWorksVote(gm);
    assert.equal(workOf(gm, "lisboa", "pozo").state, ok ? "building" : "active", `caja ${caja} against the 745.20 margin (WORKS_CAJA_FLUSH ${WORKS_CAJA_FLUSH} x 496.8)`);
    if (!ok) assert.equal(lastPosts(gm, /la caja no llega/).length, 1, "the refusal names its cause");
  }
});

test("partial deliveries: stock shortfall keeps the remainder pending and charges no labour; market stock is conserved", () => {
  const gm = withRespect(richCaja(buildingPozo(game())), "cadiz", 5000);
  setStock(gm, "cadiz", "timber", 1); setStock(gm, "cadiz", "bricks", 10); setStock(gm, "cadiz", "ironware", 1);
  const materials = quoteUnits(gm.world, gm.market, "cadiz", { timber: 1, bricks: 6, ironware: 1 });
  assert.ok(materials.ok);
  const cajaBefore = cajaOf(gm, "cadiz"), cashBefore = gm.cash;
  worksDay(gm);
  const rec = workOf(gm, "cadiz", "pozo");
  assert.deepEqual(rec.delivered, { timber: 1, bricks: 6, ironware: 1 }, "everything available lands the same day");
  assert.equal(rec.workedDays, 0, "a day without the full materials pending charges no labour (explicit rule)");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - materials.cost, "the chest pays exactly the deliveries");
  assert.equal(gm.cash, cashBefore, "the player never pays");
  assert.equal(gm.market.cadiz.bricks.stock, 4, "market conservation: 10 - 6 delivered");
  assert.equal(gm.market.cadiz.timber.stock, 0);
});

test("the day the last pending unit lands consumes one labour unit in the same pass", () => {
  const gm = withRespect(richCaja(buildingPozo(game())), "cadiz", 5000);
  setStock(gm, "cadiz", "timber", 1); setStock(gm, "cadiz", "bricks", 6); setStock(gm, "cadiz", "ironware", 1);
  worksDay(gm); // timber short: deliveries only
  assert.equal(workOf(gm, "cadiz", "pozo").workedDays, 0);
  setStock(gm, "cadiz", "timber", 5);
  const timber = quoteUnits(gm.world, gm.market, "cadiz", { timber: 1 });
  const cajaBefore = cajaOf(gm, "cadiz");
  worksDay(gm);
  const rec = workOf(gm, "cadiz", "pozo");
  assert.equal(rec.workedDays, 1, "the completing delivery unlocks one labour unit the same day");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - timber.cost - 30, "one timber unit + one 30-coin labour day");
  assert.equal(gm.market.cadiz.timber.stock, 4, "only the pending unit is taken");
});

test("the daily charges sum to the exact fee and completion closes the record once", () => {
  const gm = withRespect(richCaja(buildingPozo(game(), { delivered: { timber: 2, bricks: 6, ironware: 1 } })), "cadiz", 5000);
  const cajaBefore = cajaOf(gm, "cadiz"), cashBefore = gm.cash;
  for (let i = 0; i < 4; i++) worksDay(gm); // days 1-4 at 30
  assert.equal(workOf(gm, "cadiz", "pozo").workedDays, 4, "state just before the horizon");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 120);
  worksDay(gm); // day 5: the final settle squares the fee
  const rec = workOf(gm, "cadiz", "pozo");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 150, "the chest paid the exact 150-coin fee, to the cent");
  assert.equal(gm.cash, cashBefore, "the player never pays");
  assert.equal(rec.level, 1);
  assert.equal(rec.state, "active");
  for (const k of ["nextLevel", "needDays", "workedDays", "paidFee", "feeTotal", "need", "delivered"]) assert.ok(!(k in rec), `closed work drops ${k}`);
  assert.equal(lastPosts(gm, /Obra terminada/).length, 1, "one completion message");
  worksDay(gm); worksDay(gm); // idempotent: no double close, upkeep 1/day now applies
  assert.equal(lastPosts(gm, /Obra terminada/).length, 1, "completion does not repeat after save-safe close");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 150 - 2, "standing upkeep 1/day from the chest afterwards");
});

test("an indivisible fee squares to the cent on the last day (kills both rounding directions)", () => {
  const gm = withRespect(richCaja(buildingPozo(game(), { feeTotal: 151, delivered: { timber: 2, bricks: 6, ironware: 1 } })), "cadiz", 5000);
  const cajaBefore = cajaOf(gm, "cadiz");
  for (let i = 0; i < 4; i++) worksDay(gm);
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 120.8, "4 x 30.2");
  worksDay(gm);
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 151, "the final day charges 30.2, not 30.19 or 30.21");
  assert.equal(workOf(gm, "cadiz", "pozo").level, 1);
});

test("a thin chest pauses instead of rejecting; the resume needs two days of cost (hysteresis, both boundaries pinned)", () => {
  const gm = withRespect(buildingPozo(game(), { delivered: { timber: 2, bricks: 6, ironware: 1 } }), "cadiz", 5000);
  (gm.hallCaja ??= {}).cadiz = 29.99; // one labour day costs 30
  worksDay(gm);
  const rec = workOf(gm, "cadiz", "pozo");
  assert.equal(rec.state, "paused");
  assert.equal(cajaOf(gm, "cadiz"), 29.99, "paused consumes nothing");
  assert.equal(rec.workedDays, 0);
  assert.equal(lastPosts(gm, /se pausa/).length, 1, "the pause is said out loud");
  gm.hallCaja.cadiz = 59.99; // one coin under two days of cost
  worksDay(gm);
  assert.equal(rec.state, "paused", "59.99 does not resume (kills the 2x mutant)");
  assert.equal(cajaOf(gm, "cadiz"), 59.99);
  gm.hallCaja.cadiz = 60;
  worksDay(gm);
  assert.equal(rec.state, "building", "exactly two days of cost resumes");
  assert.equal(rec.workedDays, 1, "and the same pass works one day");
  assert.equal(cajaOf(gm, "cadiz"), 30, "60 - one 30-coin labour day");
});

test("standing upkeep lapses on an empty chest and resumes only with two days of cost", () => {
  const gm = withRespect(game(), "cadiz", 5000);
  gm.works.cadiz = { pozo: { level: 1, state: "active" } }; // upkeep 1/day
  (gm.hallCaja ??= {}).cadiz = 0.5;
  worksDay(gm);
  const rec = workOf(gm, "cadiz", "pozo");
  assert.equal(rec.unkept, true);
  assert.equal(cajaOf(gm, "cadiz"), 0.5, "unkept charges nothing");
  assert.equal(lastPosts(gm, /queda sin efecto/).length, 1);
  gm.hallCaja.cadiz = 1.99; // under two days of cost
  worksDay(gm);
  assert.equal(rec.unkept, true, "1.99 does not resume (hysteresis)");
  assert.equal(cajaOf(gm, "cadiz"), 1.99);
  gm.hallCaja.cadiz = 2;
  worksDay(gm);
  assert.equal(rec.unkept, false, "exactly two days of cost resumes");
  assert.equal(cajaOf(gm, "cadiz"), 1, "and the day is paid");
});

test("save/load mid-build keeps the work exact: pause, resume and a single completion survive a JSON round-trip", () => {
  const gm = withRespect(buildingPozo(game(), { delivered: { timber: 2, bricks: 6, ironware: 1 }, workedDays: 3, paidFee: 90 }), "cadiz", 5000);
  const copy = JSON.parse(JSON.stringify(gm)); // the save format
  const cajaBefore = cajaOf(copy, "cadiz");
  worksDay(copy); worksDay(copy); // days 4 and 5
  const rec = workOf(copy, "cadiz", "pozo");
  assert.equal(rec.level, 1, "the copy finishes the work");
  assert.equal(rec.state, "active");
  assert.equal(cajaOf(copy, "cadiz"), cajaBefore - 60, "90 paid before the save, 60 after: the fee squares across the round-trip");
  assert.equal(lastPosts(copy, /Obra terminada/).length, 1);
  assert.equal(workOf(gm, "cadiz", "pozo").workedDays, 3, "the original is untouched");
});

test("council works never enter the player's buildings registry", () => {
  const gm = withRespect(richCaja(buildingPozo(game(), { delivered: { timber: 2, bricks: 6, ironware: 1 } })), "cadiz", 5000);
  for (let i = 0; i < 5; i++) worksDay(gm);
  assert.equal(workOf(gm, "cadiz", "pozo").level, 1);
  const playerEntries = Object.values(gm.buildings?.cadiz ?? {}).filter((x) => x.type === "pozo");
  assert.equal(playerEntries.length, 0, "g.buildings stays player property: accrueBuildings never bills the player for council works");
});

test("the board lists every candidate with priority, estimate and the gold the chest lacks", () => {
  const gm = withRespect(game(), "cadiz", 5000);
  (gm.hallCaja ??= {}).cadiz = 500;
  const board = worksBoard(gm, "cadiz");
  assert.equal(board.candidates.length, 4, "pozo, hospital, capilla, alhóndiga");
  const pozo = board.candidates.find((x) => x.type === "pozo");
  assert.equal(pozo.level, 0);
  assert.equal(pozo.state, "active");
  assert.equal(pozo.estimate, 496.8);
  assert.equal(pozo.missingGold, 245.2, "745.2 margin - 500 in the chest");
  assert.ok(board.candidates[0].score > board.candidates[3].score, "pozo outranks the low-weight works");
  const rich = worksBoard(richCaja(game()), "cadiz");
  assert.equal(rich.candidates.find((x) => x.type === "pozo").missingGold, 0, "a flush chest lacks nothing");
  assert.equal(worksBoard(newGame(world, "cadiz", { freePlay: true, seed: 7, works: false }), "cadiz"), null, "flag off: no board");
});
