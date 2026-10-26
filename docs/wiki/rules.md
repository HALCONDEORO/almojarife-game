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

## Port information: charts, rumours and informants
- The tavern sells navigation charts: one chart puts every port of a coast on the map, without prices, for 120 coins plus 70 per port on that coast (`CHART_BASE`, `CHART_PER_PORT`, `COASTS` in `src/game/charts.mjs`; eight coasts cover every city exactly once). A tavern offers charts for every coast but its own that still hides an unknown port.
- A route rumour (60, `ROUTE_RUMOR_PRICE` in `src/game/charts.mjs`) reveals the nearest unknown port with an inexact snapshot. A market rumour (40, `RUMOR_PRICE` in `src/game/intel.mjs`) gives today's stock of a known port with up to ±25% error (`RUMOR_ERROR`).
- An informant (150, `CONTACT_PRICE` in `src/game/contacts.mjs`) sends his port's prices every 7 days (`CONTACT_EVERY`), 4 reports in all (`CONTACT_REPORTS`); at most 4 informants at once (`CONTACT_MAX`). Reports are inexact (±15%, `CONTACT_ERROR`) and one in ten comes out plain wrong (±45%, `CONTACT_FALSE_CHANCE`, `CONTACT_FALSE_ERROR`) without the inbox saying which. Your own eyes always win: a port with your ship or warehouse ends every day with exact figures (`refreshIntel` in `src/game/intel.mjs`).

## Council commissions
- Each week a port may post a commission (50% odds, `CONTRACT_CHANCE` in `src/game/contracts.mjs`) for a good it is short of (`CONTRACT_SCARCITY_MIN`), with a deadline of 30 to 60 days (`CONTRACT_DAYS_MIN`, `CONTRACT_DAYS_SPAN`) and a premium of 20-35% over base value paid on completion (`CONTRACT_BONUS_MIN`, `CONTRACT_BONUS_SPAN`).
- A house keeps at most 3 active commissions (`CONTRACT_MAX_ACTIVE`). Completing one moves reputation +6 and counts toward the port's respect like a 1,500-coin sale (`CONTRACT_REP`, `CONTRACT_RESPECT_COINS`); letting it lapse moves reputation -4 (`CONTRACT_FAIL_REP`).

## Still to fill
Buildings (`docs/design/construction.md`, `dock-building.md`), missions (`docs/design/missions.md`).
