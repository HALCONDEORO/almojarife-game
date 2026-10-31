import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceTick } from "../src/game/game.mjs";
import { automaticEncounter, resolvePirates } from "../src/game/encounterdaily.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const world = loadWorld();

// A ship mid-voyage using the current default combat rules.
const seafarer = () => {
  const game = newGame(world);
  game.noGoal = true;
  game.eventsOn = true; // encounters only roll with events on
  const ship = game.ships[0];
  ship.voyage = { from: "cadiz", to: "porto", ticksLeft: 500, totalTicks: 500, km: 100, path: [] }; // the full voyage shape: a save round-trip validates every field
  return { game, ship };
};
// Walk the deterministic tick stream until the seeded roll produces a pirates decision.
const sailIntoPirates = (game, ship) => {
  for (let ticks = 0; ticks < 400000; ticks++) {
    game.tick = ticks;
    const prepared = automaticEncounter(game, ship, world);
    if (game.pending) return { prepared, tick: ticks };
    assert.equal(prepared, null, "a storm would have applied directly; this stream is walked for pirates");
  }
  return assert.fail("no pirates in 400000 ticks");
};

test("prepared, queued and active are different states: the decision waits, the voyage does not change", () => {
  const { game, ship } = seafarer();
  sailIntoPirates(game, ship);
  const pending = game.pending;
  assert.equal(pending.event, "sea-pirates");
  assert.equal(pending.ship, ship.id, "the queued decision is bound to its ship");
  assert.equal((game.encounters ?? []).length, 0, "nothing is an outcome yet");
  assert.equal(game.encounterReport ?? null, null, "no active report while the decision waits");
  assert.equal(ship.voyage.ticksLeft, 500, "preparing changed nothing about the voyage");
});

test("a preparer called again on an already-queued tick returns null and keeps the decision", () => {
  const { game, ship } = seafarer();
  const { tick } = sailIntoPirates(game, ship);
  const before = JSON.parse(JSON.stringify(game.pending));
  game.tick = tick;
  assert.equal(automaticEncounter(game, ship, world), null, "the queued decision blocks new preparations");
  assert.deepEqual(game.pending, before, "the original decision stands");
});

test("a tick can never be rerolled, even when the roll produced nothing", () => {
  const { game, ship } = seafarer();
  game.tick = 7;
  const first = automaticEncounter(game, ship, world);
  assert.equal(first, null, "this deterministic tick has no encounter");
  assert.equal(game.encounterTicks[String(ship.id)], 7, "even an empty roll records the tick");
  const before = JSON.stringify(game);
  const second = automaticEncounter(game, ship, world);
  assert.equal(second, null, "the version mark is written before the roll");
  assert.equal(JSON.stringify(game), before, "a repeated empty tick writes nothing");
  const loaded = deserialize(serialize(game, "T"), world).g;
  const saved = JSON.stringify(loaded);
  assert.equal(automaticEncounter(loaded, loaded.ships[0], world), null);
  assert.equal(JSON.stringify(loaded), saved, "the empty-roll version mark survives reload");
});

test("a bad choice is rejected and the decision stays queued; resolving activates exactly one report", () => {
  const { game, ship } = seafarer();
  sailIntoPirates(game, ship);
  assert.equal(resolvePirates(game, "negotiate").ok, false, "not a choice");
  assert.ok(game.pending, "the decision survives a bad choice");
  const report = resolvePirates(game, "flee");
  assert.ok(report.id, "the stored report keeps the tick identity");
  assert.equal(game.pending, null, "the queue is consumed");
  assert.equal(game.encounterReport, report, "one active report");
  assert.equal(game.encounters[0], report, "and it heads the encounter history");
  assert.equal(resolvePirates(game, "flee").ok, false, "a consumed decision cannot be resolved twice");
});

test("the seeded outcome is reproducible: same seed, tick and ship, same report", () => {
  const first = seafarer();
  const found = sailIntoPirates(first.game, first.ship);
  const report1 = resolvePirates(first.game, "flee");
  const second = seafarer();
  second.game.tick = found.tick;
  automaticEncounter(second.game, second.ship, world);
  const report2 = resolvePirates(second.game, "flee");
  assert.equal(report1.result, report2.result);
  assert.equal(report1.id, report2.id);
});

test("a queued decision survives a save/load and resolves against the reloaded ship", () => {
  const { game, ship } = seafarer();
  sailIntoPirates(game, ship);
  const loaded = deserialize(serialize(game, "T"), world).g;
  assert.ok(loaded.pending, "the queue rides the save");
  const report = resolvePirates(loaded, "fight");
  assert.ok(report.id);
  assert.equal(loaded.pending, null);
  assert.equal(loaded.encounterReport.ship, ship.id, "the binding still names the same ship");
});

test("a decision whose ship is no longer sailable is rejected at resolve, never silently reused", () => {
  const { game, ship } = seafarer();
  sailIntoPirates(game, ship);
  delete ship.voyage; // the ship somehow stopped sailing while the decision waited
  assert.equal(resolvePirates(game, "fight").ok, false, "stale binding rejected");
});


test("the real tick loop pauses for both the queued choice and the open final report", () => {
  const { game, ship } = seafarer();
  sailIntoPirates(game, ship);
  const queued = JSON.stringify(game);
  advanceTick(game);
  assert.equal(JSON.stringify(game), queued, "a queued choice pauses the whole tick");
  resolvePirates(game, "flee");
  const active = JSON.stringify(game);
  advanceTick(game);
  assert.equal(JSON.stringify(game), active, "an open final report also pauses the tick");
  const loaded = deserialize(serialize(game, "T"), world).g;
  const saved = JSON.stringify(loaded);
  assert.equal(resolvePirates(loaded, "flee").ok, false);
  assert.equal(JSON.stringify(loaded), saved, "a saved final report cannot be applied twice");
});
