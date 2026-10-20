# Economy check on the 33-port map (20 Oct 2026)

Tool: `npm run simeco` (tools/sim_economy.mjs). 50 simulated games of 1095 days (3 years), 6 bot traders per game (2 each of three strategies), 33 ports, 120 days of warm-up. Raw numbers: economy-33-ports-sim-2026-10-20.json.

Strategies: greedy (the game's own AI: best profit per day), wanderer (random port, buys the cheapest good against base price), shuttle (fixed two-port loop).

## What was already tested before this

Structural tests (routes do not cross land, every port next to water, every pair reachable, every good has a maker and a buyer) and `npm run sim1000` (price clamps on the old 9 ports). Nothing measured profit, balance between ports or inflation on the 33-port map. This is the first run that does.

## Results

- Prices are stable: 0.1% of price samples sit at the 3x ceiling or 0.4x floor (silk 0.5%, Huelva 1.6% worst port). No price blow-up or collapse.
- No bot went broke (0% of bots under 100 coins with an empty hold at the end).
- Gold inflation is high. Median bot cash: 40,167 after year 1, 86,130 after year 2, 127,026 after year 3, from 2,000. The mission goal is 50,000 in 365 days, so a bot beats it in about 14 months. The random wanderer reaches a median of 169,896 in 3 years: arbitrage is too easy when you do not even look for it.
- Trade is concentrated. With the game's AI, Sevilla, Cadiz and Huelva receive 18,669 / 17,602 / 15,999 arrivals; Oporto, San Sebastian, La Coruna, Bilbao and Santander about 540-610 each over the same games. The northern and Atlantic ports are close to useless as destinations.
- Goods are very uneven. Units shipped: silk 1,377,829, pepper 635,602, olive oil 409,911, salt 383,494 against sugar 26,052 and iron 94,020. Silk and pepper carry most of the profit.

## Not fixed yet (next PR)

1. Lower the easy profit (margin and demand curve) so a year takes more than a year to reach the goal.
2. Give the north and Atlantic ports a reason to be visited (a producer of a scarce good, or higher demand).
3. Make sugar and iron matter, and cap silk and pepper.
4. NPC merchants per port as a formula of historical population, port size, goods made and needed, distance to lanes and demand, with a performance cap. To be validated with this same simulation.
