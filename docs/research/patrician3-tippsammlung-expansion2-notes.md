# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), expansion chapter (second pass)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 8 sections 8.3 (America: discovery and barter trade) and 8.4 (founding a new settlement) of the full German community compilation. Companion to patrician3-tippsammlung-expansion-notes.md (8.1-8.2).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 8.3-8.4.3, printed pages ~159-164; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. America trade: a fixed price schedule that rewards small deliveries
The source's American trade is sell-only (a short goods list accepted, no contracts), with a per-ship per-stop quantity cap and a FIXED price schedule: the price per unit falls as the quantity sold in one stop rises, from a maximum for the minimum lot to a minimum at the cap. Splitting a cargo across repeated stops at the same village defeats the cap without adding travel time. Unlike the Mediterranean's randomized prices, these are fixed across games.
Our state (verified: src/sim/market.mjs - our price is a power curve of current stock vs target, clamped and integer-rounded, so selling moves the stock-dependent price against the seller unit by unit; no special per-visit cap like the source's American one and no static lot-size table exists).
Verified parallel in shape, different in contract: ours is a stock-driven curve, theirs is a static schedule gameable by stop-splitting. Recorded for the economy zone; flagged, no proposal.

### 2. Voyage harshness as a hull-type filter
The source: the America run is long and punishing enough that lighter hulls may never return - players pick the most wear-resistant type, and the first discovery trip doubles as a tribe search at no extra cost. This is the per-type wear design (seafaring note finding 5) doing content gating.
Our state: no transoceanic or off-map discovery expedition like the source's was found (freenav.mjs free navigation and voyage logs exist); our wear is weather-coupled, not per type (src/game/seawear.mjs: global base/wind/storm constants with no per-type branch; hullSpeedFactor there is speed drag from damage, not a wear summand).
Open question: if per-type wear is ever adopted, voyage-length gating is its natural consumer; flagged only.

### 3. Player-founded settlements invert the political rules
The source's founder-settlement: repair dock only (no shipyard), no guild, no town-owned production (all businesses private), a fixed small set of business types (all effective), no council and no elections - the founder is a permanent lord with extended mayoral powers and unlimited treasury access, and citizens' comments always say they approve (the source's own caveat: this is what clicked citizens SAY, even during famine, not proof of material satisfaction). Fish matters for max growth because fisher huts create jobs without using building land.
Our state: existing ports have the council/treasury/works systems (townhall.mjs NPC councils, works.mjs flag-controlled civic works, enabled by default (configureWorks, works.mjs:189)), but no player action to found a new city was found in the inspected src/ and data/.
Open question: a founder-lord settlement is an endgame content input for the campaign zone; flagged with no scope claim.

## Open work
- Kapitel 8.4.4-8.5 (settlement material/money consumption table, influencing settlement production types) unread; adds build-cost detail.
- Kapitel 1 (options), 9 (auto-route tactics), rest of 2 remain.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.
