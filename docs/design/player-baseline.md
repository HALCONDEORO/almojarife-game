# Player benchmark before rebalance

`node tools/sim_player.mjs 66`: 66 starts per strategy, two starts in each of 33 ports. Uses the actual game functions, default NPCs, market impact, upkeep, wages, tolls, repair costs and mission end state. No loans, extra ships, buildings or events. One cog, 2,000 coins. NPC warm-up is the real game's 60 days.

Policies use perfect current-price information, including remote ports. They do not predict prices on arrival. Greedy uses exact buy/sell previews and ranks expected profit per day with an approximate travel-cost deduction. Random-destination draws a port each idle day and chooses a currently profitable good for that port. This is not a blind random trader and not a representative human sample. Ships repair below 65% hull if affordable.

Measured baseline, raw rows in player-baseline-2026-10-20.json:

| Policy | Wins | Deadline losses | Bankrupt | Median end day | Median final cash |
| --- | ---: | ---: | ---: | ---: | ---: |
| Greedy preview | 66/66 | 0 | 0 | 40 | 51,348 |
| Random destination, profitable cargo | 62/66 | 4 | 0 | 239 | 51,504 |

Final cash is measured when the run ends, often at victory; it is not a day-365 wealth comparison. This stronger test confirms that informed one-ship traders can reach the target quickly even after real operating costs. It supports tuning or adding competition/sinks, but does not identify which individual price or good to change. The separate trading-bot test remains useful for long-run market stability.

Not covered: events, limited player information, investment, factories, construction, historical population changes or future NPC formula. These must not be presented as tested. Before/after runs must use identical starting ports and seeds.
