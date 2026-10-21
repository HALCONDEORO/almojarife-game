// Social classes of a city and what each one consumes. Own design, written from first principles:
// a town has poor, middle (craftsmen and merchants) and rich citizens. Bigger and richer towns have
// more rich citizens. Each class eats and buys different goods, and a class stops buying a good
// when its price climbs past what that class can pay.
export const CLASSES = ["poor", "middle", "rich"];

/** Share of the population in each class. Rich share grows with city size (2% in a village, 12% in a great port). */
export function classShares(pop) {
  const size = Math.min(1, Math.max(0, (pop - 2000) / 20000));
  const rich = 0.02 + 0.10 * size, middle = 0.18 + 0.17 * size;
  return { poor: 1 - rich - middle, middle, rich };
}
/** Citizens per class (whole numbers that add up to pop). */
export function classCounts(pop) {
  const s = classShares(pop), rich = Math.round(pop * s.rich), middle = Math.round(pop * s.middle);
  return { poor: pop - rich - middle, middle, rich };
}

/** Units bought per 1000 citizens per day, by class. Staples for everyone, comforts for the middle, luxuries for the rich. */
export const PER_1000 = {
  grain:      { poor: 1.3, middle: 1.1, rich: 0.7 },
  fish:       { poor: 0.8, middle: 0.5, rich: 0.2 },
  salt:       { poor: 0.4, middle: 0.4, rich: 0.3 },
  beer:       { poor: 0.3, middle: 0.3, rich: 0.1 },
  soap:       { poor: 0.1, middle: 0.3, rich: 0.4 },
  timber:     { poor: 0.2, middle: 0.3, rich: 0.3 },
  iron:       { poor: 0.1, middle: 0.25, rich: 0.25 },
  ironware:   { poor: 0.1, middle: 0.3, rich: 0.2 },
  meat:       { poor: 0.1, middle: 0.3, rich: 0.5 },
  leather:    { poor: 0.05, middle: 0.2, rich: 0.4 },
  esparto:    { poor: 0.1, middle: 0.2, rich: 0.1 },
  wool:       { poor: 0.2, middle: 0.4, rich: 0.3 },
  cloth:      { poor: 0.05, middle: 0.4, rich: 0.9 },
  bricks:     { poor: 0.2, middle: 0.3, rich: 0.3 }, // repairs and small works by the citizens; construction quotes draw it too (docs/design/construction.md)
  olive_oil:  { poor: 0.25, middle: 0.5, rich: 0.8 },
  wine:       { poor: 0.15, middle: 0.6, rich: 1.4 },
  sugar:      { poor: 0.05, middle: 0.3, rich: 1.5 },
  pepper:     { poor: 0, middle: 0.25, rich: 2.0 },
  silk:       { poor: 0, middle: 0.1, rich: 2.5 },
};
/** Highest price, as a multiple of the base price, that each class will still pay. */
export const TOLERANCE = { poor: 1.4, middle: 2, rich: 3 };

/** How much of its normal demand a class keeps at a price ratio (price / base): full up to base, zero at its tolerance. */
export function affordMul(cls, ratio) {
  const tol = TOLERANCE[cls];
  if (ratio <= 1) return 1;
  return Math.max(0, 1 - (ratio - 1) / (tol - 1));
}
/** Daily demand of a city for a good, per class, at a price ratio. Fractions are kept; the market rounds the total. */
export function demandBy(pop, good, ratio = 1) {
  const n = classCounts(pop), row = PER_1000[good] ?? { poor: 0, middle: 0, rich: 0 }, out = {};
  for (const c of CLASSES) out[c] = n[c] / 1000 * row[c] * affordMul(c, ratio);
  return out;
}
export const totalDemand = (pop, good, ratio = 1) => CLASSES.reduce((a, c) => a + demandBy(pop, good, ratio)[c], 0);
