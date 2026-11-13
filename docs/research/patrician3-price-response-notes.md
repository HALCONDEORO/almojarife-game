# P3 price response, balance indicator and trade difficulty: the documented trading-contract edges behind our market

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, balance values, excluded
modding material or executable inspection. No implementation approved.

## Narrow finding and existing coverage

Within the P3 manual's trade chapter, three documented mechanics on its
price-formation page have no manual-primary treatment in existing notes:
the price moves with each transaction; a balanced market shows itself in
purchase and sale prices nearly coinciding, signalling that the town's
needs are covered for some weeks, and that balanced price is the same
whatever the game settings; and a higher trade difficulty narrows the
player's margins on scarce goods while costs do not move. The first of
the three is not a new absence: the routes notes already record
unit-by-unit pricing as a verified parallel from the community
compendium, and this manual page is its primary-source support.

The same manual page's demand composition - town-owned public production
and the exclusion of the trader's businesses' raw-material needs from the
market's demand - is owned by the pending market-demand-boundary note and
is deliberately not repeated here. The Tippsammlung market chapter's
community findings (absolute per-good price floors and ceilings, per-class
pricing tactics) are recorded in the market notes and are likewise not
reclaimed. Population needs per class belong to the citizens-supply note;
warehouse capacity, storage rental, guards and administrator limits belong
to the office-info, underworld and office-goods-report coverage.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Production and Prices section of the trade chapter (printed page 21): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation for the three mechanics above: the stock-versus-expected-demand difference sets the purchase and sale price and does so per
transaction rather than as a periodic average (primary documentation for the unit-by-unit finding already recorded in the routes notes from the community compendium); supply and demand count as balanced when the town's needs are covered for a stretch of weeks, with
nearly coinciding purchase and sale prices as the indicator; every good has such a balanced price, identical whatever the game settings; on a higher trade difficulty, scarce goods trade lower, so margins narrow while costs do not move. No rates, elasticities or week counts are given. |
| S2 | Tippsammlung 2010 (community compendium), market chapter, as already recorded in the market notes: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf | Community layer, cited only for comparison: per-good price bounds that vary with difficulty - corroborating that difficulty acts on the price space, not only on starting conditions. Exact P3 equivalence not claimed by the source: doctrine to test. |

## Main inspection

Real grep and reading across `src/sim` and `src/game` found the first
mechanic already built as own design, the second present in a different
form, and the third absent:

- Per-transaction response: built, and already recorded. The routes
  notes verified our unit-by-unit pricing against the community source;
  this manual page is its primary-source support. `src/sim/trade.mjs:70-73`
  prices each unit at the stock level it leaves or joins, so a large deal
  walks along the price curve against the trader; the buy loop reprices
  unit by unit (`src/sim/trade.mjs:80-85`) and so does the sell loop
  (`src/sim/trade.mjs:107-108`), each at a unit-level percentage fee
  (`src/sim/trade.mjs:33`). The underlying curve is
  `src/sim/market.mjs:36`, stock against a target - the documented
  stock-versus-demand direction, written from first principles per the
  market header.
- Balance indicator: no equivalent signal, though near-coinciding quotes
  are routine. Our buy and sell prices are shaped by the same per-port
  fee multiplier applied per unit, rounded so the fee keeps its nominal
  size (`src/sim/trade.mjs:34-36`), so exact equality cannot occur by
  construction but close quotes can and do. Nothing in the inspected
  route treats near-equal buy and sell prices as a balance reading: the
  spread is just fee and rounding over the curve's current stock, with
  no equilibrium trigger attached. Our coverage signal lives inside the
  price curve itself - stock relative to target.
- Trade difficulty on margins: no direct preset modification in the
  inspected route. `src/game/difficulty.mjs:2-13` defines the presets as
  starting cash plus an upkeep multiplier (`difficultyOpts`), and the
  price function (`src/sim/market.mjs:36`) reads no difficulty input.
  The fee actually charged is the same per-port fee multiplier scaled by
  reputation - `FEE * feeMul(g, port)` at `src/game/game.mjs:416`,
  `:429`, `:444` and `:477` (imported at `src/game/game.mjs:65`) - so
  realized margins do move with reputation and market state; they just
  do not move with the chosen preset.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

The per-transaction edge is already ours, so the remaining record asks two
small questions rather than a build. If selected later: a readable balance
cue could take the form of hint wording tied to how far stock sits from
target - the signal our curve already holds - without adopting the
documented buy-equals-sell form, whose exact equality our fee rules out; and
a hard-preset margin effect, if ever wanted, belongs in the price curve or
fee inputs with the difficulty id, not in starting conditions. Both are
flag-gated presentation or tuning changes; flag-off must mean
byte-identical saves.

Future tests should prove: flag-off games untouched; any new hint is
deterministic by port, good and day; a difficulty-linked margin input, if
added, leaves easy and normal presets byte-identical to today; and quotes
and commits keep repricing unit by unit exactly as now. Decide first, as
explicit owner calls: whether a balance cue is wanted at all beyond the
existing price display, and whether difficulty should ever touch margins
in a game whose presets currently differ only in starting pressure.

## Open questions

- In P3, does the balanced price act as a real attractor the market
  relaxes toward, or is it only a reading aid for the player? The manual
  states the indicator, not the dynamics.
- Does the higher trade difficulty in P3 move only the sale side for
  scarce goods, or purchase prices too? The manual names the margin
  effect but not its per-side shape.
- Is the balanced price per good also independent of town size, as the
  across-settings claim suggests? Untested.
