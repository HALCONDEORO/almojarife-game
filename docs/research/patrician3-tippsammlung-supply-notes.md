# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), town-supply chapter

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 7 "Die Versorgung der Stadte" of the full German community compilation. Earlier notes: patrician3-mechanics.md, patrician3-tippsammlung-notes.md (translation thread), patrician3-tippsammlung-market-notes.md (Kapitel 3), patrician3-tippsammlung-production-notes.md (Kapitel 5).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 7, printed pages ~139-149, read in full; the source documents the Patrizier II add-on era, used by the P3 community as its reference - exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Citizens judge supply twice: today's coverage and long-term reserves
The source's citizens take their daily needs from the market stock, but their satisfaction ALSO reacts to the price level, because a high price signals thin reserves for coming days. A town can be fully fed today and still grow unhappy if prices are high. Two separate checks: daily coverage, and supply security read through prices.
Our state (verified against src/game/citylife.mjs:80,113): our moodTarget follows its own saturation curve toward a target and relaxes with memory (MOOD_MEMORY), driven by coverage - the "price as reserve signal" channel is NOT verified in our engine.
Open question (not an established claim): whether citizens should react to price as a scarcity signal beyond physical stock coverage is a design question for the city-life zone. If wanted, it is testable: hold physical coverage fixed, move only price, and check whether mood diverges - outcome not preselected.

### 2. Consumption is fixed per class, and winter shifts some of it
The source gives fixed weekly consumption per 1,000 citizens per class per good (never changing), with a winter increase for heating-type goods (timber and furs in their world).
Our state (verified against src/sim/classes.mjs PER_1000): we have fixed per-class daily consumption per good - same shape. A winter uplift on heating goods is NOT verified in our needs model.
Proposal: none as a code gap. If the design wants the winter heating bump, it is a data/design input for the needs model, testable as "winter consumption of heating goods exceeds their non-winter consumption" - flagged only.

### 3. The supply doctrine: hubs, not loops
The source's organizational core: early ring routes (visit towns in a circle, buy and sell at each) make money but cannot fully supply towns; the mature system is a central warehouse (one hub, sometimes two, rarely four regional hubs) where all goods are collected and from which supply convoys distribute, with surplus flowing back. Two-hub systems balance travel time against manageability; more hubs minimize ship needs but maximize coordination effort.
Our state: this is player-strategy knowledge, not engine mechanics - our auto-routes and warehouses already permit hub-and-spoke play.
Proposal: none for code. This belongs in player-facing guidance or AI-trader behavior design; flagged as design input only, no testable engine claim.

### 4. Surplus-balancing routes: the feedback signal is what returns
The source's fine point on supply routes with load-balancing: you read a town's supply health not from its warehouse level but from how much surplus the convoy brings BACK - shrinking returns mean raise the delivery; large returns mean supply suffices. A route stop also costs travel time even when nothing is loaded.
Our state: our routes support load/unload with quantities; whether a "returned surplus" signal is surfaced to the player/AI is unverified.
Open question: if the economy/AI zone wants it, the measurable claim would be "steady-state returned surplus tracks delivery surplus over demand" - a sim check, no preselected outcome.

### 5. Estimating supply quantities: observation vs market-hall math vs tooling
The source describes three ways players size deliveries: periodic visual stock checks (cheapest, intuitive), weekly market-hall consumption numbers rescaled to convoy round-trip time (precise, laborious), and external spreadsheets (exact, maintenance-heavy). It also notes the market hall's own display quirks (a daily figure mislabeled as weekly in one place) as a caution against trusting UI labels.
Our state: we have needs telemetry (src/sim/needs-telemetry.mjs) attributing consumption; whether a per-town weekly consumption readout exists for players is unverified.
Proposal: none for engine code. If a consumption readout is added, the source's own warning applies - a test that the displayed period matches the actual aggregation window would pin it.

## Open work
- Kapitel 4 (seafaring/convoys/pirates) and the rest of Kapitel 5 remain to read.
- Event-weighted reputation (from the market note) still unverified against events.mjs/calamities.mjs.
