import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/sim/rng.mjs";
import { newPersona, makeHeir, inherit, passStanding, canSucceed, retireYear, ageAt, MAX_GENERATIONS } from "../src/game/succession.mjs";

test("heir is deterministic for a seed and keeps at most 2 distinct traits", () => {
  const p = newPersona(1460, 1, ["bold"]);
  const a = makeHeir(p, 1500, makeRng(7)), b = makeHeir(p, 1500, makeRng(7));
  assert.deepEqual(a, b);
  assert.equal(a.generation, 2);
  assert.equal(a.traits.length, 2);
  assert.equal(new Set(a.traits).size, 2);
  assert.ok(a.traits.includes("bold"));
  assert.equal(ageAt(a, 1500), 20);
});
test("a founder without traits gets one", () => {
  assert.equal(makeHeir(newPersona(1460), 1500, makeRng(1)).traits.length, 1);
});
test("no heir after the last generation", () => {
  let p = newPersona(1460);
  for (let i = 1; i < MAX_GENERATIONS; i++) p = makeHeir(p, 1500 + 40 * i, makeRng(i));
  assert.equal(p.generation, MAX_GENERATIONS);
  assert.equal(canSucceed(p), false);
  assert.equal(makeHeir(p, 1600, makeRng(1)), null);
});
test("inheritance never creates money and the loss is accounted", () => {
  for (const e of [0, 1, 9, 10, 999, 123456]) { const r = inherit(e); assert.equal(r.kept + r.lost, e); assert.ok(r.kept <= e && r.kept >= 0); }
  assert.throws(() => inherit(-1)); assert.throws(() => inherit(NaN));
});
test("standing passes with a cut and never rises", () => {
  for (const v of [0, 1, 5, 100]) assert.ok(passStanding(v) <= v);
  assert.equal(passStanding(100), 50);
});
test("retirement year is fixed from birth", () => assert.equal(retireYear(newPersona(1460)), 1520));
