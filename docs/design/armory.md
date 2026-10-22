# Armory: ship weapons, sailors' gear and hold weight

Project request (22 Oct 2026): ship weapons need types, the cargo they take away, and how they help; the building that sells ship
weapons is the same one that sells sailors' weapons. Details were left to the design; each choice below says why.

## State before this change
- Four ship weapons already existed (ballista, catapult, cannon, bombard; src/game/crew.mjs, PR #180): price, power, daily upkeep,
  one per slot, slots capped by ship type. Power x condition x crew factor is the defence used against pirates (encounters.mjs).
- Nothing took hold space. Nothing sold sailors' weapons: sailors were only hired at the tavern.
- No building sold weapons: any port window sold them. AI traders never armed.

## What it is now
1. **Weight.** Each weapon takes hold space: ballista 1, catapult 2, cannon 3, bombard 5. A ship's usable hold is
   `capacity - weapons - gear` (never below 0). Why: it makes armament a real cost in trade (a bombard is 5 units of salt),
   scaled to a barca (25) up to a nao (110). Arming is refused when the cargo already aboard would not fit.
2. **Sailors' gear.** Level 0 to 3 per ship (price to own level 1/2/3: 60/150/300; buying a level pays the difference). Each level adds 10%
   to the crew's defence factor and weighs 0.1 per sailor aboard, rounded up. Why: arms for the crew are a second way to defend, cheap,
   but heavy with a big crew, so a nao pays more hold than a barca.
3. **Armory (building).** A new non-production building (outside the 16-building cap, like dock and office), up to level 3.
   Cost: timber 10, bricks 4, ironware 3 (plus fee 250 per level), upkeep 2, 4 workers. Ship weapons and sailors' gear are sold at the
   armory of the port where the ship is docked. Every port has a town armory at list price; a player-built armory takes 10% per
   active level (max 3) off the player's purchases there. Why: the request says one building sells both; every port keeps a town armory
   so no port or AI trader is locked out, and the player's building is a real, optional gain.
4. **Same rules for bots and player.** Both buy through `buyWeapon` and `buyGear` (src/sim/armory.mjs); the buyer pays from its own cash.
   AI traders arm only when a harness reports pirate risk for them, and then only when rich (cash at least 40 times the price), keep weapons plus gear under 10% of the hold, mount at most half the
   slots, take gear level 1 first, then the weapon with the best power per coin. Why: bots have no pirate encounters yet, and arming bots by wealth alone inflated the NPC economy and broke two NPC worth gates, so
   they arm only with reported risk.
5. **Not changed:** weapon price, power and upkeep (balance holds), tolls (they follow hull size, not usable hold), pirate odds.

## Measured
See the PR report: 8-seed balance sweep against baseline and the 1/5/10/30/50/100 year gate.
