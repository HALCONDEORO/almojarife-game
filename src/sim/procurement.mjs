// Wholesale purse accounting, phase 0 of the household-procurement re-author
// (docs/design/commerce-ledger-phase0.md): MEASUREMENT ONLY. One account per port under
// grain.commerce, next to grain.needsLedger, recording the cash and inventory-basis flows
// of the legacy market exactly as it behaves today. Never limits a trade, never changes a
// price, a stock or any trader: the purse is a bookkeeping view, not a wallet, and may go
// negative without anything stopping. A binding purse is a later, separately reviewed phase.
// Phase-0 scope (declared, not instrumented): materials imported from outside the port
// (quoteUnitsImport's external part), council fees and derechos, ship upkeep and wages.
export const COMMERCE_LEDGER_ENABLED = true; // telemetry only: gates account creation; recording follows account presence

const round2 = (x) => Math.round(x * 100) / 100; // ledger money settles to cents like the trades it records

/** The port's commerce account, or null on markets built without one (bare fixtures stay untouched). */
export function commerceOf(city) { return city?.grain?.commerce ?? null; }

/** Open one city's account. Opening capital = stock on hand valued at base: the ledger treats the
 *  founding inventory as the purse's own goods (declared approximation; for an old save this values
 *  whatever stock exists when the save first ticks or loads under this version). Idempotent. */
export function openCommerce(world, city) {
  const found = commerceOf(city);
  if (found) return found;
  const inventoryBasis = {};
  let openingCapital = 0;
  for (const [good, e] of Object.entries(city)) {
    const base = world?.goods?.[good]?.base;
    if (!(base > 0) || !Number.isFinite(e?.stock)) continue;
    inventoryBasis[good] = round2(e.stock * base);
    openingCapital += inventoryBasis[good];
  }
  const account = {
    cash: round2(openingCapital),
    openingCapital: round2(openingCapital), // purse cash at open
    openingInventory: round2(openingCapital), // founding stock at base value
    inventoryBasis, // book value of stock on hand per good: what the purse paid for it
    retail: 0, // household consumption spend at the day's price
    received: 0, // payments from buyers taking goods off the market (traders, steward, construction)
    paid: 0, // payments to sellers putting goods onto the market (traders, steward, workshops)
    localSupplyValue: 0, // production stock nobody was paid for (land yields, city trickle), at base
    consumedBasis: 0, // book value that left the shelf with household consumption
    releasedBasis: 0, // book value that left the shelf with purchases
    households: null, // per-class purses, filled by settleHouseholdDay on the first day tick
  };
  city.grain.commerce = account;
  return account;
}

/** Open accounts across a market map (new games; old saves after fillMissingMarketRows). */
export function openMarketLedgers(world, market) {
  if (!world?.goods || !market) return;
  for (const city of Object.values(market)) if (city?.grain) openCommerce(world, city);
}

/** Goods sold INTO the market (trader, steward, workshop output): the purse pays, stock enters at the price paid. */
export function recordWholesaleSale(city, good, qty, revenue) {
  const a = commerceOf(city);
  if (!a || !(qty > 0) || !(revenue >= 0)) return;
  a.cash = round2(a.cash - revenue);
  a.paid = round2(a.paid + revenue);
  a.inventoryBasis[good] = round2((a.inventoryBasis[good] ?? 0) + revenue);
}

/** Goods taken FROM the market by a buyer: the purse receives the payment and releases book value
 *  proportionally (emptying the shelf settles its book exactly). stockBefore = units on hand before. */
export function recordMarketPurchase(city, good, qty, cost, stockBefore) {
  const a = commerceOf(city);
  if (!a || !(qty > 0) || !(cost >= 0)) return;
  const basis = a.inventoryBasis[good] ?? 0;
  const released = qty >= stockBefore ? basis : round2((basis * qty) / Math.max(1, stockBefore));
  a.inventoryBasis[good] = round2(basis - released);
  a.releasedBasis = round2(a.releasedBasis + released);
  a.cash = round2(a.cash + cost);
  a.received = round2(a.received + cost);
}

/** Stock added without a payment (primary production, city trickle): inventory at base value, no cash. */
export function recordLocalSupply(city, good, qty, base) {
  const a = commerceOf(city);
  if (!a || !(qty > 0) || !(base > 0)) return;
  const value = round2(qty * base);
  a.inventoryBasis[good] = round2((a.inventoryBasis[good] ?? 0) + value);
  a.localSupplyValue = round2(a.localSupplyValue + value);
}

/** Household consumption at the day's retail price: the purse earns retail, the shelf loses book value.
 *  Returns the recorded retail value (for the household attribution of the same day). */
export function recordRetailSale(city, good, units, unitPrice, stockBefore) {
  const a = commerceOf(city);
  if (!a || !(units > 0) || !(unitPrice >= 0)) return 0;
  const value = round2(units * unitPrice);
  const basis = a.inventoryBasis[good] ?? 0;
  const removed = units >= stockBefore ? basis : round2((basis * units) / Math.max(1, stockBefore));
  a.inventoryBasis[good] = round2(basis - removed);
  a.consumedBasis = round2(a.consumedBasis + removed);
  a.cash = round2(a.cash + value);
  a.retail = round2(a.retail + value);
  return value;
}
