# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), politics chapter (first pass)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 6 "Einfache Politik" sections 6.1-6.2 (rank requirements, measuring one's standing, rank privileges) of the full German community compilation. Sections 6.3-6.6 (reputation theory/practice, Hanse missions, city gates, justice) remain for a second pass.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 6.1-6.2, printed pages ~116-121; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Rank needs BOTH wealth and standing, checked on a fixed date
The source gates each rank on company value AND reputation together; promotion is evaluated only on the first of the month in the home town (other towns promote immediately - 6.1.4, verified against the PDF text), ranks once earned are permanent, and guild membership is required before one mid rank. Mayor and the Hanse-wide leader are separate elected offices: reputation-only requirements, one election date per year, and both can be LOST by vote.
Our state (verified: src/game/rank.mjs:5-8): our ladder keys on net worth alone (seven ranks), permanent - updateRank only ever raises the held index (rank.mjs:41-45) and heldRank clamps damaged values (rank.mjs:28); standing is a separate per-city axis (RESPECT levels from sales). No promotion-date gate, no rank gate on guild membership, no player-held elected office or loss-of-office system was found (townhall.mjs seats NPC mayors and councillors).
Proposal: none as a gap. The dual-gate (wealth AND standing) plus fixed evaluation dates is a design input for any rank rework; flagged only.

### 2. Standing is split by social class
The source splits reputation into a "social" axis (poor citizens honor supply, wells, hospitals) and a "societal" axis (rich citizens honor wealth, fleet size, guild membership); the wealthy weigh both equally. Rank thresholds require levels of both.
Our state (verified: src/game/reputation.mjs and rank.mjs repOf): we have per-port reputation from shortage-driven trade plus cumulative sales respect, and memoryRep nudges - two distinct per-port measures - trade reputation (portRep) and cumulative respect (repOf incl. the optional memoryRep nudge) - neither of them class-split.
Open question: a class-split reputation is a design input (citylife/economy zones); no engine gap claimed.

### 3. The source's UI never shows standing as a number
The source's players infer standing from indirect signals: monthly letters saying which of the two requirements is missing, an unlabeled comparison chart, a public epithet that tracks standing growth (with separate trade and battle epithet ladders), and per-class citizen comments keyed to rank thresholds.
Our state: numbers are available directly as well as named tiers (respectOf bands in rank.mjs:32, repTierOf in reputation.mjs:30, RESPECT_NAMES shown next to the points in the rank view).
Proposal: none. Recorded as presentation-design background: the source deliberately hides the number and gives ranked verbal bands instead.

### 4. Rank privileges unlock politics, not just titles
The source: early ranks are pure titles; from the councilor rank up, privileges become political powers - filing and voting on town-hall motions (wall expansion, militia size, a head tax), dealing with the prince at the city gate, voting at Hanse assemblies; mayor adds treasury access, fortification control and a double vote; the Hanse leader adds triple votes, motions everywhere and sanction instruments (fines, boycott, blockade) against rule-breaking cities.
Our state (verified: src/game/rankperks.mjs gives the contract-slot perk and src/game/rank.mjs:17 loanCapFor the loan-cap perk; src/game/council.mjs runs periodic council meetings that vote taxes, walls and civic works from a duty-fed treasury (councilWallsVote/councilWorksVote, game.mjs:309-311), and townhall.mjs seats a named mayor per port. The player holds no office and casts no vote, but CAN petition: proposeWork (works.mjs:84) and proposeWall (walls.mjs:99) put works/wall requests before the concejo once the merchant has respect 20 in that town (WORKS_MIN_RESPECT/WALL_MIN_RESPECT), and the council votes them at its next meeting).
Open question: player-held office and voting rights beyond petitions are design inputs (code comments in council.mjs/pregon.mjs/townhall.mjs reference a town-hall-mayor-taxes design study, but no such file exists in main - treat those comments as pointers, not documentation); flagged with no scope claim.

### 5. Elections and office loss as a reputation sink
The source's elected offices give reputation something to DO at the top end: a yearly election converts standing into power, a lost election removes it, and staying electable becomes an ongoing reason to keep both reputation axes high.
Our state: no player-held elected office or loss-of-office system was found.
Open question: design input only; recorded for the campaign/council zones.

## Open work
- Kapitel 6.3-6.6 (reputation theory and practice, the one-year mayor route, Hanse missions incl. nest-taking and land-road building, city gates in peace and siege, justice and penalties) remain to read.
- Earlier open items: convoy re-alignment en route (piracy note), event-weighted reputation (market note), weapon-weight speed coupling (seabattle note).
