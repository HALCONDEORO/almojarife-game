// Own gameplay recipes. Not historical construction quantities. Not enabled in the game yet.
import { price } from './market.mjs';
import { FEE, ceil2 } from './trade.mjs';
import { recordMarketPurchase } from './procurement.mjs';
export const RECIPES = Object.freeze({
  barca: Object.freeze({ timber: 10, iron: 3, cloth: 3, esparto: 3 }),
  cog: Object.freeze({ timber: 24, iron: 8, cloth: 10, esparto: 6 }),
  caravel: Object.freeze({ timber: 20, iron: 10, cloth: 16, esparto: 6 }),
  nao: Object.freeze({ timber: 42, iron: 16, cloth: 21, esparto: 9 }),
  warehouse: Object.freeze({ timber: 15, bricks: 20, ironware: 1 }),
  house: Object.freeze({ timber: 8, bricks: 8, cloth: 2 }),
  workshop: Object.freeze({ timber: 10, bricks: 10, ironware: 2, cloth: 6 }), // cloth-heavy on purpose: the loom is the cost (25/10 recalibration left it at its fitted cost)
  farm: Object.freeze({ timber: 29, bricks: 14, ironware: 7 }),
  pasture: Object.freeze({ timber: 36, bricks: 5, ironware: 9 }),
  sawmill: Object.freeze({ timber: 37, bricks: 9, ironware: 9 }),
  mine: Object.freeze({ timber: 42, bricks: 13, ironware: 13 }),
  office: Object.freeze({ timber: 10, bricks: 10, ironware: 1, cloth: 6 }),
  oil_mill: Object.freeze({ timber: 28, bricks: 22, ironware: 6, cloth: 6 }),
  vineyard: Object.freeze({ timber: 35, bricks: 7, ironware: 7, cloth: 7 }),
  saltworks: Object.freeze({ timber: 35, bricks: 13, ironware: 4 }),
  brewery: Object.freeze({ timber: 43, bricks: 27, ironware: 5 }),
  brickworks: Object.freeze({ timber: 37, bricks: 9, ironware: 9 }),
  soapworks: Object.freeze({ timber: 32, bricks: 16, ironware: 8 }),
  pottery: Object.freeze({ timber: 37, bricks: 18, ironware: 9 }), // construction (study 4.3 row brickworks, soapworks, pottery)
  esparto_field: Object.freeze({ timber: 33, bricks: 7, ironware: 7 }),
  ranch: Object.freeze({ timber: 31, bricks: 9, ironware: 9 }),
  armory: Object.freeze({ timber: 17, bricks: 7, ironware: 5 }),
  dock: Object.freeze({ timber: 46, bricks: 5, ironware: 5 }),
  fishery: Object.freeze({ timber: 23, bricks: 5, ironware: 5, cloth: 9 }),
  ironworks: Object.freeze({ timber: 37, bricks: 11, ironware: 11 }),
  // Civic buildings of the city-life module (own design; same material family as the rest of construction).
  posito: Object.freeze({ bricks: 15, timber: 6, ironware: 2 }),
  hospital: Object.freeze({ timber: 16, bricks: 16, ironware: 3, cloth: 7 }),
  alhondiga: Object.freeze({ timber: 14, bricks: 14, ironware: 3 }),
  caminos: Object.freeze({ bricks: 6, timber: 2, ironware: 1 }),
  pozo: Object.freeze({ timber: 2, bricks: 6, ironware: 1 }),
  capilla: Object.freeze({ timber: 10, bricks: 13, ironware: 2, cloth: 3 }),
  // Civic follow-up (docs/design/civic-buildings-2.md): meat market, mill, playhouse. Same material family.
  carniceria: Object.freeze({ timber: 14, bricks: 14, ironware: 3 }),
  molino: Object.freeze({ timber: 16, bricks: 10, ironware: 5 }),
  corral: Object.freeze({ timber: 25, bricks: 17, ironware: 2, cloth: 8 }),
  // Production transforms, unlike construction sinks, put output into stock.
  weave: Object.freeze({ wool: 4 }),
  forge: Object.freeze({ iron: 2, timber: 1 }),
  brew: Object.freeze({ grain: 3 }),
  boil: Object.freeze({ olive_oil: 1 }),
  firing: Object.freeze({ timber: 2 }),
  kiln: Object.freeze({ timber: 2 }), // study 5, pottery A: 2 timber -> 2 pottery
  // Primary producers take nothing from the market: the land yields the good (seasonal, see SEASON_PEAK).
});
export const OUTPUTS = Object.freeze({
  weave: Object.freeze({ cloth: 2 }),
  forge: Object.freeze({ ironware: 2 }),
  brew: Object.freeze({ beer: 2 }),
  boil: Object.freeze({ soap: 2 }),
  firing: Object.freeze({ bricks: 2 }),
  kiln: Object.freeze({ pottery: 2 }),
});
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
    for (let i=0;i<qty;i++) { line += ceil2(price(world, sim, good)*(1+FEE)); sim.stock--; }
    inputs[good]=qty; units[good]=line; cost+=line;
  }
  return { ok: true, recipe, city, batches, inputs, lineCosts: units, cost, outputs: Object.fromEntries(Object.entries(OUTPUTS[recipe]??{}).map(([g,n])=>[g,n*batches])) };
}
export const IMPORT_MUL = 1.5; // missing materials can be imported at this premium over (base + fee)
/** Like quoteUnits, but the stock the port lacks is imported at IMPORT_MUL instead of failing.
 *  Returns the local part (consumed from the market) and the imported part (paid, never consumed). No mutation. */
export function quoteUnitsImport(world, market, city, inputs) {
  const stock = market[city];
  if (!stock) return { ok: false, reason: 'unknown city' };
  let cost = 0; const lineCosts = {}, local = {}, imported = {};
  for (const [good, qty] of Object.entries(inputs)) {
    if (!world.goods[good] || !Number.isSafeInteger(qty) || qty < 0) return { ok: false, reason: 'bad inputs' };
    const e = stock[good];
    if (!e || !Number.isSafeInteger(e.stock)) return { ok: false, reason: 'missing materials', good, required: qty, available: 0 };
    const take = Math.min(e.stock, qty), abroad = qty - take;
    const sim = { ...e }; let line = 0;
    for (let i = 0; i < take; i++) { line += ceil2(price(world, sim, good) * (1 + FEE)); sim.stock--; }
    if (abroad > 0) { line += abroad * ceil2(world.goods[good].base * (1 + FEE) * IMPORT_MUL); imported[good] = abroad; }
    if (take > 0) local[good] = take;
    lineCosts[good] = line; cost += line;
  }
  return { ok: true, city, inputs: { ...inputs }, local, imported, lineCosts, cost };
}
/** Requote with import and consume the LOCAL units or none; imported units never touch the market. */
export function consumeUnitsImport(world, market, city, inputs, cash) {
  if (!Number.isFinite(cash) || cash < 0) return { ok: false, reason: 'bad cash' };
  const q = quoteUnitsImport(world, market, city, inputs);
  if (!q.ok) return q;
  if (cash < q.cost) return { ok: false, reason: 'no cash', cost: q.cost };
  for (const [good, qty] of Object.entries(q.local)) {
    market[city][good].stock -= qty;
    const importedPart = (q.imported[good] ?? 0) * ceil2(world.goods[good].base * (1 + FEE) * IMPORT_MUL); // the flat-rate share of the mixed line cost (same formula as quoteUnitsImport)
    recordMarketPurchase(market[city], good, qty, q.lineCosts[good] - importedPart, market[city][good].stock + qty); // telemetry: the local part paid the port's purse; imported stock never touches it
  }
  return q;
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

/** Quote explicit material quantities, including an empty market remainder. No mutation. */
export function quoteUnits(world, market, city, inputs) {
  const stock = market[city];
  if (!stock) return { ok: false, reason: 'unknown city' };
  let cost = 0; const lineCosts = {};
  for (const [good, qty] of Object.entries(inputs)) {
    if (!world.goods[good] || !Number.isSafeInteger(qty) || qty < 0) return { ok: false, reason: 'bad inputs' };
    const e = stock[good];
    if (!e || !Number.isSafeInteger(e.stock) || e.stock < qty) return { ok: false, reason: 'missing materials', good, required: qty, available: e?.stock ?? 0 };
    const sim = { ...e }; let line = 0;
    for (let i = 0; i < qty; i++) { line += ceil2(price(world, sim, good) * (1 + FEE)); sim.stock--; }
    lineCosts[good] = line; cost += line;
  }
  return { ok: true, city, inputs: { ...inputs }, lineCosts, cost };
}
/** Requote and consume all quantities or none. */
export function consumeUnits(world, market, city, inputs, cash) {
  if (!Number.isFinite(cash) || cash < 0) return { ok: false, reason: 'bad cash' };
  const q = quoteUnits(world, market, city, inputs);
  if (!q.ok) return q;
  if (cash < q.cost) return { ok: false, reason: 'no cash', cost: q.cost };
  for (const [good, qty] of Object.entries(inputs)) market[city][good].stock -= qty;
  return q;
}
