# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), production chapter 5.6.3 and building chapter 5.7

Purpose: same as patrician3-mechanics.md. This note covers two short sections not yet covered by the other tippsammlung notes: 5.6.3 (running works below full capacity) and 5.7 (building tips, which are two bug exploits). Printed pages ~112-115.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. A works costs the same whether it runs full or idle
The source argues for running every works at full capacity: the land fee per works is fixed per week, so running at a fraction of capacity spreads the same fee over far fewer units and the cost per unit climbs sharply, while the wage saving is only proportional. A works that lacks inputs still pays its wages and fee for the week. The only time to pause is a short stall early in the game; with many works, mass layoffs are not realistic and would hurt the town's social balance.
Our state (verified: src/game/buildings.mjs accrueBuildings): an active building pays a daily upkeep plus wages that scale with its level, not with what it produced that day. There is no capacity dial, so the "run it far below capacity" trap cannot occur. A building whose margin is gone simply does not produce that day and keeps paying; the code counts negative days and posts a margin warning (negDays, bldMargin). A building halts only when cash cannot cover the day's cost, and resumes at about two days of cost (hysteresis).
Design note: the source's lesson (fixed cost makes idle works expensive) already holds here by construction. Open question: whether a long-idle works should offer the player a cheap "pause" is a content-zone choice; flagged only.

### 2. Rapid-click building: materials skipped, a large cash penalty charged
The source reports a timing bug: right after two builds in the same town the game has a short window in which further builds go through without the materials, and the shortfall is then billed in cash at a very steep price, so the trick only helps when cash is plentiful and the player is fast with the mouse.
Our state (verified: src/game/buildings.mjs startConstruction and quoteConstruction): a build quotes and pays in one step with no timing window; the quote refuses a plot that is already building or queued, and each order consumes its inputs before the work starts. No race of this kind is possible by design.
Design note: two builds ordered in the same tick on two plots are already covered (test/buildings-queue.test.mjs:26-31), and startConstruction consumes inputs synchronously before queuing (src/game/buildings.mjs:259-272), so the race is structurally impossible. Not pinned: a second order after stock ran out paying the import price. Flagged only.

### 3. Material for building is drawn in a fixed order; one input was never removed from the market
The source: the order is own office store first, then ships anchored in the town, then the town market. One input bought from the market for building was not removed from market stock afterwards, so it could be "bought" again for any number of further builds; the workaround was to leave only enough in the hall for one build, build, then restore stock.
Our state (verified: quoteConstruction and startConstruction): the order is the player's warehouse first (unless the good is locked), then the local market, then import at a markup; only the locally bought units reduce market stock, and imported units never touch the market. Ships in port are not a source in our order.
Design note: the infinite-input bug cannot happen if purchases always reduce stock; the pin "market stock drops by exactly the locally bought units after startConstruction" already exists (test/buildings.test.mjs:50, inputs leave the market). Not pinned: the mixed split, where imported units never touch the market stock. Ships-as-source is a possible future convenience, flagged only.

## Open work
- Chapters 10 (FAQ) and 11 (multiplayer) per the table of contents: not covered.
- Earlier open items from other notes remain open.
