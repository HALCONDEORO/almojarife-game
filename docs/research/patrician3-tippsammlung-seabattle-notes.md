# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), sea battle chapter

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 4.4 "Der Seekampf" (automatic and manual sea battle, armament, ship control, tactics) of the full German community compilation. Companion notes: seafaring (4.1-4.2.3) and piracy (4.2.3.1-4.3.3).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 4.4, printed pages ~82-89; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Auto-battle trades outcome quality for player time
The source's automatic battle resolves without player input but the guide reports generally poorer outcomes than a practiced human would get: worse results, worse hull state afterward, uncertain boarding. The stronger ship usually wins, but the source itself reports painful exceptions. Its niches are multiplayer (where a manual battle puts the session on a time-brake for everyone) and very long engagements (nest assaults, town attacks).
Our state (verified: src/game/battle.mjs is a seeded, pure resolver shared by player and bots, already wired in behind an opt-in: encounterdaily.mjs:73 calls fightPirates (piratefight.mjs, which imports resolveBattle) when g.pirateFight is true, with the legacy single-roll outcome kept as the default alternative; no real-time manual battle mode was found).
Proposal: none. No real-time manual battle implementation is proposed in this document; the source's manual layer is recorded as design background only.

### 2. Enemy information is estimated, not exact
The source shows enemy crew counts as estimates with an error margin fixed once at battle start; only your own crew count is exact.
Our state: no enemy-crew estimate layer was found in the inspected resolver and report fields (encounterdaily.mjs:79 stores a final g.encounterReport and a report UI exists, but its fields carry resolved outcomes, not fixed-once estimates).
Proposal: none. If a battle UI is ever designed, estimate-only enemy intel is a design input; flagged.

### 3. Captain combat skill is a first-class battle factor
The source's captains carry sailing and combat skills, and high values are described as a decisive advantage in battle.
Our state (verified: src/game/captains.mjs:2 defines navigation/weather/defence skills; battle.mjs:14,16 feeds captain defence into both firepower and boarding strength).
Verified parallel: captain combat skill already matters in our resolver. The magnitude relative to crew/armament is a balance question (economy zone), not asserted here.

### 4. Armament as a protection-vs-mobility trade-off
The source's doctrine: weapons cost hold space and speed, so arm only what protection requires - traders stay unarmed except convoy leads, and a small dedicated war fleet covers defense and tavern missions. It even suggests leaving weapon slots (or a whole broadside) empty to keep speed parity with a same-type opponent.
Our state (verified: armament costs hold via loadWeight, src/sim/trade.mjs:31-32 + src/sim/armament.mjs; armament wears while sailing, crew.mjs:14). Whether weapon weight also slows our ships at sea is unverified this pass (speedFactor in crew.mjs:30 keys on crew, not weight).
Open question: if weight-to-speed coupling is intended, it is a design input; not asserted as current behavior. No tests proposed - combat is the engine zone.

### 5. Battle constants of the source vs our resolver
The source: unlimited ammunition, no dedicated gun crews (even a single sailor fires a full broadside), weapon types sharing one maximum range but differing in effectiveness by distance and in hull-vs-crew damage profiles. Capture needs an explicit order; surrender converts a loss into plunder-only; hopeless odds make a defender strike its flag.
Our state (verified: battle.mjs has no ammunition concept; crew casualties scale with hull damage, floor(damage/4); finish options are capture/plunder/sink (battle.mjs:33); a defender at hopeless odds surrenders (SURRENDER_RATIO, battle.mjs:9,50-54); weapon types exist as data (armament.mjs WEAPON_TYPES) but per-type hull-vs-crew damage profiles were NOT verified in the resolver).
Open question: per-weapon damage profiles are a combat-design input; flagged only.

### 6. Manual tactics do not transfer; their goals do
The source's tactics chapters (fleeing into the wind, luring an equal-speed pursuer to turn until it stalls, crossing-T broadside cycles, peeling a pirate convoy apart, boarding without shooting) are real-time maneuvering and have no counterpart in a tick resolver. Their strategic goals do transfer: flee when outmatched, reduce a superior enemy's speed before boarding, and isolate convoy members.
Our state: our encounters already model flight, damage and delay abstractly (encounters.mjs); no maneuver layer exists or is proposed.
Proposal: none. Recorded as design background for any future battle-UI work.

## Open work
- Kapitel 4 fully read through 4.4.2.3.4; the remaining tactics subsections (4.4.2.3.5-4.4.2.3.8, own convoys in battle, boarding details, nest-attack mission) are partly read and add maneuver detail only.
- Next chapter in order: Kapitel 6 (between 5 Warenproduktion and 7 Stadtversorgung, already noted) - to be identified from the table of contents.
- Earlier open items: convoy re-alignment en route (piracy note), event-weighted reputation (market note).
