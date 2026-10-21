# Dock building: design and measured balance (21 Oct 2026)

Status: implemented with this PR. Own design. Desktop only.

## Mechanic

A private dock (`dock`, ES "Muelle") on one of your city plots cuts the port toll
YOUR ships pay in that city, per active level: -50% / -75% / -100%
(`DOCK_TOLL_DISCOUNT`, multiplicative with the respect discount - at "honoured"
the toll is already 0, so nothing breaks). Levels of several docks in one city
sum, capped at 3: one good dock is enough, extra piers add nothing.

Like the warehouse storage bonus it is a passive effect: a halted dock keeps it
(no workers needed to tie a rope), consistent with the existing building semantics
("halted: no costs and no output" - the discount is not output).

Costs (tuned against the measurement below): recipe timber 10 + iron 2,
fee 150, 5 build days, upkeep 1/day/level, no workers. Levels 2-3 pay the full
level cost (house upgrade policy), so deep levels are expensive.

## Measured balance (tools/sim_dock_balance.mjs, 8 seeds, cadiz<->huelva, 1 game year)

A/B per seed: identical games, one with the dock built and upgraded through the real
construction flow, one without; same ships on the shortest route. Net = tolls saved
minus running costs; payback = one-off plot+construction / net per year.

| fleet        | L1          | L2          | L3           |
|--------------|-------------|-------------|--------------|
| 1 cog        | never (-31/y) | never     | never        |
| 3 cogs       | 6.1 y       | 8.2 y       | 11.9 y       |
| 3 naos       | 3.4 y       | 4.3 y       | 6.3 y        |

Home dockings per year: ~73 (1 cog), ~120 (3 ships). Tolls scale with tonnage
(capacity/10): barca 2.5, caravel 4, cog 6, nao 11 per docking.

Reading: the dock is long-game infrastructure that scales with fleet tonnage.
A one-cog trader should not build it; a 3-ship hub recovers a level-1 dock in
~6 years, and heavy nao fleets recover any level in 3.5-6.5 years. In the
365-day campaign it never pays back inside the deadline - it is a free-play
investment, like big ship orders. The first tuning (fee 300, timber 20,
25/50/100% steps) never paid back even for 3-ship hubs; the measured numbers
above forced the cheaper recipe, lower fee and steeper discount curve.

## Consistency notes

- Types, jobs and the Buildings tab read from `BUILDING_TYPES`/`JOBS_PER_LEVEL`/
  `PRODUCERS` tables, so the dock appears in the build menu with no view changes;
  only two i18n strings (`bldTypes.dock`, `bldFxD`) were added.
- The 3D model is NOT part of this PR (Estudio owns view3d building modules).
- Tests: test/dock.test.mjs (7 tests: recipe/quote, discount matrix, construction
  timing, level cap, per-port scope, respect stacking, weekly-bill accrual,
  save round-trip).
