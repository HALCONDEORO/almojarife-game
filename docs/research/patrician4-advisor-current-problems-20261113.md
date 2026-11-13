# P4 advisor: current problems are not unread history

Date: 2026-11-13. Base inspected: `480de7e`. Public-source clean-room note.
No implementation, copied source prose, exact competitor values, assets, binary
inspection or excluded modding sources. No change to roadmap or release scope.

## Answer

The P4 base manual describes an advisor view of problems affecting the company
now, with a location jump from an entry. It separately describes retained advice,
tutorial information and the chronicle. Almojarife already has message triage,
warning producers, live finance summaries and context-specific route status.
The inspected inbox views, however, classify historical message kinds and reading
state rather than deciding whether a problem remains active. Their message-click
handlers acknowledge reading, not navigation to the affected object.

Prefer a small read-only current-problem projection over replacing or deleting
message history. Start with one well-defined problem such as a stopped route.
This is an unapproved design option, not a parity bug or a claim that the entire
application lacks live status. No P3 advisor behavior is inferred here.

## Source coverage and edition limits

| Source | Contribution | Evidence limit |
| --- | --- | --- |
| S1: official base manual, Game Help, printed/PDF page 10 | Documents a current-problem list and selecting an entry to reach its location. Distinguishes stored advice from current problems. | Does not specify every problem type, ranking, removal rule or object identity. |
| S2: official Rise of a Dynasty manual | Checked its manual-correction section for later changes; none there addresses the advisor list. | Silence is not proof of identical behavior across editions or builds. |
| S3: DefKey controls reference, dated 2023-02-17 | Separates advisor, assignments, information and chronicle entry points. | Explicitly manual-derived, not independent confirmation of live issue reconciliation. |
| S4: Steam community guide, updated 2023-07-01 | Practical interface/management context for an expansion-era game. | Not evidence of advisor problem lifetimes or exact navigation behavior. |
| S5: Gaming Nexus review, 2010-11-15 | Describes continuing guidance through commercial progression. | Tutorial/advice evidence, not proof of current-problem semantics. |
| S6: Hooked Gamers review, interface discussion, 2010-10-01 | Context for automation and management workload. | Does not independently verify the advisor-list implementation. |

The substantive narrow claim rests on S1. The other sources must not be counted
as independent votes for behavior they do not describe. No live P4 playthrough or
current-distribution build test was performed. In particular, automatic removal
of a resolved entry, cross-city destination handling and severity order remain
unverified. Those are proposed contracts for our game, not imported P4 facts.

## Actual repository findings

Read the roadmap and research inventory first. `docs/ROADMAP.md` calls out player
onboarding and accessibility gates; its header warns that implementation status
is historical. Existing notes cover events, routes and generic tavern informers,
not this present-problem versus recorded-message distinction. This note stays
outside captain skills, guarantees, expeditions, moored fleet costs, standing,
family, territory, trading automation, scenarios, patrol, storage and sabotage.

A real search for `advisor`, `problemList`, `issueList`, `data-msg`, `markRead`,
`routeStuck`, `msgClass` and `actionUnread`, followed by function reads, found:

- `src/game/ledger.mjs`: `post` retains dated messages; `markRead` changes a read
  flag. Reading a warning does not itself fix its underlying world condition.
- `src/view/msgclass.mjs`: kind/topic/debt classify entries as action, notice or
  report-only. `actionUnread` filters message reading state. It does not read the
  referenced route, building or loan's current condition.
- `src/view/ledgerview.mjs`, `inboxHtml`: displays action entries and grouped
  notices from the retained inbox. Resolved-world reconciliation is not part of
  this function. It preserves action messages even after they have been read.
- `src/view/ui2d.mjs`, `inbox2dHtml`: likewise projects retained messages, adds
  categories and a read-state count. This is existing useful triage, not a missing
  inbox implementation.
- `web/main.mjs`: both inspected `data-msg` click handlers call `markRead` and
  redraw; the styled version restores message focus. Neither inspected handler
  selects the affected ship or city. Other UI navigation paths were not audited.
- `src/game/routes.mjs`: stopped-route markers are cleared when processing can
  resume. Notifications record the earlier event; their existence is not proof
  that the route is still stopped.
- `src/view/cashcard.mjs`, `financeSummary`: already derives current finance and
  settlement information. A problem view should reuse current domain readers,
  not pretend all current-status reporting is absent.
- `src/game/alerts.mjs`: a price trigger is consumed when it fires and posts a
  historical alert. That is an event subscription, not a persistent problem.
  The checked alert UI test also records removal of its former market block;
  no claim is made that the current UI offers creation there.

An isolated non-committed fixture combined an old stopped-route message with a
currently non-stuck route, then rendered the inbox and marked the message read.
The historical text remained while the unread count cleared. This tests the
view/read distinction only, not an organic route-recovery playthrough. Existing
ledger/notice/finance/price-alert baseline: 37 tests passed, none failed.
No visual audit was performed; this is not a claim about visual placement.

## Ranked options and acceptance questions

1. Add an optional current-problem view derived from a bounded domain reader,
   beginning with stopped routes. Leave chronological messages intact.
2. Add a separate explicit inspect action that resolves a valid ship/city ID at
   click time. Keep read/acknowledge separate; do not make reading sail a ship,
   spend money or activate a route. Preserve keyboard focus after navigation.
3. Defer broad advisor parity until problem categories and persistence policy are
   agreed. Do not persist another copy of every mutable world condition.

A future implementation needs tests for resolved-but-unread history, active-but-
read problems, repeated notifications for one object, deleted ships, resumed
routes, missing cities, save/load and feature-off behavior. Stable issue keys
should describe a condition/object pair, not a message ID. Whether severity or
age determines order is a design decision. A lack of problems must mean that the
chosen domain checks found none, not that the player has read everything.

## URLs

- S1 https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S2 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- S3 https://defkey.com/patrician-4-shortcuts
- S4 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- S5 https://www.gamingnexus.com/article/patrician-iv/item2819.aspx
- S6 https://www.hookedgamers.com/pc/patrician_iv/review/article-595-2.html
