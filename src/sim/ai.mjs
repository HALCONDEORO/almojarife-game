// M1b: a simple AI trader. It looks at every (good, destination) pair it can reach,
// scores profit per day using current prices and sails the best one. Own design.
import { route } from "./world.mjs";
import { price } from "./market.mjs";
import { SHIP_TYPES, FEE, buy, sell, sail, cargoUsed } from "./trade.mjs";

const CARRY_MIN_MARGIN = 1.08; // never sail for less than 8% gross margin (covers both fees)

function bestPlan(world, market, ship, cash) {
  let best = null;
  const spec = SHIP_TYPES[ship.type];
  for (const dest of world.cities) {
    if (dest.id === ship.at) continue;
    const r = route(world, ship.at, dest.id);
    if (!r) continue;
    const days = Math.max(1, Math.ceil(r.km / spec.kmPerDay));
    for (const good of Object.keys(world.goods)) {
      const here = market[ship.at][good], there = market[dest.id][good];
      if (here.stock <= 0) continue;
      const buyP = price(world, here, good) * (1 + FEE), sellP = price(world, there, good) * (1 - FEE);
      if (sellP / buyP < CARRY_MIN_MARGIN) continue;
      const qty = Math.max(0, Math.min(spec.capacity, here.stock, Math.floor(cash / Math.ceil(buyP))));
      const score = ((sellP - buyP) * qty) / (days + 1);
      if (qty <= 0) continue;
      // Tie-break on destination id, then good id, so the choice never depends on iteration order.
      const better = !best || score > best.score ||
        (score === best.score && (dest.id < best.dest || (dest.id === best.dest && good < best.good)));
      if (better) best = { dest: dest.id, good, qty, score };
    }
  }
  return best;
}

/** One decision for an idle ship. Mutates ship, market and trader. Returns what it did.
 *  Optional hooks let a harness apply player rules: feeMul(city) scales the market fee,
 *  onSale/onBuy report (city, good, scarcityBefore, revenue|cost) for reputation tracking. */
export function aiStep(world, market, trader, ship, hooks = {}) {
  if (ship.voyage) return null;
  const fee = FEE * (hooks.feeMul?.(ship.at) ?? 1);
  for (const good of Object.keys(ship.cargo)) {
    const e = market[ship.at]?.[good];
    const scarcity = e ? e.target / Math.max(1, e.stock) : 0;
    const s = sell(world, market, ship, good, ship.cargo[good], fee);
    if (s.ok) { trader.cash += s.revenue; hooks.onSale?.(ship.at, good, scarcity, s.revenue); }
  }
  if (cargoUsed(ship) > 0) return null;
  const plan = bestPlan(world, market, ship, trader.cash);
  if (!plan) return null;
  const eb = market[ship.at]?.[plan.good];
  const scarcityB = eb ? eb.target / Math.max(1, eb.stock) : 0;
  const b = buy(world, market, ship, trader.cash, plan.good, plan.qty, fee);
  if (!b.ok) return null;
  trader.cash -= b.cost;
  hooks.onBuy?.(ship.at, plan.good, scarcityB, b.cost);
  sail(world, ship, plan.dest);
  return plan;
}
