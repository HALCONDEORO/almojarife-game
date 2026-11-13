# P3 overland trade: barn deliveries at robbery risk, routes opened as a League mission

13 November 2026. Main inspected: `bba6320`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

P3 documents land trade between towns in two distinct pieces. The barn lets a
player who holds trading offices at both ends of an existing overland route
send goods between those offices by cart, with robbery risk that grows with
cargo value and a guard spend the player chooses per delivery. Separately,
the Hanseatic League can ask the player to open a new overland route, a
mission fulfilled by delivering construction goods at the town gate. Neither
piece exists in Almojarife: goods move between ports only by ship, and the
only overland reference found in the inspected engine modules is an ambient
non-player resupply mechanism that adds stock.

The land-logistics note studies P4's land trade, a different game with its own
mechanism; nothing here reopens it. The P3 politics notes cover rank-gated
contact with the regional prince at the town gate; this note touches the gate
only where the overland-route mission is delivered, and does not study
presents, delivery agreements, loans or war. No other research note records
the barn, its carts or shipment robbery.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Town Gate: Overland Route, and Barn, printed page 32: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation of both pieces: the League may ask for a new overland route and the gate button then accepts the goods, without requiring town citizenship; the barn sits in towns that have overland routes, requires an office at each end, provides a fixed number of carts per delivery but unlimited dispatches, and ties robbery risk to cargo value with player-chosen guard spending. Does not give robbery odds, guard effectiveness or costs. |
| S2 | GRYOnline, action buildings guide, barn section, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Player guide describing the same documented barn contract almost point by point: offices in both connected towns, wagons per transport with unlimited transports, risk rising with cargo value, hireable escort whose strength the player decides, with the guide's own advice to protect shipments well. Documentary overlap with the manual, not an independent runtime confirmation. |
| S3 | P3 wiki, Overland Trade Route: https://patrician3.fandom.com/wiki/Overland_Trade_Route | Community page on the establishment mission: accepted through the Alderman's office menu, fulfilled by delivering building materials to either endpoint town, with progress readable at the town gate menu and a limited window measured in months. The page lists per-route material amounts; no figures are adopted here. Community claims, no live reproduction. |

S1 and S2 agree on the barn contract; S3 is the only source read for the
mission's acceptance menu, window and progress display. No source read gives
robbery probabilities, guard pricing, delivery travel time, or whether a
robbed shipment loses goods, guards or both. Those stay open rather than
being filled from excluded material.

## Documented behavior, not inferred universal rules

The documented core is a risk-spend tradeoff on a player-initiated delivery:
goods leave one own office and arrive at the other over land, value raises
danger, and spending on guards is the mitigation. The mission piece is a
construction effort funded by material deliveries: S3 describes partial
deliveries allowed, percentage progress readable at the town gate, and the
route opening once the works and both endpoint barns are finished. Who
beyond the builder may use a new route, and whether existing routes are
fixed at game start, is not stated. Nothing read establishes
whether rivals use the barn, whether the player's shipments can be seen or
intercepted beyond the robbery event, or how the mission reward is set.

Open source questions: robbery odds and guard effectiveness; per-delivery
versus standing guard cost; delivery duration and whether it scales with
distance; what a successful robbery takes; whether routes follow real
geography or a fixed connection list; the mission's deadline, reward and
failure handling; and whether any of this changed between the base game and
Rise of the Hanse. None is answered with a copied table, schedule or
probability.

## Main inspection

Real grep across `src`, `data` and `web/main.mjs` for overland, barn, cart,
carts, robbery and land-route terms found no player land-transport mechanic
in those modules; the reference found is an ambient non-player resupply
mechanism that adds stock (`src/sim/market.mjs:39-40`), keeping town stock
above zero - no carts, no deliveries, no robbery. `data/world.json` carries
no land-route connection list.

- Goods already move between a player's own ports by ship hold and by local
  warehouse storage (`src/game/game.mjs`, `storeGoods`, `takeGoods`); nothing
  moves goods between offices without a ship.
- Council contracts (`src/game/contracts.mjs:1-4`) are timed sell-into-port
  jobs; a delivery order addressed to another own office is a different
  contract shape.
- The justice module (`src/game/justice.mjs:1-6`) charges deeds after
  detection; a robbery event against a shipment is world violence, not a
  player charge, and would not ride that module.
- Sea encounters exist per ship (`src/game/events.mjs:1-6`); there is no
  land encounter path. A shipment robbery would be a new event family, not a
  reuse of the sea one.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, start with one bounded delivery order between two own
offices on an already-established link, not a route-building campaign: pick
goods and quantity at one office, choose guard spending, resolve one seeded
robbery roll in transit, deliver at the other office. Keep it flag-gated so
an off game has no barn, no orders and no rolls, with saves byte-identical.
Do not infer our map's land links from P3's route list; our ports and their
connections are our own data decision.

Future tests should prove: flag-off saves unchanged; the robbery roll is
deterministic by seed, day and order; goods and guard money are debited at
despatch, not at resolution; a robbed delivery fails once and cannot be
settled twice, including across save/load; guard spending monotonically
reduces loss without ever guaranteeing arrival; and ship transport,
warehouse storage and council contracts stay unchanged whether the system is
on or off. Decide the connection list, the risk model, the guard pricing and
the mission's existence as explicit owner decisions first - the sources do
not settle them, and no P3 figure belongs in our data.
