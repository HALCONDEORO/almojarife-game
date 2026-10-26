import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSail, waitUntilArrival } from "../src/game/game.mjs";
import { validateEvents, rollEvent, resolveEvent, pendingEvent } from "../src/game/events.mjs";
const world = loadWorld();
const sailing = (seed = 0) => { const g = newGame(world, "cadiz", { events: true }); g.seed = seed; g.day = 20; doBuy(g, g.ships[0], "salt", 20); doSail(g, g.ships[0], "lisboa"); return g; };
test("the shipped events are valid and every one has ES and EN text", () => assert.deepEqual(validateEvents(world.events), []));
test("the validator catches bad chances, unknown effects and missing languages", () => {
  const bad = structuredClone(world.events);
  bad[0].choices[1].outcomes[0].p = 0.9;
  bad[1].choices[0].outcomes[0].effects = { teleport: 1 };
  delete bad[2].title.en;
  const errs = validateEvents(bad);
  assert.ok(errs.some((e) => e.includes("add up to 1")) && errs.some((e) => e.includes("unknown effect")) && errs.some((e) => e.includes('missing "en"')));
});
test("events happen at sea at a sensible rate, never in port", () => {
  let hits = 0, days = 0;
  for (let seed = 0; seed < 60; seed++) { const g = sailing(seed); const fired = () => g.pending || (g.inbox ?? []).some((m) => m.kind === "event"); for (let i = 0; i < 6; i++) { if (fired()) break; days++; advanceDay(g); } if (fired()) hits++; }
  assert.ok(hits > 3 && hits < days * 0.3, `hits ${hits} in ${days} days`);
  const g = newGame(world, "cadiz", { events: true }); g.day = 30; for (let i = 0; i < 100; i++) advanceDay(g);
  assert.equal(g.pending, null);
});
test("a pending event stops the clock until the player chooses", () => {
  const g = sailing(1); g.pending = { event: "storm", ship: 1, day: g.day }; // fair wind and drifting cargo resolve on their own; a risky event pauses
  assert.ok(g.pending);
  const day = g.day; advanceDay(g); waitUntilArrival(g, g.ships[0]);
  assert.equal(g.day, day);
  const pe = pendingEvent(g); assert.ok(pe.choices.length >= 1);
  const r = resolveEvent(g, pe.choices[0].id);
  assert.ok(r.ok && r.text.es && r.text.en); assert.equal(g.pending, null);
  const t0 = g.tick; advanceDay(g); assert.ok(g.tick > t0, "the clock runs again after the choice");
});
test("outcomes are deterministic for the same game, and effects stay in bounds", () => {
  const run = () => { const g = sailing(3); g.pending = { event: "pirates", ship: 1, day: g.day }; const before = g.ships[0].cargo.salt; const r = resolveEvent(g, "fight"); return { r, left: g.ships[0].cargo.salt ?? 0, before, cash: g.cash }; };
  const a = run(), b = run();
  assert.deepEqual(a, b);
  assert.ok(a.left >= 0 && a.left <= a.before && a.cash >= 0);
});
test("cargo loss keeps the cost basis in step and an empty hold is not an error", () => {
  const g = sailing(1); g.pending = { event: "storm", ship: 1, day: g.day };
  const s = g.ships[0]; const per = s.basis.salt / s.cargo.salt;
  g.world.events = structuredClone(world.events); g.world.events.find((e) => e.id === "storm").choices[1].outcomes = [{ p: 1, effects: { cargoLossPct: 50 }, text: { es: "x", en: "x" } }];
  resolveEvent(g, "press");
  assert.equal(s.cargo.salt, 10); assert.ok(Math.abs(s.basis.salt - per * 10) < 1);
  const g2 = newGame(world); g2.ships[0].voyage = { from: "cadiz", to: "lisboa", ticksLeft: 720, totalTicks: 960, path: ["cadiz", "lisboa"], km: 100 }; g2.pending = { event: "storm", ship: 1, day: 0 };
  assert.ok(resolveEvent(g2, "shelter").ok); assert.equal(g2.ships[0].voyage.ticksLeft, 960);
});
test("an unknown choice or no event is refused and changes nothing", () => {
  const g = sailing(0); assert.equal(resolveEvent(g, "x").ok, false);
  g.pending = { event: "storm", ship: 1, day: 1 }; assert.equal(resolveEvent(g, "nope").ok, false); assert.ok(g.pending);
});
test("games started without events, and old saves, never get one", () => {
  const g = newGame(world); g.day = 20; doBuy(g, g.ships[0], "salt", 20); doSail(g, g.ships[0], "lisboa");
  for (let i = 0; i < 50 && g.ships[0].voyage; i++) advanceDay(g);
  assert.equal(g.pending, null);
});
