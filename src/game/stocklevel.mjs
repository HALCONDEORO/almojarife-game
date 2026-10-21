// Stock-level indicator: a 4-step view over market state (stock vs target stock).
// Thresholds follow the price curve in src/sim/market.mjs (price = base*(target/stock)^0.6,
// clamped 0.4x-3x): scarce starts where price passes ~1.5x base, plenty where it drops under ~0.66x.
export const STOCK_LEVELS = ["scarce", "short", "normal", "plenty"];
export function stockLevel(entry) {
  const s = entry?.stock, t = entry?.target;
  if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) return "normal";
  if (s < t / 2) return "scarce";
  if (s < t) return "short";
  if (s < t * 2) return "normal";
  return "plenty";
}
