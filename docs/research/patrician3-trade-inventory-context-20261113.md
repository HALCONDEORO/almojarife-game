# P3 trade entry: make the inventory being traded visible

13 November 2026. Main inspected: `7989210`.
Clean-room documentation only. No copied wording, balance figures, assets,
binary inspection or excluded modding material. No implementation approved.

## Narrow finding and overlap

The P3 dock crane is a trade-menu entry point, not a documented loading-speed
upgrade. The manual conditions access on a local office or selected docked
ship. Its trade section distinguishes selected ship/convoy trading from office
trading when no ship is selected, and distinguishes market exchange from an
internal warehouse transfer. It displays the involved parties and capacity.
This makes inventory context part of the transaction, not merely decoration.
[S1]

Real grep of `docs/research` and actual pending PR930-952 diffs preceded this
note. Existing notes study office stocks, transfer invariants, route actions,
warehouse overflow, prices and ship selection. PR932 mentions the crane for
weapon transfer; that is not this ordinary-goods context study. PR949 studies
the minimap; PR947/951 study market demand/prices, not which owned inventory a
manual click affects. No claim that trading, transfers or contextual UI are
absent follows from this scoped coverage gap.

## Public evidence read

| Ref | Source | Contribution and limit |
| --- | --- | --- |
| S1 | Full English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Printed/PDF p.22, 8.1.4, and p.32, 10.2, each extracted separately. Defines ship/office context, market versus warehouse movement, visible parties and conditional crane entry. No timing or crane-productivity model. |
| S2 | GRYOnline action buildings guide, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Editorial description of crane entry with office or ship present. Consistent documentation, not an independent click test. |
| S3 | P3 wiki Manager: https://patrician3.fandom.com/wiki/Manager | Read for office stock-policy context; does not establish the precise ordinary-goods selection transition relied on here. Not additional proof of S1's contract. |
| S4 | DefKey, P3 shortcuts: https://defkey.com/patrician-3-shortcuts | Lists crane access as office/town trade. Its abbreviated control table does not explain all selection states and cannot override the manual's detailed ship context. |
| S5 | Steam, Transfer good from ship to ship, July 2020: https://steamcommunity.com/app/33570/discussions/0/4153959587262640438/ | Players distinguish warehouse-mediated cargo movement from direct personnel transfer. Community testimony, not a runtime proof of every convoy/transfer case. |
| S6 | Steam trading guide: https://steamcommunity.com/sharedfiles/filedetails/?id=275838607 | Describes warehouse loading and selling to a town as separate route actions. Context only; its price lists and worked quantities are not adopted. |

Coverage is primary documentation, editorial reference and community material.
No P3 session was tested. Exact selection behavior with multiple ships, a
selected ship in another town, convoy aggregation or stale windows remains
unverified. The manual does not justify a new crane construction mechanic or a
cargo-handling timer. S5 does not justify removing our own transfer features.

## Current main: relevant bodies read, not historical headers

| Code inspected | Positive existing behavior and boundary |
| --- | --- |
| `web/main.mjs`, market render and buy/sell handlers | The market is built around the selected ship and its port. Buy clicks call `doBuy`; sell clicks resolve the local warehouse at click time and call `doSellCombined`. Cargo and stored quantities are displayed together with a separate stored amount. This is not P3's pure ship-versus-office switch. |
| `src/game/game.mjs`, `doBuy` | Uses the supplied ship and its local market, then records payment and trade effects. A market buy here is not implicitly a warehouse purchase because an office exists. |
| `src/game/game.mjs`, `doSellCombined` | Clamps to available hold plus unlocked store goods, sells hold first and then store goods, and applies the combined financial effects once. A sale may intentionally consume both owned inventories. Do not label it as ship-only or silently replace it with P3's behavior. |
| `src/game/game.mjs`, `doSellStored` | Separate warehouse-to-market sale path already exists with its own guards and ledger effects. It is not an internal transfer or a missing capability to propose anew. |
| `src/game/game.mjs`, `warehouseOf`, `storeGoods`, `takeGoods` | Local warehouse lookup and internal movements already exist. Transfer bodies check ship ownership, voyage state and local warehouse, clamp to capacity/stock and move cost basis. Loading also checks warehouse locks. Those are different operations from paid exchange with the town. |

Every named identifier above was located and its relevant body read on the
stated base. This inspection does not establish complete guards on every lower
market function or prove a bug in detached/stale UI callbacks. No such bug is
claimed. The selected-ship context already has presentation and execution;
what needs an actual visual audit is whether the existing labels make a combined
sale's source inventory clear enough. No visual defect is asserted here.

## Original review questions, not recovered P3 internals

- Audit the existing market's labels and preview before adding a mode switch.
  Can a player tell that buying fills the ship while selling can also draw on
  the local warehouse? Keep the deliberate combined-sale behavior explicit.
- Does the final preview name port, ship and affected warehouse, with source
  quantities and locks, at the moment the user acts?
- When selection changes or a ship leaves, should an open market close, refresh
  or refuse an old request? Test current behavior before deciding changes.
- Internal transfers must retain goods and book cost without becoming revenue,
  a town purchase or a new sale. Existing commands already support that boundary.
- If an office-only trade mode is ever proposed, define destination inventory,
  capacity and transaction effects independently. A new entry point is not
  permission to reuse a ship action against an unrelated storage object.

## Author verification

Existing `warehouse`, `warehouse-sell`, `marketdesk`, `market-labels` and
`market-cargo-filter` test files: 21 passed, no failures. No tests changed.
These cover adjacent current behavior, not reconstructed P3 selection semantics
or a verified UI. No visual audit or P3 runtime reproduction. Patch whitespace
and clean-base application checked at handoff. Independent review still needed.
