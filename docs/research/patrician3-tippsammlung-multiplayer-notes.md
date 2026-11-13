# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), multiplayer chapter 11.4-11.5

Purpose: same as patrician3-mechanics.md. Every earlier tippsammlung note leaves chapter 11 (multiplayer) as "not covered". This note covers its rules and tricks sections (11.4 house rules, 11.5 tips and tricks), printed pages ~201-208. Most of it is about exploits, so the value for Almojarife is anti-exploit design checks, not features.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed). Almojarife is single-player; nothing here proposes multiplayer.

## Findings and what they mean for Almojarife

### 1. Offers between players as a hidden vault
The source: a player can offer goods, ships or money to a partner; the moment the offer is sent, the items leave the sender's holdings and sit in limbo until the partner accepts or the sender withdraws. Offers never expire. Players used this to park large stocks "off the books" and so avoid storage costs (grain out in summer, back in winter), as long as the sender keeps the reminder message. If the receiver has no office there, goods only return to a ship that is still in port.
Our state (verified by grep, not exhaustive: no offer, escrow or multiplayer code under src/). There is no off-ledger holding state, so the loophole has no counterpart.
Design note: any future "pending" state (auction lots, contracts, trade proposals) should keep its goods inside net worth and storage accounting and should expire. Flagged only.

### 2. Buying out a town to hand a partner the mayoralty
The source: reputation in a town grows mainly from selling goods to it, so two cooperating players could buy out the market, pass the goods over, and let one sell them back, repeating until he topped the mayor list. It costs a lot of money and is only worth it for the office's perks.
Our state (verified: src/game/reputation.mjs): reputation rises only when a sale meets a shortage (no gain in a balanced market), buying what the port lacks costs reputation, and a port grants only a capped amount per day (REP_DAY_CAP). Buying out a market to resell it therefore loses reputation instead of gaining it, and repeating the loop in one day is capped.
Design note: this already resists the loop. Open question: whether the daily cap and per-sale cap are low enough that two ports cannot still be farmed over many days is a balance-zone check; flagged only.

### 3. Inflating one cargo's value to bait pirates
The source: pirates are drawn by the displayed value of a ship's cargo, and an offer between players could set the price of one cheap barrel absurdly high, making a decoy ship look very valuable.
Our state (verified: src/game/encounterdaily.mjs automaticEncounter): the sea encounter roll is a flat seeded chance per tick that does not read cargo value; pirates are about half of encounters, storms replace them inside a storm cell. No bait mechanic exists.
Design note: if cargo value ever drives pirate attraction, it must use the market reference price, never a price from a single transaction. Flagged only.

### 4. House rules a group needed to keep a shared game fair
The source lists rules that multiplayer groups adopted: no reloading after bad luck (a lost fight stays lost), no fast-forward because players are not in sync, no manual sea fights because one fight slows everyone (so patrol and escort quests are avoided or done unarmed), no active piracy because accusations are random and cannot be fought, no smearing a partner, and no use of known exploits (arbitrage, rapid-click building, the market-stock bug).
Our state: single-player with seeded rolls; the encounter code writes its tick version before rolling so a tick cannot be re-rolled even after a save and reload (encounterdaily.mjs comment on encounterTicks), which is the same fairness idea as "no reloading". Whether other rolls (court, auctions) are equally reload-proof is not verified.
Open question: a quick audit that every seeded roll is keyed by tick or id and not by call order; flagged only.

### 5. Smaller points
- Quest board race: two players can take the same tavern job before the list refreshes, and the loser gets a confusing message naming a different port. Single-player: not applicable; if quests ever go to several actors, assign on the same step that lists them.
- A new settlement shows the owner's own office as a "rival" office to others, while AI traders may also build one: the rival-office concept depends on whose view it is. Not applicable now; flagged only.
- The random goods-swap letter (a stranger offers valuable goods for the largest delivery of a cheap one, with a signup window) was used by teams to agree who takes it. Our events notes cover similar letters; not re-assessed here.

## Open work
- Chapter 10 (FAQ, printed p189 onward) is still not covered; 11.1-11.3 (modes, connection problems, chat) skipped as technical and not relevant.
