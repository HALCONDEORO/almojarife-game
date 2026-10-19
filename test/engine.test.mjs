import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/sim/rng.mjs";
import { loadWorld } from "../src/sim/world.mjs";
import { makeMarket, tickMarket } from "../src/sim/market.mjs";
import { makeSave, serialize, deserialize, SAVE_VERSION, MIGRATIONS } from "../src/sim/save.mjs";
const world = loadWorld();

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
test("migration corpus: an older save is upgraded in order", () => {
  MIGRATIONS[0] = (s) => ({ ...s, version: 1, player: {} });
  try {
    const old = { version: 0, seed: 1, rngState: 5, day: 2, market: {} };
    const up = deserialize(JSON.stringify(old));
    assert.equal(up.version, SAVE_VERSION);
    assert.deepEqual(up.player, {});
  } finally { delete MIGRATIONS[0]; }
  assert.throws(() => deserialize(JSON.stringify({ version: 0, seed: 1, rngState: 5, day: 2, market: {} })), /no migration/);
});
