// Statistics for the pirateFight EV protocol (v13). Pure, no engine imports.
const Z90 = 1.6448536269514722; // two-sided 90% / one-sided 95%

export function wilson(x, N, z = Z90) {
  const p = x / N, d = 1 + z * z / N;
  const c = p + z * z / (2 * N), w = z * Math.sqrt(p * (1 - p) / N + z * z / (4 * N * N));
  return [Math.max(0, (c - w) / d), Math.min(1, (c + w) / d)];
}

function phiOf(n11, n10, n01, n00, N) {
  const den = (n11 + n10) * (n01 + n00) * (n11 + n01) * (n10 + n00);
  if (den === 0) return 0;
  // Method 10 continuity correction: shrink the numerator toward zero by N/2.
  let num = n11 * n00 - n10 * n01;
  num = num > 0 ? Math.max(num - N / 2, 0) : Math.min(num + N / 2, 0);
  return num / Math.sqrt(den);
}

// Newcombe 1998 method 10, paired difference p1 - p2 (p1 = B ruin, p2 = A ruin).
export function newcombe(n11, n10, n01, n00) {
  const N = n11 + n10 + n01 + n00;
  const p1 = (n10 + n11) / N, p2 = (n01 + n11) / N, d = p1 - p2;
  const [l1, u1] = wilson(n10 + n11, N), [l2, u2] = wilson(n01 + n11, N);
  const phi = phiOf(n11, n10, n01, n00, N);
  const upper = d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2 - 2 * phi * (u1 - p1) * (p2 - l2));
  const lower = d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2 - 2 * phi * (p1 - l1) * (u2 - p2));
  return { d, lower, upper, phi };
}

function binomCdf(k, m, th) { // P(X <= k), X ~ Bin(m, th)
  // log-space recurrence: the naive C(m,i) * th^i * (1-th)^(m-i) overflows the
  // coefficient (Infinity * 0 = NaN) and underflows the powers for plausible m.
  if (th <= 0) return k >= 0 ? 1 : 0;
  if (th >= 1) return k >= m ? 1 : 0;
  const lTh = Math.log(th), l1Th = Math.log(1 - th);
  let lp = m * l1Th, max = lp; const lps = [lp];
  for (let i = 1; i <= k; i++) {
    lp += Math.log(m - i + 1) - Math.log(i) + lTh - l1Th;
    lps.push(lp); if (lp > max) max = lp;
  }
  let s = 0;
  for (const l of lps) s += Math.exp(l - max);
  return s * Math.exp(max); // exp(max) may underflow to 0: then the tail truly is < alpha
}

// One-sided 95% Clopper-Pearson upper limit for n10 out of m, by bisection.
export function cpUpper(n10, m, alpha = 0.05) {
  if (n10 >= m) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (binomCdf(n10, m, mid) > alpha) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function exactUpper(n10, n01, N) {
  const m = n10 + n01;
  if (m === 0) return 3 / N;
  return (2 * cpUpper(n10, m) - 1) * m / N;
}

// Final ruin bound = max(Newcombe upper, exact conditional upper). Condition: <= margin (0.02).
export function ruinBound(n11, n10, n01, n00) {
  const N = n11 + n10 + n01 + n00;
  const nw = newcombe(n11, n10, n01, n00);
  const ex = exactUpper(n10, n01, N);
  return { upper: Math.max(nw.upper, ex), newcombeUpper: nw.upper, exactUpper: ex, lower: nw.lower, d: nw.d };
}

// Seeded RNG (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }
export function normCdf(x) { // Abramowitz-Stegun 7.1.26 via erf
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
export function normInv(p) { // Acklam
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425;
  let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// One-sided BCa interval for a statistic of a paired sample. Returns {lower, upper, status}.
// status: "ok" | "constant" (all values equal -> [c,c]) | "undefined" (variable sample but BCa not finite).
export function bca(values, stat = mean, { B = 5000, alpha = 0.05, seed = 1 } = {}) {
  const n = values.length;
  if (n === 0 || values.some(v => !Number.isFinite(v))) return { lower: NaN, upper: NaN, status: "undefined" };
  if (values.every(v => v === values[0])) { const c = stat(values); return { lower: c, upper: c, status: "constant" }; } // the interval describes stat(values), not the raw sample
  const th = stat(values), rnd = rng(seed), bs = new Array(B);
  for (let b = 0; b < B; b++) { const s = new Array(n); for (let i = 0; i < n; i++) s[i] = values[Math.floor(rnd() * n)]; bs[b] = stat(s); }
  bs.sort((x, y) => x - y);
  const below = bs.filter(v => v < th).length;
  const z0 = normInv(Math.min(Math.max(below / B, 1 / (B + 1)), B / (B + 1)));
  const jk = values.map((_, i) => stat(values.filter((__, j) => j !== i)));
  const jm = mean(jk); let num = 0, den = 0;
  for (const v of jk) { num += (jm - v) ** 3; den += (jm - v) ** 2; }
  const acc = den === 0 ? 0 : num / (6 * Math.pow(den, 1.5));
  const q = (za) => { const adj = z0 + (z0 + za) / (1 - acc * (z0 + za)); return bs[Math.min(B - 1, Math.max(0, Math.floor(normCdf(adj) * B)))]; };
  const lower = q(normInv(alpha)), upper = q(normInv(1 - alpha));
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) return { lower: NaN, upper: NaN, status: "undefined" };
  return { lower, upper, status: "ok" };
}

// Standardised difference z_c for one configuration (protocol section 4).
// diffs: B - A per seed in 33..256; sdA: sample sd of A in 1..32 (frozen); floor: coins/day floor.
export function zc(diffs, sdA, floor) {
  const den = sdA > 0 ? sdA : floor;
  return mean(diffs) / den;
}
export function sampleSd(a) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); }
export { mean };

// Verdict for a single upper bound against 0: NaN or non-finite never passes.
export function passesUpper(upper) { return Number.isFinite(upper) && upper <= 0; }
