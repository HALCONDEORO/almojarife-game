import { totalDemand } from "./classes.mjs";
// Own price model: price moves with stock relative to a target stock (supply/demand ratio).
// Written from first principles; not derived from any other game's data.
export function makeMarket(world) {
  const m = {};
  for (const c of world.cities) {
    m[c.id] = {};
    for (const g of Object.keys(world.goods)) {
      const makes = c.makes.includes(g), needs = c.needs.includes(g);
      const target = Math.round(c.pop / 100 * (makes ? 3 : needs ? 1 : 1.5));
      m[c.id][g] = { stock: target, target, makes, needs, rate: Math.max(1, Math.round(c.pop / 1000)), pop: c.pop };
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
/** Units a city's citizens want of a good per day: each class buys by its own habits and drops out when the price passes what it can pay. */
export const DEMAND_SCALE = 3, NEEDS_MUL = 3, MAKES_MUL = 0.3; // a town buys less of what it makes itself (local supply, no freight)
/** Price ratio (price / base) that citizens react to: the same rounded trading price the player sees, so the market and the City tab always agree. */
export function affordRatio(e, base) {
  const raw = Math.min(3, Math.max(0.4, (e.target / Math.max(1, e.stock)) ** 0.6)); // same curve as price()
  return base ? Math.round(base * raw) / base : raw;
}
export function cityDemand(e, good, base) {
  const pop = e.pop ?? e.rate * 1000; // older saves have no pop on the entry
  return totalDemand(pop, good, affordRatio(e, base)) * DEMAND_SCALE * (e.needs ? NEEDS_MUL : 1) * (e.makes ? MAKES_MUL : 1);
}
export function tickMarket(market, day, world) {
  for (const city of Object.values(market))
    for (const [good, e] of Object.entries(city)) {
      if (e.makes) e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 2 * seasonMul(good, day))); // warehouses are finite
      e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 0.4)); // local trickle
      const scarcity = Math.min(1.5, e.stock / Math.max(1, e.target)); // low stock, low demand
      e.stock = Math.max(0, e.stock - Math.round(cityDemand(e, good, world?.goods?.[good]?.base) * scarcity)); // whole units; no hidden state, so a year repeats exactly
    }
}
