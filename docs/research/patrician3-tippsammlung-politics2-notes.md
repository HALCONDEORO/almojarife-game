# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), politics chapter (second pass)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 6 sections 6.3-6.6 (raising reputation, the one-year mayor route, Hanse-leader missions, the city gate and the prince, crime and punishment). Companion to patrician3-tippsammlung-politics-notes.md (6.1-6.2).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 6.3-6.6, printed pages ~121-136; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Reputation actions: steady trade beats every stunt
The source's core doctrine: regular supply of scarce goods is the strongest reputation lever and cannot be replaced by anything; pure-reputation actions (church donations) exist but decay; infrastructure and jobs raise standing as a side effect; most actions are temporary and local, a few (capturing pirates, discoveries) are Hanse-wide. Selling needed goods at very high prices raises standing fast but tanks satisfaction - the classic three-way trade-off from the market chapter.
Our state (verified): our shortage-driven reputation is the same core loop, and it lives in three separate tracks. (a) Cumulative per-city respect from sales volume (rank.mjs repOf). (b) Per-port trade reputation that DOES decay: decayRep (reputation.mjs:95) drifts portRep toward zero in ports not traded in, called daily from game.mjs:307. (c) An optional memory nudge, memoryRep, which lives in memory.mjs (NOT reputation.mjs) and also decays, modifying the repOf respect read. Contracts.mjs encargos pay a premium for supplying what a port lacks, and lapse costs reputation.
Verified parallel: the decay axis exists for trade reputation. What is absent is a Hanse-wide global fame track and a per-category permanent-vs-temporary split of reputation actions. Design input, flagged.

### 2. The one-year mayor route as a difficulty benchmark
The source includes a month-by-month route from starting rank to mayor within a year: build early, join the guild early (fee savings), keep manual trading, add social infrastructure mid-route, finish with donations or a festival. Its interest for us is not the route itself but what it implies about pacing: the source expects a focused player to climb the full ladder in a year.
Our state (verified: rank.mjs): our ladder is worth-only and permanent, with no time gates at all; campaigns.mjs chains carry deadlines and dependencies but are story content, not election equivalents.
Open question: if pacing targets ever get set, the source's one-year expert route is a reference point for the campaign zone; no numbers prescribed.

### 3. Hanse-leader missions are endgame content gates
The source gates its top office behind missions for the Hanse's good, offered one at a time with deadlines: founding a new settlement, clearing a pirate nest, hunting a notorious pirate, building a land route, reviving a declining city. Some also profit the player's own business.
Our state (verified: campaigns.mjs runs story/side chains with deadlines and dependencies, incl. a guild respect quest; what was NOT found is a mission board tied to holding an office).
Open question: office-gated endgame missions are design input for the campaign zone; flagged.

### 4. The prince as a fixed-price bulk buyer of last resort
The source's prince buys selected goods at a fixed price that does not drop with volume, making him the late-game sink for huge surpluses; his monthly demand list correlates with what the city markets already stock; access unlocks at a mid rank; gifts from the town treasury (mayor only) manage his mood, and an enraged prince besieges the city. The source also documents a payment-miscalculation bug in its max-quantity button - recorded here as history, not as a mechanic.
Our state: no prince/bulk-buyer was found. Note the distinction: our market price decline under heavy selling is a price effect, not a goods sink - physical removal of goods comes from consumption, and council contracts take bounded volumes; realms exist as political data (marque letters) but buy nothing.
Open question: a fixed-price bulk buyer would change late-game economy shape - a significant economy-zone design decision, flagged with no recommendation.

### 5. Crime detection is situational, not automatic
The source's discovery rules: meeting criminals in the tavern is risky only when a watch patrols nearby or the town crier is present; some crimes (impiety) are mitigated by visible piety; penalties scale from small fines to a double-digit share of company value; bribery to dodge conviction costs more than the loot is worth (consistent with the piracy chapter).
Our state (verified: justice.mjs): sentences scale with the DEED's value (c.value x a per-kind fineShare, justice.mjs:15-19) times an infamy-driven recidivism ladder (fine, then cargo seizure from an infamy threshold, then ship detention - justice.mjs:26), bounded by cash and a minimum - NOT with company net worth. Detection is not automatic either: catchChance (justice.mjs:29) rises with the municipal chest's funding and the player's infamy, drawn seeded. What was NOT found is situational detection of tavern talk (patrols, a town crier witnessing) - our charges attach to deeds via action flags.
Open question: patrol/witness-style discovery for tavern meetings is a design input; flagged only.

## Open work
- Kapitel 6 complete through 6.6.1; the penalty table's remaining rows and any 6.6.2+ remain unread but add penalty detail only.
- Next unread chapters in the compilation: Kapitel 2 (Die Welt der Hanse - towns), Kapitel 1 (options), Kapitel 8+ (to be identified).
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation (politics part 1).
