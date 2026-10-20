# NPC population and trade allocation proposal

Own-design formula, not a historical count of merchants. Module: src/sim/npcplan.mjs. It is NOT wired into newGame, so this PR does not change live NPC count.

Per port, use a recorded historical population when available; otherwise retain the design population and label it explicitly. Malaga's 42,000 is excluded pending the required second source. Unknown is never zero.

score = sqrt(population/5000) + 0.25*distinct_produced_goods + 0.25*distinct_needed_goods + 1/(1+first_route_access_km/50) + needed_goods/all_goods.

desired = clamp(ceil(score), 1, 6).

First allocate one merchant to each port, then extra slots by score/(count+1), under a global cap of 48. Stable city-ID tie-breaks. If there are more ports than slots, highest score gets the first slots. Three tests check cap, coverage, historical/fallback labels, order independence and no mutation.

Limits: first-edge distance is an access proxy, not port tonnage or historical capacity. Needed goods are a design-demand proxy, not unmet demand measured at runtime. The cap is a candidate budget, not proven smooth performance on phones. Historical inputs and makes/needs remain estimates/design choices.

## Isolated comparison

Run `node tools/sim_npc_plan.mjs` and `node tools/sim_npc_plan.mjs --planned`.

Same world and 365 days; baseline uses the current game's three starting NPC ports and ship types, planned mode uses the allocation. Both use current greedy AI, 2,000 coins each. No player, upkeep or mission. This is separate from simeco and from the real-player benchmark.

Raw baseline.json/planned.json include arrivals and runtime. Planned 48 traders reached 32/33 destination ports, exact price-clamp share 0.383%, 4.96 seconds total, slowest simulated day 48 ms on this machine. No negative/non-integer stock or non-finite/negative trader cash. Not a phone test or render FPS guarantee. Baseline numbers are in baseline.json; do not compare total cash without accounting for 3 vs 48 starting endowments.

Before enabling: independent review, player benchmark with identical seeds, mobile performance budget, and a policy for any unvisited port. A changed starting allocation alone does not force merchants to stay local. Follow-up should compare actual fulfilled demand and traffic, not assume a port is useful because it has a starting trader.
