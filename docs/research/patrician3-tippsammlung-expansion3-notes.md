# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), expansion chapter, third pass (settlement mission and goods assignment)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 8.4.2-8.5 of the full German community compilation (printed pages ~162-168): the founding mission's conditions and build sequence, and how the source assigns a new settlement's producible goods. The material/cost table of 8.4.4 is catalog detail; excluded here (figures would be copied numbers anyway).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. The founding mission is a long-deadline quest with revocable failure
The source: the elder's founding contract gives a very generous multi-year deadline to raise a wall and reach a modest population target. Missing it only revokes the contract (handed to an AI trader who reportedly never finishes it), costs some reputation, and suspends elder missions briefly - no material penalty. Save-before-accepting is the documented standard advice, because the settlement LOCATION is assigned, not chosen.
Our state: no settlement-founding system exists in our engine at all (no found-town or colony mechanic found in the inspected code; origin.mjs only wires a founder's background into existing systems at new-game creation).
Design note: a revocable long-deadline quest with a soft failure ladder (revoke + reputation + cooldown, no ruin) is a clean pattern for any future expansion zone; flagged only.

### 2. Growth gated by civic buildings, and a pre-recognition grace period
The source: the settlement's population caps lift in steps as key buildings finish (market hall first, then own office, town hall, wall, tavern, repair dock, church). Until the council recognizes the settlement, citizens consume goods but their satisfaction does not suffer from empty shelves, taxes flow, no AI competitors settle, and the prince may not besiege - a grace window the source's players exploit to stockpile "free" workforce before recognition flips the town into the regular supply system.
Our state (verified: src/game/growth.mjs - our city growth is a slow demand-multiplier drift tied to how well fed a city is, flag-gated, not building-gated; no recognition or grace-window concept exists).
Open question: building-gated growth steps and an explicit grace window are content-zone design input; flagged only. The "grace period exploits" of the source are recorded as a balance warning, not a feature to copy.

### 3. Goods assignment by shortage, scrambled through a fixed mapping (a documented source bug)
The source: a new settlement's producible goods are drawn from the largest CURRENT shortage in the whole Hanse - but not the missing goods themselves: a fixed counter-goods table maps each shortage good to a different good the settlement will produce (the source calls this a programming error). Shortage is computed from visible stock across market halls, player offices and player auto-route ships versus weekly consumption, so players manipulate it by concentrating goods into ships before accepting the mission. One good has no counter-good at all, shrinking the settlement's output list.
Our state: n/a (no founding system, no shortage-to-goods mapping exists to verify against).
Design note: a fixed, undisclosed cross-mapping between cause (shortage) and effect (assigned goods) produced a decade of player manipulation guides. If settlement goods are ever assigned dynamically, the mapping should be direct and discoverable; recorded as an anti-pattern example, not as a mechanic to port.

## Open work
- Rest of Kapitel 2 (shipyard, market hall, own buildings: 2.1.2, 2.2.1-2.2.5) remains; mostly catalog detail.
- Chapters 10 (FAQ) and 11 (multiplayer) per the table of contents: not covered, assessment pending if wanted.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.
