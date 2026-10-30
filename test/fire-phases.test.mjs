// Fire as a phase event (Estudios 6, Marco 30/10): our incendio is a phased calamity with its own
// persisted book - start day, horizon day (untilDay) and the exact victims it halted. These tests
// pin, through the real weekly roll (seed 2 ignites cadiz in week 3): no building is processed
// twice inside a phase, the phase change survives a save/load, and finalizing removes the event,
// its victims' closure and its urban indicator - exactly once. Our own design has no continuation
// counter: the horizon IS the scheduled next instant, and that is pinned as-is.
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
const game = () => {
  const gm = newGame(world, "cadiz", { freePlay: true, seed: 2, citylife: true, plague: true, calamities: true });
  gm.buildings = { cadiz: {
    "cadiz:1": { type: "workshop", level: 1, state: "active" },
    "cadiz:2": { type: "brewery", level: 1, state: "active" },
    "cadiz:3": { type: "warehouse", level: 1, state: "active" },
    "cadiz:4": { type: "posito", level: 1, state: "active", halted: true }, // the owner halted this one himself
  } };
  return gm;
};
const ignite = (gm) => { gm.day = FIRE_DAY; calamityWeek(gm, post); return gm.calamities.active.cadiz.incendio; };
const victimsOf = (gm) => gm.calamities.fireHalted.cadiz ?? [];
const endMessages = (gm) => (gm.inbox ?? []).filter((msg) => msg.kind === "info" && msg.txt?.es?.includes("domado"));

test("one fire, one phase: victims are unique, capped at two and never owner-halted, and mid-phase rolls add nothing", () => {
  const gm = game();
  const fire = ignite(gm);
  assert.ok(fire, "the real weekly roll ignited the fire");
  assert.deepEqual(Object.keys(fire).sort(), ["fromDay", "untilDay"], "the persisted phase is start + horizon: no hidden continuation state");
  assert.equal(fire.fromDay, FIRE_DAY);
  assert.equal(fire.untilDay, FIRE_DAY + 7, "the horizon is the scheduled end");
  const victims = victimsOf(gm);
  assert.ok(victims.length >= 1 && victims.length <= 2, "the fire halts at least one and at most two buildings");
  assert.equal(new Set(victims).size, victims.length, "no building processed twice in the same phase");
  assert.ok(!victims.includes("cadiz/4"), "a building the owner halted is never a fire victim");
  for (const key of victims) {
    const plotId = key.split("/")[1];
    assert.equal(gm.buildings.cadiz[plotId].halted, "incendio", "each listed victim carries the fire's own closure");
  }
  const snapshot = [...victims];
  calamityWeek(gm, post); // same week again
  gm.day = FIRE_DAY + 3; calamityWeek(gm, post); // mid-phase
  assert.deepEqual(victimsOf(gm), snapshot, "an active phase is not re-processed: no new victims, no duplicates");
});

test("the phase survives a save/load mid-fire: horizon and victims intact, and the reloaded game finalizes exactly once", () => {
  const gm = game();
  ignite(gm);
  const victims = [...victimsOf(gm)];
  const restored = deserialize(JSON.parse(JSON.stringify(serialize(gm, "Casa Oro"))), world).g;
  assert.deepEqual(restored.calamities.active.cadiz.incendio, { fromDay: FIRE_DAY, untilDay: FIRE_DAY + 7 }, "the phase and its horizon survive the wire");
  assert.deepEqual(victimsOf(restored), victims, "the affected buildings survive the wire");
  for (const key of victims) assert.equal(restored.buildings.cadiz[key.split("/")[1]].halted, "incendio", "the closure itself survives");
  restored.day = FIRE_DAY + 7; // the horizon arrives
  calamityWeek(restored, post);
  for (const key of victims) assert.equal(restored.buildings.cadiz[key.split("/")[1]].halted, undefined, "each victim reopens at the horizon, none repeated, none lost");
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
  const bystander = ["cadiz:1", "cadiz:2", "cadiz:3"].find((plotId) => !victims.includes(`cadiz/${plotId.split(":")[1]}`));
  assert.ok(bystander, "with three working buildings and at most two victims, one is a bystander");
  gm.buildings.cadiz[bystander].halted = true; // mid-phase: the purse fails on the bystander (accrueBuildings halt shape)
  gm.day = FIRE_DAY + 7;
  calamityWeek(gm, post);
  assert.equal(gm.buildings.cadiz[bystander].halted, true, "the fire's end does not lift a halt it did not cause");
  assert.equal(gm.buildings.cadiz["cadiz:4"].halted, true, "and the owner's own halt survives too");
});
