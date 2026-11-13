# P3 building contracts and the builder pool: the documented model our one-crew city simplifies

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

The P3 manual's building chapter documents a contract: a trader builds in a
town once established there, and establishing means a trading office, which
itself requires sufficient standing. Materials come from the trader's office
or ships in port, are bought automatically on the local market when short,
and are flagged visibly when the town cannot supply them at all. Costs are
shown and the order can still be cancelled before confirming. The build menus hide anything the town cannot
currently erect, fortifications are a
lord-mayor privilege, and nothing may be built outside the walls while a
town is besieged. On placement, the full labour and materials cost leaves
the account at once. Crucially, each town keeps a pool of building
contractors that grows with population; work waits when every contractor is
busy, and an outsized project such as a complete town wall is paused
periodically so it never blocks the town's other construction.

Almojarife mirrors most of the contract - the office standing gate, the
warehouse-then-market materials quote, the paid order that locks its plot,
and a city queue with an honest estimate. But the queue module's header
attaches a P3 attribution to our one-crew rule. The rule itself is ours and
current; the manual documents the opposite: a growing contractor pool with
explicit relief for oversized projects. Nothing inspected shows the
one-crew rule ever held in the source game or that our queue changed - the
unsupported piece is the attribution alone.

Existing coverage is not reclaimed: the build note studies community factory
economics from the Tippsammlung, the civic-construction design doc records
the 11.3 and 12.4 gates and purses, the P4 material-wait note is a different
game, the siege note owns fortifications, and the expansion notes own town
founding. No research note takes manual 11.1-11.2 as primary.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Basics of Building and Trading Office Buildings (printed pages 37-38): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: the office-first rule with its standing condition; materials drawn from office or ships in port, auto-purchased locally when short, flagged when unobtainable; cost preview and pre-confirm cancellation; menu categories (office buildings, city buildings, raw-material and finishing producers, lord-mayor fortifications); the menus hide whatever the town cannot currently erect; no building outside the walls during a siege; full cost deducted on placement; a per-town contractor pool that delays work when saturated, grows with population, and pauses oversized projects like a full wall so other work proceeds; houses and warehouses only inside the walls; each extra warehouse adds storage; and owned houses show occupancy, rent and land tax, with rent adjustable per house class across selectable levels. The pool's exact size and growth step are given in the source and deliberately not adopted. |
| S2 | GRYOnline game guide, other buildings part 1: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/inne-budynki-1/z336df | Full Polish page read. Tracks the manual point by point - office first with reputation earned by trading, the same menu categories including three town-house classes by resident wealth, the same materials flow with visible flagging of the unobtainable, the siege restriction, deduction on placement, and the contractor pool that grows with the town and interrupts oversized works for smaller ones. Documentary overlap inside the same source family, not independent confirmation. |
| S3 | Old man's guide to Patrician III (Steam community guide), construction section: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Independent community guide. Operational doctrine the manual does not state: amass building materials in a warehouse before starting projects, avoid buying materials in towns that produce them poorly because prices climb steeply, and keep a dedicated materials flotilla for big works like walls. Community strategy claims until tested; its amounts and material counts are not adopted. |

## Main inspection

Real grep and reading across `src` for the contract's pieces found most of
it built, with two documented deviations:

- Office gate: `src/game/buildings.mjs:158-172` - one office per non-home
  port, bought only once the port knows the trader (`OFFICE_MIN_RESPECT`,
  buildings.mjs:159), and the office gates all construction there
  (`quoteConstruction`, buildings.mjs:196). The manual's office-first rule
  with its standing condition is the documented parallel.
- Materials flow: `src/game/buildings.mjs:211-221` - the quote draws from
  the port warehouse first, honouring warehouse goods locks, then buys the
  remainder, importing at a markup whatever the port lacks. Two deviations
  from the documented flow: ship holds in port are not drawn upon, and
  unobtainable materials do not block the order - they are imported at the
  markup instead of being flagged for the trader to supply.
- The queue: one construction crew per city (`src/game/buildings.mjs:224-225`,
  which describes our current rule but attributes it to P3; manual 11.1.2
  documents a growing pool with periodic pausing of oversized projects
  instead). Paid
  orders wait in a `queued` state that locks the plot
  (buildings.mjs:205), the queue serves oldest first
  (`cityQueue`, buildings.mjs:229-231), a freed crew takes the oldest
  order on the same tick (buildings.mjs:292), and the player sees an
  estimate with queue position (buildings.mjs:234-249) and a posted
  message (buildings.mjs:275). Within this buildings queue there is no
  population scaling and no big-project preemption; wall works and the
  municipal works department run on separate routes (`src/game/game.mjs:310`
  worksDay, `src/game/game.mjs:403` tickBuildings,
  `src/game/game.mjs:404` tickWalls), so nothing is claimed about a global
  crew across them.
- Wall gating is selective: `wallsAllow` (`src/game/plague.mjs:64-70`)
  requires expanded walls for hospital and capilla only; houses and
  warehouses carry no wall requirement, while the manual restricts houses
  and warehouses to inside the walls.
- Within `quoteConstruction`, only the `civicAllow` checks - civic standing
  and the per-city new-building cap (buildings.mjs:127-136) - skip
  re-evaluation on upgrades (gated at level zero, buildings.mjs:206-207);
  the office, wall, producer, type, level-cap and materials checks
  still apply to upgrades. Warehouse storage grows per added warehouse
  through `warehouseCap` (`src/game/game.mjs:367-368`), paralleling the
  documented storage growth without adopting its figure; town houses exist
  by resident class (`src/game/buildings.mjs:23-29`); and for rent there
  is no functional route: grep for rent and tenant terms across citylife
  and buildings finds no mechanic, and the house-classes design note
  records the P3 rent per class but defers it as a future income mechanic
  (`docs/design/house-classes.md:27`).
- No siege build-freeze branch was found in the inspected construction
  routes: grep for siege terms across `src/game` returns only a tower
  module comment (`src/game/towers.mjs:10`) stating siege interactions are
  deliberately not built, and neither `quoteConstruction` nor `wallsAllow`
  carries a siege condition - so the documented build-freeze outside walls
  during a siege has no located analog. Town founding
  and its standard buildings belong to the expansion notes and were not
  inspected here.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, keep the first slice documentary rather than mechanical:
drop the queue module's unsupported P3 attribution while preserving its
description of our own rule, and let the queue estimate say honestly when
the town's builders are saturated. A real builder pool -
several contractors scaling with population, with preemptible oversized
works - is a separate owner decision, since the one-crew rule may be a
deliberate pacing choice rather than an oversight. Flag-off must mean
byte-identical saves and unchanged estimates.

Future tests should prove: flag-off games untouched; any pool sizing is
deterministic from the city's own population figure; preempted works resume
without losing paid materials; queue estimates stay honest under
preemption; and save/load round-trips mid-queue without drift. Decide
first, as explicit owner calls: whether one crew is deliberate pacing or a
simplification to outgrow, whether ship-held materials in port should feed
quotes as the manual documents, whether importing should ever give way to
the documented block-and-flag when a port cannot supply a material, and
whether houses and warehouses should require standing inside walls.

## Open questions

- Do P3 contractors genuinely work in parallel on several buildings, or is
  the pool only a delay model? The manual's wording implies real parallel
  capacity; no inspected source settles it.
- Does the documented materials draw from ships cover any vessel in port
  or only the trader's docked convoys? The manual says ships in the port;
  the practical difference is untested.
- When materials are unobtainable, does P3 block the order outright or
  allow partial progress? The flagging is documented, the consequence is
  not.
- The manual's house classes are settled (poor, well-off and rich, page
  38); what is not established is how its selectable rent levels per class
  feed occupancy, or whether rent touches satisfaction or reputation. Our
  model defers rent entirely, so there is no local evidence
  either way.
- Are the three P3 house classes assigned to resident classes
  automatically, or can a tenant of one class occupy another's house? Not
  stated in the inspected sources.
