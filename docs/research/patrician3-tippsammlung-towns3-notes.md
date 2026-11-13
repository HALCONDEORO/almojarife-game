# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), towns chapter, third pass (info buildings and own buildings)

Purpose: same as patrician3-mechanics.md. This note covers the rest of Kapitel 2: 2.1.2 (information buildings) and 2.2.1-2.2.5 (the player's own buildings: office, houses, works, warehouses, infrastructure), printed pages ~57-63. Pure UI-catalog content is skipped.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. A wrong unit label in the market hall misled production planning for years
The source warns that the city production figures in the market hall are labeled per week but actually shown per day (the trader-facing figure is correct); the consumption display is the important one - players balance their output against summed consumption and aim for a couple of weeks of stock in every hall.
Design note (anti-pattern, no engine claim): a unit mislabel in a planning view corrupts every decision built on it. Recorded as a reminder that our own market/ledger displays must state their time base; flagged only.

### 2. Weapon stockpiles steer AI militia training (indirect influence)
The source: when a council approves new militia units, the mayor trains the types the local weapon smith has in stock - so a player can pre-buy one weapon type and sell the smith the type they want trained, steering city defence without holding office.
Our state: no militia-training system found in the inspected code (our city defence parallel is the kept watchtowers of towers.mjs and the warehouse watch of whwatch.mjs; both own design).
Design note: stock-driven AI purchasing as an indirect player lever is a clean pattern if city defence ever gets units; flagged only.

### 3. The plague: a timed crisis with mortality and a settings-loss trap
The source: a plague lasts about a month, stops immigration, shrinks the population (works run under capacity), raises wood demand, and can kill the player's wife or the local office administrator - a dead administrator interrupts the office trade AND loses the stored trade instructions, which must all be re-entered after rehiring. Wells (fire), streets, hospitals and chapels (epidemics) are the mitigations, held at high coverage.
Our state (verified: src/game/calamities.mjs - our plague-frame calamities (famine, fire, sanitation scare) are weekly seeded rolls with building mitigations, explicitly NO mortality and NO destruction: fire halts buildings, famine raises food demand, a scare slackens trade; on by default in a new game (game.mjs:174) - the module header still says off. src/game/works.mjs - the civic works (pozo/hospital/capilla/alhóndiga) carry mitigation weights from the calamity table, petitions only, not autonomous).
Design note: the source's "dead administrator loses all trade settings" is recorded as a UX trap to avoid, not a mechanic; the mitigation-buildings frame is already our own design in parallel.

### 4. School and mint accelerate growth without moving the class caps
The source: a school raises the beggar influx (future poor workers), a mint speeds up promotion into the rich class; neither changes the class distribution itself - the caps (a minority rich in a well-supplied city) hold with or without them. Both buildings exist once per city and generate no streets (relevant to the road-grid chapter).
Our state (verified: src/game/citylife.mjs - our classes exist but rents and mortality are not coded; no school/mint analog implemented, though a comment in buildings.mjs:119 already references a single school and mint per town).
Open question: growth accelerators that speed class transitions without moving the caps are content-zone design input; flagged only.

### 5. Ships as zero-cost floating warehouses (exploit warning)
The source: unneeded ships, stripped of crew and weapons and parked in harbour, serve as free storage - no storage fees, no burglary risk, no building plot used. Veterans also warn that the auto-rented extra warehouse space quietly compounds into a major cost if left unchecked.
Our state (verified: warehouse capacity and the warehouse watch exist (whwatch.mjs/whCap); whether uncrewed ships can hold goods indefinitely for free is not verified in the inspected code).
Design note: recorded as a balance warning for the economy zone, not a feature; flagged only.

## Open work
- Chapters 10 (FAQ) and 11 (multiplayer) per the table of contents: not covered, assessment pending if wanted.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.
