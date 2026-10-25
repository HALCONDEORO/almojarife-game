# Watchtowers on the city wall (issue #363, first drop)

Tracking issue: #363 "Towers and land defenses: costs and consequences". The
issue is iterative; this note covers the first drop only: towers as distinct
defense works with their own costs and a real effect today.

## Design (own tuning throughout; no documented figures exist)

- A tower mounts on the city wall: building one needs a standing wall
  (`wallsLevel >= 1`) and the cap is `TOWERS_PER_WALL_LEVEL` (2) per wall level.
- Construction follows the walls pattern: warehouse store first, the market for
  the missing materials, a labor fee, and an exact ready tick. One work at a
  time per city; standing towers keep serving while the next one rises.
- Cost per tower: 8 bricks, 3 timber, 1 ironware, fee 100, 4 days. Upkeep 1 per
  tower and day, accrued daily into the weekly book under
  `accrued.buildings["towers:<city>"]`, after buildings and walls in the day's
  cash-budget chain (so on a short purse the tower watch is the first to stand
  down).
- Unpaid consequence: the towers stand but are unmanned; their watch effect
  suspends until the pay returns, with the same two-day-cost restart hysteresis
  as the walls' watch. Both events post an ES/EN inbox message.
- Effect today (own-design choice, not a historical claim): a manned tower is a
  fire watch. Each kept tower adds `TOWER_FIRE_WATCH` (1) mitigation level
  against the calamities "incendio" roll, cutting both the weekly chance and
  the length, on the same scale as the pozo and hospital mitigations and under
  the same `CHANCE_CAP` floor. Famine and sanitation scares are unaffected.

## Deliberately NOT in this drop

- Pirate, raid and siege interactions: the pirate lane is held in
  `docs/research/parity-gap.md`; towers must not grow into it yet.
- city2d rendering of the towers: that lane belongs to the city2d/town-industry
  author. Follow-up.
- Any market, population or mood effect: the walls already own the
  effective-population role; stacking a second bonus here would double count.

## Flag and saves

- Flag `towers`, ON by default for new games (owner order 24/10 12:08: every
  flag ships ON), strict semantics: only `towers === false` or `=== 1` turns it
  off. An off game keeps no `g.towers` key, so saves stay identical.
- Old saves without the key load fine, but cannot build towers: there is no
  deserialize injection (same precedent as walls), so a pre-feature save reads
  counts as zero yet `quoteTowers` rejects. Tower play needs a new game. The
  state is a plain object, so the JSON round-trip is exact.

## UI

- One block in the city Buildings tab, right under the walls block: standing
  towers and cap, fire-watch count, daily upkeep, works in progress, the unmanned
  warning, and the build/confirm flow with the shared cost card.
- Strings live in a local `TW` table next to the block (ES/EN), not in the big
  `T.es`/`T.en` lines, while the issue #20 English sweep owns those lines.
