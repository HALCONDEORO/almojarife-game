# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), automatic city trade 3.3.2.1.2-3.3.2.3

Purpose: same as patrician3-mechanics.md. The routes, supply and company notes on main do not cover how the source splits automatic city trade between the office administrator (Kontorverwalter) and a ship captain on a stationary route. This note covers 3.3.2.1.2 (routes switch from earning to distributing), 3.3.2.2 (city trade by the administrator) and 3.3.2.3 (city trade by the captain), printed pages ~69-71 (3.3.2.1.2 runs from 69 to 70, 3.3.2.2 and 3.3.2.3 start on 70 and 3.3.2.3 ends on 71). The price tables of 3.4 are deliberately skipped.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Routes change job as the game goes on
The source: early on, auto routes earn money by buying and selling at every stop; later they should only move goods between offices (load from the store, unload into the store) while all trading is done by the office administrator, so the ships no longer need a good trading captain.
Our state (verified: src/game/steward.mjs header and src/game/game.mjs:384-385): our warehouse administrator already holds standing buy and sell orders per good (buy at or below a cap up to a stock target, sell at or above a floor keeping a chosen stock) and runs once a day on the port's market slot. Whether our routes have a pure "load from store, unload into store" mode is not verified in this pass.
Open question: check the routes code for a store-to-store mode; flagged only.

### 2. The administrator is a daily, one-pass, paid agent
The source: the administrator acts once a day, only checks whether it can buy or sell a good at the set price, and has a running cost made of a flat daily fee plus a small amount per own building in the town. Early it buys what the town makes cheaply and sells what ships bring; later it is mostly a seller. Only with an administrator can a player reserve quantities that stay in the store and are off limits to route ships, for example to keep production running while a convoy with automatic balancing is in port, or to keep building material.
Our state (verified: src/game/governor.mjs, steward.mjs, whlock.mjs, game.mjs:384-385): the governor is a paid upgrade of the free administrator; its wage depends on its level, not on how many buildings the player has in the port. A wage that cannot be paid suspends the governor with a notice instead of creating debt, and his orders pause until cash returns. Orders run once a day at the day tick. A good can be locked against voluntary outflows (whlock.mjs:4-12, whLocked); forced withdrawals through seizure, debt or bankruptcy can still happen. Construction (buildings.mjs:215) and the steward respect the lock. Whether the route loader also respects the lock is not verified in this pass.
Open question: whether the governor wage should scale with the player's buildings in the port as in the source; and whether auto routes honour the lock. Flagged only.

### 3. Replacing the administrator does not resume the existing instructions until the settings are reactivated (source) versus ours
The source's plague passage (printed page 61, see the towns3 note) says that after the administrator dies, a new one does not take over the instructions, and the player has to renew the settings by switching them off and on. That is inoperative instructions, not proof that the data is destroyed. Our dismissGovernor removes only the governor record; the standing orders live in a separate administrator record (stewardOf, warehouse admin field), so dismissing or suspending a governor does not erase them (verified by reading governor.mjs dismissGovernor and the stewardOf accessor). The governor's own budget and goal settings are removed with him.
Design note: this already avoids the trap for orders; the governor's budget and goal are lost on dismissal, flagged as a small UX question.

### 4. Stationary buying ships to complement a once-a-day administrator
The source: because the administrator acts only once a day, players keep a small ship permanently in port as a buyer. It offers one token item at an absurdly high price so its route never ends, while it buys the goods it should at a low price. It catches goods that AI traders deliver between the administrator's passes and soaks up gluts after events such as sieges or frozen harbours, when the administrator has dumped stock into the market and prices then collapse. The route only breaks when cash runs out or the hold is full, so early on the ship has to be emptied every few days; later it gets a second stop that moves the goods into the store. The source mixes this with an arbitrage version (chapter 9.1, covered elsewhere).
Our state: no stationary buyer ship exists in the code that I read (steward.mjs and governor.mjs only); our steward can both buy under a cap and sell over a floor for each good in one daily pass, which covers part of the same need without a ship. Not verified: whether intra-day market moves leave a gap that a second daily pass would use.
Design note: the unrealistic token price is an exploit of the route logic and should not be copied. Open question: whether a second steward pass or a post-event buy-back rule is worth testing in the economy audit; flagged only.

## Open work
- Chapter 3.4 data tables are skipped on purpose (utility-chart risk).
- 6.4 Eldermann missions (nest, notorious pirate) are not covered by any note; 6.4.4 (land road) is left to the land logistics work.
