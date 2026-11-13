# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), convoy orders and piracy

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 4 sections 4.2.3.1-4.3.3 (escort ships, public/private convoys, the repair-ship trick, pirate kinds, passive and active defense, player piracy) of the full German community compilation. Companion to patrician3-tippsammlung-seafaring-notes.md (4.1-4.2.3).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 4.2.3.1-4.3.3, printed pages ~78-82; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Escort ships have entry conditions
The source's convoy lead ship must meet conditions before a convoy may form: a captain aboard, hull above a condition threshold, a minimum crew count, and a minimum armament level.
Our state (verified: src/game/convoys.mjs formConvoy() accepts 2-5 docked owned ships; no captain/hull/crew/armament precondition on any member was found).
Proposal: none as a gap. Whether our convoy formation should require an able escort is a design question (convoy zone); flagged only.

### 2. Public convoys as a reputation instrument
The source has public convoys anyone (AI or human) can join, announced via the guilds, and its manual says founding one grants standing - though players could never confirm an AI ship ever joined, and long waiting times make them impractical. Private convoys are the logistics backbone; long expeditions are convoy-only.
Our state: our convoys are private only; no public/joinable convoy concept exists.
Proposal: none. Design input only (multiplayer-adjacent feature); flagged.

### 3. Convoy speed follows the slowest member
The source: a convoy sails at its slowest ship's speed.
Our state (verified: src/game/convoys.mjs:113-132 sailConvoy): the coupling exists. On departure every member sails together and the slowest sets the pace - all members' ticksLeft/totalTicks are aligned to the maximum, so a convoy arrives as one unit at its slowest member's speed, matching the source's rule.
Caveat: the alignment happens at departure. Hull damage taken mid-voyage slows individual ships afterward (seaWearDay / hull-drag path), so ETAs can still separate after wear; whether re-alignment should happen en route is an open question, not a gap.

### 4. The repair-ship trick: a fragile escort triggers cheap dock visits
The source's auto-routes repair the whole convoy when any member drops below a high condition threshold; adding a fast-wearing small ship to a convoy of durable haulers triggers repairs early, when all ships are still near-healthy, so each dock visit is short and route round-trip times stay predictable - at the cost of more frequent visits.
Our state (verified: src/game/routes.mjs:43-58 auto-repairs at a 50 threshold, i.e. half-condition, far below the source's high threshold; repair time scales with damage and our wear is weather-coupled, not per ship type (src/game/seawear.mjs: base + wind + storm + hull-damage drag for player ships; the flat tickShip model is NPC-only)).
Open question: the source's trick depends on per-type wear rates (absent here, flagged in the seafaring note) and a high repair threshold. No proposal; the contrast is recorded for the routes zone.

### 5. Two kinds of pirates: opportunists vs mission-spawned fanatics
The source distinguishes free pirates (appear on the map, attack only when feeling superior, flee when losing) from pirates spawned by certain tavern missions, who always attack and fight to the death. Free pirates can be deterred passively: a convoy past a size threshold is never attacked even if weakly armed, and pirates only attack when there is cargo worth taking - so bait cargo on a hunter ship lures them.
Our state (verified: src/game/encounters.mjs pirates are abstract voyage encounters with hullLoss/cargoLossPct/delay outcomes; there are no persistent pirate ships, no nests, and src/sim/ai.mjs:72 notes nobody raids bots today).
Open question: map-persistent pirates, nests, deterrence thresholds and bait are all design inputs (combat/AI zones); nothing proposed for engine work.

### 6. Pirate nests cycle activity
The source's pirates spawn from fixed nest locations on a rough schedule, and nests go dormant for long, unpredictable stretches before resuming - so blockading a nest works but cannot be relaxed.
Our state: no nest concept (abstract encounters only). Design input; flagged.

### 7. Player piracy: capture beats plunder, and justice costs more than loot
The source: piracy needs only a captain (arming optional - an unarmed pirate can even be faster at catching lightly-laden targets); capturing a ship beats plundering it, because a piracy conviction's bribe/fine outweighs plundered cargo value, and plunder also slows the pirate for follow-up fights. Entering port still flagged as a pirate counts as a town raid.
Our state (verified: src/game/justicewire.mjs:21 defines chargePiracy, called from privateering.mjs:57 on unlicensed attacks; justice.mjs applies fines, cargo seizure and ship detention; licensed letters of marque skim a fixed royal share instead. Plunder-vs-capture economics and the flag-state port rule are NOT modeled).
Open question: whether our justice exposure should scale to exceed typical plunder value (the source's deterrent shape) is a balance question (economy zone); flagged with no prescribed numbers.

## Open work
- Kapitel 4 remainder beyond 4.3.3 (manual sea battle details) not yet read; town raids and manual battle are referenced there.
- Earlier open items: convoy lookout/stop-cost questions (seafaring note), event-weighted reputation (market note).
