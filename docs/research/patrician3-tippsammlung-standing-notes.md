# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), ranks and how the player reads their own standing, 6.1.1-6.1.3

Purpose: same as patrician3-mechanics.md. The politics notes on main cover the climb to mayor (6.1.4, 6.3.3); none covers how the source defines rank promotion and, above all, how it lets the player read their own standing without a number. This note covers 6.1.1-6.1.3, printed pages ~116-118, plus the exception in 6.1.4 on p119. The requirement table of 6.1.2 is not reproduced on purpose.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Rank needs two things, the main rank is checked on a fixed day, and it is kept for good
The source: a promotion needs both company value and a level of standing; for the main rank, measured in the home town, the check runs once a month and allows one promotion per month (6.1.1, p116); ranks are permanent titles even if the player later falls below the bar; one rank also requires membership of the local guild. The monthly limit applies only in the home town: in other towns the rank rises as soon as the conditions are met, and the player only does not notice because the main rank is measured at home (6.1.4, p119; the source describes a speed-climbing trick built on this, not reproduced here). Mayor and the top office are different: they depend only on standing, can be won only on one election day a year, and can be lost in a vote.
Our state (verified: src/game/rank.mjs and game.mjs:323): rank depends on net worth alone (RANKS thresholds); standing does not gate it. updateRank runs in the daily close (the code comment calls it the day's rank check), only moves up, and never takes a title away, which matches the permanent-title idea. There is no guild gate for a rank in the code read.
Open question: whether higher ranks should also require standing in a port (our respect or reputation) is a content-zone choice; flagged only.

### 2. Two kinds of standing, one from each class
The source: the poor give social standing (they reward supply, wells, hospitals) and the rich give societal standing (they reward money, fleet size, guild membership); the middle class weighs both about equally. The source itself says the percentages in its table are only a rough scale and that standing can far exceed the top mark.
Our state (verified: src/game/rank.mjs RESPECT and repOf; src/game/reputation.mjs): respect is one value per city, accumulated from sales there plus a bounded memory adjustment (repOf adds memoryRep); reputation is a separate per-port value that moves with selling into or buying out of a shortage. Neither is split by class.
Open question: a per-class standing (supply and civic works for the poor, wealth and fleet for the rich) would link to the class model in citylife.mjs; design input only, no change proposed here.

### 3. The player is never shown a number, only hints
The source says the player cannot read their standing as a number and lists the indirect hints: an official letter when standing is enough but money is not (or the reverse); a comparison chart with AI rivals that has no scale on its axis, so only "much worse to much better" is readable; a title before the player's name that changes as standing grows, with separate economic and combative title ladders, the economic one capped once wealth is large; and, the best hint, what citizens say when clicked, with a different wording per class and a scale that follows the ranks, so a change in the remark tells the player the next rank's standing is reached.
Our state (verified: src/view/rankview.mjs): the house panel shows the current rank, net worth, a progress bar and the exact coins missing for the next rank, and per-city respect and reputation as named levels (RESPECT_NAMES, REP_NAMES) next to numeric columns (respect points floored, reputation rounded). So our view has numbers of its own, which is the central difference from the source's number-free feedback. Infamy exists separately (pardon.mjs, justice.mjs). No epithet or career-title ladder was found by grep (epithet, career, nickname).
Design note: the source's citizen remarks are an in-world way to show thresholds without numbers; as flavour text tied to the existing respect levels it would add texture at low cost. Open question for the narrative owner; flagged only.

### 4. Standing is a lagging check, so the letter matters
The source's letter tells the player which of the two conditions is missing at the main rank's monthly check. Our panel already shows the missing coins, but the standing side has no equivalent message because standing is not a requirement here (see 1).
Design note: if finding 1 is ever adopted, a one-line notice of "standing enough, money missing" or the reverse is the matching UX; flagged only.

## Open work
- 6.2 (what each rank brings) and 6.4 (Eldermann missions) are not covered by this note; 6.4.4 is left to the land logistics work.
