# Ships and weapons

Versión en español: [es/ships-and-weapons.md](es/ships-and-weapons.md).

Tables: [generated/ships-and-weapons.md](generated/ships-and-weapons.md).

## In review (not on main)
- Armory (PR #230): weapons take hold space (ballista 1, catapult 2, cannon 3, bombard 5), sailors' gear level 0-3, an Armory building that sells both. Bots arm only when a harness reports pirate risk, because arming bots by wealth alone broke two NPC worth gates.

Update this page and the generated table in the same PR that changes any of these numbers.

## Speeds at sea (how to read km/day)

The `km/day` column above is **effective daily progress** of a fully crewed
ship with no captain and neutral weather: tacking, calms and port turnaround
are baked in, so it is lower than an open-sea hull speed. In knots (1 knot =
44.448 km/day): barca 2.25, cog 2.02, caravel 3.15, nao 1.80. Background and
sources: [../research/ship-speeds.md](../research/ship-speeds.md).

The voyage time a player sees multiplies that base by three factors
(`src/game/traveltime.mjs`):

- **Crew**: below the minimum the ship cannot sail; from minimum to optimal
  it rises from 70% to 100% speed; a full crew adds up to +10%.
- **Captain**: +4% per navigation level (hired captains start at level 1-3).
- **Wind**: each leg rolls a fixed factor between 0.80 and 1.20 (seeded, so
  reloading a save keeps the same weather for the same leg).
