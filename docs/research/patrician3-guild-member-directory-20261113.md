# P3 guild directory: a scoped rival summary, not a world tracker

13 November 2026. Main inspected: `ef688e9`.
Clean-room documentary research only. No copied wording, source figures,
assets, excluded sources or implementation approval.

## Finding and boundary

The P3 manual's guild Members view lists traders belonging to that guild,
together with their reputation and counts of owned ships and trading offices.
The documented filter is institutional membership, not being docked in the
current port. A fleet count is not a list of current ship positions. [S1]

The announcement for this study included rank in its candidate field list.
The actual section does not name rank as a directory column. Rank is therefore
not asserted here. Reputation, membership and career rank must stay distinct.

A real grep of research on main, including merged PR930-957, found membership,
auction, public-convoy and shared-discovery studies, but no dedicated member
summary study. Existing P3 player-statistics research already discusses rival
progress; the local anchorage note studies ships physically in port; the P4
local-guild note studies permissions. Those are adjacent coverage. This note
adds only the member filter and summary-information boundary, not another
request for a general rival dashboard or a guild-membership implementation.

## Sources read and confidence

| Ref | Public source | Contribution and limit |
| --- | --- | --- |
| S1 | Full P3 English manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Section 10.10.5, printed/PDF p.35, extracted individually. Primary anchor: guild traders, reputation and ship/office counts. Does not specify refresh interval, remote tracking or a rank column. |
| S2 | GRYOnline action buildings part 2, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-2/z136dd | Editorial account describes the same member counts and reputation. Consistent documentation, not an independent runtime test. |
| S3 | Steam, Competitor mission problems and this voting thing in the town hall, October 2016: https://steamcommunity.com/app/33570/discussions/0/350543841943919660/ | A player cannot locate a mission rival through a short guild list and asks for a broader trader directory. Useful usability testimony that the list was not a sufficient universal locator for that player. Does not prove every rival's membership or a tracking rule. |
| S4 | Old man's guide to P3: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Community overview of guild activities. Context only, no verified directory refresh/access formula. |
| S5 | P3 wiki Ranks: https://patrician3.fandom.com/wiki/Ranks | Community account distinguishes career requirements, wealth and reputation. Does not establish rank as a Members column. No thresholds adopted. |
| S6 | P3 wiki Hanseatic Town: https://patrician3.fandom.com/wiki/Hanseatic_Town | Community account distinguishes town categories and availability of guild buildings. Context for not assuming every port has the same institution. No location list adopted. |

No P3 session was run. S2 largely tracks S1; these are not independent
experiments. The Guild wiki fetch was unavailable and supplies no evidence.
Unknown: whether non-members may read Members, whether counts are immediate or
sampled, whether off-map/queued/sold ships count, which reputation axis is shown,
and whether trader office counts expose office locations. Do not fill these
with the player's town-information permissions from a different menu.

## Actual main bodies checked

| Source and identifiers | Existing behavior and limit |
| --- | --- |
| `src/view/worldsystems.mjs`, `worldSystemsHtml` | The regional-rivals branch maps over `g.ai` and prints house and person names. Its `port` argument does not filter that branch by guild membership or anchorage. Rival identity presentation already exists; no ship/office counts or membership summary appear in that branch. |
| `src/game/rivalhouses.mjs`, `regionalHousePlan` | Generates house identity, region, home, person name and profile. A regional house identity is not evidence of joining every local guild. The inspected returned record is not an institutional membership registry. |
| `src/game/rivalhouses.mjs`, `regionalRivalStep` | Dispatches the legacy trader when regional identity is off/absent; otherwise refreshes the bot's own knowledge and passes information hooks into trading. A visible house name does not authorize exposing its planning knowledge. |
| `src/game/botintel.mjs`, `botIntelView` | Builds a rival-specific view from its ships, warehouses, intelligence, discoveries and cash. The current view can use an explicit ship collection or a single-ship fallback. Counting records in the outer trader array is not a future-proof fleet statistic. |
| `src/game/botintel.mjs`, `refreshBotKnowledge`, `botIntelHooks` | Refresh and supply the bot's remembered market and discovery-limited destinations. This is private planning state, not a public Members report to render wholesale. |

Every named identifier was located and its relevant body read on this main.
No absence claim relies on a historical phase header. No changes to bot
knowledge, discovery, needs or economic execution are proposed. In particular,
a public summary must not become a new route to live remote prices, cargo,
private reports or discoveries.

## Original questions before any feature decision

- Is a separate institutional directory useful beyond the existing rival names
  and player-statistics plans? Do not add a new screen merely to copy a menu.
- If useful, what membership source and local institution define its population?
  Keep no members, unknown membership and an unavailable guild distinct.
- Which public summary fields can be supported honestly by the current rival
  model? Do not manufacture office holdings, reputation or rank from identity.
- Define owned-fleet counting across single/multi-ship records, captures, sales,
  construction and losses before promising a count. Save/load must preserve it.
- Decide snapshot age and disclosure scope. A summary count must not silently
  become an exact location, cargo inventory or private-market-data view.
- A search for a mission target may still fail with a correct local member list.
  Explain scope rather than silently broadening it into an omniscient tracker.

## Author verification

Existing `rivalhouses`, `worlddefaults` and `botintel` test files: 17 passed,
no failures. These verify adjacent current behavior, not a new membership or
counting feature. No runtime code or tests changed. No P3 reproduction or visual
audit claimed. Whitespace and clean-base application checked at handoff.
Independent documentary review remains required.
