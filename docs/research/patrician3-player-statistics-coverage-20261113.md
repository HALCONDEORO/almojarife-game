# P3: player statistics, town coverage and competitor progress

Research note, 2026-11-13. Main inspected: `7989210`.
Clean-room documentation only. No implementation, source figures, quotations,
slogans, copied interface assets or excluded reverse-engineering material.

## Finding and prior coverage

P3's manual describes a player statistics menu reached through the cash icon.
It separates business information, competitor progress, town information and
town-to-town development comparisons. Crucially, its town-information section
explicitly includes towns where the player has no presence. This is a documented
information-access choice, not proof that a trading office, local market window
or rival office grants the same access in every game.

This is not an untouched subject. Our existing
`patrician4-comparative-statistics-20261113.md` already studies comparative
histories and their information boundaries. P3's `tippsammlung-standing` note
already mentions a relative rival-standing chart, and `tippsammlung-office-info`
covers local information buildings and the player's office. This note adds the
P3 manual's player-menu taxonomy and explicit town coverage, without replacing
those notes or repeating their general graph-design proposals.

The assignment mentions tables, but the inspected manual describes statistics
and charts, not an exhaustive table schema. Exact columns, rival metrics,
ordering, export, refresh rates and history retention remain unverified.

## Sources and page-by-page scope

| Source | What was actually checked |
| --- | --- |
| S1, full public English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Printed/PDF p.19, section 7.4.2: cash-icon entry point and distinction from the chronicle. Extracted as a separate page. |
| S1, printed/PDF p.21, beginning of 8.1.3 | Local market-hall and town-production information. Extracted separately; this page does not contain the player statistics menu. |
| S1, printed/PDF p.22, continuation of 8.1.3 | Business overview, competitor progress, town data and town comparisons. Most statistics are described as including time charts. Town data includes citizens, supply, quality of life, production and consumption, including towns without player presence. Extracted separately. Does not specify every chart or table field. |
| S2, GRYOnline trade/production basics: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/podstawy-handel-i-produkcja/z136c5 | Editorial description of the player statistics menu, business, competition and town comparison categories. Consistent with S1's broad structure. Its translated comparison label is not used to infer a building-by-building ownership table. Page shows an update date in 2019. |
| S3, GRYOnline interface guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/interfejs-gry-cz1/z236b7 | Cash/statistics and chronicle entry-point context. Same guide family as S2, not an independent play test. Page shows an update date in 2019. |
| S4, GRYOnline towns guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/miasta-hanzy/ze36c2 | Town population and satisfaction context; not a definition of global statistics sampling or access. Page shows an update date in 2019. |
| S5, community Newbie Aid: https://patrician3.fandom.com/wiki/Newbie_Aid | Discusses selecting and developing a group of towns according to production and supply. Planning context, not proof of a particular statistics formula or remote-data permission. |
| S6, editorial review: https://www.gry-online.pl/recenzje/patrician-iii-rise-of-the-hanse-recenzja-gry/zd5d4 | Broader game context checked; not used to fill unknown menu fields or rival rankings. |

All pages were fetched and relevant text read. No running P3 session, statistics
screen or exported dataset was inspected. S1 is the primary basis; contextual
sources are not additional independent confirmations of all its details. No
source tables, numerical data or hidden formulas were adopted.

## Actual current-main audit

| Code read on the stated base | Existing function and boundary |
| --- | --- |
| `src/view/rankview.mjs`, `houseHtml` | Own-house rank, wealth, progression, respect and reputation by port already exist. Those are player progress displays, not a competitor-progress comparison. The function calls existing reputation helpers; this note does not claim all current rendering is mutation-free. |
| `src/view/ledgerview.mjs`, `chronicleHtml`, `inboxHtml` | Own-house annual records and grouped messages already exist. Business history is not missing wholesale. An inbox message about another house is not a comparable series of rival performance. |
| `web/main.mjs`, city tab | Reads the selected ship's port, composes effective population, class information and local industry. This is an existing local information surface, not the manual's all-town statistics menu. |
| `src/view/needsview.mjs`, `needsHtml`; its caller in `web/main.mjs` | Consumption telemetry exists, with estimated-class and transitional-model caveats; the caller gates it behind developer mode. An available internal table does not establish a normal player feature or a public global-data entitlement. |
| `src/view/worldsystems.mjs`, `worldSystemsHtml` | Optional rival-house names are rendered from AI records. This is already rival visibility, but the inspected section does not present rival-development histories or comparable performance measures. |
| `src/game/game.mjs`, `recordPrices`, `priceHistory`, `trendPct` | Price arrays and change calculations already exist. Their existence does not supply population, prosperity or rival-performance histories, nor prove the player has observed every engine sample. |
| `src/game/intel.mjs`, `isLive`, `refreshIntel`, `knownMarket`; `src/view/marketdesk.mjs`, `destinationQuote` | Current local access and remembered snapshots are distinguished; destination quotes preserve age/exactness. A global statistics page must not bypass this policy merely because the engine has raw remote state. |
| `src/game/botintel.mjs` | A rival has private chart, market and warehouse knowledge. Displaying progress is not permission to disclose that private book or its orders. |

A real grep across game/view code and the main caller found no named
population/prosperity/rival-history recorder or town-comparison renderer under
the searched identifiers. The source reads above narrow that observation:
existing local, own-house and price-history functions must not be called absent.
This is scoped evidence, not a guarantee about every possible identifier.

Before writing, `docs/research` and actual pending-note diffs for PRs 930-934
were searched. Those notes concern paid event information, ownership focus,
weapon loss, a pirate opening and feasts/family. Their descriptions of towns,
news or reputation do not specify this player statistics menu. Review claims
in PR bodies were not treated as independent evidence or approval.

## Design questions, not imported P3 rules

- Should Almojarife offer a central index linking existing own-house, local
  city, price-history and report screens before adding any new data collection?
- Which town facts, if any, are public beyond the player's presence? P3's
  documented global access is a difference to decide, not a reason to defeat
  our discovery, stale-intelligence or paid-information boundaries.
- What does rival progress mean here: public milestones, an ordinal standing,
  or a declared measurable series? Do not relabel cash, wealth, reputation and
  business activity as interchangeable, or expose private bot state by default.
- Can an unavailable or unobserved city remain explicitly unavailable rather
  than appearing as zero? Which dates and provenance must each row retain?
- If comparisons are added, what units, time basis and eligible audience apply?
  Shared-axis and aggregation questions are already covered by the P4 note;
  this P3 menu description does not answer them.

## Author verification

Existing baseline: `node --test test/ledger.test.mjs test/marketdesk.test.mjs
 test/intel.test.mjs test/botintel.test.mjs` completed with 42 passing tests
and no failures. No tests were added or changed. These verify adjacent existing
functions, not a new player statistics screen. No runtime changes, new UI,
visual audit, P3 reproduction or implementation approval are claimed.
Patch whitespace and application to a separate clean-base worktree were checked
at handoff. Independent documentary review remains separate.
