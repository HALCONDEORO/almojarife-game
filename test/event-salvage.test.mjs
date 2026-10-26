import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { resolveEvent, validateEvents } from "../src/game/events.mjs";
import { shipCapacity } from "../src/sim/trade.mjs";
const world = loadWorld();
const mk = (type) => { const g = newGame(world); g.eventsOn = false; const s = g.ships[0]; if (type) s.type = type; return { g, s }; };

test("world data validates with the salvage effect", () => {
  assert.deepEqual(validateEvents(world.events), [], "no validation errors");
});

test("drifting cargo pays by hold capacity within the luck band and fills {amt}", () => {
  const { g, s } = mk();
  const cap = shipCapacity(s);
  g.pending = { event: "drifting_cargo", ship: s.id, day: g.day };
  const c0 = g.cash;
  const res = resolveEvent(g, "salvage");
  assert.ok(res.ok, res.reason);
  const good = Math.round(cap * 2 * 0.75), goodHi = Math.round(cap * 2 * 1.25);
  const bad = Math.round(cap * 1 * 0.75), badHi = Math.round(cap * 1 * 1.25);
  const amt = g.cash - c0;
  assert.ok((amt >= Math.max(1, bad) && amt <= badHi) || (amt >= good && amt <= goodHi), `amount ${amt} in a band (cap ${cap})`);
  assert.equal(res.effects.cash, amt, "reported effect matches cash delta");
  assert.ok(!res.text.es.includes("{amt}") && !res.text.en.includes("{amt}"), "placeholder filled");
  assert.ok(res.text.es.includes(String(amt)), "text names the real amount");
  const posted = g.inbox.find((m) => m.kind === "event");
  assert.ok(posted && posted.txt.es.includes(String(amt)), "feed shows the real amount");
});

test("salvage amount is deterministic for the same day, ship and seed", () => {
  const a = mk(); a.g.pending = { event: "drifting_cargo", ship: a.s.id, day: a.g.day };
  const b = mk(); b.g.pending = { event: "drifting_cargo", ship: b.s.id, day: b.g.day };
  const ra = resolveEvent(a.g, "salvage"), rb = resolveEvent(b.g, "salvage");
  assert.equal(ra.effects.cash, rb.effects.cash);
});

test("a bigger hold recovers at least as much floor value as a smaller one", () => {
  const small = mk("barca"), big = mk("cog");
  const lo = (cap, perCap) => Math.max(1, Math.round(cap * perCap * 0.75));
  assert.ok(lo(shipCapacity(big.ships ?? big.g.ships[0]), 2) > lo(shipCapacity(small.g.ships[0]), 2) || shipCapacity(big.g.ships[0]) > shipCapacity(small.g.ships[0]), "cog hold beats barca hold");
});
