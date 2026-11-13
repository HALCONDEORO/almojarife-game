# P3 external imports: a gateway supply channel is not local production

13 November 2026. Main inspected: `ef688e9`.
Clean-room documentation only. No supply, price, transport or map change
approved. No competitor quantities, delivery calendar, gateway table, text,
formulas or assets adopted.

## Narrow finding and coverage

P3's manual 8.5.3 documents regular deliveries from beyond the ordinary town
production network. Some goods arrive from the hinterland, others from the
Mediterranean; only certain towns receive these flows. That is a distinct
concept from producing the good locally or requiring the player's expedition
to bring back every unit. The manual does not provide enough detail to build
a delivery scheduler, declare particular arrivals guaranteed or calibrate one.

Real grep in `docs/research` and `docs/design` for imports, external supply,
hinterland deliveries and Spanish equivalents found the broad mention in
`patrician3-4-events-trader-ai-notes.md`, not a focused study of this channel.
PR930-957 are merged in the inspected main. Market-demand/price-response,
citizens-supply and manual-expedition notes were checked and remain separate:
this is not another demand formula, supply-satisfaction or expedition note.
Existing overland-trade research concerns player transport, not ambient imports.

## Public evidence and dependencies

| Ref | Source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 English manual, printed/PDF p26, 8.5.3: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Page extracted/read individually. Documents regular external deliveries and selective recipient towns, with different origins by commodity. No exact frequency, quantity, named gateway mapping, transport cost or vessel lifecycle supplied. Primary documentary basis. |
| S2 | GRYOnline, other trade methods: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/inne-sposoby-handlu/z036d3 | Editorial description closely repeats the manual's import paragraph. Documentary overlap, not an independent delivery observation. |
| S3 | Steam, Effective production towns by good, published December 2015: https://steamcommunity.com/sharedfiles/filedetails/?id=567242601&l=greek | Community guide distinguishes producing towns from automatic import towns and warns about scenario/map differences. Comments dispute some spice destinations; the author says the list came from the map editor. No list, editor data, counts or presumed bug is adopted. The disagreement prevents treating its gateway list as a reliable current runtime contract. |
| S4 | Steam, Old man's guide to P3: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Community advice distinguishes western producing/importing towns and redistribution routes, while also discussing expeditions. Planning testimony, not proof of exact ambient arrival mechanics, calendar or profitability. |
| S5 | Steam, Making a stable Loop, August 2024: https://steamcommunity.com/app/33570/discussions/0/4520010682809501494/ | Players describe redistributing goods among producing and consuming towns. Context for the transport leg after acquisition, not independent proof that a particular stock increase was an import rather than another trader. Route, fleet and income figures not used. |
| S6 | P3 wiki, Newbie Aid: https://patrician3.fandom.com/wiki/Newbie_Aid | Community advice chooses a town network by complementary goods and separates private supply from town-market supply. Context only, not verification of import gateways or cadence. No optimization figures adopted. |

Six documents, three types (manual, editorial guide, community testimony/wiki),
with clear dependencies. The import mechanism's existence rests chiefly on S1;
contextual sources do not establish its hidden formula. No competitor session,
map editor, executable or save was inspected.

## What must not be inferred

Receiving a good does not make a town a producer. A player seeing stock rise
also cannot attribute it to a named importer without further evidence: other
traders, local production or a scenario may supply the shelf. Community gateway
disagreement remains unresolved; it is not converted into a universal list or
a claim that one participant discovered a proven game bug. [S1, S3-S5]

External origin does not establish a physical ship on the main map, ownership
of its cargo, a bill charged to the player, pirate interception or interruption
by every port closure. Timing, exhaustion, catch-up after closure and persistence
are unanswered. The documented regional import channel is distinct from the
player's expedition or a prince purchasing goods at the town gate. [S1]

## Current main: identifiers and bodies checked

| Inspected path | Current behavior and bounded difference |
| --- | --- |
| `src/sim/market.mjs`, `makeMarket` | Creates a row for each world good in each town with initial stock, target and rate. Initial stock is not evidence of a recurring external shipment. |
| `src/sim/market.mjs`, `tickMarketCity` | Has local production for producing entries and a separate daily local-trickle calculation across entries. The latter is not restricted by an import-gateway list or a commodity-specific source calendar in this body. Rounded quantities can be zero; it is not a guaranteed positive delivery to every good every day. Both additions are capped, and consumption then reduces stock. |
| `src/sim/procurement.mjs`, `recordLocalSupply` | Records inventory basis and aggregate local-supply value for stock added without payment. The current call combines positive production/trickle additions; it does not identify an external route, origin, shipment or next delivery. It is existing accounting, not an absent supply ledger. |
| `src/game/game.mjs`, `marketTick` | Runs each port's market update at its staggered slot, followed by private producer processing. This is existing cadence, not a separate periodic external delivery schedule. |
| `src/sim/ai.mjs`, `aiStep`; `src/game/rivalhouses.mjs`, `regionalRivalStep` | Existing traders sell cargo, buy from the market and sail between world towns, subject to their rules. These real trades can redistribute stock without being an ambient source beyond the map. The regional wrapper does not create a new external importer. |
| `src/sim/recipes.mjs`, `quoteUnitsImport`, `consumeUnitsImport` | Missing construction inputs can be priced as imports; only local inputs leave market stock. The imported portion is not deposited into the public shelf. This existing premium procurement is not a periodic port-stock shipment. |
| `src/game/shocks.mjs`, `applyShock` | Harvest/demand effects alter rates/targets; a port-closure shock returns without a supply mutation here. Closure checks at trade time do not establish an external-shipment hold/release lifecycle. |

The difference is scoped to these paths and search terms. Imports, supply and
transport are not claimed absent wholesale. No present local-trickle or premium
procurement behavior is defective merely because it differs from P3.

## Own-design questions only

- Does selective external supply create useful redistribution choices beyond
  today's producers, fallback supply and traders? No new channel requested yet.
- If selected, define source, recipients, affected goods and delivery conditions
  from our own design. Do not transplant competitor gateway lists or calendars.
- Keep production, fallback supply, purchased cargo and external additions
  attributable. Avoid counting a stock addition as both import and local output.
- Decide whether new supply replaces or supplements fallback supply. Adding it
  without an economy comparison could erase shortages and transport margins.
- Specify closure, save/load and missed-time behavior before scheduling events;
  retries must not deliver a shipment twice or create an unapproved catch-up glut.

## Verification

`node --test test/market-rules.test.mjs test/procurement.test.mjs
 test/recipes.test.mjs test/staggeredmarket.test.mjs`: 30 passed, none failed.
Existing baseline only; no external-import feature or P3 behavior reproduced.
Every identifier in the current-main table was located and its body read.
No runtime/tests edited, UI change, screenshot or economic retuning claimed.
