// City growth and decline (living cities 7/8): a well-fed city slowly swells; a hungry one
// slowly shrinks. The multiplier rides on the market's daily population figure (demand),
// so the whole economy feels it through the prices everyone sees. Slow on purpose: the
// full swing takes years. Own tuning knobs, marked inference. Off unless
// g.cityGrowth === true (no keys at all in an off game: saves and play byte-identical).
export const GROWTH_MIN = 0.94;  // the smallest a city can shrink to (x pop demand)
export const GROWTH_MAX = 1.06;  // the largest it can swell to
export const GROWTH_STEP = 0.0005; // per-day pull toward the city's own balance point
export const GROWTH_PULL = 2.0;  // how far "better fed than usual" moves the balance point
export const GROWTH_EMA_DAYS = 90; // the habit window: a city is judged against its own season
export const GROWTH_FOODS = Object.freeze(["grain", "fish", "meat"]); // what "fed" means here (staples)

import { scarcityOf } from "./reputation.mjs";

/** Demand multiplier for a city; 1 when the flag is off or no drift has happened yet. */
export const growthMul = (g, cityId) => (g?.cityGrowth === true ? g.growth?.[cityId]?.mul ?? 1 : 1); // flag: g.cityGrowth; state: g.growth[city] = { mul, ema }
/** The day's drift for one city, called from its own daily market tick. Own tuning. */
export function growthTick(g, cityId) {
  if (g?.cityGrowth !== true) return;
  const m = g.market[cityId]; if (!m) return;
  let scarce = 0, n = 0;
  for (const good of GROWTH_FOODS) { const e = m[good]; if (!e) continue; scarce += scarcityOf(e); n++; }
  if (!n) return;
  const avg = scarce / n;
  const st = (g.growth ??= {})[cityId] ??= { mul: 1, ema: avg }; // first day: the habit is what the city already eats
  // A city is judged against its own habit (a month's running average), not against an
  // absolute bar: chronic understock is normal here and must not sink every port. Better
  // fed than its habit: the balance point rises; worse: it falls. The multiplier chases the
  // point, so the swing self-limits and never camps at a rail.
  const dev = (st.ema - avg) / Math.max(st.ema, 0.25);
  const target = Math.max(GROWTH_MIN, Math.min(GROWTH_MAX, 1 + GROWTH_PULL * dev));
  const mul = Math.round((st.mul + Math.max(-GROWTH_STEP, Math.min(GROWTH_STEP, target - st.mul))) * 1e6) / 1e6;
  st.ema = Math.round((st.ema + (avg - st.ema) / GROWTH_EMA_DAYS) * 1e6) / 1e6;
  if (mul !== st.mul) st.mul = mul;
}
/** One line for the Ayuntamiento tab, in words, or null near the middle. Flag off: null. */
export function growthLine(g, cityId) {
  if (g?.cityGrowth !== true) return null;
  const mul = growthMul(g, cityId);
  if (Math.abs(mul - 1) < 0.02) return null;
  const growing = mul > 1;
  return { kind: growing ? "growth" : "decline", txt: growing
    ? { es: "La ciudad crece: hay pan y llega gente.", en: "The city is growing: there is bread and folk keep coming." }
    : { es: "La ciudad mengua: el pan falta y la gente se va.", en: "The city is shrinking: bread is short and folk are leaving." } };
}
