# P4 rival business purchase: an asset transfer is not a rival portfolio

Research date: 13 November 2026. Main inspected: `30ec686`.
Clean-room documentation only. No runtime work, new price rule or roadmap
commitment. No proprietary balance values, quotations, slogans, assets, extracted
game data, utility charts or modding-internals sources are reproduced.

## Narrow finding and prior work

P4's official manual describes buying productive holdings from a competitor and
that seller demanding more for subsequent businesses. Its political context is
employment and competing for local office. This suggests a seller relationship
across purchases, rather than a generic construction button or company equity.
It does not establish a particular negotiation interface or a price formula.

Almojarife already transfers town establishments to player ownership, including
privately held works. Calling business acquisition absent would be wrong. The
narrow research question is whether a later living-rival design should connect
those assets to a persistent rival house and its successive sale decisions.

Actual grep preceded this note. `patrician3-4-events-trader-ai-notes.md` already
covers rival production growth and explicitly identifies that as future work.
`patrician4-sabotage-competitors-20261113.md` already discusses attacks on rivals
and cites a thread about removing rival production. `patrician3-company-capital-notes.md` distinguishes company shares from particular assets. The recent
`patrician3-player-consignment-notes.md` explicitly records existing
`buyEstablishment`. This note adds neither a claim that rivals were unstudied nor
another auction/consignment specification.

## Public evidence and scope

| Ref | Source | What it supports |
| --- | --- | --- |
| S1 | Publisher English P4 manual, Competitors and Mayor: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Primary documented ability to buy competitors' holdings; subsequent businesses become more expensive; employment matters in local political competition. The web extract stops before the relevant competitor section, so the complete downloaded manual's text was read. Not a patch-specific execution test. |
| S2 | Steam discussion, September 2019: https://steamcommunity.com/app/57730/discussions/0/1628538707064409795/ | Player trying to reduce rival business prices reports input deprivation did not produce the hoped-for price; discussion distinguishes removal by market pressure from purchase. Anecdote, not valuation evidence or a guaranteed strategy. |
| S3 | GRYOnline, Rozwoj handlu, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/rozwoj-handlu/zdb362 | Editorial campaign guide links new jobs to reputation and overtaking a rival; describes the continuing need to supply production inputs from the counting house. Context, not proof of what transfers in a sale. |
| S4 | Heraclitus community guide, updated July 2023: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Separates local reputation rankings, mayoral candidacy, building production and counting-house operations. Does not document a rival-purchase pricing algorithm. |
| S5 | Community Counting house wiki: https://patrician4.fandom.com/wiki/Counting_house | Describes owned businesses, workers and production inputs as distinct management concerns. Does not settle whether a purchased business includes stocks or workers. |
| S6 | GOG discussion, June 2022: https://www.gog.com/forum/patrician_series/patrician_4_gold_how_to_take_over_towns_faster | An explicitly memory-based player complaint that commercial dominance can precede satisfying political progress. Design caution only, not a rule or proof of acquisition mechanics. |

Coverage is official documentation, an editorial guide and community material.
Only S1 directly establishes successive purchase behavior. Contextual sources
are not independent confirmation of that rule. No P4 runtime was tested.

## Distinctions that matter

Buying an existing productive asset changes who controls capacity. Building new
capacity changes the amount available. Making a rival demolish a business is
neither operation: it may remove capacity without giving any to the player. The
manual describes those routes separately; a report of demolition cannot prove a
cheap acquisition or a price discount.

Likewise, buying a factory is not buying a share of the seller's whole company,
taking over its ships, acquiring its treasury or inheriting its political office.
The sources do not establish any of those consequences. Employment is relevant
to reputation in the manual, but no automatic election victory follows from the
purchase description. A higher later asking price does not establish a universal
formula tied to all sellers, all cities, buyer wealth or the remaining portfolio.

## Current main: substantial reuse, bounded gap

| Inspected path | What is already real | Boundary |
| --- | --- | --- |
| `src/game/townindustry.mjs`, `townIndustry`, `ownerOf` | Deterministic roster with stable establishment IDs, types, production shares, jobs and named townsfolk or council owners | These roster owners are derived from the local council, not linked to a regional trading-house asset portfolio. |
| `buyEstablishment`, `salesOf` | Checks eligibility and cash; transfers a buildable establishment at its level, marks its origin, reduces town production share and tracks freed town jobs; rejects repeat purchase | Agreed price comes from its caller. Private sale proceeds leave the model rather than entering an NPC purse. No persistent seller negotiation history is consulted in this function. |
| `src/game/almoneda.mjs`, `establishmentValue`, `lotOfDay`, `settle` | Existing valuation, unsold town-lot selection, seller metadata and auction settlement into the transfer primitive | The inspected replacement-cost valuation is not conditioned on earlier purchases from a named house. An auction already supplies a purchase channel; do not replace it silently. |
| `src/game/rivalhouses.mjs`, `regionalHousePlan`, `regionalRivalStep` | Named fictional houses, home regions, trading profiles, paid intelligence and real trading | The step supplies trade decisions, not construction, workforce or productive-asset ownership and sale decisions. |
| `src/game/buildings.mjs`, `quoteConstruction` | New construction uses local eligibility, owned plot, materials, fee and construction state | Not the transfer of an existing rival business. Preserve that distinction. |

The bounded missing connection is rival-house portfolio and successive seller
choice, not town ownership, named sellers, business purchases or auctions.
This is an inspection of these paths on the stated baseline, not an assertion
about every possible view or unmerged branch. Author baseline tests cover town
industry, its sale/rules and rival houses; they pass, but are not an independent
review or a verification of P4.

## Own recommendation and gates

Defer a rival-sale feature until a deliberate rival production/ownership model
is selected. A new purchase button alone would mostly duplicate existing town
acquisition. Do not invent a rich rival balance sheet solely to justify a price
escalator, and do not treat private proceeds disappearing today as a financed
rival expansion loop.

If selected later, retain the existing transfer accounting where appropriate.
First define stable seller and asset identity, which assets may be sold, who
receives payment, whether the seller may refuse, and how an accepted offer
expires. A preview should distinguish asset condition, continuing operating
costs and included property from political expectations. These are our design
questions, not recovered P4 rules.

Acceptance questions for that future design:

- Can either auction or negotiation settle the same asset twice? A stale offer
  should not charge after ownership changes, including across save/load.
- Does production move rather than duplicate, and do the job/share accounts stay
  coherent? Do not count a purchase as new construction or as net job creation.
- Does the right seller receive proceeds only once? Rejecting or expiring an
  offer should change neither treasury nor title.
- Is seller history scoped to the chosen counterparty rather than accidentally
  raising every town's prices? Which behavior persists across save/load?
- Is transferred information limited to what the buyer may inspect? A quote is
  not permission to reveal another house's hidden cash, route or stock data.
- Do old saves and flag-off games preserve their current acquisition contract?

## Open source questions

Which P4 businesses can be bought and under which local eligibility rules? Does
the seller ever refuse rather than quote? What property, stocks, staffing or
rights accompany a sale? What determines or resets subsequent asking prices?
Does the seller reinvest proceeds or replace sold capacity? Can a purchased
business later be sold back? What changes across base and expansion versions?
These remain questions. The sources here do not answer them well enough to turn
them into implementation instructions.
