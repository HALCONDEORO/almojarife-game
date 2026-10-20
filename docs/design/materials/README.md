# Material recipe candidates (not enabled)

Own gameplay quantities, not historical reconstruction. Pure quote/consume module uses actual marginal market prices including fees, validates the entire recipe, then removes all inputs or none. No player cash is mutated; a caller must deduct the returned cost and create the corresponding order/building exactly once on success. Do not call this from a player action until that transaction, saves and UI are tested together.

Candidates: four ship hulls consume timber/iron/cloth; warehouse consumes timber/iron; office consumes timber/iron/cloth. Wool-to-cloth weaving consumes four wool and adds two cloth. These are proposed recipes, not working factories. No sugar refinery invented without a raw-sugar good; no fish-preserving output invented when dried fish already exists. Luxury spice/silk consumption remains the social-class model and is not forced into implausible hull recipes.

Four tests: pure quote, exact stock removal, no changes on shortages/bad input/insufficient cash, weaving input/output accounting, known positive integer recipe goods, fresh stock check after a stale quote.

Isolated comparison: `node tools/sim_recipes.mjs` and `node tools/sim_recipes.mjs --recipes`, 1095 days, six raw trading bots. Every month each town attempts one small recipe with a hypothetical 500-coin budget. This probes stock stability, not actual player finances, construction demand or viable factory margins. Raw files include fulfilled units, failed purchases and exact price-clamp share sampled daily. They do not establish prices, construction costs or equilibrium for the final game.

Before enabling: compare actual player benchmark, make labor/materials price split explicit (avoid silently charging full ship price plus materials), prevent bypass via instant ship purchase, connect UI shortages and save-safe orders, calibrate factory margins and output capacity. The planner is intentionally not connected to newGame or orderShip yet.
