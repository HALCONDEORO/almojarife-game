# Needs ledger periods and source boundaries

Internal telemetry only. No new player metric, rates, economic effect or save
schema. This contract complements `consumption-service-contract.md`: that contract
separates need, desire, service and remaining inventory; this one pins when those
facts are recorded and resumed.

## Unit, source and time window

- `daily` is the latest completed market tick for one port, identified by its
  `daily.day`. It is replaced by that port's next tick, not by rendering.
- `totals` and `byClass` accumulate every recorded port-market tick since the
  ledger was created. `days` is the count of recorded ticks, including initial
  preparation. It is not the campaign day, a rolling week or a calendar year.
- Need, desired purchases and consumed quantities use game market units. Signed
  balance is physical need minus consumed, not a backlog of purchase requests.
- Class attribution is proportional and estimated. Adding class receipts must
  recover the port's served quantity without a second withdrawal.
- Construction and industrial purchases are not household consumption. A stock
  update between ticks changes the next shelf; it does not create a household
  receipt in the previous period.
- Commerce retail values and the player's weekly cash report have different
  sources and periods. They must not be added to household consumption units.

## Sequence matters

A market tick adds local supply, computes demand, limits whole-unit service by
stock, and records the resulting receipt. A subsequent tick replaces `daily` and
adds to cumulative totals. Exact and stock-limited fulfilment use the same served
unit. Recording intended demand before the clamp must never turn it into served
consumption.

Ports tick at staggered slots during a game day. A render between slots can show
different ports' latest completed days; it is not an atomic all-port snapshot.
The developer needs table labels its latest day and cumulative tick count. It
reads those records without resetting or advancing them and remains hidden from
normal player mode.

## Saving mid-day

The save contains the current tick and each port's ledger. There is no separate
fractional-carry accumulator in this consumption path. The regression writes a
validated manual save slot at a real half-day tick, reads it through the actual
slot functions and deserializer, then advances both restored and uninterrupted
games through two more days. Every port's needs ledger must match.

This tests the DOM-free save-slot path and real engine continuation, not browser
clicks, autosave timing, backup rotation or storage quota recovery. Those remain
owned by their existing tests. No claim of a synchronized all-port daily reset.
