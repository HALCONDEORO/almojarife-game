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
- later: city wall and sieges

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

## Added 20:52 (Marco)
- shipyard: today only "buy a caravel" (fixed price, max 3 ships, no building, repair or upgrade, one shipyard action in any port). Next: ship classes as data, shipyard only in some ports, build orders with delay, repair, upgrades, selling ships, named fleets/convoys
- real calendar: months, dates, seasons and feasts; a game year with real historical events per era (fairs, wars, epidemics, bad harvests, milestones), data in JSON, public-domain/verified sources noted in docs (English), tests; yearly variation by seeded random events on top of the fixed historical ones
