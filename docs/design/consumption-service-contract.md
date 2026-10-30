# Household service and an empty shelf

This regression contract describes Almojarife's current market, not another game's
model. It adds no rates, save fields, prices, stock changes or wellbeing rules.

## Four different readings

1. **Physical need** is a fractional game-unit quantity from the class basket,
   without price or shelf scarcity. It is not a historical ration.
2. **Desired purchases** include the current affordability and shelf-scarcity
   multipliers. Whole-unit purchase requests settle by the difference between
   `round(demand * (day + 1))` and `round(demand * day)`.
3. **Served purchases** cannot exceed the shelf stock. `needsLedger` records the
   actual consumption once, allocated proportionally to classes as an estimate.
4. **Remaining inventory** is what is left after supply and purchases. It does not
   say how much of a request was served.

Exact whole-unit fulfilment can leave an empty shelf. Zero demand and zero stock
also leave an empty shelf. Neither fact alone proves an unmet purchase request.
The physical ledger's signed `balance = need - consumed` is not the rounded
purchase request minus service: fractional settlement can make it negative on a
fully served day. Do not label that surplus a shortage, debt or negative stock.

## Ordering and continuation

The market first adds production and the local trickle, within shelf capacity.
It then withdraws household consumption. Earlier construction or industrial
withdrawals are not household purchases and are not counted again. With commerce
accounts, food is processed before purse-capped discretionary goods. The separate
commerce tests own those purse rules; this regression isolates the stock/service
contract with commerce disabled.

There is no saved fractional carry accumulator in this path. The day index and
the current demand determine rounding. For a constant demand, differences
between consecutive rounded cumulative totals telescope exactly. If prices,
population or scarcity change, this is not an accumulator of earlier unmet
requests. JSON continuation must preserve the day and market/ledger state.

## Limits that remain explicit

Citylife currently reads shelf coverage (`stock / target`) for its own calibrated
mood and population rules. It does not read a served/desired ratio from this
ledger. This PR does not silently replace that economic rule. Any change needs
its own design, balance evidence and review, including exact-fulfilment and
zero-demand cases.

The ledger is internal telemetry, not a new player panel. Regression tests cover
exact fulfilment, no demand, constrained service, fractional rounding, prior
withdrawals, input validation and JSON continuation. The existing telemetry tests
also compare the economy with the ledger enabled and disabled.
