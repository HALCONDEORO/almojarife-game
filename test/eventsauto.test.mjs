import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSail, advanceDay } from "../src/game/game.mjs";
import { autoChoice, rollEvent } from "../src/game/events.mjs";
const world = loadWorld(), ev = (id) => world.events.find((e) => e.id === id);
test("only risk-free events are auto-resolved, with the best choice", () => {
  assert.equal(autoChoice(ev("drifting_cargo")), "salvage");
  for (const id of ["storm", "pirates"]) assert.equal(autoChoice(ev(id)), null, id);
});
test("a purely favourable event does not pause the game and leaves a message", () => {
  const g = newGame(world, "cadiz", { events: true }); g.seed = 1; g.day = 20;
  g.world = { ...g.world, events: [ev("drifting_cargo")] };
  doBuy(g, g.ships[0], "salt", 20); doSail(g, g.ships[0], "lisboa");
  let got = false;
  for (let s = 0; s < 300 && !got; s++) { g.seed = s; g.pending = null; const cash = g.cash, n = (g.inbox ?? []).length; for (let d = 0; d < 6 && !got; d++) { rollEvent(g); assert.equal(g.pending, null); if (g.cash > cash) got = true; g.day++; } if (got) assert.ok(g.inbox.length > n && g.inbox[0].kind === "event"); }
  assert.ok(got, "an event fired and paid out");
});
