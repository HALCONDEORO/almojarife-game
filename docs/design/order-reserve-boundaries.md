# Orders, cancellation and warehouse reserves

Status: design proposal, not runtime behavior. Baseline: main `bc6b4a4`.
This original design follows a private comparative study. No source-game code,
assets or economic tables are needed or included. The study does not settle our
refund or reserve policy.

## Existing contracts to keep

- `game.mjs`: `repairQuote` and `orderRepair` validate the selected hulls;
  payment happens once at order admission. `processRepairs` delivers hull work.
  `cancelRepair` refunds `floor(cost * left / total)` without undoing delivered
  work. Pending repairs and saved orders already exist. Do not add another queue.
- New ship orders currently debit the full catalogue price and store
  `{type, at, readyDay}`. `deliverOrders` removes the order and creates the ship.
  There is no separate admission/start phase or historical payment field.
- `steward.mjs` already buys only `buyTo - stock`, sells above `sellKeep`, and
  preserves a cash reserve. These are separate settings, not quantities of stock.
- `whlock.mjs` blocks every voluntary warehouse outflow, including manual loading,
  standing/manual sales and construction inputs. Legal forced removals remain
  outside that protection. Existing locks must retain that meaning.
- Current automatic routes trade with the market and ship cargo. They do not load
  warehouse goods. A warehouse loading-reserve setting would have no automatic
  route consumer today; do not ship a control that promises protection there.
- Public works already have public funds, council approval and daily delivery.
  Arrival news does not write price intelligence. Neither is a new queue gap.

## Candidate A: ship-order cancellation

Do not infer a refundable phase from the target delivery day. Do not reconstruct
what an old order paid from today's catalogue. Do not copy a reference game's
partial refund or material rule.

### Prerequisite PR, behavior-preserving

For **new** orders, store stable ID, admission day, paid amount and rules version
alongside the existing fields. Keep `readyDay` and delivery behavior unchanged.
Use an order-specific counter or namespaced ID, not a change that accidentally
renumbers ships. Serialize them as ordinary optional state; old orders remain
valid. Loading or rendering must not debit money or rewrite old orders.

This prerequisite is useful only if the following cancellation policy is accepted;
otherwise avoid unused state. An old order lacking provenance continues to deliver
normally and must not advertise cancellation. No synthetic refund is available.

### Policy decision before implementation

Choose whether any withdrawal period exists and exactly when work starts. Choose
its retained cost and whether any resources are consumed at admission or at start.
Almojarife currently does not debit ship-building materials, so a goods refund
would invent stock. A quote must state the paid amount, retained amount, refund
and the validity boundary. It is not a commitment until execution succeeds.

Execution resolves by ID and revalidates the current phase. A stale open panel
cannot bypass a crossed boundary. After success the order is terminal, cannot be
refunded twice and cannot deliver a ship. After delivery cancellation is rejected.

### Acceptance tests

- New and old pending orders survive reload and deliver exactly once.
- Cancellation conserves cash using the original paid amount after a catalogue
  change; it neither creates goods nor restores already delivered work.
- Repeated cancel, cancel after delivery, and duplicate delivery are no-ops.
- Open preview before the boundary, advance across it, then execute: reject or
  refresh under the chosen policy, never honor a stale quote silently.
- Two same-type orders at the same port resolve independently by stable ID.
- UI exercises open, quote, cancel, close, reopen, reload, ES/EN and desktop sizes.

## Candidate B: partial warehouse retention

A sale floor, purchase target, loading reserve and all-outflow lock are different
policies. Keep physical `goods` and cost basis untouched when configuring one.
Show physical stock and currently available quantity separately. A reserve above
stock means a deficit, not newly acquired goods.

### Smallest useful path

Do not begin with an unused automatic-loading control. First decide its consumer:
warehouse-to-ship automation would itself need a separate feature and route design.
For a proposed universal partial retention instead, explicitly decide whether it
covers manual loading, manual sales and construction. That is a new player rule,
not a proven consequence of either game's description. It must not silently change
`steward.sellKeep` or the full lock.

One possible implementation shape, **not selected policy**:

- Optional per-good unit floor, validated as finite nonnegative integer.
- `available = fullLock ? 0 : max(0, stock - floor)` only for covered consumers.
- An atomic execution computes the withdrawal from current stock, not the preview.
- Full lock wins; clearing it reveals the retained floor rather than erasing it.
- Repeated desired-state commands are idempotent. No async generation is needed
  for synchronous single-player commands.
- Bankruptcy/seizure exemptions remain explicit; a reserve is not a legal shield.

Do not share a mutable computed availability across orders. Sequential execution
must recompute it, so two competing orders cannot spend the same available units.
A preview is informational and owns no stock. A true reservation *for an order*
would instead need ownership, release and cancellation lifecycle, and is a separate
feature from this floor.

### Acceptance tests

- Set/clear/repeat; zero, exact stock, above stock and invalid numbers.
- Full lock plus floor; unlock does not erase the floor; old save has no new floor.
- Every covered consumer honors it; uncovered consumers remain unchanged.
- Competing construction and loading commands cannot double-spend goods.
- Buying fills only a deficit; changing the floor never creates stock or money.
- Partial withdrawal preserves cost basis proportionally; blocked operations do
  not mutate stock, basis, cash or progress.
- Save/load preserves policy and real quantities, with unchanged results after
  replay. UI names the actual protected consumers instead of promising all flows.

## Delivery sequence

1. Ship the existing repair cancellation preview independently, without changing
   the settlement rule (PR #770).
2. Resolve the product-policy choices above, then write one small runtime concern
   per PR. Do not bundle reserve rules with new ship cancellation.
3. Require independent exact-head review, regression tests and actual product
   captures before merge. A green design review is not runtime approval.
