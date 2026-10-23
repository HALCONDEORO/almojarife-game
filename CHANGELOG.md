# Changelog

## Unreleased
- Platform: the game is explicitly desktop-only (Windows, Mac and Linux browsers, keyboard and mouse); phones and tablets are out of scope.
- Staggered markets: each port ticks its economy once per day at its own slot inside the day (Patrician 3 style), instead of one midnight pulse. Formulas and daily quantities are bit-identical per port; price history is written at the port's tick.
- Continuous voyages: ships move per tick and arrive at a day and hour, not at day boundaries; each leg gets a seeded wind factor (0.8-1.2). Estimates and the ship panel show hours and the arrival ETA. Save format v3 (older test saves are not kept).
- Tick clock: the simulation now advances in ticks (240 per day, 10 per hour); day-boundary systems keep identical behaviour. Save format v2 adds `state.tick` (older test saves are not kept).
- Prototype: market model, world data (Baltic prototype), SVG map renderer, 7 tests.
- Project documents: design, roadmap, competition study.
- Repository organised like other open-source games: CI, issue and PR templates, code of conduct, translating guide.
