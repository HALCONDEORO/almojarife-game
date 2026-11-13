# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), plot optimisation and street rules, 9.2 (partial reading)

Purpose: same as patrician3-mechanics.md. The options note assessed chapter 9.2 as "layout mechanics" and the routes note left it open; no note records what the section teaches. This note is a PARTIAL reading: the intro of 9.2, the irreversibility rule and the first street type (9.2.1.1, cross streets), printed pages ~175-177. The diagrams and the exact adjacency rules of the source are layout data and are not reproduced.

Section map of 9.2 (pages ~175-182) with what is NOT read here: 9.2.1.2 access streets (only the opening lines were seen), 9.2.1.3 parallel streets, 9.2.2 simple block building (blocks of six, eight and ten). Nothing is claimed about how the source prevents the second and third street types or about its dense block shapes.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Roads appear as a side effect of where the player builds, and never go away
The source: the town planning office reserves street space automatically when buildings are placed next to each other in certain patterns, and a street, once reserved, can never be undone, even if it was not paved. That land is lost for houses and works for good. Since inhabitants come only from houses and works, the order and pattern of building decides how many people a town can hold. For the first street type (cross streets from adjacent placements) the source says it can be prevented by leaving a gap and demolishing the spacer later, because a street needs a minimum width and does not form in a narrower gap. That prevention is described only for this first type; it is not generalised here.
Design reading: this is a hidden, order-dependent, irreversible rule that players had to learn by experiment, with a lasting cost for mistakes.
Our state (verified in the generators and functions inspected: src/view3d/cityplots.mjs and src/game/buildings.mjs): each port has a fixed set of plots generated from a seeded city layout (cityPlots, seeded by the city id and a population size class); the game only records which plots the player owns and what stands on them (plot ids like city:index). In what I inspected there is no rule that reserves streets according to build order. No demolition function was found in buildings.mjs by grep (demolish, derrib). This is not a claim about every file in the repo.
Design note: no equivalent trap in the inspected code; no change proposed.

### 2. Population depends on built houses, and our model has two housing sets
The source's goal is to maximise inhabitants by wasting little land on roads. In our code the population effect of houses is separate from the layout: housePopBonus is the residents set, summed over houses in state active (a halted house keeps its residents, so unpaid upkeep never evicts, buildings.mjs around line 506), while housingRoom counts only active, non-halted house levels and is what newcomers can use. Work buildings need labor from the port's free inhabitants (freeLabor, line ~373; staffingRatio, line ~375).
Open question: whether the number of plots per port, together with these rules, gives a sensible ceiling on how many buildings a strong player can run there; a balance-report question, flagged only.

### 3. Spacing tricks are exploits of an automatic rule
The spacer trick exploits the automatic street rule. Any future auto-road feature or player-editable layout in Almojarife should avoid order-dependent irreversible effects, or show the cost of a placement in a preview before the player commits.
Open question: none beyond the above; flagged only.

## Open work
- 9.2.1.2, 9.2.1.3 and 9.2.2 (printed pages ~177-182) are unread here and need a separate pass.
- 9.3 and 9.4 (suggested openings for a peaceful trader and a pirate) are walkthroughs that point back to market, production, politics and piracy notes; not assessed here.
