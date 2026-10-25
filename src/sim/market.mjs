import { NEEDS_LEDGER_ENABLED, recordLegacyConsumption } from "./needs-telemetry.mjs";
import { totalDemand, demandBy, demandOf, CLASSES } from "./classes.mjs";
import { COMMERCE_LEDGER_ENABLED, openCommerce, openMarketLedgers, recordLocalSupply, recordRetailSale } from "./procurement.mjs";
import { settleHouseholdDay } from "./households.mjs";
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
  if (COMMERCE_LEDGER_ENABLED) openMarketLedgers(world, m); // every port starts with its wholesale account (telemetry only)
  return m;
}
/** Bring a loaded market up to the current world: any city or good added since the save was written
 *  gets a fresh row (stock at target, like a new game). Existing rows are never touched. Returns how many rows were added. */
export function fillMissingMarketRows(world, market) {
  if (!world?.cities || !world?.goods || !market) return 0; // partial worlds in old or malformed saves are left to the callers' own checks
  const fresh = makeMarket(world); let added = 0;
  for (const [city, goods] of Object.entries(fresh)) {
    const row = (market[city] ??= {});
    for (const [good, e] of Object.entries(goods)) if (!row[good]) { row[good] = e; added++; }
  }
  if (COMMERCE_LEDGER_ENABLED) openMarketLedgers(world, market); // an old save without accounts gets them, valued at its current stock (declared approximation)
  return added;
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
export const SEASON_PEAK = { grain: 225, wine: 270, olive_oil: 330, sugar: 100, pepper: 150, wool: 150, fish: 110, salt: 200 };
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
/** Per-class demand of one market entry: the mixed pool splits by the town's shares; class-typed
 *  house residents (e.classExtra, already on the same scale as e.pop) buy by their own class. */
export function cityDemandBy(e, good, base) {
  const ratio = affordRatio(e, base), ex = e.classExtra ?? null;
  const exTotal = ex ? CLASSES.reduce((a, c) => a + (ex[c] ?? 0), 0) : 0;
  const by = demandBy(Math.max(0, (e.pop ?? 0) - exTotal), good, ratio);
  if (exTotal) { const bx = demandOf(ex, good, ratio); for (const c of CLASSES) by[c] += bx[c]; }
  return by;
}
export function cityDemand(e, good, base) {
  const by = cityDemandBy(e, good, base);
  return CLASSES.reduce((a, c) => a + by[c], 0) * DEMAND_SCALE * (e.needs ? NEEDS_MUL : 1) * (e.makes ? MAKES_MUL : 1);
}
export function tickMarket(market, day, world, options = {}) {
  for (const city of Object.values(market)) tickMarketCity(city, day, world, options);
}
/** One day for ONE city (market[cityId]): the same formulas and quantities as a full tickMarket day. */
export function tickMarketCity(city, day, world, {needsLedger=NEEDS_LEDGER_ENABLED, commerceLedger=COMMERCE_LEDGER_ENABLED} = {}) {
  const commerce = commerceLedger && world?.goods && city?.grain ? openCommerce(world, city) : null; // lazy open: an account-less market (old save, bare fixture) gets its account on its first tick
  const actual={},desired={},retailValues={};
  const track = needsLedger || commerce;
  for (const [good, e] of Object.entries(city)) {
    const beforeSupply = e.stock;
    if (e.makes) e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 2 * (e.townShare ?? 1) * seasonMul(good, day))); // warehouses are finite; townShare: share of the town's industry still in town hands (docs/design/town-industry-and-auctions.md piece 2), absent = 1
    e.stock = Math.min(e.target * 4, e.stock + Math.round(e.rate * 0.4)); // local trickle
    if (commerce && e.stock > beforeSupply) recordLocalSupply(city, good, e.stock - beforeSupply, world.goods[good]?.base); // a partial world (fixture) just skips the good
    const scarcity = Math.min(1.5, e.stock / Math.max(1, e.target)); // low stock, low demand
    const d = cityDemand(e, good, world?.goods?.[good]?.base) * scarcity; // units per day, often below 1
    const used = Number.isFinite(day) ? Math.round(d * (day + 1)) - Math.round(d * day) : Math.round(d); // whole units whose running total matches d per day (no day given: plain rounding); no hidden state, so a year repeats exactly
    if(track){
      actual[good]=Math.min(e.stock,Math.max(0,used));
      const by=cityDemandBy(e,good,world?.goods?.[good]?.base); // same split as cityDemand: ledger desire matches the units actually drawn
      const mul=DEMAND_SCALE*(e.needs?NEEDS_MUL:1)*(e.makes?MAKES_MUL:1)*scarcity;
      desired[good]=Object.fromEntries(Object.entries(by).map(([c,n])=>[c,n*mul]));
    }
    const shelfBefore = e.stock, priced = commerce && actual[good] > 0 && world.goods[good]; // a partial world (fixture) records no retail for goods it does not know
    const retailPrice = priced ? price(world, e, good) : 0; // households face the day's price after production, before their own consumption depletes the shelf
    e.stock = Math.max(0, e.stock - used);
    if (priced) retailValues[good] = recordRetailSale(city, good, actual[good], retailPrice, shelfBefore);
  }
  if(needsLedger)recordLegacyConsumption(city,day,actual,desired,g=>{const e=city[g];return DEMAND_SCALE*(e.needs?NEEDS_MUL:1)*(e.makes?MAKES_MUL:1);});
  if (commerce) { // attribute the day's ACTUAL retail spend to the classes, proportional to their desire (estimate, like needsLedger)
    const spentByClass = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    for (const [good, value] of Object.entries(retailValues)) {
      if (!(value > 0)) continue;
      const by = desired[good], total = CLASSES.reduce((s, c) => s + (by?.[c] ?? 0), 0);
      if (!total) continue;
      for (const c of CLASSES) spentByClass[c] += (value * by[c]) / total;
    }
    settleHouseholdDay(city, spentByClass);
  }
}
