# Public-building construction, after the P3 record

Marco (25/10): "Los edificios públicos no los puede hacer cualquiera; mira en P3 cómo se
organiza esa construcción, copia el sistema y mejóralo." This note records what the record
says, what the game already did, and what changed.

## What the record says (Patrician III manual, ch. 11.3 and 12.4)

- City buildings (wells, roads, hospital, chapel, school, mint) are funded by the rich
  citizen, NOT from the town's coffers: "The rich will give donations and thus ensure
  personal recognition from their fellow citizens." Walls and the military are the council's
  business, paid from the town coffers (12.4) - a different purse for a different class of
  works.
- Gates: only inside the town walls; hospital and chapel only once the wall has been
  expanded at least once; one school and one mint per town; wells and roads unlimited.
- Recognition: "A benefactor will be remembered." Funding public works buys standing.
- The town's own building department also erects city buildings over time, keeping chapels
  and hospitals in rough balance.

## What the game already did

- The player funds every civic building (same purse rule as the record).
- hospital and capilla already require expanded walls (wallsAllow, plague module).
- corral already requires a big city (minPop 15000).
- pozo and caminos were already unlimited, like wells and roads.

## What changed (this piece)

- Standing gate on NEW civic works: the port must know you (respect 20, "known") before it
  lets you fund public works; the city-scale works (hospital, alhondiga, corral) ask for
  "trusted" (100). Upgrades of what you already built stay a matter of cash and walls.
- One facility per city for the city-serving types (posito, alhondiga, carniceria, molino,
  corral), like the record's single school and mint; hospital and capilla may repeat once,
  like the record's balanced chapels and hospitals.
- Recognition wired in: completing a civic work earns the port's respect for the full
  invested sum, at the same one-point-per-100-coins scale as trade (rank.mjs).

Menu feedback is our adaptation, not the record: the record hides what cannot be erected
("Only buildings which can actually be erected in a town will appear on the menus"); we
instead keep the unlockable refused offers visible as locked cards that name their reason
(respect, walls, city size, per-city cap), so the unlock path is discoverable (Main design
call 25/10). "Good not producible in this city" stays hidden: the player cannot change a
city's soil. Existing buildings in existing saves are untouched: the gates only consult
quotes.
The town-funded path (the record's building department) is NOT in this piece; it belongs to
the council module and needs its own economy review.
