# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), expansion chapter (first pass)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 8 sections 8.1-8.2 (city-wall expansion, Mediterranean expeditions) of the full German community compilation. Sections 8.3 (America) and 8.4 (founding new settlements) remain for a second pass.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 8 intro, 8.1, 8.2.1-8.2.2, printed pages ~149-156; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Wall expansion as the growth gate: petition vs execution split
The source: every town starts fully walled; outside the wall only businesses (no houses, no protection) can be built, so a full inner city stops growing until the wall expands - a small fixed number of times per town. Petitioning needs a mid-high rank in that town and a council vote (approval is near-certain once businesses already stand outside); execution is always the mayor's job, taking months scaled by available building materials; the expansion counts as official once the new wall exists as a complete construction site.
Our state (verified: src/game/walls.mjs - three wall levels per port as COUNCIL works: the concejo votes, pays from the town chest and pays the watch; the player only petitions with respect "Conocido" (WALL_MIN_RESPECT, walls.mjs:31,99); kept walls add effective market population, the wall-growth role).
Verified parallel with a different ownership contract: in the source the player-mayor builds the wall; in ours the council owns it end to end and walls already gate growth. Deliberate divergence, not a gap. Flagged.

### 2. Discovery expeditions: long, convoy-only, with negative-space feedback
The source: Mediterranean discovery needs a convoy meeting full escort conditions (even a single qualifying ship), the player picks up to a small fixed number of coastal guess-points, the ship is gone for weeks or months, and failed search spots are marked permanently on the discovery map (negative space persists). A per-game subset of a larger city pool is discoverable; offered goods per city are fixed across games, demanded goods are randomized at game start.
Our state (verified: src/game/fog.mjs - ports start hidden and are discovered by sailing radius, for bots too via botintel.mjs; charts.mjs sells chart hints; no long-range expedition mechanic with guess-points or per-game randomized demand exists).
Open question: expedition-style discovery and per-game demand randomization are design inputs for the content zone; flagged only.

### 3. Expedition infrastructure as a player-organized loop
The source recommends a forward base near the map edge with spare crewless ships: returning crews swap to a fresh hull while the worn one repairs, keeping expedition cadence high. This works because hull repair is fast relative to expedition length and crews transfer freely in port.
Our state (verified: crew transfer between docked ships exists, crew.mjs:63; our repair is the routes/yard system; no expedition loop exists to optimize).
Proposal: none. Recorded as player-strategy background; no engine implication.

## Open work
- Kapitel 8.3 (America: discovery, native tribes, barter trade) and 8.4 (founding a new settlement as a Hanse-leader mission: conditions, material and money consumption) remain.
- Kapitel 1 (options), 9 (auto-route trading tactics), rest of 2 remain unread.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.
