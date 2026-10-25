# Backlog by theme

Ideas we intend to build, grouped by theme and ordered inside each theme. Each item becomes one small pull request with tests. Everything that can be data lives in `data/` so contributors can add content without touching code. Status: **done** (on main), **next**, **later**. The dates in [ROADMAP.md](ROADMAP.md) are the plan; this list is the shape of the work.

All game rules and numbers are our own design. Other games inspire ideas only; see [research/lessons-and-reuse.md](research/lessons-and-reuse.md).

## 1. Trading (the core loop)
- done: quantity buttons, deal preview with price impact, sell all, profit on cost basis
- done: 30-day price history and 7-day trend
- done: seasons change production of farm and sea goods
- next: best-deal helper (which port pays most for what is in the hold, net of days at sea)
- next: standing buy/sell orders per port (limit price), executed on arrival
- next: trade log with profit per voyage
- later: price news feed ("grain is dear in Sevilla")

## 2. Start of a game
- done: company name, character, portrait, coat of arms, home port, background
- next: difficulty presets (coins, rival strength, event frequency)
- next: starting ship choice
- next: world seed, shown on screen so a game can be replayed or shared
- later: scenarios with their own goals and start conditions

## 3. Cities
- next: city data file with buildings (market, shipyard, warehouse, church, town hall, tavern)
- next: population growth and needs that change with food supply
- later: guilds and trade privileges; town hall, building permits, city logic
- walls done (levels, upkeep, unkept watch); towers: first drop done (fire watch, issue #363); later: sieges, towers vs pirates and events

## 4. Economy
- next: per-city tariffs and market fees
- later: credit and interest from a banker; insurance for cargo
- later: production buildings and workshops, with raw goods and recipes in data
- later: reputation and rank with each city

## 5. Ships
- next: ship classes as data (capacity, speed, draught, upkeep, hull)
- next: hull wear and repair at the shipyard
- later: crew and captains, upgrades, convoys, ship naming

## 6. People and events
- next: events as data (storm, fire, plague, festival, pirates: flee, fight or pay)
- later: rival merchants with names and personalities
- later: governors, commissions from towns, news and rumours
- later: wars and blockades that close lanes for a while

## 7. Playing the game
- next: tutorial that teaches one buy and one sale, then sailing
- next: achievements (own wording and art)
- next: keyboard shortcuts and accessibility: contrast mode, bigger text, screen-reader labels, reduced motion
- done: pause menu, save and load, export and import saves
- later: free-licence music and sound (CC0 or CC BY only, each with a CREDITS row)
- later: more languages through [TRANSLATING.md](../TRANSLATING.md)

## 8. Quality and tools
- done: data validator in CI
- next: glossary and architecture decision records
- next: AI levels (careful, balanced, bold) with a long-run balance test
- later: mission conditions store, replays, mod loading

## Added 20:52 (project owner)
- shipyard: today only "buy a caravel" (fixed price, max 3 ships, no building, repair or upgrade, one shipyard action in any port). Next: ship classes as data, shipyard only in some ports, build orders with delay, repair, upgrades, selling ships, named fleets/convoys
- real calendar: months, dates, seasons and feasts; a game year with real historical events per era (fairs, wars, epidemics, bad harvests, milestones), data in JSON, public-domain/verified sources noted in docs (English), tests; yearly variation by seeded random events on top of the fixed historical ones

## Added 20:54 (project owner) - world and calendar plan (supersedes the 1480-1500 proposal)
Start year 1470 (Iberia, Mediterranean, Atlantic coast). The map opens by dated milestones; every region, port, good and event is data in JSON with a verified public-domain source in docs/ (English) and tests.
- phase 1: real calendar (months, dates, seasons, feasts), game starts 1470, year counter, dated event table
- phase 2: milestone engine: regions/ports/goods unlock on their date (Atlantic islands, West Africa coast 1470s-80s, Cape of Good Hope 1488, Americas/Caribbean 1492, Brazil 1500, India route 1498)
- phase 3: new goods (sugar, gold, tobacco, spices, silk), prices and production per region
- phase 4: Africa, Indian Ocean, Asia, rest of world by later milestones
- phase 5: base map from Natural Earth (public domain), split into regional tiles loaded on demand so GitHub Pages download stays small; simplified coast geometry per region
- phase 6: yearly variation: fixed historical events + seeded random ones (harvests, epidemics, wars, fairs, piracy)
- market info (shipped basic): live in port, last seen with age, rumours. Next: agents/contacts per port, information from passing ships

## Scope 21:15 (project owner): Patrician-style mechanics inside the current map (own mechanics, no copied content)
Priority by impact, one small PR each with tests and ES screenshots:
1. shipyard: ship classes as data, build with delay, repair, upgrades, sell
2. buildings and factories: production chains per port (data), upkeep, levels
3. credit and debt: loans with interest, limits by net worth
4. city rank and offices: reputation, rank titles, privileges
5. guilds: membership fee, benefits, rules
6. auctions: lots of goods/ships, rival bids
7. rivals: stronger AI with strategies and personalities
Graphics engine in parallel: waves, day/night, animated port, performance; 3D study after.
- crew and guns (21:23): crew (sailors, soldiers with light arms) and artillery (bombards/cannons by era and class) with cost, cargo weight taken, upkeep, effect on pirate events and naval combat; data in JSON. Next after the illustrated shipyard.

## Ten ideas from the owner (21:29), all accepted. Fictional characters only; own mechanics, no copied content.
Priority order (impact first, small PRs with tests):
1. tutorial and easy mode (guided first voyage, hints, softer upkeep)
2. contracts and commissions from nobles and guilds (deadline, reward, penalty)
3. loans and insurance with interest (credit limit by net worth)
4. reputation and honour per city (affects prices, contracts, offices)
5. rivals with personality (AI strategies: trader, pirate-friendly, monopolist)
6. black market and smuggling (customs, fines, seizure risk)
7. spies and contacts per port (paid info with risk of false information; extends the tavern rumours)
8. captain's log and yearly chronicle (generated from the game log)
9. sandbox mode, scenarios and achievements
10. family and heirs, marriages and alliances (fictional characters; the game continues after the player's death)
Also queued: crew and guns, illustrated shipyard, buildings and factories, guilds, auctions, calendar from 1470 with milestones (approved 21:08, after navigation and map).
- more building types per city (owner 21:33), each with its own function and its own goods (workshop, mill, brewery, rope walk, smithy, bakery, market hall, customs house, chapel...), data in JSON; fits "buildings and factories"
- DONE (owner 08:29, 20/10): weekly settlement of ship upkeep, weekly reports and a message inbox with header buttons. Next on this line: crew wages, guns and building upkeep as extra weekly cost lines; interest on debt with the credit feature. See docs/design/weekly-settlement.md

## Platform rule (owner, 23 Oct 2026)
The game is desktop-only: Windows, Mac and Linux browsers with keyboard and mouse. Mobile is out of scope entirely: no mobile support is required, planned or tested, and it does not drive design, performance budgets or the 3D decision.
- DONE (owner 09:12, 20/10, "more uses for reports and messages"): low-cash warning the day before settlement, and a debt message when the bill cannot be paid in full.
- MORE USES FOR REPORTS AND MESSAGES, ranked by value (with the main objection):
  1. DONE (per good; per route still open). Profit per trade in the weekly report. Value: high, the player learns what works. Objection: needs a trade log; keep it to the last 52 weeks.
  2. Price history seen per port in Reports. Value: high, supports the "plan with prices" goal. Objection: partly there (recordPrices); only needs a view.
  3. Market opportunity messages (a good is cheap or dear at a port you know). Value: medium. Objection: can nag; cap at one per week and only for known ports.
  4. Trip summary on arrival (sold, bought, margin). Value: medium. Objection: duplicates the report; keep it one line.
  5. Message categories like Patrician (official, personal, trade) with tabs. Value: medium. Objection: only useful once there are many messages.
  6. Offers and rumours from the tavern as messages. Value: low-medium. Objection: depends on the rumour system staying simple.
- DONE (owner 09:20, 20/10, "negative money"): cash can go negative at settlement, 2% weekly interest on the deficit, bankruptcy past -3000, red coin counter, debt message and report line (design: docs/design/weekly-settlement.md).
- DONE (owner 09:20): bank / moneylender in the port: loans with interest, term and limit, repayment, shown in reports and messages.
  Devil's advocate: (a) a loan plus negative cash is two kinds of debt: keep one rule, loans are priced lower than overdraft (e.g. 1% a week vs 2%) so asking is better than falling into it; (b) unlimited loans break the "50,000 in 365 days" goal: cap by net worth (e.g. half of net worth, max 5000) and one open loan per port; (c) a death spiral for new players: warn before the due date and let a late loan become overdraft instead of ending the game at once; (d) historical flavour: a moneylender in a 15th century port is fitting; keep names generic.

## Patrician-style mechanics (owner 09:50, 20/10: "do all of them", in this order; ideas only, nothing copied)
1. DONE: automatic trade routes (src/game/routes.mjs). Devil's advocate: a ship that sails by itself can make the game a spectator sport; so it uses the normal fees, price impact, hold space and cash, never sails empty from A, and reports every sale and stall in messages. Later: several goods per leg, stop-loss.
2. NEXT: ranks and titles by net worth, with small perks (e.g. cheaper repairs). Objection: perks can snowball; keep them tiny.
3. NEXT: pirates and escorts (route risk, guns, convoy). Objection: random losses feel unfair; show the risk before sailing and let guns reduce it.
4. NEXT: famine and plague events that move prices in one port. Objection: must not be unwinnable; short and local.
5. NEXT: own workshops that produce goods. Objection: large; start with one type (e.g. brewery).
6. NEXT: crew wages and cannon cost as weekly lines in the report.
7. NEXT: tolls and trade privileges per city.
8. NEXT (owner 09:52): free navigation across the map, not only port to port. Depends on a coastline and sea mask for the map before it can be done safely.

## City economy (done: social classes)
- Each city splits into poor, middle (craftsmen and merchants) and rich citizens; big ports have more rich citizens.
- Each class buys different goods per 1000 citizens per day and stops buying a good when its price passes what the class can pay (poor 1.4x base, middle 2x, rich 3x).
- Market consumption is now the sum over classes (small demands accumulate until a whole unit); new "City" tab shows classes and what they buy.
- Ideas: class wealth changing with prosperity, class-specific unrest, building types per class.
