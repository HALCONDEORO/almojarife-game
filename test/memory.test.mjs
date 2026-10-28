// Isolated pre-embargo trade-rule fixture; embargo-ON rejection is covered in pardonhost/embargo tests.
import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame, advanceDay, doBuy, doSell } from "../src/game/game.mjs";
import { memoryDeed, memoryOf, memoryRep, memoryGossipLine, memoryLine, MEMORY_GRAIN_SCARCE, MEMORY_HALFLIFE, MEMORY_REP_MAX } from "../src/game/memory.mjs";
import { scarcityOf } from "../src/game/reputation.mjs";
import { repOf } from "../src/game/rank.mjs";
import { hallView } from "../src/view/townhallview.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";
const world = loadWorld();
const inbox = (g) => g.inbox ?? g.ledger?.inbox ?? [];
const mk = (opts) => newGame(world, "cadiz", { freePlay: true, seed: 5, embargo: false, ...opts });
const starve = (g, city) => { const e = g.market[city].grain; e.stock = Math.max(1, Math.floor(e.target / 4)); }; // scarcity >= 4
test("flag off: no state, deeds are no-ops, respect untouched, tab shows nothing", () => {
  const g = mk({});
  assert.equal(g.cityMemory, undefined);
  memoryDeed(g, "cadiz", "favor", 100); memoryDeed(g, "cadiz", "grievance", 100);
  assert.equal(g.memoryDeeds, undefined);
  assert.deepEqual(memoryOf(g, "cadiz"), { favor: 0, grievance: 0, bots: 0 });
  assert.equal(memoryRep(g, "cadiz"), 0);
  assert.equal(memoryGossipLine(g, "cadiz"), null);
  assert.equal(hallView(g, "cadiz").memory, undefined);
});
test("selling grain into a starving port is remembered as a favor", () => {
  const g = mk({ cityMemory: true });
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; s.cargo = { grain: 60 };
  starve(g, "cadiz");
  assert.ok(scarcityOf(g.market.cadiz.grain) >= MEMORY_GRAIN_SCARCE);
  const r = doSell(g, s, "grain", 60);
  assert.equal(r.ok, true);
  assert.ok(memoryOf(g, "cadiz").favor > 0);
  assert.ok(memoryRep(g, "cadiz") >= 0);
});
test("buying grain out of a starving port is remembered as a grievance", () => {
  const g = mk({ cityMemory: true });
  const s = g.ships[0]; s.at = "cadiz"; s.voyage = null; g.cash = 1e6;
  starve(g, "cadiz");
  const before = g.market.cadiz.grain.stock;
  const r = doBuy(g, s, "grain", Math.min(20, before));
  assert.equal(r.ok, true);
  assert.ok(memoryOf(g, "cadiz").grievance > 0, JSON.stringify(memoryOf(g, "cadiz")));
  assert.ok(memoryRep(g, "cadiz") <= 0);
});
test("memories fade with a half-life, and the respect nudge stays bounded", () => {
  const g = mk({ cityMemory: true });
  memoryDeed(g, "cadiz", "favor", 1000);
  const now = memoryOf(g, "cadiz").favor;
  g.day += MEMORY_HALFLIFE;
  assert.ok(Math.abs(memoryOf(g, "cadiz").favor - now / 2) < 1e-6);
  memoryDeed(g, "cadiz", "favor", 1e6); // a mountain of favor still cannot buy more than the cap
  assert.ok(memoryRep(g, "cadiz") <= MEMORY_REP_MAX && memoryRep(g, "cadiz") >= -MEMORY_REP_MAX);
  assert.equal(memoryRep(g, "cadiz"), MEMORY_REP_MAX);
});
test("the rep nudge rides inside repOf, bounded, and only with the flag", () => {
  const on = mk({ cityMemory: true }), off = mk({});
  memoryDeed(on, "cadiz", "grievance", 300);
  memoryDeed(off, "cadiz", "grievance", 300); // no-op off
  assert.ok(repOf(on, "cadiz") < repOf(off, "cadiz"));
  assert.ok(repOf(on, "cadiz") - repOf(off, "cadiz") >= -MEMORY_REP_MAX);
});
test("dockside gossip: once when you arrive, then quiet for a while, in both languages", () => {
  const g = mk({ cityMemory: true });
  memoryDeed(g, "cadiz", "favor", 500);
  const line = memoryGossipLine(g, "cadiz");
  assert.ok(line && line.kind === "favor" && line.txt.es && line.txt.en);
  (g.memoryGossip ??= {}).cadiz = g.day; // caller stamps it, as game.mjs does
  assert.equal(memoryGossipLine(g, "cadiz"), null); // cooldown
  g.day += 21;
  assert.ok(memoryGossipLine(g, "cadiz"));
  const g2 = mk({ cityMemory: true }); memoryDeed(g2, "cadiz", "grievance", 500);
  assert.equal(memoryGossipLine(g2, "cadiz").kind, "grievance");
  assert.equal(memoryGossipLine(mk({ cityMemory: true }), "cadiz"), null); // nothing to tell
});
test("the Ayuntamiento tab remembers, with the flag only", () => {
  const on = mk({ cityMemory: true }); memoryDeed(on, "cadiz", "favor", 500);
  assert.ok(hallView(on, "cadiz").memory.kind === "favor" && hallView(on, "cadiz").memory.txt.es);
  assert.equal(hallView(mk({ cityMemory: true }), "cadiz").memory, undefined);
});
test("state saves and loads byte-identical, flag on and off", () => {
  for (const opts of [{}, { cityMemory: true }]) {
    const g = mk(opts); memoryDeed(g, "cadiz", "favor", 120); memoryDeed(g, "malaga", "botGrievance", 30);
    const h = deserialize(JSON.parse(JSON.stringify(serialize(g, "T", 1))), world).g;
    assert.equal(JSON.stringify(serialize(h, "T", 1)), JSON.stringify(serialize(g, "T", 1)));
    assert.deepEqual(memoryOf(h, "cadiz"), memoryOf(g, "cadiz"));
  }
});
test("an off game plays byte-identical to before the feature (golden parity)", () => {
  const play = (opts) => { const g = mk(opts); for (let i = 0; i < 40 && !g.over; i++) advanceDay(g); return g; };
  const a = play({}), b = play({});
  assert.equal(JSON.stringify(serialize(a, "T", 1)), JSON.stringify(serialize(b, "T", 1))); // deterministic
  const on = play({ cityMemory: true }); // on: only memory keys may differ from off
  const strip = (g) => { const s = JSON.parse(JSON.stringify(serialize(g, "T", 1))).state; delete s.cityMemory; delete s.memoryDeeds; delete s.memoryGossip; return s; };
  assert.deepEqual(strip(on), strip(a));
});
test("bot deeds fade like yours and surface as the ambient Ayuntamiento line", () => {
  const g = mk({ cityMemory: true });
  memoryDeed(g, "cadiz", "botGrievance", 120);
  const now = memoryOf(g, "cadiz").bots;
  assert.ok(now > 0);
  for (let i = 0; i < MEMORY_HALFLIFE; i++) advanceDay(g);
  assert.ok(Math.abs(memoryOf(g, "cadiz").bots - now / 2) < 1e-6); // same halflife as favor and grievance
  // a city that remembers only the foreign merchants says so
  const h = mk({ cityMemory: true });
  memoryDeed(h, "cadiz", "botGrievance", 500);
  const line = memoryLine(h, "cadiz");
  assert.equal(line.kind, "bots");
  assert.ok(line.txt.es.includes("mercaderes") && line.txt.en.includes("merchants"));
  // your own record, when strong, speaks first
  memoryDeed(h, "cadiz", "favor", 5000);
  assert.equal(memoryLine(h, "cadiz").kind, "favor");
  // and the ambient line rides into the Ayuntamiento view
  assert.equal(hallView(h, "cadiz").memory.kind, "favor");
  const b = mk({ cityMemory: true });
  memoryDeed(b, "cadiz", "botGrievance", 500);
  assert.equal(hallView(b, "cadiz").memory.kind, "bots");
});

test("an old save with botGrievance as a single number does not break new deeds", () => {
  const world = loadWorld();
  const g = newGame(world, "cadiz", { freePlay: true, seed: 5, cityMemory: true });
  g.memoryDeeds = { cadiz: { favor: [], grievance: [], botGrievance: 7 } };
  memoryDeed(g, "cadiz", "botGrievance", 30);
  memoryDeed(g, "cadiz", "favor", 20);
  assert.ok(memoryOf(g, "cadiz").bots > 0);
  assert.ok(memoryOf(g, "cadiz").favor > 0);
  g.memoryDeeds = { cadiz: {} };
  memoryDeed(g, "cadiz", "grievance", 10);
  assert.ok(memoryOf(g, "cadiz").grievance > 0);
});
