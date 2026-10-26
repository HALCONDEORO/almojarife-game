# Rules and mechanics

Versión en español: [es/rules.md](es/rules.md).

Core rules as implemented on main. Each statement names its constant or source file; deeper design notes live in `docs/DESIGN.md` and `docs/design/`.

## Time and calendar
- Game time runs in ticks: 240 per day, 10 per hour (`TICKS_PER_DAY`, `TICKS_PER_HOUR` in `src/sim/clock.mjs`). The day stays the accounting unit: market tick, upkeep accrual, loans, settlement and ranks run once per day each.
- Each port ticks its market at its own hour of the day (`marketSlot` in `src/game/game.mjs`): updates spread through the day instead of one midnight pulse, and daily quantities are unchanged.
- Pacing is a view choice, not a rule (`src/view/timepolicy.mjs`): with automatic time a day lasts 20 s at 1x and speeds are 1/2/4/8; the manual pacing is 1.5 s per day with 1/2/4.
- Historical background: design study in `docs/design/time-model.md`.

## Trade and fees
- Market fee of 2% on every deal, charged to both sides (`FEE` in `src/sim/trade.mjs`). Prices settle to cents: buys round up, sells round down, so a one-port round trip always loses to the fee.
- Demand is split by social class and each class stops buying above its tolerance; see [classes.md](classes.md) and the goods table ([generated/goods.md](generated/goods.md)).

## Voyages and encounters
- A voyage's length is its route distance converted to ticks by the ship's km/day, a crew factor and a per-leg seeded wind factor between 0.8 and 1.2 (sail code in `src/game/game.mjs`). Arrivals land on the exact tick and show day and hour; the wind rolls at departure and does not re-roll at sea.
- Sea encounters roll once per tick with the same total exposure per day as before (`SEA_ENCOUNTER_CHANCE_TICK` in `src/game/encounterdaily.mjs`), so long voyages meet them at varied hours.

## Weekly settlement, bank and reports
- Ship upkeep accrues daily and is paid every 7 days (`SETTLE_EVERY` in `src/game/ledger.mjs`). The settlement always charges the full bill; an unpaid deficit bears 2% interest per week (`OVERDRAFT_RATE`) and past 3,000 of deficit the house is bankrupt (`OVERDRAFT_LIMIT`). Net worth subtracts upkeep accrued but not yet paid.
- The moneylender lends in steps of 100 up to half of net worth (max 5,000), at 1% a week, due in 56 days (`LOAN_STEP`, `LOAN_MAX`, `LOAN_RATE`, `LOAN_TERM_DAYS` in `src/game/bank.mjs`); borrowed money does not count toward the goal. Design and sources: `docs/design/weekly-settlement.md`.
- Each settlement writes a weekly report and posts a message; the inbox keeps the last 60 messages and 52 reports (`MAX_INBOX`, `MAX_REPORTS`).

## Still to fill
Buildings (`docs/design/construction.md`, `dock-building.md`), missions (`docs/design/missions.md`), charts and informants.
