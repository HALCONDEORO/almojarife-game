# Player benchmark with competing NPCs

The default benchmark already included the game's three NPCs. This comparison adds the candidate 48 NPC allocation as an explicit `newGame` research option. The web game never sets the option, so its default stays three. Both candidates trade in the same market as the real player from the same 60-day warmup through each game. Save/restore preserves all traders.

33 matched ports per strategy, same seeds. Each port appears once; repeated greedy runs with identical starts are not independent trials. Greedy uses perfect current remote prices to choose a profitable cargo/destination; random destination still uses that same price knowledge for cargo. Travel price changes, real fees/wages/tolls/repairs and victory/deadline rules remain. No random events, extra ships, buildings, loans or material recipes. This is not novice/human behavior.

See player-competition-summary.json for counts and matched raw results, player-default-33.json for default results and player-planned-*.json for candidate chunks. Reproduce a chunk with `node tools/sim_player.mjs 6 planned 0` (count, mode, starting-index offset). Chunking changes neither seeds nor starting indices.

More competition does not by itself prove balance fixed. Candidate greedy still wins every port. Cash is final-run cash, not fixed-horizon wealth. Run time is this machine, not mobile performance. NPCs use existing simplified greedy rules, not full player operating costs. No activation recommended solely from these results.
