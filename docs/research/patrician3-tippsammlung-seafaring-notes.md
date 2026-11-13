# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), seafaring chapter

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 4 "Die Seefahrt" (ship-types sections) of the full German community compilation. Earlier notes: patrician3-mechanics.md, patrician3-tippsammlung-notes.md (translation thread), patrician3-tippsammlung-market-notes.md (Kapitel 3), patrician3-tippsammlung-production-notes.md (Kapitel 5), patrician3-tippsammlung-supply-notes.md (Kapitel 7).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 4 sections 4.1-4.2.3, printed pages ~74-78, read for this pass; convoy/piracy subchapters beyond 4.2.3 remain open; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Ship progression: size tiers unlock through shipyard development
The source's four ship types each come in several sizes that unlock as shipyards develop over the game; bigger hulls cost more. Ship types sort differently by price/capacity (small to large), by speed (the light trader fastest, the heavy cog slowest), and by maneuverability (matters only in manual battle). One type (their biggest) may not exist at early start years at all.
Our state (verified against src/sim/trade.mjs:11-14): we have four types with fixed capacity/speed/upkeep/cost/build-days - no size tiers and no shipyard-driven unlock.
Proposal: none for code. Tiered hulls unlocking via shipyard investment is a design input (ships zone/balance); flagged only, no engine gap claimed.

### 2. Refit stages trade cargo space for weapon mounts, irreversibly
The source's ships can be upgraded through refit stages: each stage adds weapon slots and battle stability but permanently reduces hold capacity, and refits cannot be undone. Crew beyond the minimum also eats hold space.
Our state (verified: src/sim/trade.mjs:31-32 shipCapacity subtracts loadWeight, which is weaponWeight plus gearWeight per src/sim/armament.mjs:21,28 - gear weight scales with crew size and gear level): weapons and crew gear both costing hold exists. A staged irreversible refit system does NOT exist (armament mounts are not a one-way street).
Proposal: none as a code gap. Whether loadWeight already makes armament effectively "cost hold" is covered; irreversibility is a design choice, flagged only.

### 3. No-captain sailing works but is worse
The source lets a ship sail without a captain (a sailor steers, always taking the straight line and ignoring storms/ice/fog banks); a captain costs money but routes around bad weather and appears to slow wear (the source itself hedges this).
Our state (verified: captainSpeed factors exist in game.mjs sailing; storms/weather exist via sim/weather.mjs. Our routes.mjs does NOT check for a captain - setRoute/setRouteAdv/processRoutes never reference one): the broad pattern partially exists. Whether our no-captain ships ignore hazards or wear faster is unverified.
Open question: a sim check could pin "no-captain voyage wears hull faster and ignores weather fields vs captained" IF the design intends the source's trade-off; not asserted as our current behavior.

### 4. Convoys behave as one ship outwardly - with hidden costs
The source's convoys need a captain only on the lead ship, load as a single unit, and present as one ship to others; the downside is that only the lead ship's lookout spots other vessels.
Our state (verified: src/game/convoys.mjs:30+ form/leave/disband with membership contract, escortOf firepower sharing): convoys exist with shared-escort semantics. Single-lead-lookout visibility is unverified in our engine.
Open question: whether convoys should hide escorts' spotting is a design question for the convoy/AI zone; flagged only.

### 5. Wear rates differ by hull type
The source sorts ships by durability: the heavier hauler wears slowest, the light trader fastest - which is why heavy hulls get the long expeditions and building-material runs.
Our state (verified: player ships wear via seaWearDay in src/game/seawear.mjs, called from game.mjs:293/343 - a base rate plus wind strain and storm exposure, with no explicit per-type multiplier; NPC traders keep the flat trade.mjs tickShip model on purpose, as seawear.mjs documents).
Open question: per-type wear rates would be a design input; if wanted, a data-side pin could assert relative wear ordering without prescribing values. Flagged only.

## Open work
- Rest of Kapitel 4 (convoy orders, piracy subchapters 4.2.3.1-4.3) remains to read.
- Event-weighted reputation (from the market note) still unverified against events.mjs/calamities.mjs.
