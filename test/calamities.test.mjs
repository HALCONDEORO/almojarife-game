// Calamities module (block C3): famine, fire and sanitation scares in the plague frame.
// Own tuning everywhere (no documented figures); flag OFF = untouched game.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame, advanceDay } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { initCalamities, calamityWeek, calamityChance, calamityDays, calamityActive, calamityDemandMul, calamityMoodHit, CALAMITY } from "../src/game/calamities.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { post } from "../src/game/ledger.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const game = (opts = {}) => newGame(world, "cadiz", { freePlay: true, seed: 7, citylife: true, plague: true, calamities: true, ...opts });
const withBuildings = (g, cityId, defs) => { g.buildings ??= {}; g.buildings[cityId] = Object.fromEntries(defs.map(([type, level], i) => [`${cityId}:${i + 1}`, { type, level, state: "active" }])); };

test("flag OFF: no state, no rolls, no effect", () => {
  const g = newGame(world, "cadiz", { freePlay: true, seed: 7 });
  assert.equal(g.calamities, undefined);
  for (let i = 0; i < 60; i++) advanceDay(g);
  assert.equal(g.calamities, undefined);
  assert.equal(calamityDemandMul(g, "cadiz", "grain"), 1);
  assert.equal(calamityMoodHit(g, "cadiz"), 0);
});

test("without buildings the city keeps the base chance and duration of each calamity", () => {
  const g = game();
  for (const k of Object.keys(CALAMITY)) {
    assert.equal(calamityChance(g, "cadiz", k), CALAMITY[k].chance, k + " chance");
    assert.equal(calamityDays(g, "cadiz", k), CALAMITY[k].days, k + " days");
  }
});

test("the cited buildings cut risk: posito vs famine, pozo+hospital vs fire and sanitation", () => {
  const g = game();
  withBuildings(g, "cadiz", [["posito", 3], ["pozo", 3], ["hospital", 2], ["alhondiga", 1]]);
  assert.ok(calamityChance(g, "cadiz", "hambruna") < CALAMITY.hambruna.chance, "famine chance falls");
  assert.equal(calamityDays(g, "cadiz", "hambruna"), CALAMITY.hambruna.days - 3 * 3 - 1 * 1, "posito 3 + alhondiga 1 cut 10 days");
  assert.equal(calamityDays(g, "cadiz", "incendio"), CALAMITY.incendio.minDays, "pozo 3 cuts past the floor, which holds");
  assert.ok(calamityDays(g, "cadiz", "malsana") < CALAMITY.malsana.days, "sanitation shortens");
});

test("famine raises food demand only; sanitation slackens everything", () => {
  const g = game();
  g.day = 10;
  g.calamities.active.cadiz = { hambruna: { fromDay: 10, untilDay: 45 } };
  assert.equal(calamityDemandMul(g, "cadiz", "grain"), 1.5);
  assert.equal(calamityDemandMul(g, "cadiz", "cloth"), 1);
  g.calamities.active.cadiz.malsana = { fromDay: 10, untilDay: 24 };
  assert.equal(calamityDemandMul(g, "cadiz", "grain"), 1.5 * 0.9);
  assert.equal(calamityDemandMul(g, "cadiz", "cloth"), 0.9);
});

test("a fire halts up to two working buildings and they reopen when it ends; the owner's own halt stays", () => {
  const g = game();
  withBuildings(g, "cadiz", [["workshop", 1], ["brewery", 1], ["warehouse", 1]]);
  g.buildings.cadiz["cadiz:3"].halted = true; // the owner halted this one himself
  g.day = 14;
  g.calamities.active.cadiz = {};
  // force a fire through the weekly frame: seed the state as the roll would
  const cal = g.calamities;
  cal.active.cadiz.incendio = { fromDay: 14, untilDay: 21 };
  const candidates = Object.entries(g.buildings.cadiz).filter(([, b]) => b.state === "active" && !b.halted && b.type);
  for (const [plotId, b] of candidates.slice(0, 2)) b.halted = "incendio";
  cal.fireHalted.cadiz = candidates.slice(0, 2).map(([p]) => `cadiz/${p}`);
  g.day = 21;
  calamityWeek(g, post);
  assert.equal(g.buildings.cadiz["cadiz:1"].halted, undefined, "fire victim 1 reopened");
  assert.equal(g.buildings.cadiz["cadiz:2"].halted, undefined, "fire victim 2 reopened");
  assert.equal(g.buildings.cadiz["cadiz:3"].halted, true, "the owner's own halt is untouched");
  assert.ok(!calamityActive(g, "cadiz").includes("incendio"), "the fire is out");
});

test("start and end messages post in ES and EN", () => {
  const g = game();
  g.day = 7;
  g.calamities.active.cadiz = { hambruna: { fromDay: 7, untilDay: 14 } };
  g.day = 14;
  calamityWeek(g, post);
  const msg = (g.inbox ?? []).find((m) => m.kind === "info" && m.txt?.es?.includes("hambruna"));
  assert.ok(msg, "end message posted");
  assert.ok(msg.txt.es.length > 10 && msg.txt.en.length > 10, "both languages");
});

test("save round trip with the calamities flag ON keeps the book", () => {
  const a = game();
  a.calamities.active.cadiz = { malsana: { fromDay: 1, untilDay: 15 } };
  for (let i = 0; i < 5; i++) advanceDay(a);
  const { g: b } = deserialize(JSON.parse(JSON.stringify(serialize(a, "Casa Oro"))), world);
  assert.equal(b.calamities.active.cadiz.malsana.untilDay, 15);
  for (let i = 0; i < 20; i++) { advanceDay(a); advanceDay(b); }
  assert.deepEqual(JSON.parse(JSON.stringify({ ...b, world: undefined })), JSON.parse(JSON.stringify({ ...a, world: undefined })));
});

test("a calamity drags the mood while it lasts (citylife seam)", () => {
  const g = game();
  g.calamities.active.cadiz = { hambruna: { fromDay: 1, untilDay: 60 } };
  assert.equal(calamityMoodHit(g, "cadiz"), 15);
});

test("a fire-halted building is not a cash halt: accrue leaves it, restart refuses it, the label says fire", async () => {
  const { accrueBuildings, restartBuilding } = await import("../src/game/buildings.mjs");
  const { buildingsRows, buildingLabel } = await import("../src/view/buildingsview.mjs");
  const g = game();
  withBuildings(g, "cadiz", [["workshop", 1]]);
  const b = g.buildings.cadiz["cadiz:1"];
  b.halted = "incendio";
  g.cash = 1e6; // plenty of cash: a cash halt would auto-resume with two days' cost
  accrueBuildings(g); // the daily accrue
  assert.equal(b.halted, "incendio"); // still burnt
  assert.equal(g.accrued?.buildings?.["cadiz/cadiz:1"] ?? 0, 0); // and it accrued nothing
  const r = restartBuilding(g, "cadiz", "cadiz:1");
  assert.equal(r.ok, false); assert.equal(r.reason, "fire"); // no manual restart while it burns
  const row = buildingsRows(g, "cadiz").find((x) => x.plotId === "cadiz:1");
  assert.equal(row.fire, true);
  const t = { bldState: { halted: "parado", fire: "incendio", plot: "solar" }, bldTypes: { workshop: "Taller" } };
  assert.match(buildingLabel(t, row), /incendio/);
  // when the fire is declared out, calamities lifts it and normal rules apply again
  delete b.halted;
  g.cash = -100; // no cash now: the daily accrue halts it for cash, as before
  accrueBuildings(g);
  assert.equal(b.halted, true);
  assert.equal(restartBuilding(g, "cadiz", "cadiz:1").reason, "no cash");
});
