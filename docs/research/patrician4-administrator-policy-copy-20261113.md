# P4 add-on administrator policy reuse: existing parity, bounded copy semantics

Date: 2026-11-13. Inspected base: `30ec686`. Docs only, public sources and own
code; no copied text, source tables, competitor values, assets or binary analysis.

## Answer

The Rise of a Dynasty manual documents saving an administrator's settings and
using them at another administrator. A community guide confirms reuse of trade
rules between cities and recommends local adjustment. Almojarife already has
named governor rule templates, cross-port application, UI controls and a tested
save/load round trip. This is not a missing automation feature.

The useful design question is what a player expects applying a template to mean.
Our implementation merges the template's goods into existing target rules rather
than replacing the entire policy. It copies rule values, not stock, money,
governor employment, cash reserve, paused flags, budgets or completed goals.
These are observed local semantics, not claims about P4's internal copy fields.
Prefer clarifying the apply contract before expanding it.

## Public evidence and its limits

| Source | What was read and supports | Limit |
| --- | --- | --- |
| S1 official add-on manual, Counting house, PDF/printed page 8 | Save one administrator's settings, then use them at another. | Does not enumerate fields, merge/replace behavior, limits or persistence. |
| S2 official base manual, Advanced Options / administrator | Buy/sell price limits and stock levels are part of delegated local trade. | Does not establish the later copy feature. |
| S3 Steam community guide, administrator section | Expansion-specific rule reuse across cities and need for local changes. | Advice, not a serialization specification or a guaranteed optimal policy. |
| S4 Steam community discussion, 2017-07-25 | A player reports reusing a baseline policy, then customizing production inputs locally. | One player's strategy; no general profit guarantee or source settings imported. |
| S5 Counting house community reference | Describes buying/selling thresholds and stock locks. | Does not prove exactly which settings a copied template carries. |
| S6 Kalypso add-on product page | Establishes the expansion/product context. | Does not independently confirm template semantics. |

The manual and guide support reuse; they do not settle whether P4 overwrites
unmentioned goods, carries locks or cash constraints, creates a permanent linked
policy, or lets later source edits affect previous destinations. No live P4 build
was tested. Do not infer those behaviors from the phrase describing reuse.

## Real code and UI reads

Checked the roadmap's historical-status warning and current research inventory.
Searched `copy`, `template`, `settings`, `saveGovTemplate`, `applyGovTemplate`,
`governor`, `rules`, then read the actual functions rather than old feature
comments. Current implementation:

- `src/game/govtemplates.mjs`, `saveGovTemplate`: builds a named snapshot of
  whitelisted standing-order price/quantity fields. Requires a working qualified
  governor; a later source edit does not mutate the saved object by reference.
- `applyGovTemplate`: validates all template entries in a probe before writing.
  Invalid entries reject before normal target updates. Applying each entry uses
  `setStewardRule`; unmentioned target goods are not cleared.
- `src/game/steward.mjs`, `setStewardRule`: validates price/quantity relationships
  and target capacity; resets the supplied good's numeric rule values in place.
  Existing key position is retained. Paused state is stored separately in
  `admin.off`, not inside the copied numeric rule.
- `src/game/governor.mjs`: employment/state, budget and stockpile goal are separate
  governor data. They are not template fields. `admin.reserve` is also outside
  the copied rule whitelist.
- `web/main.mjs`: already renders template naming, save/apply/delete controls and
  calls the actual template functions. This is a code-level UI observation, not
  a pixel-level usability or accessibility verdict.
- `test/governor-l2.test.mjs`: exercises save/apply/delete, invalid-rule rejection
  and serialization round trip. The governor baseline across its domain/view
  tests passed unchanged: 24 tests, no failures.

An isolated non-committed fixture saved a source grain rule, applied it to a
second owned warehouse with an existing wine rule, then edited the source. The
second warehouse retained wine, received grain, and the saved grain snapshot
stayed unchanged. Target inventory, cash and governor record were unchanged by
application. This tests actual functions with synthetic setup, not organic play
or complete save corruption handling. No engine changes are included.

## Ranked next steps

1. Preserve existing behavior and make its scope explicit: apply updates listed
   goods while leaving other rules and non-rule state alone. A later UI task could
   preview the affected goods, retained rules and still-paused orders.
2. If users need full replacement, design a distinct operation with confirmation
   and tests rather than silently changing the current merge operation.
3. Defer global linked policies and automatic multi-city rollout. The sources
   establish reuse, not a requirement to synchronize all cities forever.

Future checks should include paused target rules, retained priority order,
unknown goods, capacity mismatch, old saves, empty templates, local reserves,
percentage-based price fields and editing one destination after applying. A
copied price policy can behave differently because each port has different
recent prices, production and consumption. Template reuse should not promise
identical trades or profit. No new UI, economy or release scope is approved here.

## Source URLs

- S1 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- S2 https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S3 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- S4 https://steamcommunity.com/app/57730/discussions/0/2132869574277606551/
- S5 https://patrician4.fandom.com/wiki/Counting_house
- S6 https://www.kalypsomedia.com/us/patrician-iv-rise-of-a-dynasty
