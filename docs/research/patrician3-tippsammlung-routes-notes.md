# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), auto-route tactics chapter (first pass)

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 9.1 (captain trade bonus, arbitrage price bands, same-city arbitrage ships, route micro-tricks) of the full German community compilation. Kapitel 9.2-9.4 (city planning, peaceful and pirate playthrough guides) remain for a second pass.

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 9.1, printed pages ~169-174; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Captain trade skill: a purchase discount on auto-routes - and a money pump
The source's captains carry a trade skill that grants an automatic discount on every auto-route purchase, tiered by skill level (a few percent at the lowest usable tier, around a tenth at the top, with diminishing returns between the top two). Because buy/sell spreads in the market's middle stock band are smaller than that discount, a captain can buy and re-sell IN THE SAME CITY at a guaranteed small profit - the source documents same-city arbitrage ships as a well-known trick, running multiple in-town stations per day.
Our state (verified: src/game/captains.mjs:2,12 - our captains have navigation/weather/defence ONLY, no trade skill; auto-route purchases pay the real respect-scaled port fee with no captain discount, routes.mjs:165; our market fee is a flat small percentage on both sides, src/sim/trade.mjs:33).
Verified divergence: without a trade discount, the source's same-city money pump cannot exist in our engine (buy-sell round trip loses the (respect-scaled) fee). If a trade skill is ever added, its discount must stay below the buy-sell spread in every stock band or the pump returns - recorded as a balance constraint for the economy zone, with no numbers prescribed.

### 2. Unit-by-unit pricing: verified parallel
The source prices every single barrel individually against the current market-hall stock, so a big trade walks the price curve with each unit; prices depend only on stock.
Our state (verified: src/sim/trade.mjs buy loop reprices every unit as stock decrements - the same shape; sell mirrors it).
Verified parallel: our pricing granularity already matches the source's model.

### 3. Route micro-tricks as UI/UX background
The source documents player workarounds in its route editor: a never-executable dummy sale order to keep a route from being interrupted when a buy fails; a skipped first stop to suppress repetitive arrival messages. These answer pain points of a 2002-era UI.
Our state: our route system has its own flow (routes.mjs); whether our UI needs equivalent affordances was not assessed (web zone).
Proposal: none. Recorded as UX background only.

## Open work
- Kapitel 9.2 (city street/block planning), 9.3 (peaceful playthrough guide), 9.4 (pirate playthrough guide) remain; mostly strategy walkthroughs.
- Kapitel 1 (options), 8.4.4-8.5, rest of 2 remain.
- Earlier open items: convoy re-alignment en route, event-weighted reputation, weapon-weight speed coupling, class-split reputation, labor-market coupling, auction pricing audit.
