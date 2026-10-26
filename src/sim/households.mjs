// Household purses, phase 0: an attribution estimate over the ACTUAL legacy consumption,
// under the same honesty rule as needsLedger ("estimated-proportional", never an observed
// purchase). Each class earns a daily income per person, pays its attributed share of the
// day's retail spend, and accrues `unmet` when its purse cannot cover that share. Nothing
// here limits consumption: the legacy market decides what is eaten; these purses measure
// whether the classes could have paid for it.
import { CLASSES, classCounts } from "./classes.mjs";
import { commerceOf } from "./procurement.mjs";

/** Goods a purse never caps: the daily food basket (NEED_GROUP "food" plus the optional legumes).
 * The purse LIMITS everything else and only MEASURES these (docs/design/household-purses-limit.md).
 * Kept here, not in NEED_GROUP: it is a purse mechanic, not the wiki's needs taxonomy. */
export const PURSE_UNCAPPED = new Set(["grain", "fish", "meat", "salt", "olive_oil", "legumes"]);

/** Daily income per person by class (carried from docs/design/household-procurement-phase1.md, 22/10 research policy). */
export const HOUSEHOLD_INCOME = Object.freeze({ poor: 0.48, middle: 1.2, rich: 4.65 });

const round2 = (x) => Math.round(x * 100) / 100;

/** Settle one day of household accounts for a city: income in, attributed retail spend out.
 *  spentByClass = { class: money } as attributed by the market tick from actual consumption.
 *  No-op on markets without a commerce account. Returns the households map. */
export function settleHouseholdDay(city, spentByClass, incomePerPerson = HOUSEHOLD_INCOME) {
  const a = commerceOf(city);
  if (!a) return null;
  const counts = classCounts(city.grain?.pop ?? 0);
  const households = (a.households ??= Object.fromEntries(CLASSES.map((c) => [c, { cash: 0, income: 0, spent: 0, unmet: 0 }])));
  for (const cls of CLASSES) {
    const h = households[cls];
    const income = round2((counts[cls] ?? 0) * (incomePerPerson[cls] ?? 0));
    h.cash = round2(h.cash + income);
    h.income = round2(h.income + income);
    const due = round2(spentByClass?.[cls] ?? 0);
    const paid = Math.min(h.cash, due);
    h.cash = round2(h.cash - paid);
    h.spent = round2(h.spent + paid);
    if (due > paid) h.unmet = round2(h.unmet + due - paid);
  }
  return households;
}

/** Cap one discretionary retail sale by what each class purse can still pay today.
 * budget = { class: cash left for non-food today }; shares = { class: desire share (any scale) }.
 * Returns { units, spend }: the whole units the purses can afford (<= units) and the exact spend
 * per class for those units (<= budget per class). Food never goes through here: it is measured,
 * not capped, until a welfare model exists (docs/design/household-purses-limit.md). */
export function capRetailByPurses(budget, shares, units, unitPrice) {
  const zero = { units: 0, spend: Object.fromEntries(CLASSES.map((c) => [c, 0])) };
  const total = CLASSES.reduce((a, c) => a + (shares[c] ?? 0), 0);
  if (!(units > 0) || !(unitPrice > 0) || !(total > 0)) return zero;
  // Invariant: sum(spend) === units * unitPrice. Each class buys whole units bounded by BOTH its
  // desire share and what its purse can pay; a class that cannot pay neither buys nor is charged,
  // and its units are NOT resold to other classes (desire is desire). Unsold units stay on the shelf.
  const rows = CLASSES.map((c) => ({
    c,
    raw: (units * (shares[c] ?? 0)) / total, // fractional desire for this sale
    cap: Math.floor(Math.max(0, budget[c] ?? 0) / unitPrice + 1e-9), // whole units this purse can pay
  }));
  const alloc = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  let left = units;
  for (const x of rows) { const u = Math.min(Math.floor(x.raw), x.cap); alloc[x.c] = u; left -= u; }
  rows.sort((a, b) => (b.raw % 1) - (a.raw % 1) || CLASSES.indexOf(a.c) - CLASSES.indexOf(b.c)); // largest remainder, deterministic
  for (const x of rows) { if (left <= 0) break; const maxU = Math.min(Math.ceil(x.raw), x.cap); if (alloc[x.c] < maxU) { alloc[x.c]++; left--; } }
  const sold = CLASSES.reduce((a, c) => a + alloc[c], 0);
  return { units: sold, spend: Object.fromEntries(CLASSES.map((c) => [c, alloc[c] * unitPrice])) };
}
