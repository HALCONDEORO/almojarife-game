# P3 market information: whose demand is being shown?

13 November 2026. Main inspected: `7989210`.
Clean-room research only. No economy, display or automation change approved.
No competitor quantities, coefficients, text or assets adopted.

## Narrow answer and overlap check

P3's manual distinguishes two information perimeters. Market production includes
municipal and trader businesses, including the player's. Market consumption is
not an equally comprehensive mirror: the manual explicitly excludes the raw
material requirements of trader businesses from the market hall. The office's
own stock/production/consumption page is a different view. A displayed city
surplus therefore cannot by itself prove that the player's production inputs
are covered. That last sentence is a planning inference, not a measured P3 rule.

This note does not reclaim general consumption-versus-stock displays, units,
price curves, production targets or office management. Real grep covered
`docs/research`, `docs/design`, `src` and `web` for demand, consumption, market
hall, private inputs, production and Spanish equivalents. Existing
`patrician3-tippsammlung-office-info-notes.md` and `towns3` cover market
information and unit-label faults; `citytrade` covers office reserves;
`patrician3-mechanics.md` covers batch prices; player-consignment covers auctions.

PR heads 930-942 were fetched and the new-document diffs checked. In particular,
937 concerns player statistics, 940 production intent/utilization and 942 building
contracts/contractor pools. None owns this public/private input perimeter. The
new sea-town-defense note has an unrelated traffic/participant perimeter.

## Evidence ledger

| Ref | Public source read | Claim and limit |
| --- | --- | --- |
| S1 | P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Printed p21, sections 8.1.2-3, expressly separates citizen/municipal raw-material demand from trader-business inputs absent in market information. P23, 8.2.1.2, gives own business stock and previous-week production/consumption. P32, 10.3, includes public/private output in production but describes weekly consumption as citizen/town-business need. Each page extracted/read individually. Primary documentary evidence, no runtime measurement. |
| S2 | Steam official manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Same document, not independent corroboration. The fetched text includes 8.1.2 and own-business consumption; the local complete PDF supplies p32's detailed market section. |
| S3 | GRYOnline, trade and production basics: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/podstawy-handel-i-produkcja/z136c5 | Explicitly repeats that trader-owned factories' input needs are not displayed in the town exchange. Editorial guide closely follows the manual: documentary overlap, not independent experiment. |
| S4 | GRYOnline, action buildings: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Production includes municipal and traders' businesses, including the player's; consumption describes the town/citizens. Same guide family as S3. |
| S5 | P3 wiki, Newbie Aid: https://patrician3.fandom.com/wiki/Newbie_Aid | Community planning advice uses market stock versus consumption, while separately advising input stockpiles for workshops. Supports the practical distinction, not exact display accounting or a universal stock ratio. No strategy quantities adopted. |
| S6 | P3 wiki, Businesses: https://patrician3.fandom.com/wiki/Businesses | Describes private production as supplementing available goods and warns that higher production also consumes inputs. Does not independently establish which screen includes each input. Same wiki family as S5; figures and recipes not adopted. |

Six documents, three types (manual, editorial guide, community wiki), but fewer
independent source families. The narrow exclusion rests on S1, not a vote among
six witnesses. No competitor session, save, formula extraction or excluded
modding material used.

## Documentary boundary, not an economic formula

The production and consumption tabs need not count the same owners. The office
view's previous-week flows are also not the same as prospective city need. Do
not subtract an observed historical output from an expected need and silently
call the result a forecast of the player's missing inputs. [S1, S4]

The manual's description of which needs affect prices is not proof that a
player's market purchase has no price effect. The same manual describes supply
and prices moving with transactions. Direct purchases reduce public stock;
a private warehouse requirement can remain outside a public consumption total.
Exact demand formulas, office resupply timing and displayed rounding are not
reconstructed here. [S1]

## Current main: bodies inspected, not names or comments alone

| Code and identifier checked | Actual behavior and bounded interpretation |
| --- | --- |
| `src/sim/market.mjs`: `makeMarket`, `price` | Each good has stock/target metadata; price uses stock relative to target. Target stock is not a measured period's factory input consumption. |
| `src/sim/market.mjs`: `cityDemandBy`, `cityDemand`, `tickMarketCity` | Citizen demand is split by class, scaled, modified by stock and processed with actual available stock and household budget behavior. Municipal supply is aggregated through the market entries, not a list of municipal factory input recipes in this demand path. |
| `src/game/buildings.mjs`: `workshopTick` | Active primary producers add output to public stock. Transforming producers quote affordable/profitable input batches against the local market, consume those inputs and add output. They do not draw their transformation inputs from the player's office warehouse in this body. This is a real existing production chain, not a missing-input claim. |
| `src/sim/recipes.mjs`: `quoteRecipe`, `consumeRecipe` | Quotes unit-by-unit market input cost and stock availability, then removes inputs/adds outputs after validation. A private producer's purchase can thus alter market stock/prices without becoming citizen demand. |
| `src/game/game.mjs`: `marketTick` | Calls `tickMarketCity` before `workshopTick` for each port's market slot. The former's consumption telemetry is not a record of the later factory-input purchases. |
| `src/sim/needs-telemetry.mjs`: `recordLegacyConsumption` | Attributes the market's recorded whole-unit consumption among citizen classes and writes a needs ledger. It does not aggregate the player's recipe inputs. The estimate label remains important; this inspection does not equate it to a full household spending ledger. |
| `src/view/needsview.mjs`: `needsHtml`; `web/main.mjs`, its call site | Renders need, desired, consumed and balance by good/class from that ledger. Call is behind the `devMode` local-storage gate. It is not a public complete city/industry demand table. |

Consequently, absence of factory inputs from citizen telemetry is not a bug by
itself. Adding them to household consumption would mix different actors and
could double count market purchases. Existing production data and telemetry
must not be labelled as all city needs without defining the perimeter first.

## Own-design questions only

- Is any new planning readout needed beyond existing stock, production and needs
  information? Keep current behavior unless that product decision is made.
- If selected, distinguish public stock, citizen need, planned factory inputs,
  actual inputs consumed and owned reserve. State owner coverage and period.
- Do not expose rival private inventories or plans merely to fill a city total.
- Keep the display read-only. Recomputing it must not buy inputs, change market
  targets, reserve goods or advance a production tick.
- Decide how halted factories, missing inputs and lack of cash affect an estimate.
  Capacity is not a promise that every planned batch will run.

## Verification and limits

`node --test test/needs-telemetry.test.mjs test/needs-ledger-period.test.mjs
test/recipes.test.mjs test/workshop-costs.test.mjs`: 21 passed, none failed.
Existing baseline only: telemetry attribution/periods and recipe/production
accounting; no P3 reproduction or new display tested. All identifiers in the
code table were located and their bodies/call site read. No runtime/test edits,
UI change, product screenshot or competitor execution claimed.
