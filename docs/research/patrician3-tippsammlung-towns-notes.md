# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), towns chapter (first pass: tavern)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 2 "Die Welt der Hanse" section 2.1.1.1 (the tavern and its mission board) of the full German community compilation. The rest of Kapitel 2 (guild, town hall, shipyard, market hall, own buildings) remains for later passes; it is largely a building catalog with mechanics notes.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 2 intro and 2.1.1.1, printed pages ~19-32; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Sailors are drawn from (and returned to) the town's beggar pool
The source: tavern sailors are the employable share of a town's beggars - many beggars means many sailors at the bar and vice versa. Hiring and later discharging crews at another town physically MOVES the beggar population between towns, which the source describes as a deliberate trick to feed worker-short towns or push a settlement past a growth threshold. Crew wages are a small fixed daily rate; a no-captain ship pays one sailor double as helmsman. The manual's warning that mass layoffs hurt future hiring is reported as not measurable in practice.
Our state (verified: src/game/crew.mjs:47-55 hireCrew has NO pool - sailors are hired at a flat fee without touching any town population figure; no beggar concept exists anywhere in src/).
Proposal: none as an engine gap. A population-coupled labor market is a significant citylife/economy design input; flagged only.

### 2. The tavern side room is a rotating mission board with real teeth
The source's tavern back room offers rotating, time-limited missions from named visitors: escorts and fugitive transports (which ALWAYS spawn a dedicated attacker that fights to the death - the mission's real prize is capturing that ship), patrols (spawn single-type attackers, rewards scale with ships taken), couriers (multi-stop, next stop revealed on arrival, hates delays), bulk transport jobs (low value, hold-hungry), and a competitor-revenge mission that flips mid-way (the target counter-offers double, then both reconcile and the mission evaporates). Missions rotate between towns, which the source uses as an argument for offices everywhere.
Our state (verified: our encounter system (encounters.mjs) generates pirate/storm outcomes on voyages, and campaigns.mjs runs story/side chains, but no rotating tavern mission board with mission-spawned persistent attackers exists; ai.mjs:72 confirms nobody raids bot lanes today).
Open question: mission-spawned hunting as a ship-acquisition path is a design input for the combat/content zones; flagged only.

### 3. The hired-pirate deal: outsource piracy for a loot share
The source lets the player hand a captainless, armed ship to a tavern pirate, who then raids (locally or Hanse-wide) and returns a loot share plus immunity from his attacks; the deal is irreversible short of hunting the ship down yourself. The source's verdict is mostly negative on value but notes the ship-recovery angle. It also documents a loot-crediting exploit - recorded here as history, not mechanics.
Our state: no hired-pirate mechanic exists (our privateering is player-executed via letters of marque, privateering.mjs).
Open question: design input only; flagged.

### 4. Civic infrastructure as the council's job, not just the player's
The source lists wells, hospitals, chapels, schools as player-built reputation levers (politics note part 1, class-split reputation).
Our state (verified: src/game/works.mjs - the concejo itself votes civic works (well, hospital, chapel, grain exchange), pays per day worked from the town chest and keeps daily upkeep; player walls keep their own contract).
Verified parallel: our council-works loop puts infrastructure in the council's hands rather than the player's - a deliberate different contract, not a gap.

## Open work
- Rest of Kapitel 2: guild (membership, auctions incl. a documented auction bug - history only, convoy board, trade contracts), town hall (bulletin board supply orders, outrigger ships, town info), shipyard, market hall, church, own buildings (office, houses, businesses, warehouses, infrastructure). Mostly catalog; auction and bulletin-board mechanics may merit one more pass.
- Kapitel 1 (options/settings) and Kapitel 8+ remain unidentified/read.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling (this note).
