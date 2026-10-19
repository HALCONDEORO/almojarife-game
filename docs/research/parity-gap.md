# "Patrician III parity" milestone: what we have, what is missing, in what order

Goal set by the project owner: before inviting the public, the game should reach the depth of a classic Hanse trading game (ports, trade, ships, buildings, city logic, interface polish), then keep improving. This is a quality bar, not a date. See [patrician3-mechanics.md](patrician3-mechanics.md) for the notes behind it. All items are built with our own world, art, names and numbers.

Status key: DONE, PARTIAL, TODO.

## Checklist (in build order)

### A. Core trading loop (foundation)
- [x] DONE: ports, 12 goods, prices that react to supply and demand, AI traders, buy and sell, cheap/dear hints.
- [x] DONE: ships sail on the map in real time, pan and zoom, sea-chart background.
- [ ] TODO: quantity preview and average price before buying; demand icons next to port names on the map.
- [ ] TODO: weekly consumption screen per port (market hall).

### B. Menus and flow
- [x] DONE: title screen, versioned saves, autosave, export/import.
- [x] DONE: company and character creation (crest, portrait, colours, home port).
- [x] DONE (PR open): pause menu, port panel with market, shipyard and warehouse tabs.
- [ ] TODO: options screen (language, speed, sound), tutorial, campaign shell with mission 1.

### C. Economy depth
- [ ] TODO: second layer of goods (processed goods) and about 20 goods in total.
- [ ] TODO: social classes with needs lists; migration; satisfaction; staples rule.
- [ ] TODO: production buildings with inputs, outputs, seasons, low/high production per port.
- [ ] TODO: warehouses become trading offices (trade without a ship in port).

### D. Ships and fleet
- [ ] PARTIAL: cog and caravel. TODO: a third and a fourth ship type, river/shallow-water ports for small ships.
- [ ] TODO: shipyard that levels up with use, build queue, repair, upgrade tiers (hit points, weapon slots).
- [ ] TODO: crew and weekly wages; tavern hiring.
- [ ] TODO: storms, ship wear, winter frozen ports.

### E. Automation (late game comfort)
- [ ] TODO: captains with automatic routes (many stops, per-stop buy/sell limits).
- [ ] TODO: managers for offices (buy/sell limits, minimum stock).
- [ ] TODO: convoys.

### F. City and politics
- [ ] TODO: city screen; houses and workshops on lots; roads, wells, hospital, chapel, church, school, mint, town wall.
- [ ] TODO: town hall: building permits, taxes, notices and missions, council, mayor election.
- [ ] TODO: reputation (local and Hanse-wide) and ranks with company value and guild membership.
- [ ] TODO: events: fire, plague, famine, celebrations.

### G. Tavern, pirates, war
- [ ] TODO: tavern with characters: sailors, captain, informer, broker, trader, missions.
- [ ] TODO: pirates (hire, threat on routes), simple automatic combat, capture ships.
- [ ] TODO: sieges and princes (optional, late).

### H. Polish and reach
- [ ] TODO: sound and music with clean licences; art pass on ports, ships, buildings.
- [ ] TODO: balance with the 1000-year simulation tool; accessibility; performance.
- [ ] TODO: content guides and modding folder; public release.

## Rough order and size
1. A and B finish (about 1 to 2 weeks of nightly work): finish the open PRs, quantity preview, options, campaign shell.
2. D and part of C: ship types, shipyard levels, crew, tavern basics, classes and needs (about 3 to 4 weeks).
3. F: city screen, buildings, town hall, permits, reputation and ranks (about 4 to 6 weeks). This is the biggest block.
4. C production and offices, then E automation (about 3 to 4 weeks).
5. G pirates and combat, H polish (about 4 to 6 weeks).
Estimates are rough and assume nightly sessions. We cut scope before moving the public dates (alpha 14 Jul 2027, beta 30 Nov 2027, 1.0 28 Feb 2028).
