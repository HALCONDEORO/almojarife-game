# Patrician III: notes from the FX Interactive strategy guide (clean-room), v3

Purpose: close the "Spanish tips PDF" item left open in [patrician3-mechanics.md](patrician3-mechanics.md). Same rules as that file: ideas and general mechanics only, in our own words; no text, tables, art, names or numbers copied; source figures appear as rough ratios at most. v3: corrected after independent review; every "current code" claim below was checked against the source on main (c4b7e8e), not against parity-gap.md.

## Source read (free, public)

- FX Interactive (the Spanish publisher), "Los secretos de Patrician III: Imperio de los Mares", 7-page official strategy guide. The original URL now redirects to the publisher home page; read via the Wayback Machine capture of 29 Nov 2024: https://web.archive.org/web/20241129233437/http://www.fxinteractive.com/p228/images/Secretos%20del%20Imperio%20de%20los%20Mares.pdf
- The guide is copyrighted publisher material (not CC-licensed wiki text). Nothing below is quoted or tabulated from it; each item is a mechanic restated in our words.

## What the guide adds over the wiki-sourced notes

Most of the guide overlaps what [patrician3-mechanics.md](patrician3-mechanics.md) already records (price bands, staples, convoys, tavern hiring, ranks). The items below are the ones that add a mechanic or a concrete design cue we had not written down.

### 1. Price limits are uniform across goods

- The guide publishes, per good, a base price plus two extremes: the lowest price at which a city sells the good (what the player pays) and the highest price at which a city buys it (what the player is paid). Both extremes are the same ratio of base for every good, roughly: a city never sells below about three fifths of base, and never pays more than about double base. The "never pays more" figure is documented only for the lowest difficulty and only when the city holds no stock of the good.
- On difficulty the guide gives only recommended selling prices per difficulty tier (and the low-difficulty caveat above); it does not say that both price extremes move.
Almojarife proposal: if we ever document our price model for players, state our own uniform clamp ratios in data rather than per-good tables. Economy tuning belongs to the economy workstream; this note only records the mechanic.

### 2. "Never sail empty" as a measurable habit

- The guide's first trading rule: every leg should carry something, even at a thin margin, because time costs more than a cheap sale.
- Current code: this is already enforced for the simple route v1 (src/game/routes.mjs: at the home port A the ship waits instead of sailing without the outbound good; from B it always returns, even empty). Advanced routes v2 (setRouteAdv) use a different criterion: the ship waits in port only when nothing traded and nothing aboard is wanted at a later stop (the traded/holdsForLater check). Later legs can still run empty by design.
Almojarife proposal: surface an empty-leg count per route in the route profit statistics that already exist, so the player learns the habit from their own numbers. Testable: a leg completed with no cargo increments the counter and the statistic is reported.

### 3. Route definitions outlive ships

- The guide advises saving profitable routes so that when a convoy is lost you load the same route onto a new convoy instead of rebuilding it by hand. In our code both route kinds live on the ship object (ship.route in src/game/routes.mjs), so losing the ship loses the route definition.
Almojarife proposal: route templates as data (a named list of stops with per-stop orders), assignable to any ship. Ship loss keeps the template in a list the player can reassign. Testable: assign template to ship A, remove ship A, assign the same template to ship B without re-entering stops.

### 4. River and shallow ports filter routes by ship class

- River ports are reachable only by small ship classes; a route that includes one is still followed by bigger ships, they simply skip that stop. Our BACKLOG already lists draught as ship-class data.
Almojarife proposal: when draught lands, a route stop the ship cannot enter is skipped with a message (not a stall), mirroring the readability rule that routes report what they do. Testable: route with a shallow-only stop and a deep-draught ship completes the other stops and logs the skip.

### 5. Dangerous sea passages

- The guide warns against routes that cross one specific strait because passage there damages ships, and recommends keeping each route inside one sea. The mechanic: sea zones carry different risk, and route planning should see it.
- Current code: hull loss at sea comes from daily wear (src/game/seawear.mjs, src/sim/trade.mjs) and from storm and pirate encounters (src/game/encounters.mjs, src/game/encounterdaily.mjs). There is no explicit additional per-region damage multiplier, but weather exposure already varies by region and season: seawear.mjs reads windAt/inStorm, and src/sim/weather.mjs keeps WIND and STORM_COUNT tables per region and season, which encounterdaily.mjs consults through inStorm.
Almojarife proposal: an additional per-region risk layer as data feeding the wear and encounter rolls, shown on the map when plotting a course. It must first justify that it does not duplicate the risk the regional wind/storm tables already express. Testable: two equal-length voyages, the one through a high-risk zone accumulates more expected wear.

### 6. Shipyard loyalty

- Building repeatedly in the same shipyard shortens delivery times and eventually unlocks the best hulls: a player-facing progression taught by the guide.
Almojarife proposal: per-yard experience counter in data with a visible level. Testable: N orders at one yard measurably shorten the next quoted build time there and not elsewhere.

### 7. Captain scarcity as a design alternative

- The guide describes free captains as scarce and found by searching taverns. Current code already chose a different answer: src/game/captains.mjs has a deterministic per-port tavern roster, and hired or dismissed entries never respawn.
Almojarife proposal: none. Record only the design cue: scarcity plus search makes hiring a rumour-driven activity instead of a menu. If the roster is ever revisited, a capped pool of free captains that appears at unstated ports is the alternative the classic game used (its exact pool size is not adopted here).

### 8. Fleet size interacts with battle captures

- The guide's convoy advice links fleet size to whether ships can be captured in battle at all. Current code: convoys exist with their own limits (src/game/convoys.mjs: CONVOY_MIN 2, CONVOY_MAX 5, escort bonus), and the seeded battle resolver is already wired behind the pirateFight flag (src/game/encounterdaily.mjs resolvePirates calls fightPirates with escortOf when the flag is on); player boarding and capture remain a separate, unbuilt mechanic. The guide's own convoy number is not adopted.
Almojarife proposal: study whether battle outcomes (especially captures, once boarding exists) should depend on fleet-size ratio, without changing the existing convoy cap. Testable: outcome distribution differs across a documented size threshold.

### 9. Auctions feed piracy, piracy feeds loans

- Two emergent loops the guide teaches: freshly auctioned ships leave port damaged and under-crewed, so they are easy prey near the auction port; and pirate income can be lent out at the moneylender at modest interest to grow capital without hurting reputation. Systems (auctions, repairs, loans, reputation) combine instead of standing alone.
Almojarife proposal: none new; record as a design heuristic for the auctions and loans backlog items: new systems should interact with at least two existing ones, and each interaction gets a test.

### 10. Reputation levers beyond trade

- Current code: src/game/reputation.mjs already implements per-port reputation with scarcity-scaled deltas on both selling and buying (repOnSale, repOnBuy over scarcityOf), daily and per-trade caps, monthly decay, and tiers with fee and repair perks. The trade-driven part of the classic mechanic is implemented.
- What the guide adds are non-trade levers, each with a cost and a failure mode: church charity draws beggars who only help the city if jobs exist for them; feasts succeed only if the warehouse holds set amounts of several goods per head of population; supplying a besieged town earns reputation; accepting patrol-ship duty pays and raises standing.
Almojarife proposal: when new reputation levers are added, each one names its cost and its failure mode in data, and tests cover both directions (lever with cost paid raises standing; same lever without the cost does nothing or backfires).

## Open work

- The German tip collection (Tippsammlung) at patrizierforum.net: partially translated to English in a forum thread (see patrician3-tippsammlung-notes.md when present). The full German original and its attachments (hub-system chapter PDF) were not retrievable in this pass (404 on the forum, not archived).
- Videos and forum threads remain uncovered, as in patrician3-mechanics.md.
