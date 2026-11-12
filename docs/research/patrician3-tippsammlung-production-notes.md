# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), production chapter

Purpose: same as patrician3-mechanics.md. This note covers Kapitel 5 "Die Warenproduktion" of the full German community compilation. Earlier notes: patrician3-mechanics.md (manual/wiki), patrician3-tippsammlung-notes.md (English translation thread), patrician3-tippsammlung-market-notes.md (Kapitel 3 trade).

Rules: ideas and mechanics in our own words only; no copied text, tables or data; source numbers as rough orders of magnitude at most; no decompiled files. Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf (Kapitel 5 "Die Warenproduktion", roughly the first half of the chapter read for this pass; the source documents the Patrizier II add-on era, and the P3 forum's translation thread treats the same compilation as its reference - findings below are included because they describe the shared P2/P3-era economy, but exact P3 equivalence of every detail is not claimed).

## Findings and what they mean for Almojarife

### 1. Static town production caps organic growth; player production breaks the cap
Towns produce a fixed, never-changing amount of goods on their own (invisible workshops, visible only as daily market restock). That alone supports population growth only up to a modest ceiling over the starting population; beyond it, growth requires the player's own businesses. Every new business also feeds the loop: workers plus their families raise demand, which requires still more production; their worked example shows the loop converging only slowly, with each wave of new citizens demanding almost as many establishments again.
Our state (verified against src/sim/market.mjs:93-94): our towns restock daily with rate scaled by population and townShare, plus a small trickle of every good.
Open question (not an established claim): whether our economy likewise plateaus without player industry is a balance hypothesis to test, not a guaranteed consequence - a long-run sim (AI traders active, player businesses disabled, population tracked) would answer it. Flagged for the balance zone; no outcome preselected.

### 2. Effective vs ineffective production per town
Each town makes only a subset of goods, and each of those either "effectively" (better yield/cost) or "ineffectively" (the game calls it "normal"; the community stresses that effective is the norm and ineffective the exception to avoid).
Our state (verified against data/world.json): each city has a makes list, with rate depending on starting population and seasonMul, but no additional per-city efficiency tag.
Proposal: none without a design decision first (this is a new mechanic, not a gap in an existing one). If the economy zone wants it, the data hook would be a per-city efficiency multiplier on makes rate. Flagged as design input only.

### 3. Two openings: building materials first vs high-price goods first
The community's seasoned advice: start with brickworks and sawmills to stockpile building materials, then grow staple production; the alternative slow opening starts with a few high-price workshops. Materials-first grows faster but risks over-extension and bankruptcy.
Our state: bricks and timber exist as buildable goods in Almojarife, so the same lever exists in principle.
Open question: which opening our balance rewards is unknown. A fair experiment would script both openings for the same number of years and compare population AND solvency (their doctrine admits materials-first can bankrupt); judging by population alone would bake in the source's bias. Balance territory; flagged.

### 4. Winter cuts farm output for some goods - check which, before pinning
The source's agricultural producers lose a sizeable fixed share of output across the winter months while keeping the same workforce - so winter unit costs spike.
Our state (verified against src/sim/market.mjs:48-55 and src/game/buildings.mjs): we have a GLOBAL seasonal amplitude (SEASON_AMPLITUDE) with per-good seasonal peaks (SEASON_PEAK) - NOT a per-good winter penalty knob, and NOT every good dips in winter (some peak in winter months by design).
Proposal (narrowed, testable): do NOT assert "strictly less in winter" in general. A valid pin would cover only goods whose SEASON_PEAK sits outside winter (e.g. grain-type profiles), asserting lower yield in winter months than in their peak months with identical inputs, controlling for stock caps and rounding. Goods with winter peaks must be excluded from the assertion.

### 5. Timber as choke input: partially verified only
The source treats timber as the most critical raw material: sole input for bricks, input to many finished goods, a top citizen-priority good, and required by shipyards and weaponsmiths. Their advice: build sawmills early and never strip the citizen-facing market stock.
Our state: timber exists and production recipes chain goods, and RECIPES in src/sim/recipes.mjs does list timber as an input for every ship and building recipe; the header comment appears stale - construction/processing call quoteRecipe/consumeRecipe/consumeUnitsImport (buildings.mjs:259,465-478); the full shipyard path was not audited.
Proposal: none beyond the follow-up itself - a data-integrity test could assert each shipyard/weaponsmith recipe lists timber IF the design intends the same choke; that design intent is unverified here.

### 6. Joint production: the source's model differs from ours - verified
The source's cattle ranch yields meat and leather from one establishment (their word: establishments, not generic workplaces), and the fishery yields fish and train oil; the source allocates joint costs across both outputs; our byproduct accounting is a different contract.
Our state (verified against src/sim/recipes.mjs and src/game/buildings.mjs:403): our model differs. RECIPES/OUTPUTS are single-output per recipe (no multi-output recipe exists); the cattle ranch instead has a primary output (meat) plus an explicit byproduct (leather) in PRODUCERS.
Proposal: none on cost splitting (the different-contract rule does not map to our byproduct model). If documentation is wanted, a one-line design note stating "ranch yields leather as a byproduct at a fixed rate per meat batch" would suffice; no test gap claimed.

## Open work
- Rest of Kapitel 5 (remaining goods sections) and Kapitel 7 (town supply) remain to read.
- Event-weighted reputation (from the market note) still awaits a look at events.mjs/calamities.mjs before any proposal.
