# P3 automatic stop phases: ordering is more than moving a town

13 November 2026. Main inspected: `ef688e9`.
Clean-room documentary comparison only. No implementation approval,
competitor figures, copied prose, assets or file-format research.

## Narrow finding and existing coverage

The P3 manual describes a stop as processing disposal actions before taking
cargo aboard. Within those phases, the goods list determines precedence.
Its discussion includes market sales and office unloading, followed by
loading. This documents phases as well as a reorderable list. It does not
specify an atomic transaction, rollback after a rejection, or a retry policy.
In particular, it does not justify adding warehouse transfers to every
existing route action in Almojarife. [S1]

This is a coverage clarification, not a missing sell-before-buy feature.
Real grep of `docs/research` on main and inspection of merged PRs 930-957
found `p3-p4-route-ui-20261112.md` already covering goods priority and town
reordering. `patrician3-route-import-adaptation-notes.md` already points to
this manual section as adjacent coverage; it studies portability rather
than stop execution. PR950 studies remembered prices, PR953 manual trade
inventory, and PR955 bounded time advancement. None supplies a warehouse
route transition policy. Do not reclaim their existing work.

## Evidence ledger

| Ref | Public source inspected | Contribution and limits |
| --- | --- | --- |
| S1 | P3 English manual, printed/PDF page 26, section 8.4.11: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete local PDF text, page inspected separately. Documents disposal before loading and goods precedence within the ordered list. No atomicity or failure contract. Page 24, section 8.4.5, separately inspected for priority context. |
| S2 | GRYOnline route guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/szlaki-handlowe/zf36d2 | Price, quantity and priority discussion read. Prioritising a purchase leaves remaining capacity for a later good. Close to the manual account, not independent runtime evidence for phases. |
| S3 | Community wiki, Trade Routes: https://patrician3.fandom.com/wiki/Trade_Routes | Describes reordering and recommends separate local visits for disposal and acquisition. That workaround does not establish that every edition needs separate visits. Its timing and town-limit claims are not adopted. |
| S4 | Steam discussion, Trade Office: https://steamcommunity.com/app/33570/discussions/0/2595630410183789003/ | Player describes a multi-visit office workflow. Anecdotal workaround only, not proof of a universal execution sequence or necessary timing. |
| S5 | Steam discussion, goods amount setting: https://steamcommunity.com/app/33570/discussions/0/540742485424298448/?l=greek | Players address residual cargo by unloading before replenishing on a later visit. Useful failure scenario, not a measured top-up or phase specification. |
| S6 | Steam guide, Patrician III - How to start: https://steamcommunity.com/sharedfiles/filedetails/?id=463659359 | Player advice puts sales before purchases and rearranges goods. Supports practical importance of capacity precedence, not independent engine verification. No suggested balance settings adopted. |

S3-S6 do not overturn S1's documentary ordering. Their separate-stop advice
might concern different workflows, timing, configuration or versions; none
was reproduced here. The public descriptions do not settle that discrepancy.
Search exposed an autoroute file-format project; it was not opened or used.
No game binaries, modding sources or source-derived identifiers were studied.

## Actual main contract, bodies read

All identifiers below are in `src/game/routes.mjs` at the inspected main.

- `processRoutes` (:74) runs legacy sales before purchase attempts, with
  repair between them. It dispatches advanced routes separately; sailing,
  convoy membership and ongoing repairs already gate execution.
- `setRouteAdv` (:125) normalises separate ordered sell and buy arrays. It
  rejects adjacent identical cities, including the loop boundary. Repeating
  a town as a workaround is therefore not mechanically portable from S3-S5.
- `processRouteAdv` (:198) visits sell rules in array order, then repair,
  then buy rules in array order. Capacity and cash are recomputed for each
  purchase. A failed or skipped sell is logged but does not cancel every
  following rule. Successful earlier trades are not rolled back here.
- `planSell` (:174) checks the selling floor against progressively updated
  stock; `planBuy` (:156) plans against remaining room, stock and budget,
  including port fees. This is existing economic execution, not a proposal
  to replace it with a competitor algorithm.
- `routeRepair` (:48) can stop the visit after sales and before purchases
  when a repair is accepted. A visit is therefore not a single indivisible
  market transaction even when its diary groups the actions.

Grep of this module for warehouse-transfer calls finds no store/take action
execution. This is a bounded statement about this route path, not absence of
manual warehouse movement, office management or trade elsewhere in the game.

## Verification and future questions

Existing tests run: `advancedroutes`, `route-trade-precedence`,
`route-autorepair` and `route-order`, all under `test/` with `.test.mjs`.
They pass unchanged. The precedence fixture directly verifies that sales
free hold capacity before purchases and earlier eligible buy rules receive
scarce room. This is already implemented, not a newly discovered engine bug.
No UI defect or visual audit is asserted; no tests or runtime files changed.

If office actions are ever added, decide their phase, locked-stock policy,
failure continuation and diary attribution explicitly. Would a partially
successful visit wait, depart or retry? Which goods may be sold after loading
from an office? Can a repair interrupt office transfers? These are our open
product questions, not measured P3 rules. Preserve current sale/purchase
precedence until a separately reviewed design changes it.
