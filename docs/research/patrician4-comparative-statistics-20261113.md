# P4 comparative statistics: trends are not current problems or realized profit

Research date: 13 November 2026. Main inspected: `bba6320`.
Clean-room documentation only. No implementation, balance change, copied source
wording, slogans, assets, numerical tables or excluded utility/modding material.

## Finding and scope

P4's manual places league-wide statistics in the guild. A community guide goes
further: selectable comparisons of city population and prosperity over time,
comparison with the wider league, commodity price relative to production cost,
and production details across producing cities. That is a different question
from where a company has an active problem or whether an unread warning remains.

Almojarife already records price history and renders local charts. It also
separates current local market knowledge from stale destination observations.
The narrow possible addition is a comparison of compatible, permitted series,
not introducing history or charts from scratch. Do not import P4's apparent
league-wide information access into our discovery system as an incidental UI
change. No feature or release-scope expansion is approved by this note.

A real grep of research and source preceded these findings. Existing advisor
research covers present-condition reconciliation. Goodsheets studies concern
commodity guidance; the FX guide note already mentions route profit statistics.
None of those is evidence that all statistics are absent. This note studies
comparison semantics and information boundaries rather than another advisor,
static goods table or profitability guarantee.

## Sources and confidence

| Ref | Source | Contribution and limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Guild: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Primary documentation that guild statistics concern the league. Does not specify graph axes, sampling, accessible history or aggregation rules. |
| S2 | Heraclitus guide, updated July 2023, Statistics Screen: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Direct community description of selectable city/league comparisons, commodity price-to-production-cost comparisons and production details by city. Stronger detail than S1, but not an independent runtime test or a verified definition of every plotted measure. |
| S3 | Counting house wiki: https://patrician4.fandom.com/wiki/Counting_house | Describes company income/expenditure accounts and owned businesses/workers separately from goods production and consumption. Context for distinguishing accounts from a comparative market indicator, not corroboration of graph behavior. |
| S4 | GRYOnline, Rozwoj handlu, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/rozwoj-handlu/zdb362 | Editorial explanation of supplying production inputs from the counting house. Supports why productive capacity alone is not proof of output or realized income; does not document statistics calculations. |
| S5 | Tom Bitterman, Gaming Nexus, November 2010: https://www.gamingnexus.com/article/patrician-iv/item2819.aspx | Review notes further manual planning for optimized routes and a weak sense of visible accomplishment. Design context and opinion only, not evidence that statistics are missing or wrong. |
| S6 | Hooked Gamers review, October 2010, interface discussion: https://www.hookedgamers.com/pc/patrician_iv/review/article-595-2.html | Independent review of growing production chains and distributing inputs across towns. Workload context, not an account of graph semantics. |

All pages were fetched and relevant text read. Coverage includes official
manual, community documentation, editorial guide and reviews. S2 supplies the
specific comparison claim; the remaining contextual sources are not additional
independent confirmations of it. No P4 build, graph screenshot or data export
was tested. Search results for utility charts and extracted balance aids were
not used as evidence.

## What a comparison does and does not establish

A city population trend, a prosperity indicator and a commodity price trend
have different units. Placing them on one unlabeled scale creates an apparent
relationship without a meaningful comparison. A nominal selling price relative
to production cost is also not realized player profit: transport, unsold stock,
fees, upkeep and the player's own acquisition basis are separate concerns.
Do not rename a P4 guide's profitability label as our audited net return.

The guide describes both time comparisons and current production listings.
Potential output, operating factories, actual delivered output and market stock
must not become interchangeable columns. It does not settle whether its league
comparison is weighted by population, production or anything else. A mean of
ratios is not automatically the same object as a ratio of totals. Any aggregation
we choose needs an explicit own definition, not an attributed P4 formula.

## Actual main audit

| Path read | Existing implementation and boundary |
| --- | --- |
| `src/game/game.mjs`, `recordPrices`, `priceHistory`, `trendPct`, port market callback | Bounded per-city/per-good price arrays and relative-change helper already exist. The market callback records prices at each port's own slot, so series position is not itself an explicit common timestamp. This is engine history, not proof a player has observed every sample. |
| `src/view/lonjaview.mjs`, `lonjaChart`, `lonjaHtml` | Existing local table with current quote, changes and a chart per commodity. Each chart derives its own range from that series. It is not a shared-axis selected-city overlay. Do not compare line heights from separately scaled charts as absolute prices. |
| `src/game/intel.mjs`, `isLive`, `refreshIntel`, `knownMarket` | Local presence supplies live knowledge; snapshots retain observation day and exactness. Stale knowledge is first-class, not a missing-history placeholder. |
| `src/view/marketdesk.mjs`, `destinationQuote` | Destination quotes use known market snapshots and carry age/exactness. A new comparison should preserve that distinction rather than bypass it through raw engine state. |
| `src/game/gamesave.mjs`, `sanitizeHistory` | Existing history nodes are checked for object/array shape. This is not a complete timestamp, finite-value, unit or provenance schema for a new multi-metric history format. |

The inspected paths expose local price history but not a selected-city
population/prosperity comparison recorder and renderer. The real grep found no
population/prosperity-history pairing in these game/view modules. This is a
bounded source finding, not a claim about every UI, an unmerged branch, or an
absence of city-state simulation. No reserved lazy-history initializer or fog
function was changed.

History access requires a separate audit before reuse: `priceHistory` returns
stored engine arrays and `lonjaHtml` reads those arrays directly. This note did
not audit all callers' access controls and therefore does not claim an existing
remote-information leak. It does establish that these helpers alone do not
prove player-visible observation provenance.

Author baseline tests for the lonja, intel, destination quotes, retired price
history and an existing port market fixture pass. This is not an independent
review, a temporal-alignment test or a visual inspection of graph layout.

## Own recommendation and future acceptance questions

Prefer a read-only selected-market comparison using already permitted data
before recording new city-demographic histories. First agree what question the
player needs answered and which series can honestly share units and dates.
Keep missing, unknown, stale and not-yet-recorded samples distinct; never backfill
old saves with today's population or future prices. A date filter cannot turn
engine history into knowledge the player never obtained.

If selected, an initial design should answer:

- Are samples engine truth or player observations? Who may see a regional
  aggregate, and can its totals reveal a still-hidden city by subtraction?
- Which timestamps align staggered port observations? Is a gap left visible or
  interpolated, and how is uncertainty explained without implying exactness?
- Are axes shared, normalized or separate? Are units, period and missing data
  available as readable text rather than color or hover alone?
- What does any cost denominator include? Undefined or absent costs must not
  produce infinite profitability or a guaranteed recommendation.
- Does opening or filtering the comparison leave cash, time, discovery and
  history unchanged? Does save/load preserve the chosen observation contract?
- Are empty, constant, short, invalid and nonoverlapping series handled? A
  future rendered UI requires pixel inspection on its supported screens.

Do not replace the advisor or company accounts, automatically alter a trading
policy, or create another global market oracle. New persistence, history limits,
access rules and city metrics require a separate chosen design and tests.

## Unverified P4 details

What time sampling and retention does the statistics screen use? Which exact
prosperity measure is plotted? How are league averages weighted? Are unvisited
cities included, and is information access affected by membership or edition?
How does the displayed production measure treat missing inputs and staffing?
What precisely enters its cost denominator? Those remain open questions, not
implementation requirements or reasons to copy an unseen formula.
