// Own price model: price moves with stock relative to a target stock (supply/demand ratio).
// Written from first principles; not derived from any other game's data.
export function makeMarket(world, rng) {
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
/** One day: producers add, consumers remove, stock never negative. */
export function tickMarket(market) {
  for (const city of Object.values(market))
    for (const e of Object.values(city)) {
      if (e.makes) e.stock += e.rate * 2;
      if (e.needs) e.stock = Math.max(0, e.stock - e.rate * 2);
      else e.stock = Math.max(0, e.stock - Math.round(e.rate * 0.3));
    }
}
