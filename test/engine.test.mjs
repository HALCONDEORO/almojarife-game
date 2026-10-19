import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/sim/rng.mjs";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket } from "../src/sim/market.mjs";
import { makeSave, serialize, deserialize, loadGame, SAVE_VERSION } from "../src/sim/save.mjs";
const world = loadWorld();
const KNOWN42 = [601103752, 448290559, 852465793];

test("same seed gives the same sequence; different seed differs", () => {
  const a = makeRng(42), b = makeRng(42), c = makeRng(43);
  const sa = Array.from({ length: 50 }, () => a.next());
  assert.deepEqual(sa, Array.from({ length: 50 }, () => b.next()));
  assert.notDeepEqual(sa, Array.from({ length: 50 }, () => c.next()));
  assert.ok(sa.every((x) => x >= 0 && x < 1));
});
test("rng state can be saved and restored mid-sequence", () => {
  const a = makeRng(7);
  for (let i = 0; i < 10; i++) a.next();
  const st = a.getState();
  const expected = Array.from({ length: 5 }, () => a.next());
  const b = makeRng(1); b.setState(st);
  assert.deepEqual(Array.from({ length: 5 }, () => b.next()), expected);
});
function run(seed, days) {
  const rng = makeRng(seed), m = makeMarket(world, rng);
  for (let d = 0; d < days; d++) tickMarket(m);
  return { seed, rngState: rng.getState(), day: days, market: m };
}
test("same seed and days give an identical world state", () => {
  assert.equal(serialize(makeSave(run(5, 100))), serialize(makeSave(run(5, 100))));
});
test("save then load gives the same state, and continuing matches an uninterrupted run", () => {
  const full = run(9, 200);
  const half = run(9, 100);
  const loaded = deserialize(serialize(makeSave(half)));
  assert.equal(loaded.version, SAVE_VERSION);
  for (let d = loaded.day; d < 200; d++) tickMarket(loaded.market);
  assert.deepEqual(loaded.market, full.market);
});
test("bad saves are rejected with a clear error", () => {
  assert.throws(() => deserialize("{nope"), /not valid JSON/);
  assert.throws(() => deserialize("{}"), /missing version/);
  assert.throws(() => deserialize(JSON.stringify({ version: SAVE_VERSION + 1 })), /newer than this game/);
  const ok = makeSave(run(1, 3));
  assert.throws(() => deserialize(JSON.stringify({ ...ok, day: -1 })), /bad day/);
  const bad = structuredClone(ok); const c = Object.keys(bad.market)[0]; const g = Object.keys(bad.market[c])[0];
  bad.market[c][g].stock = -5;
  assert.throws(() => deserialize(JSON.stringify(bad)), /bad stock/);
});

test("known answer: mulberry32 seed 42 never changes (saves depend on it)", () => {
  const r = makeRng(42);
  assert.deepEqual(Array.from({ length: 3 }, () => Math.round(r.next() * 1e9)), KNOWN42);
});
test("int and pick stay in bounds and reject bad input", () => {
  const r = makeRng(3);
  for (let i = 0; i < 500; i++) { const n = r.int(2, 5); assert.ok(n >= 2 && n <= 5 && Number.isInteger(n)); }
  assert.ok(["a", "b"].includes(r.pick(["a", "b"])));
  assert.throws(() => r.int(5, 2), RangeError);
  assert.throws(() => r.pick([]), RangeError);
});
test("save is plain data and a copy: ticking after saving does not change it", () => {
  const st = run(4, 10), save = makeSave(st);
  assert.deepEqual(JSON.parse(serialize(save)), save);
  const before = serialize(save);
  tickMarket(st.market);
  assert.equal(serialize(save), before);
});
test("malformed saves give clear errors, not TypeErrors", () => {
  const ok = makeSave(run(1, 2)); const c = Object.keys(ok.market)[0]; const g = Object.keys(ok.market[c])[0];
  const mut = (f) => { const x = structuredClone(ok); f(x); return JSON.stringify(x); };
  assert.throws(() => deserialize(mut((x) => { x.market[c] = null; })), /bad market entry/);
  assert.throws(() => deserialize(mut((x) => { x.market[c][g] = null; })), /bad stock/);
  assert.throws(() => deserialize(mut((x) => { x.market = []; })), /bad market/);
  assert.throws(() => deserialize(mut((x) => { x.rngState = -1; })), /bad rngState/);
  assert.throws(() => deserialize(mut((x) => { x.rngState = 2 ** 32; })), /bad rngState/);
  assert.throws(() => deserialize(mut((x) => { x.player = []; })), /bad player/);
});
test("migrations chain in order and a bad migration is rejected", () => {
  const m = { 0: (s) => ({ ...s, version: 1, player: {} }), 1: (s) => ({ ...s, version: 2, extra: true }) };
  const old = JSON.stringify({ version: 0, seed: 1, rngState: 5, day: 2, market: {} });
  const up = deserialize(old, { migrations: m, version: 2 });
  assert.equal(up.version, 2); assert.equal(up.extra, true);
  assert.throws(() => deserialize(old, { migrations: { 0: (s) => s }, version: 1 }), /must return version 1/);
  assert.throws(() => deserialize(old, { migrations: {}, version: 1 }), /no migration/);
});
test("loadGame restores the RNG so a resumed run matches an uninterrupted one", () => {
  const a = makeRng(11); for (let i = 0; i < 17; i++) a.next();
  const expected = Array.from({ length: 5 }, () => a.next());
  const b = makeRng(11); for (let i = 0; i < 17; i++) b.next();
  const g = loadGame(serialize(makeSave({ seed: 11, rngState: b.getState(), day: 17, market: {} })), makeRng);
  assert.deepEqual(Array.from({ length: 5 }, () => g.rng.next()), expected);
});
