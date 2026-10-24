// Presentation-only market helpers. Never expose unknown live destination prices.
import { knownMarket } from '../game/intel.mjs';
import { price } from '../sim/market.mjs';
export const marketQuantity = value => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(999, Math.floor(n))) : 10;
};
export function destinationQuote(g, city, good) {
  const { market, age } = knownMarket(g);
  if (!market[city]?.[good] || !g.world.goods[good]) return null;
  return { price: price(g.world, market[city][good], good), age: age[city].days, exact: age[city].exact };
}
