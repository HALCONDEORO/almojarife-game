# P4 pirate hideouts: site discovery is not clan extinction

13 November 2026. Main checked: `480de7e` (through PR889).
Scope: the persistent identity and authorisation boundaries of P4 hideout attacks.
Documentation only, not approval for a new pirate-world simulation.

## Finding and prior coverage

The narrow new contract is discovery of a site, permission to assault it, and
whether destroying that site also ends the group that used it. Existing P3
piracy notes cover cyclical nest activity; the events note names tavern
last-seen rumours and waiting before a hideout assault. Existing map/ship design already
proposes persistent hideouts. This note does not rediscover those ideas. It
adds P4's documented survivor relocation, sequential defence and distinction
between observing a location and accepting a sanctioned attack.

The roadmap's parity direction and combat work make this relevant research,
not a reason to revise dates or declare persistent pirates implemented. Existing
combat is real code; a clan lifecycle is a different system.

## Sources and method

Relevant sections were read on the date above. No executable, extracted data,
utility chart, modding-internals page, copied source text, assets, source names
or numerical balance values are reproduced. No gameplay experiment was performed.

| Ref | Public source | Evidence and limit |
| --- | --- | --- |
| S1 | Publisher manual, Pirates, printed page 47: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Primary documented clan/home/return/discovery/mission/assault/relocation loop. The initial web extract omitted this chapter; the full public PDF was downloaded and its text inspected. |
| S2 | GRYOnline, Piraci, page updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/piraci/z2b349 | Independent guide describes discovery, a guild assignment and assault. Its broad claim that victory removes a group needs S1's survivor qualification. |
| S3 | Heraclitus, Steam guide, World Map: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Community description of nearby visibility and reduced local piracy after eliminating bases. Not proof of a detection formula or permanent global safety. |
| S4 | Steam discussion about destroying a hideout: https://steamcommunity.com/app/57620/discussions/0/3362406825537586206/ | Player reports inability to assault without a League mission; reply attributes availability to rank. Corroborates a permission gap, not an exact universal rank threshold. |
| S5 | Reddit, tracking pirates, November 2025: https://www.reddit.com/r/patrician/comments/1p65keq/patrician_iv_tracking_down_pirates/ | Players distinguish knowing an approximate location from scouting the site and obtaining approval. Explicitly uncertain about exact discovery mechanics; not a formula. |
| S6 | Andromalis, Steam advanced guide: https://steamcommunity.com/sharedfiles/filedetails/?id=1889979415 | Player opinion that piracy cannot be eliminated efficiently. Context for continued threat, not proof that every destroyed group always respawns. |

These are primary documentation, an independent guide and community accounts,
not independent experimental replications. No exact detection radius, wait time,
rank threshold, payout, spawn schedule or source map is imported. No hidden rule
is inferred from a guide author's frustration.

## Documented lifecycle and unresolved parts

The manual distinguishes hired raiders from simulated pirate clans. Clans have
a base from which convoys raid, return with loot and repair. Success expands
their fleet and activity. [S1] This is not proof that every hired pirate belongs
to the same simulation or that all threats share one global spawn budget.

Following a returning convoy to its coastal disappearance can reveal its base.
The manual describes a chance of discovery, not a guaranteed unlock from merely
passing a fixed coordinate. A guild assignment then permits the assault. [S1]
The guide and player reports support separating visibility and eligibility.
[S2/S4/S5] The exact combination of rank, discovery ownership and mission
availability across versions remains open.

After accepting the assignment, the manual recommends allowing enemy convoys
to gather. Assault fights the convoys present in sequence; victory destroys
the site, which has no separate fixed defences in this documented P4 description.
[S1] This is not P3's tower-defence contract and must not inherit its weapons or
siege requirements merely because both games use pirate nests.

Crucially, the manual says a convoy still away when the base is destroyed can
establish another base and return under another name. [S1] Thus site destruction
is not unconditional clan extinction. S2's shorter victory summary and S6's
pessimistic opinion do not erase that distinction. We have not established an
all-survivors-destroyed global extinction rule, minimum relocation delay, maximum
base count or exact resource cost. Absence of a visible pirate is not evidence
that no survivor exists.

## Actual main audit

A real grep over `src`, `data`, `docs/research` and `docs/design` for hideout,
pirate base/clan/nest, guarida and nido located prior research/design but no
persistent pirate-base state. Relevant resolver call sites were then inspected.

| Source | Verified current boundary |
| --- | --- |
| `src/game/piratefight.mjs` | Creates a pirate ship from an encounter ID, runs the shared battle resolver and returns outcome/prize data. It is not registered as a persistent clan convoy with a home and repair inventory. |
| `src/game/encounterdaily.mjs` | Seeded per-ship encounter cadence, queued decisions and stored final reports exist. Reproducible combat identity is not a travelling opponent whose absence from a base changes an assault roster. |
| `src/game/battle.mjs` | Shared battle resolution is reusable; a sequential multi-convoy assault needs explicit continuation, cumulative damage and once-only settlement above it. |
| `src/game/fog.mjs`, `src/game/intel.mjs` | Port discovery and market information already exist. Site visibility and guild attack permission must not masquerade as discovering a trading port or granting exact remote prices. |
| `src/game/campaigns.mjs`, `src/game/contracts.mjs` | Mission progression and shortage jobs exist, not a discovered-site assault authorisation bound to a persistent enemy identity. |
| `src/game/gamesave.mjs` | Existing ship, voyage, convoy and report references have validation/remapping. New clan/site/survivor identity needs its own supported schema. |

## Own proposal, not a recovered P4 algorithm

If persistent piracy is later selected, model group identity, site identity and
convoy identity separately. Site knowledge belongs to the observer; assault
permission belongs to the mission; neither is proof that all enemy vessels are
at home. A site defeat can update that site's state while an identified survivor
continues under an explicitly chosen relocation policy. Never infer a fresh
fleet simply from changing its display name.

First test these transitions with synthetic actors and existing battle reports,
not a full world-map fleet or source-derived spawn table. Discovery UI, pursuit,
AI logistics, repair/growth financing, public bounties and history are separate
scope decisions. Do not reduce every future random encounter after a site win
unless the encounter generator actually draws from the defeated population.

### Acceptance contracts for a future experiment

- Approximate intelligence, discovered site and accepted authorisation are
  distinct states. A stale rumour or a known coordinate alone cannot start a
  mission-gated assault or expose unrelated market information.
- Departure/return and assault ordering define which defenders are present.
  A convoy cannot defend at home and raid elsewhere in the same simulation step.
- Sequential battles carry declared losses and resources forward. Replay or
  save/load cannot restore a destroyed defender or pay the bounty twice.
- Defeating a site marks that site once. Surviving convoys keep identity and
  conserved ships/cargo through any chosen relocation; renaming creates no loot.
- Interrupted or failed assault follows an explicit withdrawal policy, not an
  accidental reset to an undamaged enemy roster.
- Missing or malformed references cannot spawn replacement fleets or turn a
  hidden site into a port. Omission preserves old encounters and seeded reports.

No implementation, test run or UI accompanies this documentation patch. All
exact balancing and unresolved source-version behavior remain open questions.
