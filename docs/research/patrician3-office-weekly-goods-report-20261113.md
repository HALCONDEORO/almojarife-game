# P3 office goods report: current stock is not last week's output

Research note, 2026-11-13. Main inspected: `7989210`.
Clean-room documentation only. No source figures, quotations, slogans, assets,
excluded modding material or implementation approved.

## Finding and overlap boundary

P3's office goods page combines current stock with the previous week's business
production or consumption. Its manual explicitly gives zero output a meaning:
the corresponding business exists but produced nothing during that period.
That is different from having no business, no completed observation window or
no saved record. It is also different from a planned production rate.

This note does not reopen warehouse sizes, overflow rental, guards, office
construction or administrator limits, which existing notes cover. Pending
PR940 covers chosen production capacity versus actual utilization, employment
and costs. Its inspected text does not specify this office report's period or
zero-output semantics. Existing production, local-needs and player-statistics
notes are adjacent coverage, not an absence of all reporting.

## Evidence and limits

| Source | Contribution and limit |
| --- | --- |
| S1, full English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Section 8.2.1.2, printed/PDF p.23, extracted as a separate page: current stock plus previous-week production/consumption in the player's business; an existing business can show zero output, usually due to workers or inputs. This does not identify every reason, cutoff time or aggregation formula. |
| S2, GRYOnline office guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/kantor/z336d6 | Editorial account consistent with the previous-week and zero-output distinction. Page shows an update date in 2019; no live reproduction. |
| S3, Steam Stock of goods discussion, October 2016: https://steamcommunity.com/app/33570/discussions/0/350543841945850485/ | Players ask about red production/consumption figures; a reply attributes them to incomplete staffing. Anecdotal interpretation, not verified color semantics or a reason to copy a warning color. |
| S4, community Manager page: https://patrician3.fandom.com/wiki/Manager | Stock targets and purchase settings are described separately. Context for not treating inventory policy as measured output; no quantities adopted. |
| S5, community trading guide: https://steamcommunity.com/sharedfiles/filedetails/?id=275838607 | Explains administrator buy/sell settings. Context only, not a period-report specification or independent output test. |
| S6, GRYOnline action-buildings guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Describes town market information including public and merchant production. Same editorial family as S2. A town-wide report is not the office's own-business report. Page shows an update date in 2019. |

No P3 session, report rollover or saved record was inspected. The manual does
not settle whether its previous-week window rolls continuously or closes at a
calendar boundary, how acquisitions mid-period appear, or whether all input
consumption is measured rather than estimated. Those remain questions.

## Current main, checked in actual function bodies

| Code read | Existing behavior and boundary |
| --- | --- |
| `src/game/game.mjs`, `warehouseOf` | Returns current owned warehouse state. Current goods on hand are a stock, not a production flow over a period. The separate `storeGoods` and `takeGoods` bodies transfer inventory and cost basis; those transfers must not become output simply because warehouse stock changes. |
| `src/game/buildings.mjs`, `workshopTick`, primary branch | Updates local market stock and an owned building's `produced` field. That field accumulates lifetime main-output units, not a weekly office quantity. The stock cap means its nominal amount can differ from the actual market-stock increment. By-products are handled separately and are not another increment to that main counter. |
| `src/game/buildings.mjs`, `workshopTick`, processor branch | Buys inputs and places output in the local market, updates cash and commerce telemetry, then increments `produced` by batches. This is a different unit from the primary branch's output units. Summing these counters as one goods total or subtracting snapshots into a universal weekly report would be misleading. |
| `src/view/buildingsview.mjs`, `buildingsRows` | Existing active, non-halted producer rows expose `produced`, a rate and other state. This is useful existing reporting, but neither a uniform unit nor the manual's own-business prior-week ledger. Halted buildings take a different row path, so a missing displayed field is not itself proof of no business. |
| `src/game/ledger.mjs`, `logSell`, `settleWeek` | Existing weekly trade, running-cost, debt and building-cost reports exist. The inspected report record does not contain an own-business per-good physical production/consumption ledger. Sale profit is not manufactured output or input consumption. |
| `src/view/ledgerview.mjs`, `reportsHtml` | Renders those existing settlement and trade reports. A weekly heading does not make every adjacent counter a same-period production measure. |
| `src/sim/procurement.mjs`, `commerceOf`, `recordLocalSupply` | Records the town commerce account and value of unpaid supply. That account is not an owned-business per-good weekly physical ledger; a value total must not be relabeled as goods consumed or units produced. |

Every identifier above was located and its relevant body read on the stated
base. No claim relies on an old phase header. No change to reserved production,
procurement, needs or household code is proposed.

A real grep of research notes and pending PR930-940 was saved before writing.
It found existing weekly town-demand descriptions and general production
reporting, but no dedicated office prior-period/zero-output study. The actual
PR940 diff was read to avoid repeating its capacity-control topic. This is a
scoped coverage statement, not a claim that all production data is absent.

## Own design questions, not recovered P3 internals

- Would a small own-business report help explain idle assets better than the
  existing rate, margin and lifetime displays? Keep that decision separate
  from adding capacity controls or changing production economics.
- Which physical unit and ownership scope would each row use? Separate main
  goods, by-products, batches, input use and money before choosing aggregates.
- What period is complete? Distinguish a completed zero-output period, a new
  business with only partial coverage, missing historical data and no business.
- Can the report derive from actual production events rather than inventory
  differences that also include transfers, sales and purchases?
- How should a sold, demolished or newly acquired business contribute during a
  period? Define attribution and save/load once-only rollover before coding.
- Should the view explain known causes without guessing from zero alone?
  Staffing, fire, cash, missing inputs and profit checks are distinct states.

## Author verification

Existing baseline: `node --test test/buildingsview.test.mjs
 test/workshop-costs.test.mjs test/ledger.test.mjs
 test/economy-own-good-ledgers.test.mjs` passed 65 tests with no failures.
No test was added or modified. These verify adjacent current behavior, not a
new report, a reconstructed P3 formula or a UI. No visual audit or P3 runtime
reproduction is claimed. Patch whitespace and clean-base application were
checked at handoff. Independent documentary review remains separate.
