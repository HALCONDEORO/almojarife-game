# Ship speeds: current values, historical reference and proposals

Study of the four ship classes' speeds (`src/sim/trade.mjs`, `SHIP_TYPES.kmPerDay`)
against late 15th-16th century evidence and the Patrician 3 reference numbers.
Research only: no game numbers change here. Any change must go through the
balance simulations (`tools/sim_economy.mjs`, `tools/sim_1000y.mjs`).

## 1. Current in-game values

`kmPerDay` is the base effective progress of a fully crewed ship with an
average captain and neutral wind. Crew (`speedFactor` in `crew.mjs`), captain
(`captainSpeed` in `captains.mjs`) and the leg's weather multiply it at
sailing time (`traveltime.mjs`).

| Class   | km/day | Knots (km/day / 44.448) | Capacity | Upkeep/day | Build days |
|---------|--------|--------------------------|----------|------------|------------|
| barca   | 100    | 2.25                     | 25       | 1          | 8          |
| cog     | 90     | 2.02                     | 60       | 2          | 14         |
| caravel | 140    | 3.15                     | 40       | 3          | 12         |
| nao     | 80     | 1.80                     | 110      | 5          | 25         |

## 2. Historical reference (Iberia, late 15th-16th century)

- Columbus's first-voyage convoy averaged **a little under 4 knots over
  several days**, with about **8 knots as top speed**; 90-100 miles per day
  (167-185 km) was a typical day's run and 200 miles (370 km) exceptional.
  The nao Santa Maria was the slowest of the three ships and the caravel
  Pinta the fastest, by small margins (~0.1 knot in convoy).
  (columbuslandfall.com/ccnav/ships.shtml)
- The caravel is consistently described as small, fast and highly
  manoeuvrable, with a rig that used the wind better than other ships of the
  era (EBSCO Research Starters, "Caravel ship").
- Replica trials of the Bremen cog (14th century) show a safe, rough but
  workable sea boat whose best point of sail is a broad reach; square-rigged
  cargo hulls of the period lose a lot of speed upwind (tDAR, "The sailing
  properties of the Hanse cog"; International Journal of Nautical
  Archaeology 2009.00225.x).

Read the game numbers as *effective daily progress of a coastal trader*
(tacking, calms, currents and port turnaround baked in), not as open-sea hull
speed. Against that reading, 80-140 km/day sits deliberately below the ocean
passage average (~170 km/day) and keeps the Iberia-Med map at playable
voyage lengths of days, not hours.

## 3. Patrician 3 reference (P3 is the genre bar)

- Four classes with speed differences: Snaikka fast and cheap, Crayer
  fastest all-round, Cog slower and bigger, Hulk slowest and largest
  (patrician3.fandom.com/wiki/Ship).
- Speeds read from the game files, at full load: Snaikka 5.75 kn, Crayer
  6.25 kn, Cog 4.75 kn; **speed drops with hold load**, e.g. a Snaikka at
  60% load matches an empty Hulk (Steam guide 1817022479, citing the German
  forum's file analysis).
- Spread between fastest and slowest trader in P3: ~1.3x. Ours is 1.56x
  (caravel vs cog), a wider but still sane spread.

## 4. Findings

1. **The ordering is right.** Caravel fastest, nao slowest matches both the
   historical record and the P3 feel. The barca as a light coastal boat
   between caravel and cog is plausible for a lateen-rigged fishing/trading
   boat.
2. **Absolute values are conservative but defensible** as effective daily
   progress (section 2). They should be documented as such so future tuning
   compares like with like.
3. **No load factor.** P3 slows a full hold; our speed ignores cargo weight.
   This is the biggest fidelity gap, and it is also a pricing mechanic: it
   rewards light, fast runs and makes heavy hauls slower per unit distance.
4. Crew, captain and wind already modulate speed per voyage; the ranges of
   those factors are not documented player-side.

## 5. Proposals (each needs balance sims before merging)

1. Keep the four `kmPerDay` values for the alpha and document them as
   effective daily progress in `docs/wiki/ships-and-weapons.md` (which today
   lists no speeds at all).
2. Add an optional load factor, P3-style: `speed x (1 - 0.15 x load
   fraction)`. Flag-gated, then measured by the economy sims before turning
   on by default.
3. If new classes arrive, proposed starting points grounded by role (to be
   tuned, not historical claims): patache (dispatch boat, ~150 km/day, tiny
   hold), bergantin (~130), urca/fluyt (slow, big and cheap to run, ~85),
   galleon (late-period armed, ~95).
4. Document the crew/captain/wind speed ranges in the player wiki so the
   numbers players see at sea are explainable.
5. Backlog idea, not alpha: seasonal wind zones (Strait levante/poniente)
   multiplying the per-leg wind already in `sail()`.

## Sources

- https://columbuslandfall.com/ccnav/ships.shtml (Columbus's ships: sizes,
  convoy averages and daily runs)
- https://www.ebsco.com/research-starters/history/caravel-ship/ (caravel:
  fast, manoeuvrable, rig advantage)
- https://core.tdar.org/document/422888/ (Hanse cog sailing trials, replica)
- https://onlinelibrary.wiley.com/doi/10.1111/j.1095-9270.2009.00225.x
  (Bremen cog replicas, expert assessment)
- https://patrician3.fandom.com/wiki/Ship (P3 classes and relative speeds)
- https://steamcommunity.com/sharedfiles/filedetails/?id=1817022479 (P3
  speeds from the game files and the load effect)
