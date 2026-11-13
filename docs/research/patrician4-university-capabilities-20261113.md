# P4 university research as a capability unlock: clean-room note

Research date: 13 November 2026. Almojarife main inspected:
`8f9bed5`. Documentation only; no technology tree, economic changes or roadmap
expansion is approved by this note.

## Scope and method

Public manuals, a published guide, a distributor description, a review, a game
catalogue and a community guide were read. No executable, extracted game data,
modding or decompilation source, copied prose, artwork or source-game balance
figures are included. No gameplay experiment was performed. The official manual
was also downloaded and text-extracted because the fetched version ended before
its research section. Findings describe documented P4 mechanics, not hidden code.

Existing research covers P3 shipyard experience and P4 civic/political events.
The notes added in PRs 856-873 concern P3/Tippsammlung topics, not the P4 university
project lifecycle. This slice adds infrastructure-dependent capability unlocks,
not another ship catalogue. It excludes the addon's land logistics and the supply
requirements of founding missions.

## What the sources establish

### Infrastructure changes the pace of a separate project

The base-game manual describes upgrading a convent school into a university,
submitting research projects, and faster completion as the League has more
universities. Research is therefore not just a shipyard gaining experience by
building or repairing vessels. A civic infrastructure decision affects the pace
of a separate activity. The manual does not provide a speed formula here. [S1]

The published guide describes a research view with the university's founder,
knowledge points, infrastructure count and current research, as well as projects
with prerequisites and a displayed completion time. It reports that the project
itself takes time without an additional research payment. That is not evidence
that constructing or supporting the institution is free. These UI and cost
claims remain guide evidence, not independently observed behavior. [S2]

### Completion can enable a capability rather than grant an asset

The manual explicitly makes some vessel types available after their associated
research. The distributor's product description and the game-catalogue entry
also connect research with new ships. The key distinction for design is between
unlocking a build option and receiving a ship: these sources support the former,
not a free vessel materializing at completion. [S1, S3, S5]

The guide describes sequential ship research alongside production, geography,
naval-combat and fortification branches. That broader catalogue is useful context,
not a specification to copy wholesale or a reason to change Almojarife's economy.
No coefficients, duration table or preferred research order is imported. [S2]

### Research can expose an opportunity without replacing its execution

The manual connects geography research with the appearance of an outpost-founding
assignment. It also says such assignments can appear in other circumstances.
Thus research is a documented trigger, not proven to be the only route to the
assignment. Obtaining the assignment remains distinct from accepting and fulfilling
it. This note makes no claim that the project itself builds a town. [S1]

### Authority and visibility are not settled by a single simplified guide

A Steam guide says new-ship research requires being mayor and having a university.
The published guide distinguishes research visibility by political role and
identifies a university's founder; the manual also describes the university's
builder starting geography research. These do not establish a complete permission
matrix for every project and edition. Do not collapse founder, mayor, owner and
viewer into one universal prerequisite. [S1, S2, S6]

The contemporary review connects city infrastructure choices, including a
university, with political influence. It corroborates the broad civic context,
not the detailed permission rule, completion formula or beneficiary scope. [S4]

## Actual Almojarife delta

Checked on the pinned main, not inferred from historical roadmap labels:

| Code | Existing behavior | Missing piece relevant to this slice |
| --- | --- | --- |
| `src/sim/trade.mjs`, `SHIP_TYPES` | Static ship catalogue and specifications used by trading and fleet logic | No project-completion capability gate in the catalogue |
| `src/game/game.mjs`, `orderShip` / `deliverOrders` | Validates game state, type, docked presence and cash; pays at order time, delivers after the build interval | No university/research eligibility check before an otherwise valid type is ordered |
| `src/game/game.mjs`, `buyCaravel` | Separate instant-purchase entry point | Any future unlock must cover alternate purchase paths, not only the yard button |
| `src/game/buildings.mjs`, `BUILDING_TYPES` | Player construction and civic building definitions | No university type in the inspected catalogue |
| `src/game/works.mjs` | Separate council-owned works, petitions, construction and town-chest payments | Existing civic lifecycle is not a research-progress engine; adding a player building would not by itself define a civic sponsor |
| `src/game/gamesave.mjs` | Existing versioned game serialization and normalization | No research-project lifecycle found in the inspected runtime modules |

Ship construction, civic construction, timed orders and political systems already
exist. The gap is a project/prerequisite/completion/beneficiary model, not a missing
shipyard or missing town-building engine. A repository search for university and
research found no gameplay research system; unrelated research comments and
research-option flags are not technology projects.

Author baseline check: existing `shipyard` and `tutorial-shipyard-step` suites pass.
This is a regression baseline, not a new-feature test or independent review.

## Own-design option, not an implementation instruction

First decide whether Almojarife needs this progression at all. Locking currently
available ships would remove existing player choices and affect old saves. A new
optional capability is safer to study than silently gating the current catalogue.
The late-medieval institutional framing needs its own historical sources; P4's
university fiction is not proof about Iberian practice.

If selected later, keep infrastructure, project progress and granted capabilities
separate. A project record needs stable identity, prerequisites, sponsor, progress
and completion status; an unlock needs an explicit audience. Reuse order delivery
patterns for deterministic timing only after deciding how active infrastructure
changes progress. Avoid a cached completion date that ignores later changes unless
that is an explicit policy.

Before integration, settle whether benefits belong to the player, city, institution
or whole world; whether AI shares them; who selects projects; what happens on office
loss or institution interruption; and whether existing assets remain usable. The
manual's League-wide acceleration statement does not by itself settle all these
questions or justify a world-wide buff.

Suggested acceptance cases, if the idea is chosen:
- Completion grants the capability once, never a duplicate ship or duplicate bonus.
- Save/load retains progress, prerequisites and beneficiary scope; bad state cannot
  unlock everything or strand a project permanently.
- Every acquisition path enforces the same gate; the UI explains why a type is
  unavailable without taking money for a refused order.
- In-progress orders, captured ships and old saves have an explicit compatibility
  policy rather than losing usable assets when a gate is introduced.
- Infrastructure changes do not apply time twice or permit negative progress.
- A geography-style opportunity trigger cannot duplicate accepted missions or
  reveal unrelated hidden information.
- With the option absent, seeded economy, current ship availability and saved state
  remain unchanged. Production, household and needs balances are not retuned here.

## Open verification work

Project concurrency, cancellation/refunds, exact political authority, technology
sharing with rivals, effects on already-built ships and infrastructure-loss behavior
remain unresolved. Neither the manual nor the fetched guide establishes a complete
patch-specific lifecycle. These need permitted observation before becoming claims
about P4; Almojarife can instead choose its own explicit rules.

## Sources

All accessed 13 November 2026. Numbers in URLs identify sources, not adopted balance.

- **S1, primary:** Kalypso, P4 English manual. Research / Founding New Outposts;
  Ships and Convoys; civic school entry. Publication date not shown in inspected
  document. Primary support for infrastructure, ship unlocks and opportunity trigger.
  https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- **S2, published guide:** GRYOnline, *Patrician 4: Uniwersytet*, updated 27 August
  2019. Support for UI, knowledge points, prerequisites and branch context; not an
  official formula or a current-edition test.
  https://www.gry-online.pl/poradniki/patrician-iv/uniwersytet/z0b338
- **S3, distributor:** Application Systems, P4 product page, date not shown.
  Corroborates researchable ship types only.
  https://www.application-systems.co.uk/patrician4/index.html
- **S4, contemporary review:** Gaming Nexus, *Patrician IV Review*, 15 November
  2010. Corroborates the university/political-infrastructure context only.
  https://www.gamingnexus.com/article/patrician-iv/item2819.aspx
- **S5, game catalogue:** MobyGames, *Patrician IV: Conquest by Trade*, page date
  not used. Corroborates research for improved ships only.
  https://www.mobygames.com/game/51978/patrician-iv-conquest-by-trade/
- **S6, community:** Steam, palermos, *Trade Routes*, created 12 March 2019,
  updated 29 March 2022. Limited to its university/mayoral prerequisite claim;
  its route profits and settings are neither used nor reproduced.
  https://steamcommunity.com/sharedfiles/filedetails/?id=1681273344
