// Fire as a phase event (Estudios 6, Marco 30/10): our incendio is a phased calamity with its own
// persisted book - start day, horizon day (untilDay) and the exact victims it halted. These tests
// pin, through the real weekly roll (seed 2 ignites cadiz in week 3): no building is processed
// twice inside a phase, the phase change survives a save/load, and finalizing removes the event,
// its victims' closure and its urban indicator - exactly once. Our own design has no continuation
// counter: the horizon IS the scheduled next instant, and that is pinned as-is.
// Fixture note: the owner-halted posito sits FIRST on purpose. With it wrongly admitted as a
// candidate it would take index 0, and the roll's first picks (0.0187, 0.0089) both land on
// index 0 - so the owner-halt and cap mutants die on the exact victim list, not on luck.
// The base calamity contracts (chances, durations, mitigations, demand, mood, labels) live in
// calamities.test.mjs; nothing duplicated.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { newGame } from "../src/game/game.mjs";
import { buildWorld } from "../src/sim/world.mjs";
import { calamityWeek, calamityActive } from "../src/game/calamities.mjs";
import { worldSystemsHtml } from "../src/view/worldsystems.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
import { post } from "../src/game/ledger.mjs";

const world = buildWorld(JSON.parse(fs.readFileSync(new URL("../data/world.json", import.meta.url))));
const FIRE_DAY = 21; // week 3: the seeded roll ignites a fire in cadiz for seed 2 (and week 4 stays quiet)
const VICTIM_KEY = "cadiz/cadiz:2"; // the roll's first pick: candidates[0] of the working buildings
const game = () => {
  const gm = newGame(world, "cadiz", { freePlay: true, seed: 2, citylife: true, plague: true, calamities: true });
  gm.buildings = { cadiz: {
    "cadiz:1": { type: "posito", level: 1, state: "active", halted: true }, // the owner halted this one himself - first on purpose (see header)
    "cadiz:2": { type: "workshop", level: 1, state: "active" },
    "cadiz:3": { type: "brewery", level: 1, state: "active" },
    "cadiz:4": { type: "warehouse", level: 1, state: "active" },
  } };
  return gm;
};
const ignite = (gm) => { gm.day = FIRE_DAY; calamityWeek(gm, post); return gm.calamities.active.cadiz.incendio; };
const victimsOf = (gm) => gm.calamities.fireHalted.cadiz ?? [];
const endMessages = (gm) => (gm.inbox ?? []).filter((msg) => msg.kind === "info" && msg.txt?.es?.includes("domado"));

test("one fire, one phase: the victim list is exact, capped and never owner-halted, and mid-phase rolls add nothing", () => {
  const gm = game();
  const fire = ignite(gm);
  assert.ok(fire, "the real weekly roll ignited the fire");
  assert.deepEqual(Object.keys(fire).sort(), ["fromDay", "untilDay"], "the persisted phase is start + horizon: no hidden continuation state");
  assert.equal(fire.fromDay, FIRE_DAY);
  assert.equal(fire.untilDay, FIRE_DAY + 7, "the horizon is the scheduled end");
  assert.deepEqual(victimsOf(gm), [VICTIM_KEY], "exactly the roll's pick: one victim, not two, not three (kills cap and double-pick mutants)");
  assert.ok(!victimsOf(gm).includes("cadiz/cadiz:1"), "a building the owner halted is never a fire victim");
  assert.equal(gm.buildings.cadiz["cadiz:1"].halted, true, "the owner's own halt is untouched");
  assert.equal(gm.buildings.cadiz["cadiz:2"].halted, "incendio", "the victim carries the fire's own closure");
  calamityWeek(gm, post); // same week again
  gm.day = FIRE_DAY + 3; calamityWeek(gm, post); // mid-phase
  assert.deepEqual(victimsOf(gm), [VICTIM_KEY], "an active phase is not re-processed: no new victims, no duplicates");
  assert.equal(gm.buildings.cadiz["cadiz:3"].halted, undefined, "no bystander is touched mid-phase");
});

test("the phase survives a save/load mid-fire: the fire is alive the day before the horizon and finalizes exactly once after it", () => {
  const gm = game();
  ignite(gm);
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(gm, "Casa Oro"))), world).g;
  assert.deepEqual(restored.calamities.active.cadiz.incendio, { fromDay: FIRE_DAY, untilDay: FIRE_DAY + 7 }, "the phase and its horizon survive the wire");
  assert.deepEqual(victimsOf(restored), [VICTIM_KEY], "the affected buildings survive the wire");
  assert.equal(restored.buildings.cadiz["cadiz:2"].halted, "incendio", "the closure itself survives");
  restored.day = FIRE_DAY + 6; // the day BEFORE the horizon
  calamityWeek(restored, post);
  assert.ok(calamityActive(restored, "cadiz").includes("incendio"), "the fire still burns the day before its horizon (kills the end-one-day-early mutant)");
  assert.equal(restored.buildings.cadiz["cadiz:2"].halted, "incendio", "and its victim is still closed");
  restored.day = FIRE_DAY + 7; // the horizon arrives
  calamityWeek(restored, post);
  assert.equal(restored.buildings.cadiz["cadiz:2"].halted, undefined, "the victim reopens at the horizon, not repeated, not lost");
  assert.ok(!calamityActive(restored, "cadiz").includes("incendio"), "the event is gone");
  assert.equal(restored.calamities.fireHalted.cadiz, undefined, "the victim book is closed");
  assert.equal(endMessages(restored).length, 1, "the end is announced once");
  calamityWeek(restored, post); // the same week runs again
  assert.equal(endMessages(restored).length, 1, "finalizing is not repeated");
  assert.ok(!calamityActive(restored, "cadiz").includes("incendio"), "and no new fire appears from the re-run");
});

test("finalizing removes the urban indicator: the city panel lists no calamity once the fire is out", () => {
  const gm = game();
  ignite(gm);
  assert.match(worldSystemsHtml(gm, "cadiz", "es"), /incendio/, "the panel shows the fire while it burns");
  gm.day = FIRE_DAY + 7;
  calamityWeek(gm, post);
  assert.match(worldSystemsHtml(gm, "cadiz", "es"), /Calamidades activas: ninguna/, "the panel is clean when the fire ends");
  assert.match(worldSystemsHtml(gm, "cadiz", "en"), /Active calamities: none/);
});

test("the end reopens exactly the fire's own victims: a cash halt during the fire is not the fire's to lift", () => {
  const gm = game();
  ignite(gm);
  const victims = victimsOf(gm);
  const bystander = ["cadiz:2", "cadiz:3", "cadiz:4"].find((plotId) => !victims.includes(`cadiz/${plotId}`));
  assert.ok(bystander, "with three working buildings and one victim, two are bystanders");
  gm.buildings.cadiz[bystander].halted = true; // mid-phase: the purse fails on the bystander (accrueBuildings halt shape)
  gm.day = FIRE_DAY + 7;
  calamityWeek(gm, post);
  assert.equal(gm.buildings.cadiz["cadiz:2"].halted, undefined, "the fire's own victim reopens");
  assert.equal(gm.buildings.cadiz[bystander].halted, true, "the fire's end does not lift a halt it did not cause");
  assert.equal(gm.buildings.cadiz["cadiz:1"].halted, true, "and the owner's own halt survives too");
});
