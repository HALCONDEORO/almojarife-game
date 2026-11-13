# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), how trade, standing, contentment and production link, 3.1

13 November 2026. Main inspected: `bba6320`. Clean-room research only: ideas in our own words, no copied text, tables or figures, no excluded modding material, no executable inspection. No implementation approved.

Reading scope: section 3.1 (3.1.1 trade and standing, 3.1.2 trade and contentment with its four class subsections and short conclusion, 3.1.3 trade and production), printed pages 63-65 of the Tippsammlung (3.1.1 on p. 63, 3.1.2 to the start of 3.1.2.3 on p. 64, the rest through 3.1.3 on p. 65; checked by extracting pages 63-66 of the PDF one by one; p. 66 opens 3.2). The data sheet the section points to at the end of chapter 3 (consumption per class) is NOT read here.

Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf. It documents Patrizier II (the community compilation, print version of the forum). Whether each detail holds in Patrician III is not claimed; this repo studies it as design reading, like the other Tippsammlung notes.

## What the section teaches

1. Standing comes from trade, per town. Every good counts the same; only the value of the sale matters, so a dearer good earns more than a cheaper one, and a scarce good earns more than a plentiful one. Every purchase lowers standing, and buying a scarce good lowers it more than buying a plentiful one. Profit margin is therefore also the standing gain. The effect is local to the town where the trade happens, so the advice is to buy where a good is made cheaply and sell where it is needed, then trade other goods back. Sieges, plague, famine and a frozen port raise demand for some goods, and sales of those earn extra.
2. Standing and contentment are different things. Standing belongs to the player; contentment belongs to the townspeople. They usually move together because even distribution of goods serves both, but they can split (a high rank in an angry town through an arbitrage ship).
3. Contentment is read per class, on a ladder of six words. The town jester gives only a general reading; the status bar gives the classes separately. Beggars are left out because they consume nothing.
4. Growth depends on jobs, housing and a contentment level of at least the third rung. Below that a class stagnates or shrinks. The class mix of the town can therefore be steered inside bands, wide for the poor and narrower for the rich. A stock buffer of some weeks of every good is advised.
5. Each class has its own levers. The rich care about meat, cloth, wine, spices and furs; the middle group reacts strongly to wool, wine and cloth although those look like other classes' goods; the poor need cheap food (grain, fish, beer), wool, and timber, and use no furs or wine. Salt matters to everyone. Wells and similar measures lift every class. Dearth of timber or grain hits all classes. The source says not all goods are classified because some effects are hard to measure.
6. Beggars are the recruiting pool: poor residents come from them, crews and the town guard are made from them, and their number follows the contentment of the poor. Alms feeding raises it for a short time.
7. Production, distribution, contentment, growth and standing form one loop. Late game the player sells mostly from own production, not from classic buy-and-sell.

## Mapping to Almojarife (verified by reading the cited lines)

- Standing per port exists as portRep (`src/game/reputation.mjs`). It rewards sales and penalises purchases by how scarce the good is: `repOnSale` (line 77) and `repOnBuy` (line 82) both return 0 when scarcity is 1 or below, so a sale into a balanced market earns nothing and a purchase of an abundant good costs nothing. Gains are capped per port and day (`REP_DAY_CAP`, line 11, applied in `award`, line 61), losses are not capped. Standing decays toward zero in ports without trade (`decayRep`, line 95). Local, as in the source.
  Difference to the source: in the source every sale counts and scarcity only increases it, and every purchase costs. Here the scarcity of 1 or below is a hard zero on both sides, and the gain is capped. Not a bug; a design choice to record. Open question: whether the intent is that selling plentiful goods should earn nothing; the source suggests a small gain.
- Contentment per class exists as `moodTarget` (`src/game/citylife.mjs:80`) driven by how well the market covers each class's basket, with a hunger cap on the staple coverage and extra effects from civic buildings, shocks and plague. A weekly drift of newcomers is bounded by `housingRoom` (`citylifeDay`, line 109; room at line 115). The module's header says it is flag-gated; I did not check whether it is on by default at runtime.
  Matches: classes are separate; contentment drives growth and flight; hunger is the hard floor; room is limited by housing.
- Class mix: `classShares` (`src/sim/classes.mjs:8`) derives the shares from the population size only. In what I read, nothing makes the class mix move with contentment. The source says players can steer it inside bands. Open question: do we want class mix to react to contentment, or is the size-based mix intended?
- Beggars: a grep over `src` and `data` (.mjs and .json) for beggar, mendig and Bettler found no hit. In what was searched there is no beggar pool as the source describes it; crews and recruits are not drawn from a contentment-linked group. Not a claim about the whole repo.
- The source's wide list of per-class goods is the unread data sheet's companion; the mapping of our class baskets (`PER_1000`) to it is left open.

## Proposals (docs only, for the owner to judge)

1. Record in the standing design that the scarcity-1 hard zero is a conscious departure, and decide whether a small baseline gain for plentiful sales is wanted.
2. Ask whether contentment should shift class mix within bands, as the source describes; if yes, it is a new feature behind a flag with its own tests.
3. Beggar pool: only if the owner wants a recruiting pool linked to the poor's contentment; no action until then.

## Open work

- The consumption data sheet at the end of chapter 3 and the sections after 3.1 are unread here.
- Whether Patrician III changed any of these mechanics from Patrizier II.
