import test from "node:test";
import assert from "node:assert/strict";
import { ruinBound, bca, passesUpper, zc, sampleSd, cpUpper } from "../tools/ev/stats.mjs";

// Reference values computed independently in Python (bisection on the exact binomial
// CDF for Clopper-Pearson; Newcombe 1998 method 10 with continuity correction on phi).
// Protocol v13, N=224. Tolerance 0.001 pp.
const REF = [
  [[0, 0, 0, 224], 1.3393, 1.1934],
  [[0, 3, 0, 221], 3.3035, 3.3035],
  [[0, 2, 2, 220], 1.8671, 1.8671],
  [[0, 1, 0, 223], 1.9760, 1.9760],
  [[10, 3, 0, 211], 3.2885, 3.2885],
  [[10, 2, 2, 210], 1.9492, 1.9492],
  // Regression (external v2 P1): method 8 gave 1.9905% here, under the 0.02
  // margin; the corrected method 10 bound is 2.1260%, which fails it.
  [[1, 1, 0, 222], 2.1260, 2.1260],
];
for (const [t, fin, nw] of REF) {
  test(`ruin bound ${t.join(",")}`, () => {
    const r = ruinBound(...t);
    assert.ok(Math.abs(r.upper * 100 - fin) < 0.001, `final ${r.upper * 100}`);
    assert.ok(Math.abs(r.newcombeUpper * 100 - nw) < 0.001, `nw ${r.newcombeUpper * 100}`);
  });
}
test("zero discordant pairs gives 3/N = 1.34 pp", () => {
  assert.ok(Math.abs(ruinBound(0, 0, 0, 224).upper - 3 / 224) < 1e-12);
});
test("all discordant pairs and symmetric case are finite", () => {
  assert.ok(Number.isFinite(ruinBound(0, 224, 0, 0).upper));
  assert.ok(Number.isFinite(ruinBound(0, 0, 224, 0).upper));
});
test("bca: constant sample is exact [c,c]; NaN is undefined and never passes", () => {
  const c = bca([2, 2, 2, 2]);
  assert.equal(c.status, "constant"); assert.equal(c.upper, 2);
  const n = bca([1, NaN, 3]);
  assert.equal(n.status, "undefined"); assert.equal(passesUpper(n.upper), false);
});
test("bca: variable sample brackets the mean and is deterministic", () => {
  const v = Array.from({ length: 60 }, (_, i) => (i % 7) - 3 + i * 0.01);
  const a = bca(v, undefined, { seed: 5 }), b = bca(v, undefined, { seed: 5 });
  assert.deepEqual(a, b); assert.equal(a.status, "ok"); assert.ok(a.lower < a.upper);
});
test("z_c uses sd of A and falls back to the floor when sd is 0", () => {
  assert.equal(zc([2, 4], 2, 1), 1.5);
  assert.equal(zc([2, 4], 0, 3), 1);
  assert.ok(sampleSd([1, 2, 3]) === 1);
});

test("bca constant sample describes stat(values), not the raw value", () => {
  const r = bca([-2, -2], (xs) => -(xs.reduce((a, b) => a + b, 0) / xs.length));
  assert.equal(r.status, "constant"); assert.equal(r.lower, 2); assert.equal(r.upper, 2);
});

test("cpUpper stays stable for plausible large samples (no coefficient overflow)", () => {
  const u = cpUpper(1000, 2000); // 50% successes: upper limit must sit just above 0.5
  assert.ok(u > 0.5 && u < 0.6, `cpUpper(1000,2000)=${u}`);
  assert.ok(cpUpper(0, 2000) < 0.01);
  assert.equal(cpUpper(2000, 2000), 1);
});
