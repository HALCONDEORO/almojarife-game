# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), production chains 5.4.1-5.4.5 (beer, iron ore, metalware, furs, fish)

Purpose: same as patrician3-mechanics.md. The production note on main leaves "the rest of Kapitel 5" open. This note covers the first five per-good sheets of 5.4 (alphabetical: brewery, ore smelter, workshop, hunting lodge, fisher), printed pages ~97-100. The remaining sheets (5.4.6-5.4.17) are not covered. Town lists per good that the source gives for its own map are not reproduced.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed). Almojarife has its own goods and map; findings are about structure, not about copying the chains.

## Findings and what they mean for Almojarife

### 1. Every good gets a three-part profile
The source rates each producer on supply importance (how much citizens need the good), earning potential, and build priority, and lists its inputs. In these five sheets staples (beer, fish) are very important and earn little, and fish is compared with grain, which has no sheet among the five; goods that are almost irrelevant to satisfaction (metalware, furs) earn a lot; an intermediate (ore) matters only to its one downstream user and has no effect on citizens at all. Build priority tends to follow in these sheets (staples early, high earners later because their buildings are costly, slow and need hard-to-source materials, and one input can bottleneck a chain); no universal causal rule is claimed.
Our state (verified: src/sim/needs.mjs NEED_GROUP and src/sim/classes.mjs PER_1000): goods are grouped as food, drink, luxury, clothing, household and materials, and citizens consume per class; iron, ironware, timber and bricks are in the materials group and ARE consumed by citizens in our basket, unlike the source's ore. There is no per-good "build priority" or "earning potential" field; those are not stored in the code I read.
Open question: a short per-good profile table in design docs (importance, margin, build order) would help the economy audit and the AI's build order; whether our materials-in-the-basket choice is intended for the intermediate goods is a content-zone question. Flagged only.

### 2. A producing town turns from exporter to importer as it grows
The source warns, for beer, that a cargo that looks huge is used up by a mid-sized town in about a month, and that a town which first exports a staple later becomes a net buyer once its population has grown, which catches logistics out.
Our state (verified: src/sim/market.mjs makeMarket and src/game/growth.mjs): each port has a fixed list of goods it makes and needs; the daily rate scales with population, and city growth moves demand within a small bounded range. Whether a producer port can really flip to net importer through growth was not tested in this pass.
Open question: a balance-report check that lists, per producer port, the ratio of its production rate to its own consumption at the growth limit; flagged only.

### 3. Build the whole chain where the inputs are local and efficient; split chains with a shuttle
The source recommends putting a chain where all links are produced efficiently in one town (no delivery cost) and, when no town has all of them, a partner arrangement: two towns each make one input, the producer buildings are split between them, and a small convoy shuttles the inputs back and forth. It also notes that an inefficient link is a heavy cost for logisticians.
Our state (verified: src/game/buildings.mjs "primary producers ... buildable only where the city makes the good" and cityAllowsProducer in quoteConstruction): our primary producers can only be built where the city produces the good, so the "wrong town" error cannot occur; construction of any building draws its materials from the store, then the market, then import at a markup (quoteConstruction, buildings.mjs:202-221); that is the build-supply path only. Production inputs follow their own recipe and quote (workshopTick, buildings.mjs:445-477), and import at a markup is not guaranteed there. Our standing routes go between ports and buy, sell and sail on the market; warehouse-to-warehouse carrying between own ports is not established in what I read, so a logistic equivalent of the partner shuttle is not claimed.
Open question: whether a store-to-store transport between own ports exists or should exist for partner production; flagged only.

### 4. Joint output splits cost between the two products
The source says one fisher variant yields fish and whale oil in the same house with lower input use but higher running cost, the cost being split between the two products in a fixed ratio, so the fish becomes uneconomic while the oil is cheap, and the oil profit covers the fish loss.
Our state: the production note already records that our joint-production model differs; not re-assessed here.

## Open work
- 5.4.6-5.4.17 (livestock, grain, hemp, sawmill, honey, pottery, pitch, salt, cloth, wine, wool, bricks) are not covered; the pitch sheet carries a consumption claim worth checking separately.
- 5.1, 5.2 and 5.5 (data sheets, deliberately skipped as tables) are not covered.
