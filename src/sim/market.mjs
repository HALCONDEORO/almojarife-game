// Own price model: price moves with stock relative to a target stock (supply/demand ratio).
// Written from first principles; not derived from any other game's data.
export function makeMarket(world) {
  const m = {};
  for (const c of world.cities) {
    m[c.id] = {};
    for (const g of Object.keys(world.goods)) {
      const makes = c.makes.includes(g), needs = c.needs.includes(g);
      const target = Math.round(c.pop / 100 * (makes ? 3 : needs ? 1 : 1.5));
      m[c.id][g] = { stock: target, target, makes, needs, rate: Math.max(1, Math.round(c.pop / 1000)) };
    }
  }
  return m;
}
/** price = base * (target/stock)^elasticity, clamped to 0.4x-3x. */
export function price(world, entry, good, elasticity = 0.6) {
  const ratio = entry.target / Math.max(1, entry.stock);
  return Math.round(world.goods[good].base * Math.min(3, Math.max(0.4, ratio ** elasticity)));
}
/**
 * One day. Producers add stock. Every town also gets a small local trickle of every good
 * (small-boat and overland trade), so a town never runs completely dry. Consumption falls
 * as stock gets scarce (demand follows price), so stock settles above zero instead of
 * sticking at the price ceiling. Stock stays a whole number and never negative.
 */
export function tickMarket(market) {
  for (const city of Object.values(market))
    for (const e of Object.values(city)) {
      if (e.makes) e.stock = Math.min(e.target * 4, e.stock + e.rate * 2); // warehouses are finite
      e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 0.4)); // local trickle
      const base = e.needs ? e.rate * 1.2 : e.rate * 0.3;
      const scarcity = Math.min(1.5, e.stock / Math.max(1, e.target)); // low stock, low demand
      e.stock = Math.max(0, e.stock - Math.round(base * scarcity));
    }
}
