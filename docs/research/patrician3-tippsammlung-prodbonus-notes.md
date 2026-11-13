# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), the production bonus for several works of one kind, 5.6.2

Purpose: same as patrician3-mechanics.md. The production note on main covers 5.6.1 and 5.6.4, and the build notes cover 5.6.3 and 5.7; none covers the production bonus of 5.6.2, printed pages ~111-112. Small, but it is a structural idea about how output should grow with the number of works.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. A small, stepped reward for building many works of one kind in one town
The source: a bonus rewards building several works of the same type in the same town. It starts at a small number of works and rises in a few steps as that number grows; the effect is a slightly higher output at the same time and cost, not faster or cheaper work. It applies only to that town and that works type, and bonuses for different types are independent. The source itself calls the gain modest: it helps a big operation, but one more works does not make a player rich.
Our state (verified by grep on src/game/buildings.mjs and src/sim/recipes.mjs for cluster, production bonus and same-type terms: none found; read of buildings.mjs around WORKSHOP_BATCH_PATTERN and batchesFor): output of each building depends only on its own level (a repeating batch pattern per level) and on the port's staffing ratio (free labor against jobs needed); buildings do not affect each other's output. The only per-port aggregate effects in the code I read are the house population bonus and the warehouse capacity bonus.
Design note: our levels (up to a small maximum per plot) already give a size reward per building; a count-based reward across buildings would be a second, different lever and would interact with labor, plots and the AI's build order. No change is proposed from this note alone.
Open question: whether a stepped same-type reward per port is worth testing in the economy audit, with a flag and a balance report that shows its effect on payback time; flagged only.

### 2. Why the idea matters for specialisation
The source's reasoning is that the bonus pushes players to concentrate a works type in a town, which fits its advice elsewhere to build a chain where inputs are local. Whether our plot limits and labor limit already force the same concentration was not examined here.
Open question: check, in a balance report, how many same-type buildings a strong port ends up with at the plot and labor limits; flagged only.

## Open work
- 5.1-5.3 and 5.5 are covered or skipped by other notes (tables skipped on purpose); 5.4.6-5.4.17 per-good sheets remain open.
