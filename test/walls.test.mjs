// Walls module (edificios push, lane B): levels 0..3 with x3 wall/gate art,
// construction on the buildings pattern, weekly-book upkeep, save-safe legacy
// read of plague.walls=1 as level 1. Every number is own tuning (inference,
// no documented figure exists); flag OFF = untouched game. Contract:
// walls-contract-v1.md; D1/D2/D3 ruled by Estudio before this runs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay, advanceTick } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyOffice, buyPlot, quoteConstruction } from "../src/game/buildings.mjs";
import { wallsLevel, wallsKeptLevel, quoteWalls, startWalls, tickWalls, accrueWalls, WALL_MAX_LEVEL, WALL_POP, WALL_UPKEEP } from "../src/game/walls.mjs";
import { accrueBuildings } from "../src/game/buildings.mjs";
import { wallsAllow } from "../src/game/plague.mjs";
import { settleWeek } from "../src/game/ledger.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // walls flag is ON by default
const rich = (g, cityId = "cadiz") => { (g.rep ??= {})[cityId] = 100; g.cash = 1e6; buyOffice(g, cityId); };

test("flag OFF (false or 1): no state, quote says unknown, ticks and accruals no-op", () => {
  for (const off of [false, 1]) {
    const g = newGame(world, "cadiz", { freePlay: true, seed: 7, walls: off });
    assert.equal(g.walls, undefined, "off game keeps no key");
    assert.equal(quoteWalls(g, "cadiz").reason, "unknown");
    tickWalls(g); accrueWalls(g); // must not throw, must not create state
    assert.equal(g.walls, undefined);
    assert.equal(wallsLevel(g, "cadiz"), 0);
  }
});

test("flag ON by default: absent and true both create the state", () => {
  assert.notEqual(game().walls, undefined, "absent opts: ON");
  assert.notEqual(game({ walls: true }).walls, undefined, "explicit true: ON");
});

test("happy path: quote, pay with money identity, activate on the exact readyTick", () => {
  const g = game(); rich(g);
  const q = quoteWalls(g, "cadiz");
  assert.ok(q.ok && q.level === 1 && q.ticks > 0, JSON.stringify(q));
  const before = g.cash, readyTick = g.tick + q.ticks;
  const r = startWalls(g, "cadiz");
  assert.ok(r.ok && g.cash === before - q.cost, "money identity on the start");
  assert.equal(wallsLevel(g, "cadiz"), 0, "not active until the tick lands");
  while (g.tick < readyTick) advanceTick(g);
  assert.equal(wallsLevel(g, "cadiz"), 1, "active exactly at readyTick");
  assert.ok(g.inbox.some((m) => m.txt?.es && m.txt?.en), "ES+EN completion message");
});

test("levels cap at WALL_MAX_LEVEL and one build at a time per city", () => {
  const g = game(); rich(g);
  assert.equal(startWalls(g, "cadiz").ok, true);
  assert.equal(startWalls(g, "cadiz").reason, "already building");
  g.walls.cadiz = { level: WALL_MAX_LEVEL, state: "active" };
  assert.equal(quoteWalls(g, "cadiz").reason, "max level");
});

test("office required, unknown city, game over, no cash", () => {
  const g = game(); rich(g);
  assert.equal(quoteWalls(g, "lisboa").reason, "office required");
  assert.equal(quoteWalls(g, "nowhere").reason, "unknown city");
  g.over = true; assert.equal(startWalls(g, "cadiz").reason, "game over"); g.over = false;
  g.cash = 0; assert.equal(startWalls(g, "cadiz").reason, "no cash");
});

test("legacy plague.walls=1 reads as level 1; new construction lands on level 2", () => {
  const g = game({ plague: true }); rich(g);
  g.plague.walls.cadiz = 1; // a save from before the module
  assert.equal(wallsLevel(g, "cadiz"), 1);
  assert.ok(wallsAllow(g, "cadiz", "hospital"), "legacy save keeps the hospital license");
  const q = quoteWalls(g, "cadiz");
  assert.equal(q.level, 2, "next build continues at level 2");
});

test("wallsAllow: flag-off pass-through and level-1 gate", () => {
  const g0 = newGame(world, "cadiz", { freePlay: true, seed: 7, walls: false, plague: false });
  assert.ok(wallsAllow(g0, "cadiz", "hospital"), "walls flag off (and no plague): the gate does not exist");
  const g = game(); rich(g); // default ON
  assert.equal(wallsAllow(g, "cadiz", "hospital"), false, "walls flag on, no walls built: hospital gated");
  g.walls.cadiz = { level: 1, state: "active" };
  assert.ok(wallsAllow(g, "cadiz", "hospital"));
  assert.ok(wallsAllow(g, "cadiz", "house"), "ordinary types never gated");
});

test("upkeep accrues into the weekly book and settleWeek pays it", () => {
  const g = game(); rich(g);
  g.walls.cadiz = { level: 2, state: "active" };
  const before = g.cash;
  for (let i = 0; i < 7; i++) accrueWalls(g);
  assert.equal(g.accrued?.buildings?.["walls:cadiz"], 7 * WALL_UPKEEP * 2, "7 days x upkeep x level 2");
  g.day = 7; // settle day
  const r = settleWeek(g);
  assert.ok(r && g.cash < before, "the weekly book collects wall upkeep");
});

test("buildings and walls share one daily cash budget (Codex finding 23/10)", () => {
  const g = game(); rich(g);
  g.walls.cadiz = { level: 2, state: "active" };
  const committed = accrueBuildings(g);
  assert.equal(typeof committed, "number", "accrueBuildings reports its commitment");
  // Contract: whatever buildings already committed today is not available to the walls.
  g.cash = WALL_UPKEEP * 2; // exactly the wall upkeep
  accrueWalls(g, g.cash);   // ...but buildings already spent it all
  assert.equal(g.walls.cadiz.unkept, true, "walls go unkept once buildings consumed today's cash");
  assert.equal(g.accrued?.buildings?.["walls:cadiz"] ?? 0, 0, "no wall upkeep accrued");
  g.cash = 1e6; accrueWalls(g, 0); // hysteresis resumes with cash in hand
  assert.equal(g.walls.cadiz.unkept, false);
});

test("unkept hysteresis: broke walls stand but their bonus suspends; cash resumes", () => {
  const g = game(); rich(g);
  g.walls.cadiz = { level: 3, state: "active" };
  g.cash = 0;
  accrueWalls(g);
  assert.equal(g.walls.cadiz.unkept, true);
  assert.equal(wallsLevel(g, "cadiz"), 3, "the wall still stands (license stays)");
  assert.equal(wallsKeptLevel(g, "cadiz"), 0, "bonus suspended while unkept");
  g.cash = 1e6;
  accrueWalls(g);
  assert.equal(g.walls.cadiz.unkept, false);
  assert.equal(wallsKeptLevel(g, "cadiz"), 3);
});

test("phased upgrade: the old wall stands until the new one completes (P3 11.5.3)", () => {
  const g = game(); rich(g);
  g.walls.cadiz = { level: 1, state: "active" };
  const q = quoteWalls(g, "cadiz");
  assert.equal(q.level, 2);
  assert.ok(startWalls(g, "cadiz").ok);
  assert.equal(wallsLevel(g, "cadiz"), 1, "old defenses serve until completion");
  while (g.tick < g.walls.cadiz.readyTick) advanceTick(g);
  assert.equal(wallsLevel(g, "cadiz"), 2);
});

test("kept walls add exactly WALL_POP x level of effective population; unkept walls add nothing", () => {
  const bare = game(), walled = game(); rich(walled);
  walled.walls.cadiz = { level: 3, state: "active" };
  advanceDay(walled); advanceDay(bare); // one full day in lockstep: cadiz's market slot recomputes with the walls in place
  assert.ok(walled.market.cadiz.grain?.pop > 0, "market pop recorded");
  assert.equal(walled.market.cadiz.grain.pop - bare.market.cadiz.grain.pop, WALL_POP * 3, "kept level 3 adds exactly WALL_POP x 3");
  walled.walls.cadiz.unkept = true;
  advanceDay(walled); advanceDay(bare); // next market slot recomputes without the bonus
  assert.equal(walled.market.cadiz.grain.pop - bare.market.cadiz.grain.pop, 0, "unpaid watch: no growth bonus");
});

test("save round-trip: wall records and works in progress survive intact", async () => {
  const { serialize, deserialize } = await import("../src/game/gamesave.mjs");
  const g = game(); rich(g);
  g.walls.cadiz = { level: 2, state: "active", unkept: true };
  g.walls.sevilla = { level: 1, state: "active", nextLevel: 2, readyTick: g.tick + 50 };
  const { g: g2 } = deserialize(JSON.parse(JSON.stringify(serialize(g, "Casa Oro"))), world); // same wire path as plague.test
  assert.equal(wallsLevel(g2, "cadiz"), 2);
  assert.equal(g2.walls.cadiz.unkept, true, "the unkept mark survives");
  assert.equal(g2.walls.sevilla.nextLevel, 2, "the work in progress survives");
  assert.equal(g2.walls.sevilla.readyTick, g.tick + 50);
});

test("default game (walls ON): the hospital offer is gated until the first wall completes, then real", () => {
  const g = game({ citylife: true }); rich(g); // default ON: no walls option passed
  buyPlot(g, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:1", "hospital").reason, "walls required", "no walls: hospital not offered");
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:1", "capilla").reason, "walls required", "no walls: capilla not offered");
  assert.ok(quoteConstruction(g, "cadiz", "cadiz:1", "pozo").ok, "pozo stands outside the walls");
  assert.ok(startWalls(g, "cadiz").ok, "the player can start the first wall");
  while (g.walls.cadiz.nextLevel) for (let i = 0; i < 400000 && g.walls.cadiz.nextLevel; i++) advanceTick(g);
  assert.equal(wallsLevel(g, "cadiz"), 1, "the wall completed");
  assert.ok(quoteConstruction(g, "cadiz", "cadiz:1", "hospital").ok, "hospital offered once the wall stands");
});

test("a completed modern record subsumes the legacy marker; a stale marker never resurrects an unpaid watch", () => {
  const g = game();
  g.plague = { walls: { cadiz: 1 } }; // pre-module save marker
  assert.equal(wallsLevel(g, "cadiz"), 1, "legacy marker reads as level 1 while no modern wall stands");
  assert.equal(wallsKeptLevel(g, "cadiz"), 1, "legacy walls predate upkeep and count as kept");
  g.walls.cadiz = { nextLevel: 2, readyTick: g.tick + 10 }; // works under way: the old wall still stands
  assert.equal(wallsLevel(g, "cadiz"), 1, "works under way never drop the old wall");
  assert.equal(wallsKeptLevel(g, "cadiz"), 1, "kept while the upgrade is built");
  g.walls.cadiz = { level: 2, state: "active" };
  assert.equal(wallsLevel(g, "cadiz"), 2, "completed modern wall subsumes the marker");
  assert.equal(wallsKeptLevel(g, "cadiz"), 2, "kept while paid");
  g.cash = 0; accrueWalls(g);
  assert.equal(g.walls.cadiz.unkept, true, "watch goes unpaid");
  assert.equal(wallsKeptLevel(g, "cadiz"), 0, "no bonus while unpaid: the stale marker must not resurrect it");
  assert.equal(wallsLevel(g, "cadiz"), 2, "the wall still stands, only the bonus stops");
});
