# Captain proposal, original gameplay design

A tavern lists a small deterministic roster per port. Hire directly onto an owned ship docked in that port. One captain per ship, one assignment per captain. No hiring/reassignment at sea or after game end. Existing saves without captain fields retain current behavior. Original names/portraits/writing only; do not reuse any other game's assets/text/code.

## Proposed first playable stage

Own scale 0..3 for Navigation, Weather, Defence and Trade. For first stage only Navigation is active, other skills visibly marked not yet active, not sold as benefits. Navigation speed multiplier 1 + 0.04*level, applied once to crew-adjusted voyage time, minimum one day. Never overrides insufficient crew. Travel estimates and actual departure must use the same function.

Illustrative candidate Inés del Puerto: Navigation2, other skills0. Proposed hire fee120 coins, wage2/day. Fee once at hire, wage accrues every day including docked days, settled weekly with visible captain line and reflected in dueNow/net worth/low-cash warning. No upfront infinite discount or fabricated free return on dismissal. Prices are own design, not historical wages. Confirm fee + ongoing wage + effect before hiring. Fleet view shows captain and traits. Dismiss only docked, clear salary immediately going forward, no hire-fee refund. Rehire exploit prevented by persistent hired/dismissed candidate state.

Atomic hire checks owned live ship identity, port, roster candidate, captain not already hired, no current captain, valid cash before charging/assigning. Tests cover double hire, stale candidates, foreign ship, at sea, no cash, missing/old state, save/restore, wage accrual, crew floor, exact estimate/departure agreement. Benchmark actual captain cost/speed before tuning.

## Later stages, not enabled

Weather may reduce real storm hull damage only when such an event exists and is tested. Defence may alter actual combat defence only, never guarantee immunity. Trade may reduce a verified fee component without minting money or changing quote/action inconsistently. Each requires its own rules, bounded values, tests, balance and review. No cosmetic skill sold as a working effect.

## Inspiration, not copied implementation

Patrician III manual: https://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf?t=1450011557 . Inspected manual includes captain recruitment/attributes sections. Community explanation inspected: https://patrician3.fandom.com/wiki/Captain . It describes tavern recruitment, sailing/trade/fighting skills and salaries. These are comparison references, not specs or permission to copy. Our own scale/formulas, roster names and UI are independent. No assertion about Port Royale mechanics without an inspected source.

Mock at web/mock/captains.html is Spanish review-only. No save reads/writes or actual hire; production requires ES+EN. Show Marco before connecting.
