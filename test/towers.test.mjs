// Towers module (issue #363, lane C): watchtowers mounted on the city wall,
// construction on the walls pattern, weekly-book upkeep, fire-watch effect on
// the calamities "incendio" roll. Every number is own tuning (inference, no
// documented figure exists); flag OFF = untouched game.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay, advanceTick } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyOffice } from "../src/game/buildings.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { towersCount, towersKept, towersMax, quoteTowers, startTowers, tickTowers, accrueTowers, TOWERS_PER_WALL_LEVEL, TOWER_UPKEEP, TOWER_BUILD_DAYS } from "../src/game/towers.mjs";
import { accrueWalls, WALL_UPKEEP } from "../src/game/walls.mjs";
import { calamityChance, calamityDays, CALAMITY, CHANCE_CAP } from "../src/game/calamities.mjs";
import { settleWeek } from "../src/game/ledger.mjs";
import { TICKS_PER_DAY } from "../src/sim/clock.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, ...opts }); // towers flag is ON by default
const rich = (g, cityId = "cadiz") => { (g.rep ??= {})[cityId] = 100; g.cash = 1e6; buyOffice(g, cityId); };
const withWalls = (g, cityId = "cadiz", level = 1) => { g.walls[cityId] = { level, state: "active" }; };

test("flag OFF (false or 1): no state, quote says unknown, ticks and accruals no-op", () => {
  for (const off of [false, 1]) {
    const g = newGame(world, "cadiz", { freePlay: true, seed: 7, towers: off });
    assert.equal(g.towers, undefined, "off game keeps no key");
    assert.equal(quoteTowers(g, "cadiz").reason, "unknown");
    tickTowers(g); accrueTowers(g); // must not throw, must not create state
    assert.equal(g.towers, undefined);
    assert.equal(towersCount(g, "cadiz"), 0);
    assert.equal(towersKept(g, "cadiz"), 0);
  }
});

test("flag ON by default: absent and true both create the state", () => {
  assert.notEqual(game().towers, undefined, "absent opts: ON");
  assert.notEqual(game({ towers: true }).towers, undefined, "explicit true: ON");
});

test("a tower mounts on the wall: no standing wall, no quote", () => {
  const g = game(); rich(g);
  assert.equal(quoteTowers(g, "cadiz").reason, "walls required");
  withWalls(g);
  assert.ok(quoteTowers(g, "cadiz").ok, "wall level 1 carries towers");
});

test("quote is pure: arming the preview changes no state and builds nothing early", () => {
  const g = game(); rich(g); withWalls(g);
  const snap = JSON.stringify({ towers: g.towers, cash: g.cash, tick: g.tick, wh: g.warehouses });
  const q1 = quoteTowers(g, "cadiz"), q2 = quoteTowers(g, "cadiz");
  assert.ok(q1.ok && q2.ok);
  assert.deepEqual(q1, q2, "same quote twice");
  assert.equal(JSON.stringify({ towers: g.towers, cash: g.cash, tick: g.tick, wh: g.warehouses }), snap, "no state moved while quoting");
  assert.equal(towersCount(g, "cadiz"), 0, "nothing built by the preview");
});

test("happy path: quote, pay with money identity, tower stands on the exact readyTick", () => {
  const g = game(); rich(g); withWalls(g);
  const q = quoteTowers(g, "cadiz");
  assert.ok(q.ok && q.count === 1 && q.ticks === TOWER_BUILD_DAYS * TICKS_PER_DAY, JSON.stringify(q));
  const before = g.cash, readyTick = g.tick + q.ticks;
  const r = startTowers(g, "cadiz");
  assert.ok(r.ok && g.cash === before - q.cost, "money identity on the start");
  assert.equal(towersCount(g, "cadiz"), 0, "not standing until the tick lands");
  while (g.tick < readyTick) advanceTick(g);
  assert.equal(towersCount(g, "cadiz"), 1, "standing exactly at readyTick");
  assert.ok(g.inbox.some((m) => m.txt?.es && m.txt?.en), "ES+EN completion message");
});

test("cap: two towers per wall level; raising the wall raises the cap", () => {
  const g = game(); rich(g); withWalls(g, "cadiz", 1);
  assert.equal(towersMax(g, "cadiz"), TOWERS_PER_WALL_LEVEL, "cap reads the wall");
  g.towers.cadiz = { count: 2, state: "active" };
  assert.equal(quoteTowers(g, "cadiz").reason, "max level", "2 towers on wall 1: full");
  withWalls(g, "cadiz", 2);
  assert.equal(towersMax(g, "cadiz"), 4);
  assert.ok(quoteTowers(g, "cadiz").ok, "wall 2 opens two more");
});

test("one work at a time per city; office, city, game-over and cash gates", () => {
  const g = game(); rich(g); withWalls(g); withWalls(g, "lisboa");
  assert.equal(startTowers(g, "cadiz").ok, true);
  assert.equal(startTowers(g, "cadiz").reason, "already building");
  assert.equal(quoteTowers(g, "lisboa").reason, "office required");
  assert.equal(quoteTowers(g, "nowhere").reason, "unknown city");
  g.over = true; assert.equal(startTowers(g, "lisboa").reason, "game over"); g.over = false;
  const g2 = game(); rich(g2); withWalls(g2); g2.cash = 0;
  assert.equal(startTowers(g2, "cadiz").reason, "no cash");
});

test("upkeep accrues into the weekly book and settleWeek pays it", () => {
  const g = game(); rich(g);
  g.towers.cadiz = { count: 3, state: "active" };
  const before = g.cash;
  for (let i = 0; i < 7; i++) accrueTowers(g);
  assert.equal(g.accrued?.buildings?.["towers:cadiz"], 7 * TOWER_UPKEEP * 3, "7 days x upkeep x 3 towers");
  g.day = 7; // settle day
  const r = settleWeek(g);
  assert.ok(r && g.cash < before, "the weekly book collects tower upkeep");
});

test("cash-budget chain: walls are paid before towers on a short purse", () => {
  const g = game(); rich(g);
  g.walls.cadiz = { level: 2, state: "active" };
  g.towers.cadiz = { count: 2, state: "active" };
  g.cash = 2 * WALL_UPKEEP; // exactly the walls' day, nothing left for the towers
  const wallCommit = accrueWalls(g, 0) ?? 0;
  assert.equal(wallCommit, 2 * WALL_UPKEEP, "accrueWalls reports its commitment down the chain");
  accrueTowers(g, wallCommit);
  assert.equal(g.walls.cadiz.unkept, undefined, "walls stay kept");
  assert.equal(g.towers.cadiz.unkept, true, "towers go unmanned first");
  assert.equal(towersKept(g, "cadiz"), 0, "an unmanned tower watches nothing");
});

test("unkept on a broke day; hysteresis resumes only with two days of cost in hand", () => {
  const g = game(); rich(g);
  g.towers.cadiz = { count: 2, state: "active" };
  g.cash = 0; accrueTowers(g);
  assert.equal(g.towers.cadiz.unkept, true);
  g.cash = 2 * TOWER_UPKEEP - 1; accrueTowers(g); // one day short of the hysteresis bar
  assert.equal(g.towers.cadiz.unkept, true, "one day of cost does not resume the watch");
  g.cash = 2 * 2 * TOWER_UPKEEP; accrueTowers(g);
  assert.equal(g.towers.cadiz.unkept, false, "two days of cost resumes the watch");
  assert.ok(g.inbox.some((m) => m.txt?.es && m.txt?.en), "ES+EN watch messages");
});

test("hysteresis band: cash in [cost, 2*cost) does NOT resume the watch (mutation killer: < cost*2 must not degrade to < cost)", () => {
  const g = game(); rich(g);
  g.towers.cadiz = { count: 2, state: "active" };
  const cost = TOWER_UPKEEP * 2; // one day of the whole watch
  g.cash = 0; accrueTowers(g);
  assert.equal(g.towers.cadiz.unkept, true);
  g.cash = cost; accrueTowers(g); // exactly one day of cost in hand
  assert.equal(g.towers.cadiz.unkept, true, "one full day of cost stays under the two-day bar");
  g.cash = 2 * cost - 1; accrueTowers(g); // one coin short of the bar
  assert.equal(g.towers.cadiz.unkept, true, "one coin short still keeps the watch down");
  g.cash = 2 * cost; accrueTowers(g); // the bar itself
  assert.equal(g.towers.cadiz.unkept, false, "the bar resumes the watch");
});

test("fire watch: kept towers cut the fire chance and length, nothing else", () => {
  const g = game(); rich(g);
  const baseChance = calamityChance(g, "cadiz", "incendio"), baseDays = calamityDays(g, "cadiz", "incendio");
  g.towers.cadiz = { count: 2, state: "active" };
  const cutChance = calamityChance(g, "cadiz", "incendio"), cutDays = calamityDays(g, "cadiz", "incendio");
  assert.ok(cutChance < baseChance, "the watch cuts the weekly fire chance");
  assert.ok(cutDays < baseDays, "the watch shortens the fire");
  assert.equal(calamityChance(g, "cadiz", "hambruna"), CALAMITY.hambruna.chance, "no watch against famine");
  assert.equal(calamityDays(g, "cadiz", "malsana"), CALAMITY.malsana.days, "no watch against a scare");
  g.towers.cadiz.unkept = true;
  assert.equal(calamityChance(g, "cadiz", "incendio"), baseChance, "an unpaid watch is no watch");
  const off = newGame(world, "cadiz", { freePlay: true, seed: 7, towers: false });
  assert.equal(calamityChance(off, "cadiz", "incendio"), baseChance, "flag off: no effect");
  assert.ok(cutChance >= baseChance * CHANCE_CAP, "the cut never beats the cap");
});

test("save round-trip keeps the towers state (plain object, unkept and works)", () => {
  const g = game(); rich(g); withWalls(g);
  g.towers.cadiz = { count: 2, state: "active", unkept: true };
  g.towers.sevilla = { count: 1, state: "construction", nextCount: 2, readyTick: 999 };
  const { g: g2 } = deserialize(serialize(g, "Test Co"), world);
  assert.deepEqual(g2.towers, g.towers, "JSON round-trip keeps the record");
});

test("day loop integration: advanceDay accrues towers after walls, advanceTick finishes the work", () => {
  const g = game(); rich(g); withWalls(g);
  assert.ok(startTowers(g, "cadiz").ok);
  for (let d = 0; d < TOWER_BUILD_DAYS; d++) advanceDay(g);
  assert.equal(towersCount(g, "cadiz"), 1, "the day loop finishes the tower on its day");
  g.towers.cadiz.count = 3; g.towers.cadiz.state = "active";
  const before = g.accrued?.buildings?.["towers:cadiz"] ?? 0;
  advanceDay(g);
  assert.equal((g.accrued?.buildings?.["towers:cadiz"] ?? 0) - before, 3 * TOWER_UPKEEP, "the day loop accrues tower upkeep");
});
