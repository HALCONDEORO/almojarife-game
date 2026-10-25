// Household purses, phase 0: an attribution estimate over the ACTUAL legacy consumption,
// under the same honesty rule as needsLedger ("estimated-proportional", never an observed
// purchase). Each class earns a daily income per person, pays its attributed share of the
// day's retail spend, and accrues `unmet` when its purse cannot cover that share. Nothing
// here limits consumption: the legacy market decides what is eaten; these purses measure
// whether the classes could have paid for it.
import { CLASSES, classCounts } from "./classes.mjs";
import { commerceOf } from "./procurement.mjs";

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
