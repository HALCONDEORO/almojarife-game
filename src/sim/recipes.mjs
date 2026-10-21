// Own gameplay recipes. Not historical construction quantities. Not enabled in the game yet.
import { price } from './market.mjs';
import { FEE } from './trade.mjs';
export const RECIPES = Object.freeze({
  barca: Object.freeze({ timber: 10, iron: 3, cloth: 4 }),
  cog: Object.freeze({ timber: 24, iron: 8, cloth: 12 }),
  caravel: Object.freeze({ timber: 20, iron: 10, cloth: 18 }),
  nao: Object.freeze({ timber: 42, iron: 16, cloth: 24 }),
  warehouse: Object.freeze({ timber: 20, iron: 6 }),
  house: Object.freeze({ timber: 12, iron: 2, cloth: 2 }),
  workshop: Object.freeze({ timber: 18, iron: 5, cloth: 6 }),
  farm: Object.freeze({ timber: 14, iron: 2 }),
  pasture: Object.freeze({ timber: 12, iron: 2 }),
  sawmill: Object.freeze({ timber: 10, iron: 4 }),
  mine: Object.freeze({ timber: 16, iron: 6 }),
  office: Object.freeze({ timber: 16, iron: 4, cloth: 6 }),
  // Production transforms, unlike construction sinks, put output into stock.
  weave: Object.freeze({ wool: 4 }),
});
export const OUTPUTS = Object.freeze({ weave: Object.freeze({ cloth: 2 }) });
/** Cost and availability for purchasing recipe inputs directly at a local market. No mutation. */
export function quoteRecipe(world, market, city, recipe, batches = 1) {
  if (!Object.hasOwn(RECIPES, recipe)) return { ok: false, reason: 'unknown recipe' };
  if (!Number.isSafeInteger(batches) || batches < 1 || batches > 100) return { ok: false, reason: 'bad batches' };
  const stock = market[city]; if (!stock) return { ok: false, reason: 'unknown city' };
  const inputs = {}, units = {}; let cost = 0;
  for (const [good, amount] of Object.entries(RECIPES[recipe])) {
    const qty = amount*batches, e = stock[good];
    if (!world.goods[good] || !e || !Number.isSafeInteger(e.stock) || e.stock < qty) return { ok: false, reason: 'missing materials', good, required: qty, available: e?.stock ?? 0 };
    const sim = {...e}; let line = 0;
    for (let i=0;i<qty;i++) { line += Math.ceil(price(world, sim, good)*(1+FEE)); sim.stock--; }
    inputs[good]=qty; units[good]=line; cost+=line;
  }
  return { ok: true, recipe, city, batches, inputs, lineCosts: units, cost, outputs: Object.fromEntries(Object.entries(OUTPUTS[recipe]??{}).map(([g,n])=>[g,n*batches])) };
}
/** Requote immediately and consume all inputs or none. Caller pays from returned cost only on success. */
export function consumeRecipe(world, market, city, recipe, cash, batches=1) {
  if (!Number.isFinite(cash) || cash < 0) return { ok:false, reason:'bad cash' };
  const q=quoteRecipe(world,market,city,recipe,batches); if (!q.ok) return q;
  if (cash < q.cost) return {ok:false,reason:'no cash',cost:q.cost};
  for(const [good,qty] of Object.entries(q.inputs)) market[city][good].stock-=qty;
  for(const [good,qty] of Object.entries(q.outputs)) market[city][good].stock+=qty;
  return q;
}
