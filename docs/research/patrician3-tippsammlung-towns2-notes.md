# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), towns chapter (second pass: guild and town hall)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 2 sections 2.1.1.2 (the guild: membership, auctions, convoy board, trade hubs) and 2.1.1.3.1 (the town-hall bulletin board) of the full German community compilation. Companion to patrician3-tippsammlung-towns-notes.md (tavern).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 2.1.1.2-2.1.1.3.1, printed pages ~32-38; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Guild membership: a rank key with a sliding fee, thin on features
The source's guild charges a joining fee that scales with company value (capped, cheaper in the home town), is mandatory for one mid-rank promotion (cross-ref: politics note part 1), and then offers little: auctions, a convoy board, and shared intelligence on Mediterranean trade hubs (members see competitors' discoveries too). The source's advice is to join mid-ladder, when the fee is painful but survivable.
Our state (verified: no guild membership registry or fee exists; campaigns.mjs s1-gremio is a guild-themed side-quest with a respect-20 condition and a coin reward (campaigns.mjs:32-40), not a membership system - hermandad.member is a port classification, not membership; our ladder has no membership gate - politics note part 1).
Open question: a paid membership gate with scaling fee is a design input; flagged only.

### 2. The source argues auctions usually destroy seller value
The source's guild runs auctions of ships, houses and businesses (membership required to bid or to list), and its verdict is absolute: auctioning your own assets always destroys company value, since the proceeds are far below the asset's revenue potential; idle capacity at zero utilization beats selling. It also documents an expropriation bug around auctions - recorded as history, not mechanics.
Our state (verified: src/game/almoneda.mjs exists - our almoneda auctions assets with the council's mayor and councillors as bidders; whether our sale prices track asset value was not audited this pass).
Open question: our auction pricing fairness is unaudited; flagged for the economy zone, no claim either way.

### 3. The bulletin board: guaranteed-price shortage contracts with a human handover
The source's town-hall board posts shortage-driven delivery orders: named good, volume, deadline, and an excellent guaranteed unit price. Delivery happens through a named contractor in the target town's tavern who accepts partial deliveries from the office and anchored ships, and hands everything to the market hall - so contract delivery has no supply downside versus direct selling. The source's optimization: sell any surplus at top market price first, hand only the contracted remainder over.
Our state (verified: src/game/contracts.mjs - our encargos are the same core loop with a different contract: the concejo posts the order, selling into the port counts AUTOMATICALLY while active (no named handover), the reward is a fixed completion bonus computed from quantity x base value when the offer is generated (contracts.mjs:16,35), paid IN ADDITION to the ordinary market proceeds of the delivered goods, and a lapse costs reputation).
Verified parallel with a different pricing contract: theirs decouples reward from market price (fixed guarantee), while our total receipts remain market-dependent plus the fixed bonus. Worth the economy zone's attention as a deliberate divergence, not a bug either way. Flagged.

### 4. Mediterranean trade hubs as shared-discovery content
The source's guild map lists southern trade hubs with supply/demand, discovery date and discoverer; members see competitors' discoveries, non-members only their own. Trade contracts with these hubs (fixed remaining volume, guaranteed price, expiry) belong to the source's Kapitel 8.
Our state: no guild-shared expedition-hub discovery registry or hub-specific contract system was found. Pieces exist separately: fog.mjs port discovery and charts.mjs (coast charts, plus a route rumour that reveals the nearest unknown port with an inexact market snapshot, charts.mjs:53,66), and contracts.mjs town-delivery contracts.
Open question: design input for the content zone; flagged.

## Open work
- Rest of Kapitel 2: town hall beyond the board (outrigger ships, town info), shipyard (repair/build details, incl. the earlier repair-cost topics), market hall, church, own buildings (office, houses, warehouses, infrastructure). One more pass at most.
- Kapitel 1 (options) and Kapitel 8 (expansions: Mediterranean, America, land routes, settlements) unread.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit (this note).
