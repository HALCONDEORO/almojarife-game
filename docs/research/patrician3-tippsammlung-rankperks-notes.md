# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), what each rank brings, 6.2

Purpose: same as patrician3-mechanics.md. The standing note covers how rank is earned (6.1); the politics notes touch the mayor climb. None covers 6.2, the ladder of privileges that each rank unlocks, printed pages ~119-121. The shape of that ladder is the useful part for Almojarife's rank perks.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. The four lowest ranks are only titles; real privileges start at the council rank
The source: the first ranks bring no direct advantage (guild membership is open to anyone who can afford it, so it is not a rank privilege). From the council rank on, every further step brings valuable privileges.
Our state (verified: src/game/rank.mjs loanCapFor and src/game/rankperks.mjs contractMaxFor): perks start early and are small: the loan cap grows with every rank, and from the second rank a house can keep one more council order at once.
Open question: whether perks should be back-loaded as in the source (cosmetic early, strong late) or stay spread out; a content-zone choice, flagged only.

### 2. Council rank gives a voice, not just a title
The source: a councillor can file motions at the town hall of the town where the title is held and vote on them, for example asking for a wall extension, a militia increase or the poll tax rate; most are approved as a formality, and a special tax is possible but rarely wise. The councillor is also the first rank that can deal with the territorial lord at the town gate to sell surplus in bulk, and can vote at extraordinary diets and in the top-office election.
Our state (verified by grep and reading: src/game/council.mjs, walls.mjs councilWallsVote, works.mjs councilWorksVote, buildings.mjs civicAllow): the council is an NPC body that votes tax steps on a schedule and votes on walls and works; the player asks for civic works through petitions, and a new civic building is gated by the player's respect in that city (repOf against a threshold), not by rank. The player has no vote and cannot file motions on tax or walls in the code I read.
Open question: whether reaching a given rank should give a standing right to petition or to propose tax steps; flagged only.

### 3. Patrician gives candidacy; the top local office gives wide powers; the top overall office gives few
The source: the patrician rank brings the right to stand for mayor of the home town (one of four candidates when standing is high enough) and credit offers from the lord that the source advises against. The mayor chairs the council and can move money between the private purse and the town treasury, decide militia composition, manage wall expansion, buy hand weapons freely, speak to the weapons dealer without risk of charges at home, upgrade fortifications, gift treasury money to the lord, and in war give orders at the gate, bribe or surrender. The mayor has a double vote. The source notes that the top office, elder of the league, brings broader but oddly modest privileges, mainly voting and motion rights in every town including settlements.
Our state (verified: src/game/campaigns.mjs header, townhall.mjs, pregon.mjs, almoneda.mjs): our campaign arc ends with the council naming the house head mayor ("El Almojarife"), a story reward; mayor and councillor names in the code are generated NPC names used for flavour and proclamations. No player powers over the town treasury, militia or walls were found in the files read.
Open question: whether the arc's final rank should grant any concrete power (for example a say in the council treasury's spending) so that the climb has a gameplay payoff; flagged only.

### 4. The shortlist for the top office has its own conditions
The source: to reach the shortlist for the league election a player must be mayor at home, have received a personal invitation from the current holder, and have completed a couple of league tasks; the incumbent is always on the list even if he lost his own mayoralty, and a lost mayoralty does not stop an incumbent from standing again.
Our state: our missions are chained data in campaigns.mjs; whether any mission mirrors an invitation, tasks-for-the-league structure or an incumbent rival was not mapped in this pass.
Open question: check the later missions against this shape; flagged only.

## Open work
- 6.3 (raising popularity) is covered by the politics notes; 6.4 (league missions) is not covered; the sections on a land road are left to the land logistics work.
