import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, doBuy, doSail, doGoTo } from "../src/game/game.mjs";
import { BOYCOTT, BLOCKADE, measureOf, boycottOn, blockadeOn, entryBan } from "../src/game/portmeasures.mjs";
import { embargoOn } from "../src/game/embargo.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const mk = () => { const g = newGame(world); g.eventsOn = false; const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; return { g, s }; };
test("no measures: the harbour is open both ways (no navigation blocking exists by default)", () => {
  const { g, s } = mk();
  assert.equal(measureOf(g, "sevilla"), null); assert.equal(entryBan(g, "sevilla"), null);
  assert.equal(doSail(g, s, "sevilla").ok, true);
  s.at = "sevilla"; s.voyage = null; assert.equal(doSail(g, s, "cadiz").ok, true);
});
test("boycott: the harbour refuses new arrivals but lets its own ships leave and trade", () => {
  const { g, s } = mk(); g.measures = { sevilla: BOYCOTT };
  assert.equal(boycottOn(g, "sevilla"), true); assert.equal(blockadeOn(g, "sevilla"), false);
  const arrival = doSail(g, s, "sevilla"); assert.equal(arrival.ok, false); assert.equal(arrival.reason, "boycott"); assert.equal(s.voyage, null);
  s.at = "sevilla"; // already inside when the boycott was declared: not trapped
  assert.equal(doSail(g, s, "cadiz").ok, true);
  const trader = mk(); trader.g.measures = { cadiz: BOYCOTT }; assert.equal(doBuy(trader.g, trader.s, "grain", 1).ok, true); // a boycott does not close the market
});
test("blockade: the harbour is sealed both ways and holds the ships inside", () => {
  const { g, s } = mk(); g.measures = { malaga: BLOCKADE };
  assert.equal(blockadeOn(g, "malaga"), true); assert.equal(entryBan(g, "malaga"), "blockade");
  const arrival = doSail(g, s, "malaga"); assert.equal(arrival.ok, false); assert.equal(arrival.reason, "blockade");
  s.at = "malaga"; const out = doSail(g, s, "cadiz"); assert.equal(out.ok, false); assert.equal(out.reason, "blockade"); // trapped
  g.freeNav = true; const go = doGoTo(g, s, world.nodes.cadiz.lat, world.nodes.cadiz.lon); assert.equal(go.ok, false); assert.equal(go.reason, "blockade"); // free navigation cannot slip out either
  const unaffected = mk(); assert.equal(doSail(unaffected.g, unaffected.s, "malaga").ok, true); // a measure on one port never closes another
});
test("a course change at sea into a closed harbour is refused and the reason stays on the ship", () => {
  const { g, s } = mk(); g.freeNav = true;
  assert.equal(doSail(g, s, "lisboa").ok, true); // at sea now, before the measure exists
  g.measures = { lisboa: BOYCOTT };
  const go = doGoTo(g, s, world.nodes.lisboa.lat, world.nodes.lisboa.lon);
  assert.equal(go.ok, false); assert.equal(go.reason, "boycott"); assert.equal(s.navError, "boycott");
  assert.equal(s.voyage.to, "lisboa"); // the old leg still stands: nothing rewrites a voyage silently
});
test("the grain embargo stays a trade refusal, not a harbour ban: separate permissions, not one hostility flag", () => {
  const { g, s } = mk(); const e = g.market.cadiz.grain; e.target = 100; e.stock = 10;
  assert.equal(embargoOn(g, "cadiz"), true); assert.equal(entryBan(g, "cadiz"), null); // embargoed, harbour open
  assert.equal(doSail(g, s, "sevilla").ok, true); s.at = "cadiz"; s.voyage = null;
  g.measures = { cadiz: BLOCKADE };
  assert.equal(embargoOn(g, "cadiz"), true); assert.equal(doSail(g, s, "sevilla").reason, "blockade"); // both at once, each on its own rule
  const trader = mk(); trader.g.measures = { cadiz: BOYCOTT }; assert.equal(embargoOn(trader.g, "cadiz"), false); // a boycott never starves the market by itself
});
test("measures survive a save and reload", () => {
  const { g, s } = mk(); g.measures = { sevilla: BOYCOTT, malaga: BLOCKADE };
  const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T"))), world).g;
  assert.equal(measureOf(h, "sevilla"), "boycott"); assert.equal(measureOf(h, "malaga"), "blockade");
  const hs = h.ships[0]; hs.at = "malaga"; hs.voyage = null;
  assert.equal(doSail(h, hs, "cadiz").reason, "blockade");
  assert.equal(doSail(h, { ...hs, at: "cadiz" }, "sevilla").reason, "boycott");
});
