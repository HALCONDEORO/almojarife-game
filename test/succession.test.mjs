import test from "node:test";
import assert from "node:assert/strict";
import { makeRng } from "../src/sim/rng.mjs";
import { newPersona, makeHeir, inherit, passPrestige, passReputation, canSucceed, retireYear, ageAt, MAX_GENERATIONS } from "../src/game/succession.mjs";

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
test("inheritance in cents never creates money and never goes negative", () => {
  for (const e of [0, 1, 25, 99, 101, 999, 12345600]) { const r = inherit(e); assert.equal(r.keptCents + r.lostCents, e); assert.ok(r.keptCents >= 0 && r.lostCents >= 0 && r.lostCents <= e); }
  assert.deepEqual(inherit(25), { keptCents: 22, lostCents: 3 });
  assert.deepEqual(inherit(1), { keptCents: 0, lostCents: 1 });
  for (const bad of [-1, 0.25, NaN, Infinity, 2 ** 53]) assert.throws(() => inherit(bad));
});
test("prestige is non-negative and passes with a cut", () => {
  for (const v of [0, 1, 5, 100]) assert.ok(passPrestige(v) <= v && passPrestige(v) >= 0);
  assert.equal(passPrestige(100), 50);
  assert.throws(() => passPrestige(-1));
});
test("signed reputation: good name is cut, bad name is kept", () => {
  assert.equal(passReputation(100), 50);
  assert.equal(passReputation(-40), -40);
  assert.equal(passReputation(-0.5), -0);
  assert.throws(() => passReputation(NaN));
});
test("retirement year is fixed from birth", () => assert.equal(retireYear(newPersona(1460)), 1520));
