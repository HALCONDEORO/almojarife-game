# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), FAQ chapter 10.1 and 10.3

Purpose: same as patrician3-mechanics.md. Earlier tippsammlung notes list chapter 10 (FAQ) as not covered. This note covers its economic questions 10.1.1 and 10.1.2 (printed pages ~189-191) and the two practical sea questions 10.3.4 (arming ships) and 10.3.5 (moving crew), printed pages ~193-194. Question 10.1.3 (auto routes) is deliberately left out and referred to the supply and routes notes already on main. The political questions (10.2) and the pirate questions (10.3.1-10.3.3) overlap other notes and are not re-assessed here.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Cheap staples as an investment in demand
The source: selling beer, fish and grain at little or no profit makes a town grow, and a bigger town creates demand for the goods that really earn money (metal goods, furs, luxuries). Once a town needs something, the seller sets the price within wide limits. A mint raises the share of rich citizens, who are the biggest spenders.
Our state (verified: src/game/growth.mjs, game.mjs:171 and 381): a city swells slowly when its staples (grain, fish, meat) are better stocked than its own habit, and shrinks when they are worse; the effect is a small bounded multiplier on demand and is on by default. It reads stock scarcity, not the price the player charged, so a player who dumps staples cheaply raises stock and gets the growth, which matches the source's idea in effect. Beer is not in our staples list (GROWTH_FOODS).
Open question: whether beer-like consumer goods should count as "fed" is a content-zone decision; flagged only.

### 2. Idle capacity costs the same as full capacity, for ships as for works
The source: every empty barrel of hold space on a ship costs money because the ship costs the same loaded or empty; unneeded ships should not sit in port, there is always some job; trade ships should be unarmed and minimally crewed since weapons use cargo space and add running cost.
Our state (verified: src/game/crew.mjs dailyUpkeep and cannonUpkeep; src/sim/armament.mjs; src/sim/trade.mjs:32): the hull part of ship upkeep is fixed and only the wage part follows the crew; each weapon adds its own daily upkeep and weighs on the hold (shipCapacity subtracts loadWeight). So both source claims hold here by construction.
Design note: nothing to change; this is a consistency check that passes.

### 3. Weapon choice depends on the job
The source: heavy throwers (Bliden) do best against towers (cities, pirate nests) and at range; the short-range gun (Bombarde) suits close fights; the plain cannon gives the most damage per weapon space; the Werke (a mounted weapon the source says cuts down the enemy crew without wrecking the hull - gloss cautious, our reading of the text) suits a player who wants to board, not sink. The source also says the ranking per space differs between families because pieces take a different number of spaces. Early in the game the smith's stock decides more than the plan. The Entermesser (boarding knives, 10.3.5) are personal crew gear, a different thing from a mounted weapon.
Our state (verified: src/sim/armament.mjs WEAPON_TYPES and MAX_CANNONS): four weapon types, one piece per slot, each with its own power, price, upkeep and weight. Every piece takes one slot, so our model does not reproduce the source's trade-off between pieces of different size. Our weapon table is own tuning.
Open question: whether weapons should have roles (siege, ship fight, crew reduction) or take unequal space is a content-zone choice for the sea-battle owner; no change proposed from this note alone.

### 4. Moving crew between ships in port
The source: in port a player can move sailors, captains and boarding knives (Entermesser) between two own ships, useful after a mutiny or a hard fight when the tavern has no crew; two captains swap places; it does not work at sea or during a fight.
Our state (verified: src/game/crew.mjs transferCrew): sailors move between two ships docked in the same port, free of charge, refused at sea, bounded by the target's room, wages follow headcount. The function does not check that both ships are in g.ships; it is designed for two own ships and the UI path was not checked in this pass. Captains exist (src/game/captains.mjs: captainRoster, hireCaptain, captainOf, captainWage; test/captains.test.mjs) and gear exists in armament.mjs, but transferCrew does not touch those fields.
Open question: whether captains or gear should be movable or swappable between two own ships in port, as in the source; flagged only.

### 5. Three building families must stay in balance
The source: an expanding company needs works for basic supply, for building material and for consumer and luxury goods; building only the luxury kind outruns what towns can absorb, and each family triggers the need for the next, so where you enter the loop barely matters.
Our state: not verified in code in this pass (the build and production notes already cover costs and inputs). Recorded as a design heuristic for the economy audit.
Open question: whether our AI traders or a balance report check the staples / material / luxury mix; flagged only.

## Open work
- 10.1.3 (auto routes, round circuits versus a central warehouse): out of scope here, see the supply and routes notes already on main.
- Chapters 10.2 and 10.3.1-10.3.3 not re-assessed here.
