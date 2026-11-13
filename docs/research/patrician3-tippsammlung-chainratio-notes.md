# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), good priority, chain ratios and dependency graphs, 5.5.3 to 5.5.5

13 November 2026. Main inspected: `8290a85`. Clean-room research only: ideas in our own words, no copied text, tables or figures, no excluded modding material, no executable inspection. No implementation approved.

Reading scope: 5.5.3 (importance of goods to residents), 5.5.4 (production equation list) and 5.5.5 (two dependency graphs), printed pages 108-109 of the Tippsammlung (5.5.3 and the start of 5.5.4 on p. 108; the rest of 5.5.4 and 5.5.5 on p. 109; p. 109 ends where 5.6 opens; checked by extracting pages 108-110 of the PDF one by one). 5.5.1 (overall data sheet) and the unit-cost table of 5.5.2 are tables and are not summarised here. The ratio lists and the ranking are data and are not reproduced.

Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf. It documents Patrizier II (a community print version). Equivalence with Patrician III is not claimed.

## What the section teaches

1. Goods have a fixed priority order for what residents care about: staple foods first, then fuel and clothing materials, then comfort goods, then luxuries and metal goods last. A few goods (ore, hemp, pitch, bricks) do not matter to contentment at all. Reading: contentment is driven by a ranked list, not by all goods equally.
2. A "production equation" says how many raw-material buildings it takes to supply one processing building (or the reverse), so that raw output matches the processor's need with only a small leftover. Examples are given for the sawmill feeding several kinds of processors, a hemp farm with a workshop feeding many hunting huts, and so on. The idea: plan building counts in matching ratios, not one-for-one.
3. The equations hold only when every building in the chain runs the efficient mode, and for seasonal buildings only in summer output.
4. Exact ratios need large building counts, which a new player does not have. The source offers rougher small-scale ratios and warns they become wasteful over time because the quantities do not fit; a rough "some wood" entry means one sawmill suffices for a very long time for low-wood processors.
5. The two graphs show raw, intermediate and final goods with arrow thickness as rough quantity, and make two points: some chains need little of one input but a lot of another (salt for meat and leather), and wood is the central input of most chains, including some where it is not obvious (fish and train oil).

## Mapping to Almojarife (verified by reading the cited lines)

- Our processors do not link to a supplier building. A processor buys its inputs at the local market on the day it runs, runs the largest batch that still turns a profit after fees, and stops if stock, cash or margin is missing (`workshopTick`, `src/game/buildings.mjs:429`, comment at 425-428). In what I read there is no rule that rewards matching raw and processor building counts; the market price is the link. So production equations have no direct counterpart; the closest analogue is the margin check.
- The data to compute ratios exists: `PRODUCERS` (`buildings.mjs:386`) gives each building's recipe, output and a batch `pattern`, `producerRate` (line 420) gives average batches per day, and `RECIPES`/`OUTPUTS` in `src/sim/recipes.mjs` give input and output per batch. A ratio view would be derived from these, not new data.
- Timber as a central input is also true here, by reading `src/sim/recipes.mjs`: every construction recipe lists timber (all entries in the construction block), and among processors the forge, firing and kiln recipes use timber while weave, brew and boil do not. A sawmill is a primary producer with no inputs (`PRODUCERS.sawmill`). This confirms the source's point only for what I read; it is not a statement about balance.
- Good priority: our residents' demand is per class and per good (`PER_1000`, `src/sim/classes.mjs:20`), and contentment checks the staple list (`STAPLES`, `src/game/citylife.mjs:25`) plus each class's basket (`moodTarget`, line 80). There is no single ranked list of goods; weight by class takes its place. Beer is in every class basket here but is not in the staple list. Bricks are in every class basket, while the source says bricks do not matter for contentment. Both are differences to record, not defects: our bricks comment says citizens use them for repairs and small works.

## Proposals (docs only, owner decides)

1. A read-only helper in the buildings UI could show, for a chosen processor, how many of the supplier buildings in the port would match its input need, derived from `PRODUCERS`, `producerRate` and `RECIPES`. It would teach the idea without adding a rule. Needs an owner decision on whether the UI should show it at all.
2. Ask whether bricks in the resident baskets is intended given the source says bricks are irrelevant to contentment; flag only.
3. Ask whether beer should count as a staple for the hunger cap; the source ranks it among the top priorities. Flag only; balance evidence needed first.

## Open questions

- Whether Patrician III keeps the same priority order as Patrizier II.
- Whether the "efficient mode only" condition has a counterpart here: our primary producers have a seasonal pattern and no efficient/inefficient split in what I read.
- 5.5.1, 5.5.2 tables and 5.6 are not read here.
