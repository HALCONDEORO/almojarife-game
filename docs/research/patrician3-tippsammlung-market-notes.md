# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), market chapter

Purpose: same as patrician3-mechanics.md - understand Hanse-game depth so Almojarife reaches it with its own world, names, art and numbers. This note covers the trade chapter (Kapitel 3) of the full German community compilation; the earlier patrician3-tippsammlung-notes.md covered the forum's partial English translation (19 posts). This pass read the German original.

Rules for this file
- Ideas and general mechanics only, written in our own words. No text, tables or data copied; numbers from the source appear as rough orders of magnitude at most.
- No reverse-engineered game files or decompilation notes. Source is the public fan-compiled PDF.
- The compilation is for the P2 add-on era but is the canonical community reference the P3 forum points to; mechanics below were chosen because they also appear in P3-era sources we already read (manual, wiki).

## Source read (free, public)
- Tippsammlung 2010 & Handbucherweiterung, compiled by the Patrizierforum community: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 3 "Der Handel", printed pages ~63-73, read in full; chapter 4 begins on the printed page 74 and was NOT part of this pass).

## Findings and what they mean for Almojarife

### 1. Price bounds are absolute per good, and the bad end is worse than no trade
The game's prices float with supply and demand but sit inside fixed per-good floors and ceilings (their worked example: a floor well under half of the mid price, a ceiling well under double, both varying with difficulty). Neither extreme is playable: at the ceiling citizens are furious, at the floor the trader bleeds money.
Our state (verified against src/sim/market.mjs:36): price = base * (target/stock)^elasticity clamped with common lower and upper multipliers for every good, with an asymmetric band around base.
Proposal (framing, not a ready-made invariant): the source implies staples should sit near the cheap end and luxuries near the expensive end BY DESIGN. Our classes.mjs gives overlapping per-class demand vectors, not an explicit binary staple/luxury grouping, so no such assertion follows from the price function alone. A legitimate experiment would: define a grouping first (from PER_1000 weights), then measure equilibrium prices under stated conditions, and report whatever split (or none) it finds. Outcome not preselected.

### 2. The "ideal price" is a per-class pricing tactic, not a number
The community's core trade doctrine: sell staple goods (the poor's goods: grain, fish, beer, timber) at roughly cost; sell luxuries (the rich's goods) at the exact price where only about one day of city demand moves, reading weekly consumption from the market hall; use mid-tier consumer goods as a fine-tuning dial for satisfaction. There is no universal price table because the right tactic depends on whether the player optimizes for headcount growth (feed the poor) or wealth (more rich citizens).
Our state: classes.mjs already models per-class daily consumption (staples for all, comforts for the middle, luxuries for the rich) and citylife.mjs has the satisfaction plateau.
Proposal: our open research question, not a claim established by the guide - under a stated market-day scenario, how do selling roughly one day of luxury demand and selling several days at a lower price compare in revenue, consumption and satisfaction? Define the scenario and report either result; no outcome is preselected.

### 3. Population class shares move within bands as the city grows
Their numbers: rich citizens swing between roughly a twentieth and a quarter of the population, the well-off between a seventh and a third, the poor from under half to four fifths. Growth only happens while at least the poor are content; beggars (no consumption, no satisfaction) are the recruitment pool for workers, sailors and soldiers.
Our state (verified against src/sim/classes.mjs:10): our rich share grows with city size and the poor take the remainder - same shape, deliberately different magnitudes. Note: we do NOT have an explicit beggar pool - crew hiring checks cash and berths only, not any population reserve.
Proposal: none for shares. The beggar-pool idea (visible non-consuming poor as the recruitment source for sailors and workers) is a design-level input for the city-life zone, not a code gap to test; flagged only.

### 4. Trade reputation is local and scarcity-weighted
Reputation from trade is per-town: only sales raise it, buying lowers it, and selling a scarce good raises it more than selling an abundant one. Selling during a siege, plague, famine or freeze (when demand spikes) pays extra reputation.
Our state (verified against src/game/reputation.mjs:25-34): portRep is already per-city with tier multipliers, and scarcity-weighted sale effects are implemented - note the asymmetry vs the source: abundant trade awards nothing here, so 'every purchase lowers standing' does NOT hold in our engine; only the scarcity-dependent side is comparable.
Proposal (testable): the uncovered nuance is event-weighted reputation - a sale during an active siege/famine event counting extra. Check events.mjs/calamities.mjs wiring into reputation before proposing; flagged as follow-up, not asserted in this note.

### 5. Auto-routes carry their own upkeep rules
Their routes (multi-stop, load/unload per stop with price limits) skip blockaded or boycotted towns on their own, and a route ship repairs as soon as its hull drops below a high threshold close to full condition, with repairs running before that stop's trade actions (source statement about P2/P3, not our engine).
Our state (verified against src/game/routes.mjs:43-58): our routes auto-repair too, but at a lower hull threshold, repairs run before LOADING but AFTER SELLING (ordering differs from the source's 'before trade actions'), and a skipped repair only warns once (routeRepairSkip). Existing coverage: test/route-autorepair already pins below-threshold, at-threshold, waiting-in-yard and no-loading cases, so no new pin is proposed here. The only open item is a balance question for the economy zone: whether our threshold should rise toward the source's much higher one.
