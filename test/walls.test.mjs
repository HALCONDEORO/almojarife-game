// Council walls (Marco 30/10 15:23: "hace falta que el concejo vote, lo paguen ellos y lo mantengan ellos"):
// the concejo votes the walls at its meetings, pays the works and the watch out of the town chest (caja).
// The player never pays; at most a known merchant (respect 20, "Conocido") hands in a petition.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay, advanceTick } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyOffice, buyPlot, quoteConstruction } from "../src/game/buildings.mjs";
import { wallsLevel, wallsKeptLevel, quoteWalls, startWalls, proposeWall, councilWallsVote, tickWalls, accrueWalls, WALL_MAX_LEVEL, WALL_POP, WALL_UPKEEP, WALL_AUTONOMOUS } from "../src/game/walls.mjs";
import { accrueBuildings } from "../src/game/buildings.mjs";
import { wallsAllow } from "../src/game/plague.mjs";
import { settleWeek } from "../src/game/ledger.mjs";
import { cajaOf, meetingDay, nextMeetingDay } from "../src/game/council.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // walls flag is ON by default
const richCaja = (gm, cityId = "cadiz") => { (gm.hallCaja ??= {})[cityId] = 1e6; return gm; }; // a chest that can pay any work
const rich = (gm, cityId = "cadiz") => { (gm.rep ??= {})[cityId] = 100 * 100; gm.cash = 1e6; buyOffice(gm, cityId); return gm; }; // player-side setup: respect 100 (stored as coins sold), office, cash
// rep is stored as coins sold (repV 2), 100 coins = 1 respect point; set repV so ensureRep does not treat the value as legacy points.
const withRespect = (gm, cityId, coins) => { gm.repV = 2; (gm.rep ??= {})[cityId] = coins; return gm; };
const runTo = (gm, day) => { while (gm.day < day) advanceDay(gm); };

test("flag OFF (false or 1): no state, quote says unknown, ticks and accruals no-op", () => {
  for (const off of [false, 1]) {
    const gm = newGame(world, "cadiz", { freePlay: true, seed: 7, walls: off });
    assert.ok(!("walls" in gm), "off game keeps no key");
    assert.equal(quoteWalls(gm, "cadiz").reason, "unknown");
    tickWalls(gm); accrueWalls(gm); councilWallsVote(gm); // must not throw, must not create state
    assert.ok(!("walls" in gm), "walls ticks create no state");
    assert.equal(wallsLevel(gm, "cadiz"), 0);
  }
});

test("flag ON by default: absent and true both create the state", () => {
  assert.notEqual(game().walls, undefined, "absent opts: ON");
  assert.notEqual(game({ walls: true }).walls, undefined, "explicit true: ON");
});

test("concejo pays: caja debit identity, player cash untouched, active on the exact readyTick", () => {
  const gm = richCaja(game());
  const qt = quoteWalls(gm, "cadiz");
  assert.ok(qt.ok && qt.level === 1 && qt.ticks > 0, JSON.stringify(qt));
  const cashBefore = gm.cash, cajaBefore = cajaOf(gm, "cadiz"), readyTick = gm.tick + qt.ticks;
  const rs = startWalls(gm, "cadiz");
  assert.ok(rs.ok, "the concejo starts the work");
  assert.equal(gm.cash, cashBefore, "the player never pays (Marco 30/10)");
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - qt.cost, "the chest pays the whole quote");
  assert.equal(wallsLevel(gm, "cadiz"), 0, "not active until the tick lands");
  while (gm.tick < readyTick) advanceTick(gm);
  assert.equal(wallsLevel(gm, "cadiz"), 1, "active exactly at readyTick");
  assert.ok(gm.inbox.some((m) => m.txt?.es && m.txt?.en), "ES+EN completion message");
});

test("levels cap at WALL_MAX_LEVEL and one build at a time per city", () => {
  const gm = richCaja(game());
  assert.equal(startWalls(gm, "cadiz").ok, true);
  assert.equal(startWalls(gm, "cadiz").reason, "already building");
  gm.walls.cadiz = { level: WALL_MAX_LEVEL, state: "active" };
  assert.equal(quoteWalls(gm, "cadiz").reason, "max level");
});

test("the quote is the concejo'sh: no respect gate, no player cash gate; the chest must cover it", () => {
  const gm = game(); // respect 0, cash 2000: both irrelevant to the quote now
  assert.ok(quoteWalls(gm, "cadiz").ok, "the concejo quotes its own works regardless of who asks");
  assert.equal(quoteWalls(gm, "nowhere").reason, "unknown city");
  gm.over = true; assert.equal(startWalls(gm, "cadiz").reason, "game over"); gm.over = false;
  (gm.hallCaja ??= {}).cadiz = 0;
  assert.equal(startWalls(gm, "cadiz").reason, "caja short", "an empty chest cannot start works");
});

test("petition bar is exactly 20 respect: 19.99 rejected, 20 and 20.01 pass (kills the WALL_MIN_RESPECT +1 mutant)", () => {
  for (const [coins, ok] of [[1999, false], [2000, true], [2001, true]]) {
    const gm = withRespect(game(), "lisboa", coins); // non-home: no founding respect nudge, no memory flag
    assert.equal(proposeWall(gm, "lisboa").ok, ok, `respect ${coins / 100} at the bar`);
    if (!ok) assert.equal(proposeWall(gm, "lisboa").need, 20, "the refusal says what the concejo asks");
  }
});

test("petition needs no office and no cash; one petition at a time per city", () => {
  const gm = withRespect(game(), "lisboa", 2000); // home is cadiz; no office bought anywhere; cash 2000
  assert.ok(!gm.offices?.includes("lisboa"), "no office in lisboa");
  assert.ok(proposeWall(gm, "lisboa").ok, "a known merchant petitions away from home without an office");
  assert.equal(proposeWall(gm, "lisboa").reason, "petition pending", "a second petition is refused while one waits");
});

test("autonomous builds are OFF (documented constant): a flush chest alone builds nothing, the wall needs a petition", () => {
  assert.equal(WALL_AUTONOMOUS, false, "shipping config: own-motion builds disabled (year-1 balance: 22 cities walled themselves)");
  const gm = game();
  const meet = nextMeetingDay(world, "sevilla", gm.day);
  runTo(gm, meet - 1);
  gm.hallCaja = { sevilla: 1e6 }; // flush chest, no petition
  advanceDay(gm); // councilWallsVote runs inside dayTick on the meeting day
  assert.ok(!gm.walls.sevilla?.nextLevel && !(gm.walls.sevilla?.level >= 1), "no petition, no wall, however flush the chest");
  assert.equal(gm.walls.sevilla, undefined, "no state is even created");
});

test("meeting-day vote with petition: thin chest below the quote rejects it", () => {
  const gm = withRespect(game(), "sevilla", 2000);
  gm.day = nextMeetingDay(world, "sevilla", 1); // a sevilla meeting day, by the same seeded calendar
  assert.ok(meetingDay(world, "sevilla", gm.day), "test premise: sevilla meets today");
  assert.ok(proposeWall(gm, "sevilla").ok);
  gm.hallCaja = { sevilla: 1 }; // one coin: the chest cannot cover any quote
  councilWallsVote(gm); // direct call: no market drift or municipal income inside a full dayTick
  assert.ok(!gm.walls.sevilla?.nextLevel, "thin chest: petition rejected");
  assert.equal(gm.walls.sevilla.petition, undefined, "the petition is consumed by the refusal");
});

test("petition voted at the next meeting: builds at exact chest cost; rejected (and consumed) when the chest falls short", () => {
  const gm = withRespect(game(), "sevilla", 2000);
  const meet = nextMeetingDay(world, "sevilla", gm.day);
  assert.ok(proposeWall(gm, "sevilla").ok);
  runTo(gm, meet - 1);
  const qt = quoteWalls(gm, "sevilla");
  gm.hallCaja = { sevilla: qt.cost }; // exactly the quote, below the flush bar: the petition carries it
  advanceDay(gm);
  assert.ok(gm.walls.sevilla?.nextLevel, "the petitioned wall starts even below the flush bar");
  assert.equal(gm.walls.sevilla.petition, undefined, "the petition is consumed by the vote");
  const g2 = withRespect(game(), "sevilla", 2000);
  const meet2 = nextMeetingDay(world, "sevilla", g2.day);
  assert.ok(proposeWall(g2, "sevilla").ok);
  runTo(g2, meet2 - 1);
  g2.hallCaja = { sevilla: 0 };
  advanceDay(g2);
  assert.ok(!g2.walls.sevilla?.nextLevel, "empty chest: no build");
  assert.equal(g2.walls.sevilla.petition, undefined, "the petition is consumed by the refusal");
  assert.ok(g2.inbox.some((m) => m.kind === "council" && m.txt?.es?.includes("rechaza")), "the refusal reaches the petitioner");
});

test("the walls work is only news where the concejo knows the player", () => {
  const gm = game(); // respect 0 everywhere
  richCaja(gm, "sevilla");
  assert.ok(startWalls(gm, "sevilla").ok, "the chest can always pay its own works");
  assert.equal(gm.inbox.filter((m) => m.kind === "council").length, 0, "but nobody tells a stranger");
});

test("legacy plague.walls=1 reads as level 1; new construction lands on level 2", () => {
  const gm = game({ plague: true }); richCaja(gm);
  gm.plague.walls.cadiz = 1; // a save from before the module
  assert.equal(wallsLevel(gm, "cadiz"), 1);
  assert.ok(wallsAllow(gm, "cadiz", "hospital"), "legacy save keeps the hospital license");
  const qt = quoteWalls(gm, "cadiz");
  assert.equal(qt.level, 2, "next build continues at level 2");
});

test("wallsAllow: flag-off pass-through and level-1 gate", () => {
  const g0 = newGame(world, "cadiz", { freePlay: true, seed: 7, walls: false, plague: false });
  assert.ok(wallsAllow(g0, "cadiz", "hospital"), "walls flag off (and no plague): the gate does not exist");
  const gm = game(); // default ON
  assert.equal(wallsAllow(gm, "cadiz", "hospital"), false, "walls flag on, no walls built: hospital gated");
  gm.walls.cadiz = { level: 1, state: "active" };
  assert.ok(wallsAllow(gm, "cadiz", "hospital"));
  assert.ok(wallsAllow(gm, "cadiz", "house"), "ordinary types never gated");
});

test("upkeep is paid daily by the chest, never by the player; the weekly book never sees walls", () => {
  const gm = richCaja(game());
  gm.walls.cadiz = { level: 2, state: "active" };
  const cashBefore = gm.cash, cajaBefore = cajaOf(gm, "cadiz");
  for (let i = 0; i < 7; i++) accrueWalls(gm);
  assert.equal(cajaOf(gm, "cadiz"), cajaBefore - 7 * WALL_UPKEEP * 2, "7 days x upkeep x level 2 out of the chest");
  assert.equal(gm.cash, cashBefore, "the player pays no upkeep (Marco 30/10: lo mantienen ellos)");
  assert.equal(gm.accrued?.buildings?.["walls:cadiz"] ?? 0, 0, "the weekly book never sees walls");
  gm.day = 7; // settle day
  settleWeek(gm);
  assert.equal(gm.cash, cashBefore, "settlement collects nothing from the player for walls");
});

test("walls never draw on the player'sh daily cash budget; the towers chain is untouched", () => {
  const gm = game();
  gm.walls.cadiz = { level: 2, state: "active" };
  gm.hallCaja = { cadiz: 1e6 };
  const committed = accrueBuildings(gm);
  assert.equal(typeof committed, "number", "accrueBuildings reports its commitment");
  gm.cash = 0; // even a broke player keeps kept walls when the chest pays
  const out = accrueWalls(gm, committed);
  assert.equal(out, committed, "accrueWalls adds nothing to the player'sh budget chain");
  assert.equal(gm.walls.cadiz.unkept ?? false, false, "the chest pays the watch while the player is broke");
  assert.equal(gm.cash, 0, "player cash untouched");
});

test("unkept hysteresis: a broke chest leaves the wall standing but suspends the bonus; a refilled chest resumes", () => {
  const gm = game();
  gm.walls.cadiz = { level: 3, state: "active" };
  gm.hallCaja = { cadiz: 0 };
  accrueWalls(gm);
  assert.equal(gm.walls.cadiz.unkept, true);
  assert.equal(wallsLevel(gm, "cadiz"), 3, "the wall still stands (license stays)");
  assert.equal(wallsKeptLevel(gm, "cadiz"), 0, "bonus suspended while unkept");
  gm.hallCaja.cadiz = WALL_UPKEEP * 3; // one day of cost: not enough to resume (hysteresis: two days)
  accrueWalls(gm);
  assert.equal(gm.walls.cadiz.unkept, true, "one day of cost does not resume the watch (kills the hysteresis mutant)");
  gm.hallCaja.cadiz = 1e6;
  accrueWalls(gm);
  assert.equal(gm.walls.cadiz.unkept, false);
  assert.equal(wallsKeptLevel(gm, "cadiz"), 3);
});

test("phased upgrade: the old wall stands until the new one completes (P3 11.5.3)", () => {
  const gm = richCaja(game());
  gm.walls.cadiz = { level: 1, state: "active" };
  const qt = quoteWalls(gm, "cadiz");
  assert.equal(qt.level, 2);
  assert.ok(startWalls(gm, "cadiz").ok);
  assert.equal(wallsLevel(gm, "cadiz"), 1, "old defenses serve until completion");
  while (gm.tick < gm.walls.cadiz.readyTick) advanceTick(gm);
  assert.equal(wallsLevel(gm, "cadiz"), 2);
});

test("kept walls add exactly WALL_POP x level of effective population; unkept walls add nothing", () => {
  const bare = game(), walled = richCaja(game());
  walled.walls.cadiz = { level: 3, state: "active" };
  advanceDay(walled); advanceDay(bare); // one full day in lockstep: cadiz'sh market slot recomputes with the walls in place
  assert.ok(walled.market.cadiz.grain?.pop > 0, "market pop recorded");
  assert.equal(walled.market.cadiz.grain.pop - bare.market.cadiz.grain.pop, WALL_POP * 3, "kept level 3 adds exactly WALL_POP x 3");
  walled.walls.cadiz.unkept = true;
  advanceDay(walled); advanceDay(bare); // next market slot recomputes without the bonus
  assert.equal(walled.market.cadiz.grain.pop - bare.market.cadiz.grain.pop, 0, "unpaid watch: no growth bonus");
});

test("save round-trip: wall records, petitions and works in progress survive intact", async () => {
  const { serialize, deserialize } = await import("../src/game/gamesave.mjs");
  const gm = game();
  gm.walls.cadiz = { level: 2, state: "active", unkept: true };
  gm.walls.sevilla = { level: 1, state: "active", nextLevel: 2, readyTick: gm.tick + 50 };
  gm.walls.lisboa = { level: 0, state: "construction", petition: true };
  const { g: g2 } = deserialize(JSON.parse(JSON.stringify(serialize(gm, "Casa Oro"))), world); // same wire path as plague.test
  assert.equal(wallsLevel(g2, "cadiz"), 2);
  assert.equal(g2.walls.cadiz.unkept, true, "the unkept mark survives");
  assert.equal(g2.walls.sevilla.nextLevel, 2, "the work in progress survives");
  assert.equal(g2.walls.sevilla.readyTick, gm.tick + 50);
  assert.equal(g2.walls.lisboa.petition, true, "a pending petition survives");
});

test("default game (walls ON): the hospital offer is gated until the first wall completes, then real", () => {
  const gm = richCaja(rich(game({ citylife: true }))); // default ON: no walls option passed; the player buys the plot, the chest pays the wall
  buyPlot(gm, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  assert.equal(quoteConstruction(gm, "cadiz", "cadiz:1", "hospital").reason, "walls required", "no walls: hospital not offered");
  assert.equal(quoteConstruction(gm, "cadiz", "cadiz:1", "capilla").reason, "walls required", "no walls: capilla not offered");
  assert.ok(quoteConstruction(gm, "cadiz", "cadiz:1", "pozo").ok, "pozo stands outside the walls");
  assert.ok(startWalls(gm, "cadiz").ok, "the concejo can start the first wall");
  while (gm.walls.cadiz.nextLevel) for (let i = 0; i < 400000 && gm.walls.cadiz.nextLevel; i++) advanceTick(gm);
  assert.equal(wallsLevel(gm, "cadiz"), 1, "the wall completed");
  assert.ok(quoteConstruction(gm, "cadiz", "cadiz:1", "hospital").ok, "hospital offered once the wall stands");
});

test("a completed modern record subsumes the legacy marker; a stale marker never resurrects an unpaid watch", () => {
  const gm = game();
  gm.plague = { walls: { cadiz: 1 } }; // pre-module save marker
  assert.equal(wallsLevel(gm, "cadiz"), 1, "legacy marker reads as level 1 while no modern wall stands");
  assert.equal(wallsKeptLevel(gm, "cadiz"), 1, "legacy walls predate upkeep and count as kept");
  gm.walls.cadiz = { nextLevel: 2, readyTick: gm.tick + 10 }; // works under way: the old wall still stands
  assert.equal(wallsLevel(gm, "cadiz"), 1, "works under way never drop the old wall");
  assert.equal(wallsKeptLevel(gm, "cadiz"), 1, "kept while the upgrade is built");
  gm.walls.cadiz = { level: 2, state: "active" };
  assert.equal(wallsLevel(gm, "cadiz"), 2, "completed modern wall subsumes the marker");
  assert.equal(wallsKeptLevel(gm, "cadiz"), 2, "kept while paid");
  gm.hallCaja = { cadiz: 0 }; accrueWalls(gm);
  assert.equal(gm.walls.cadiz.unkept, true, "watch goes unpaid when the chest is empty");
  assert.equal(wallsKeptLevel(gm, "cadiz"), 0, "no bonus while unpaid: the stale marker must not resurrect it");
  assert.equal(wallsLevel(gm, "cadiz"), 2, "the wall still stands, only the bonus stops");
});

test("Auditoría #721: a petition voted with missing materials is consumed with a causal refusal, never left pending", () => {
  const gm = withRespect(game(), "sevilla", 2000); // respect 20, "Conocido"
  gm.day = nextMeetingDay(world, "sevilla", 1); // a sevilla meeting day, by the same seeded calendar
  assert.ok(meetingDay(world, "sevilla", gm.day), "test premise: sevilla meets today");
  assert.ok(proposeWall(gm, "sevilla").ok);
  gm.market.sevilla.bricks.stock = 0; // the market cannot supply the recipe (sevilla makes no bricks: one dayTick adds none)
  const cajaBefore = cajaOf(gm, "sevilla");
  councilWallsVote(gm); // direct call: no market drift inside a full dayTick
  assert.ok(!gm.walls.sevilla?.nextLevel, "no work starts without materials");
  assert.equal(gm.walls.sevilla.petition, undefined, "the petition is consumed by the refusal");
  assert.equal(cajaOf(gm, "sevilla"), cajaBefore, "the chest pays nothing");
  const refusals = gm.inbox.filter((m) => m.kind === "council" && m.txt?.es?.includes("rechaza tu petición de muralla: faltan materiales"));
  assert.equal(refusals.length, 1, "exactly one causal refusal reaches the petitioner");
  assert.ok(refusals[0].txt.en.includes("lacks the materials"), "ES+EN refusal");
});

test("same refusal through the real loop (advanceDay): petition consumed, cause posted", () => {
  const gm = withRespect(game(), "sevilla", 2000);
  assert.ok(proposeWall(gm, "sevilla").ok);
  const meet = nextMeetingDay(world, "sevilla", gm.day);
  runTo(gm, meet - 1);
  gm.market.sevilla.bricks.stock = 0;
  advanceDay(gm); // dayTick runs councilWallsVote on the meeting day
  assert.ok(meetingDay(world, "sevilla", gm.day), "premise: the day advanced onto the meeting day");
  assert.ok(!gm.walls.sevilla?.nextLevel, "no work starts");
  assert.equal(gm.walls.sevilla.petition, undefined, "the petition is consumed by the vote");
  assert.ok(gm.inbox.some((m) => m.kind === "council" && m.txt?.es?.includes("faltan materiales")), "the player hears why");
});

test("legacy save (JSON round-trip): upkeep accrued before the council model is settled once, never again (migration exception, Main 30/10)", () => {
  let gm = game();
  gm.walls.cadiz = { level: 1, state: "active" }; // an old save'sh wall, built when the player paid
  (gm.accrued ??= { ships: {} }).buildings = { "walls:cadiz": 14 }; // debt the old code accrued, not yet settled
  gm.day = 7; // settlement day (SETTLE_EVERY)
  richCaja(gm); // the chest pays the watch from here on
  gm = JSON.parse(JSON.stringify(gm)); // the save load: plain objects, like an old slot
  const cashBefore = gm.cash;
  const rs = settleWeek(gm);
  assert.ok(rs, "settlement runs on day 7");
  assert.equal(gm.cash, cashBefore - 14, "the old debt is settled exactly once (not condoned)");
  assert.ok(rs.buildings.some((b) => b.plot === "walls:cadiz" && b.cost === 14), "the weekly book shows the one-time walls line");
  assert.equal(gm.accrued.buildings["walls:cadiz"], undefined, "the bucket is cleared by the settlement");
  const cashAfter = gm.cash;
  for (let i = 0; i < 7; i++) accrueWalls(gm);
  assert.equal(gm.cash, cashAfter, "no new player charge: the chest pays the watch now");
  assert.equal(gm.accrued.buildings["walls:cadiz"], undefined, "walls never enter the weekly book again");
});
