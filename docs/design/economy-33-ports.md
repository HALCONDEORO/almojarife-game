# Economy check on the 33-port map (20 Oct 2026)

Tool: `npm run simeco` (tools/sim_economy.mjs). 50 simulated games of 1095 days (3 years), 6 bot traders per game (2 each of three strategies), 33 ports, 120 days of warm-up. Raw numbers: economy-33-ports-sim-2026-10-20.json.

Strategies: greedy (the game's own AI: best profit per day), wanderer (random port, buys the cheapest good against base price), shuttle (fixed two-port loop).

## What was already tested before this

Structural tests (routes do not cross land, every port next to water, every pair reachable, every good has a maker and a buyer) and `npm run sim1000` (price clamps on the old 9 ports). Nothing measured profit, balance between ports or inflation on the 33-port map. This is the first run that does.

## Corrected interpretation (20 Oct 2026)

This is a trading-bot stress test, not a complete player game. It does not apply player upkeep, wages, tolls, loan costs, construction, mission success or bankruptcy. Cash earned here must not be compared directly with the player's 50,000-coin mission target. The original inference about beating the mission in 14 months was not supported. The model does not track all money holders, so it does not measure global money inflation.

- Exact price clamps (unrounded model ratio >=3 or <=0.4) occupy 0.1% of the samples. Samples are taken every 30 days, not every day. This alone does not rule out shorter spikes.
- No trader ended with cash below 100 and an empty hold. This is a low-cash heuristic, not a measured player bankruptcy rate. None was unable to afford any available unit at its final port. Traders with cargo can still have low liquid cash.
- Median bot cash after 3 years: greedy 30,706; wanderer 169,896; shuttle 86,281. These are raw trading cash balances without player operating costs. They justify further testing, not an automatic cut in player profits.
- Arrivals are now split by strategy. Greedy bots alone: Sevilla 17,761, Cadiz 16,353, Huelva 15,000; La Coruna and Argel 0, Cartagena 3, Oran 4, Oporto 5. The previous counts pooled all three strategies and were mislabeled as the game's AI alone. Concentration is a measured concern; it does not prove that a city is useless to a human player.
- Units carried still pool all strategies: silk 1,377,829, pepper 635,602, sugar 26,052, iron 94,020. Shipment volume is neither unmet demand nor profit. No conclusion that silk is oversupplied or iron is undersupplied follows from those counts alone.
- The shuttle partner is assigned randomly, not chosen by best profitability. Removed artificial static margin rankings (0.6/1.6): these were not actual model prices.

## Next balance work

1. Measure player outcomes through the real game cost and end-state functions before tuning mission prices or rewards.
2. Scale NPC count with port population and trade opportunity under a performance cap; compare traffic coverage against this baseline.
3. Add construction and production uses with explicit stock accounting and failure tests. Validate actual fulfilled demand, not just shipments.
4. Re-run identical seeds before and after each change. Historical populations remain a separate evidence-led change; unknown figures are not zero.
