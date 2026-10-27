# Wholesale purse, phase 1: binding cash

Phase 0 (docs/design/commerce-ledger-phase0.md) gave every port a wholesale account under
`grain.commerce` as MEASUREMENT ONLY and declared: "A binding purse is a later, separately
reviewed phase." This is that phase, and this review is the one it asked for. It replaces
the stalled draft in PR #229, whose tree predates the phase-0 ledger and the household-purse
cap (#539); the intent survives, the implementation is rewritten against current main.

## Rule

A wholesale sale INTO the market (a trader's `sell`, or the warehouse administrator's
standing sell order) can only draw the cash the port's purse actually holds:

- each unit is priced marginally as before, but the sale stops when the next unit would cost
  more than `account.cash` (partial fill);
- an empty or negative purse pays nothing: `sell` returns `{ ok: false, reason: "market has no cash" }`
  and the cargo stays aboard;
- `previewSell` applies the same cap, so the UI quote matches what the sale will do;
- buying FROM the market is unchanged (the trader pays; the purse receives);
- retail consumption, unpaid local supply and workshop output accounting are unchanged
  (workshop output stays telemetry in this phase; making it binding is a follow-up).

`WHOLESALE_PURSE_BINDING` in src/sim/procurement.mjs gates the behavior; markets without an
account (bare fixtures, old saves before `fillMissingMarketRows`) trade exactly as before.

## Why

Without a binding purse a port pays infinite money for goods, so saturation never reaches
traders: prices collapse but the port keeps absorbing cargo. With the purse binding, selling
into a saturated port stalls, which is the pressure the market-saturation redesign wants.

## Tests

- test/wholesale-binding.test.mjs: squeezed purse settles partially and previews the same
  numbers; empty purse refuses and keeps the cargo; account-less ports are uncapped.
- test/commerce.test.mjs: the phase-0 "never limits a trade" case is inverted to the
  binding expectation.
