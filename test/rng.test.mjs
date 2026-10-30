import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/sim/rng.mjs';

// Golden values for mulberry32 with seed 1. The RNG state lives in save games,
// so the sequence must stay stable across releases; if these numbers change,
// old saves resume a different stream.
const GOLDEN_SEED_1 = [0.6270739405881613, 0.002735721180215478, 0.5274470399599522];

test('same seed reproduces the exact golden sequence', () => {
  const rng = makeRng(1);
  assert.deepEqual([rng.next(), rng.next(), rng.next()], GOLDEN_SEED_1);
});

test('different seeds produce different streams', () => {
  const a = makeRng(1), b = makeRng(2);
  const seqA = Array.from({ length: 8 }, () => a.next());
  const seqB = Array.from({ length: 8 }, () => b.next());
  assert.notDeepEqual(seqA, seqB);
});

test('next() stays within [0, 1)', () => {
  const rng = makeRng(42);
  for (let i = 0; i < 10000; i++) {
    const v = rng.next();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('int() returns inclusive integer bounds', () => {
  const rng = makeRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = rng.int(3, 9);
    assert.ok(Number.isInteger(v) && v >= 3 && v <= 9, `out of bounds: ${v}`);
  }
  assert.equal(rng.int(5, 5), 5, 'degenerate range returns the only value');
});

test('int() rejects invalid arguments', () => {
  const rng = makeRng(1);
  assert.throws(() => rng.int(9, 3), RangeError);
  assert.throws(() => rng.int(1.5, 3), RangeError);
  assert.throws(() => rng.int(1, Number.NaN), RangeError);
});

test('pick() only returns array elements and rejects bad input', () => {
  const rng = makeRng(11);
  const items = ['a', 'b', 'c'];
  for (let i = 0; i < 100; i++) assert.ok(items.includes(rng.pick(items)));
  assert.throws(() => rng.pick([]), RangeError);
  assert.throws(() => rng.pick('abc'), RangeError);
});

test('getState/setState resume the stream exactly', () => {
  const rng = makeRng(123);
  rng.next(); rng.next();
  const state = rng.getState();
  const expected = [rng.next(), rng.next(), rng.next()];
  const restored = makeRng(999);
  restored.setState(state);
  assert.deepEqual([restored.next(), restored.next(), restored.next()], expected);
});

test('setState coerces to uint32 like the constructor', () => {
  const rng = makeRng(1);
  rng.setState(-1);
  assert.equal(rng.getState(), 0xffffffff, 'setState(-1) stores uint32');
  const seeded = makeRng(0xffffffff);
  assert.deepEqual([rng.next(), rng.next()], [seeded.next(), seeded.next()]);
  rng.setState(2 ** 32 + 1);
  assert.equal(rng.getState(), 1, 'setState wraps past 32 bits');
  const fresh = makeRng(1);
  assert.deepEqual([rng.next(), rng.next()], [fresh.next(), fresh.next()]);
});
