# Patrician III: notes from the Tippsammlung translation thread (clean-room), v2

Purpose: cover the German community tip collection (Tippsammlung), listed as open work in [patrician3-mechanics.md](patrician3-mechanics.md). Same rules: ideas and general mechanics only, in our own words; no text, tables, art, names or numbers copied; source figures as rough ratios at most. Every "current code" claim was checked against the source on main (c4b7e8e).

## Source read (free, public)

- Patrizierforum thread "Part Translation of the Tippsammlung" (Dec 2016 - Jan 2017), a fan's partial English translation of chapters 1 and 3 of the German Tippsammlung, with corrections and discussion by forum administrators: http://www.patrizierforum.net/index.php?thread/5252-part-translation-of-the-tippsammlung/ (19 posts, read in full).
- Community text; paraphrased only, never quoted.
- Provenance caution: precise satisfaction figures circulating in that thread come from a utility chart built with a tool that reads the game's internals. Consistent with our exclusion of binary-derived sources, those figures are not used here; only qualitative mechanics that the manual- and wiki-sourced notes already support are recorded.
- Not retrievable: the thread's translated "hub system" chapter attachment (forum returns 404, no archived copy). The full German Tippsammlung PDF was not re-read in this pass.

## Mechanics and what they mean for Almojarife

### 1. Start year as a world-state preset

- The classic game lets the start year move initial conditions: later starts mean bigger towns (more demand but more needs), shipyards already advanced (better hulls available sooner, faster repairs), stronger rivals, and a calendar offset that puts the first winter closer. Difficulty through initial world state, not through cheating prices.
- Current code: difficulty presets vary only starting cash and upkeep (src/game/difficulty.mjs).
Almojarife proposal: when scenarios land (BACKLOG "scenarios with their own goals and start conditions"), let a scenario vary initial town development, unlocked ship classes, rival strength and starting season. Testable: two starts under different presets differ in generated world state, same seed otherwise.

### 2. Scarcity-driven reputation: already implemented

- The thread's trade-prestige correlation (selling scarce goods earns more standing, buying scarce goods costs standing, all local to the town) matches what src/game/reputation.mjs already implements (scarcityOf scaling on repOnSale and repOnBuy). The thread's special cases (siege, plague, famine, frozen ports raise demand of specific goods) fall out of the same mechanic if events move stock or target.
Almojarife proposal: none new. For new events, prefer moving market stock/target over bespoke reputation rules, so the existing scarcity path does the work. Testable per event: the event raises scarcity of the affected goods and trade reputation deltas follow.

### 3. Standing and satisfaction are separate meters

- The thread stresses that a player's rank in a town and the town's contentment are different things: automated dumping can keep rank high while the population suffers; class contentment drives growth only together with housing and jobs; moods are reported in named levels, not raw numbers.
- Current code: src/game/citylife.mjs already has per-class mood with memory, a neutral point, crisis penalties and weekly migration bounded by housing (flag-gated), and already names mood bands: moodWord() maps the mean mood to contenta / tranquila / inquieta / furiosa (consumed by src/game/moodout.mjs). What the classic game adds: (a) a beggar pool outside the classes that consumes nothing and feeds workers, sailors and soldiers into the poor class; (b) levers that move immigration itself (short-term charity, long-term education buildings).
Almojarife proposal: (a) when crew and factory hiring need a labour source, draw from a non-consuming beggar pool instead of the classes; (b) review how visibly the existing moodWord bands are exposed in the UI, rather than implementing new ones; (c) record charity/education as immigration levers for the city-logic backlog. Testable: beggars never consume market stock; hiring converts beggars into workers.

### 4. Price limits are shared, and both extremes are bad

- Prices follow local supply and demand but hit the same hard floor and ceiling in every town; at the ceiling the poor cannot afford staples (contentment and growth collapse), at the floor trade is pointless. The intended play is the middle: sell staples cheaply enough to keep the base class content while keeping margins on goods for the rich.
- Current code: our model has the same shape, a uniform clamp around base price (src/sim/market.mjs: price = base * (target/stock)^elasticity, clamped to 0.4x-3x), and class affordability cutoffs (affordRatio) so demand collapses when staples pass what a class can pay.
Almojarife proposal: none new; the mechanic is present. Worth one test addition in our suite: at the price ceiling, poor-class demand for staples drops out (documenting the intended behaviour at the clamp).

### 5. Satisfaction plateau (implemented) and stock-days target (open)

Two separate mechanics that v1 of this note merged:

- Plateau: below a "satisfaction price", selling cheaper buys no extra contentment. Permitted source: the Patrician III wiki Trade Prices page states this in player terms (https://patrician3.fandom.com/wiki/Trade_Prices, paraphrased). The precise figures for it circulating in the translation thread come from a chart built with a game-internals tool; as stated above, those figures are excluded.
- Current code: already implemented in spirit. src/game/citylife.mjs the coverage component of moodTarget is 80 * min(1.25, classCoverage), capped at 100: coverage beyond 1.25 adds nothing (coverage 1 reads 80; 1.25 and above read the cap). No proposal.
- Stock-days target: the manual/wiki-sourced notes already record that citizens want a stock of one to two weeks of consumption (patrician3-mechanics.md section 2). Current code has no explicit days-of-stock target; coverage is ratio-based.
Almojarife proposal: if tuning ever needs it, define the coverage target as days-of-stock in data. Testable: coverage at the configured days-of-stock reads full, less does not.

### 6. Winter shifts what citizens want

- The thread notes winter raises demand for heating-relevant goods (fuel and warm clothing materials), not just food.
- Current code: seasons already modulate production per good (src/sim/market.mjs SEASON_PEAK/seasonMul) but demand baskets are season-blind.
Almojarife proposal: seasonal demand multipliers as data per good, on top of the existing class baskets. Testable: winter demand for the listed goods exceeds summer demand at equal stock.

### 7. Growth moves trade from arbitrage to own production

- The thread's closing observation: as towns grow, supplying them shifts the player from trading what towns produce to producing and distributing their own goods, because factories create jobs, jobs create demand, and demand creates growth elsewhere.
Almojarife proposal: none new; keep as the design justification for the workshops/production backlog item and for balancing production to become attractive only after trade capital exists.

## Open work

- Full German Tippsammlung (200+ pages): only chapters 1 and 3 are covered by the translation thread; the rest (production chains, politics, Hanse) remains unread. The download directory 403-blocks direct listing; specific file URLs would need the forum index.
- The thread's price-list spreadsheet attachments and hub-system PDF: not retrievable (404, unarchived).
