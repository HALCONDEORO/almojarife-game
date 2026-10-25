import { CLASSES, classCounts, demandBy } from "../sim/classes.mjs";
/** Rows for the "City" tab: citizens per class and what each class buys most. Pure data, no DOM. */
export function cityRows(pop, goods, ratioOf = () => 1) {
  const counts = classCounts(pop);
  return CLASSES.map((cls) => {
    const buys = goods.map((g) => ({ good: g, qty: demandBy(pop, g, ratioOf(g))[cls] })).filter((x) => x.qty > 0.005).sort((a, b) => b.qty - a.qty);
    return { cls, count: counts[cls], pct: Math.round(counts[cls] / pop * 1000) / 10, top: buys.slice(0, 4), priced_out: goods.filter((g) => demandBy(pop, g, 1)[cls] > 0 && demandBy(pop, g, ratioOf(g))[cls] === 0) };
  });
}
