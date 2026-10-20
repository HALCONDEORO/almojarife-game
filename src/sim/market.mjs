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
/** Day of the year on which each good is most plentiful (harvest, catch, shearing). Goods not listed are made all year. */
export const SEASON_PEAK = { grain: 225, wine: 270, olive_oil: 330, sugar: 100, pepper: 150, wool: 150, dried_fish: 110, salt: 200 };
export const SEASON_AMPLITUDE = 0.35;
/** Production multiplier for a good on a day: 1 on average over the year, 1.35 at peak, 0.65 at the low. */
export function seasonMul(good, day) {
  const peak = SEASON_PEAK[good];
  if (peak === undefined || day === undefined) return 1;
  return 1 + SEASON_AMPLITUDE * Math.cos(2 * Math.PI * (day - peak) / 365);
}
export const SEASONS = ["winter", "spring", "summer", "autumn"];
/** Calendar season for a game day (day 0 is 1 January). */
export function seasonOf(day) { return SEASONS[Math.floor((((day + 11) % 365) / 91.25)) % 4]; }
/** `mods` is optional: { [city]: { [good]: { make, use } } } multiplies production and consumption (city events). Without it the day is exactly as before. */
export function tickMarket(market, day, mods = null) {
  for (const [cityId, city] of Object.entries(market))
    for (const [good, e] of Object.entries(city)) {
      const m = mods?.[cityId]?.[good], make = m?.make ?? 1, use = m?.use ?? 1;
      if (e.makes) e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 2 * seasonMul(good, day) * make)); // warehouses are finite
      e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 0.4)); // local trickle
      const base = e.needs ? e.rate * 1.2 : e.rate * 0.3;
      const scarcity = Math.min(1.5, e.stock / Math.max(1, e.target)); // low stock, low demand
      e.stock = Math.max(0, e.stock - Math.round(base * scarcity * use));
    }
}
