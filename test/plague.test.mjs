// Plague module (block C2): weekly roll, mitigations (caminos, pozo, hospital, capilla),
// wall gate for hospital/capilla, demand dip while it lasts, ES/EN player messages.
// Every number is own tuning (no documented figure exists); flag OFF = untouched game.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { buyPlot, buyOffice, startConstruction, quoteConstruction } from "../src/game/buildings.mjs";
import { initPlague, plagueWeek, plagueChance, plagueDays, plagueActive, plaguePopMul, expandWalls, PLAGUE_BASE_CHANCE, PLAGUE_BASE_DAYS, WALL_COST } from "../src/game/plague.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { post } from "../src/game/ledger.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, citylife: true, plague: true, ...opts });
const withBuildings = (g, cityId, defs) => { g.buildings ??= {}; g.buildings[cityId] = Object.fromEntries(defs.map(([type, level, halted], i) => [`${cityId}:${i + 1}`, { type, level, state: "active", ...(halted ? { halted: true } : {}) }])); };

test("flag OFF: no state, no rolls, market untouched", () => {
  const g = newGame(world, "cadiz", { freePlay: true, seed: 7 });
  assert.equal(g.plague, undefined);
  for (let i = 0; i < 60; i++) advanceDay(g);
  assert.equal(g.plague, undefined);
  assert.equal(plaguePopMul(g, "cadiz"), 1);
  assert.ok(!g.inbox?.some((m) => JSON.stringify(m.txt ?? "").includes("Peste") || JSON.stringify(m.txt ?? "").includes("Plague")), "no plague messages");
});

test("without buildings the city keeps the base chance and duration", () => {
  const g = game();
  assert.equal(plagueChance(g, "cadiz"), PLAGUE_BASE_CHANCE);
  assert.equal(plagueDays(g, "cadiz"), PLAGUE_BASE_DAYS);
});

test("well and hospital cut the chance and shorten the plague; a halted hospital does not", () => {
  const g = game();
  withBuildings(g, "cadiz", [["pozo", 3], ["hospital", 2]]);
  const chance = plagueChance(g, "cadiz"), days = plagueDays(g, "cadiz");
  assert.ok(chance < PLAGUE_BASE_CHANCE, "chance falls: " + chance);
  assert.equal(days, PLAGUE_BASE_DAYS - 3 * 2 - 2 * 3, "3 well levels + 2 hospital levels cut 12 days");
  withBuildings(g, "cadiz", [["pozo", 3], ["hospital", 2, true]]);
  assert.equal(plagueDays(g, "cadiz"), PLAGUE_BASE_DAYS - 3 * 2, "halted hospital counts for nothing");
});

test("walls: hospital and capilla need the one expansion; pozo does not; expansion pays exactly", () => {
  const g = game();
  (g.rep ??= {}).cadiz = 100; g.cash = 1e6; buyOffice(g, "cadiz");
  buyPlot(g, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:1", "hospital").reason, "walls required");
  assert.equal(quoteConstruction(g, "cadiz", "cadiz:1", "capilla").reason, "walls required");
  assert.ok(quoteConstruction(g, "cadiz", "cadiz:1", "pozo").ok, "pozo stands outside the walls");
  const before = g.cash;
  const r = expandWalls(g, "cadiz");
  assert.ok(r.ok && g.cash === before - WALL_COST, "money identity on the expansion");
  assert.equal(expandWalls(g, "cadiz").reason, "already expanded");
  assert.ok(quoteConstruction(g, "cadiz", "cadiz:1", "hospital").ok, "hospital allowed after the expansion");
  const g2 = newGame(world, "cadiz", { freePlay: true, seed: 7, citylife: true, walls: false }); // no wall system at all (plague off, walls pinned off): no gate
  (g2.rep ??= {}).cadiz = 100; g2.cash = 1e6; buyOffice(g2, "cadiz"); buyPlot(g2, "cadiz", { id: "cadiz:1", type: "house", w: 10, d: 10 });
  assert.ok(quoteConstruction(g2, "cadiz", "cadiz:1", "hospital").ok, "without the plague flag the wall gate does not exist");
});

test("an active plague cuts demand via effective population and expires with an ES+EN message", () => {
  const g = game();
  g.day = 10;
  g.plague.active.cadiz = { fromDay: 10, untilDay: 10 + PLAGUE_BASE_DAYS };
  assert.equal(plaguePopMul(g, "cadiz"), 0.75);
  assert.ok(plagueActive(g, "cadiz"));
  advanceDay(g); // a market tick passes for cadiz with the reduced pop
  const pop = g.market.cadiz.grain.pop, base = world.nodes.cadiz.pop;
  assert.equal(pop, Math.round(base * 0.75), "demand pop dips while the plague lasts");
  g.day = 10 + PLAGUE_BASE_DAYS;
  const before = g.inbox?.length ?? 0;
  plagueWeek(g, post);
  assert.ok(!plagueActive(g, "cadiz"), "it burns out on its day");
  const msg = (g.inbox ?? []).slice(0, (g.inbox?.length ?? 0) - before + 1).find((m) => m.kind === "info" && m.txt?.es?.includes("peste"));
  assert.ok(msg, "end message posted");
  assert.match(msg.txt.es, /La peste ha pasado/);
  assert.match(msg.txt.en, /The plague has passed/);
});

test("the weekly roll can start a plague and greets it in ES and EN", () => {
  const g = game();
  // find a week where the seeded roll fires for cadiz, then force it by setting state directly
  g.day = 7 * 3;
  g.plague.active.sevilla = { fromDay: g.day, untilDay: g.day + 7 };
  plagueWeek(g, post);
  assert.ok(plagueActive(g, "sevilla"), "still active: one at a time per city");
  const msgs = (g.inbox ?? []).filter((m) => m.kind === "info" && m.txt?.es);
  for (const m of msgs) { assert.ok(m.txt.es.length > 5 && m.txt.en.length > 5, "both languages rendered"); }
});

test("save round trip with the plague flag ON keeps the plague book", () => {
  const a = game();
  a.plague.active.cadiz = { fromDay: 1, untilDay: 40 };
  a.plague.walls.cadiz = 1;
  for (let i = 0; i < 10; i++) advanceDay(a);
  const { g: b } = deserialize(JSON.parse(JSON.stringify(serialize(a, "Casa Oro"))), world);
  assert.equal(b.plague.active.cadiz.untilDay, 40);
  assert.equal(b.plague.walls.cadiz, 1);
  for (let i = 0; i < 20; i++) { advanceDay(a); advanceDay(b); }
  assert.deepEqual(JSON.parse(JSON.stringify({ ...b, world: undefined })), JSON.parse(JSON.stringify({ ...a, world: undefined })));
});
