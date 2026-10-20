<h1 align="center">El Almojarife</h1>
<p align="center"><em>An open-source sea-trading game on the Iberian and Mediterranean coast, 15th-16th century.</em><br>
<a href="https://halcondeoro.github.io/almojarife-game/"><b>Play in your browser</b></a></p>

<p align="center"><img src="docs/img/map.png" alt="The sea chart with ports, routes and ships" width="780"></p>

You are a small merchant with one cog and a few coins in a harbour town. Buy cheap where a good is plentiful, sail the sea lanes, sell dear where it is scarce, grow a fleet, and rise to the top rank: the **almojarife**, the royal treasurer who ran a port's trade (say it: al-mo-ha-REE-fay).

**Status: early alpha.** It is playable and free, but rough. See the honest list below.

## Why you might like it

- **A living market.** 9 ports, 12 goods, prices that move with supply and demand. Selling a big load crashes the price. AI traders compete with you.
- **A real sea chart.** Pan and zoom a hand-styled map built from public-domain Natural Earth data. Ships sail the lanes in real time.
- **Your own trading house.** Name your company and character, pick a portrait, design a coat of arms and house colours, choose a home port and a background.
- **Port panel.** Market, shipyard and warehouse tabs. The shipyard is an illustrated slipway: pick a ship class, build it (it takes days), repair hull wear, sell.
- **Weekly books.** Ship upkeep is not charged on the spot. It is settled once a week, so you can plan prices and cash. Open **Reports** for the weekly ledger and **Messages** for your inbox (settlements, warnings).
- **Events and rumours.** Storms, pirates, fair winds and drifting cargo bring choices at sea. Prices of ports you have not visited are rumours with an age and an error margin; buy news at the tavern.
- **A 3D port (prototype).** A three.js harbour built from your game state: docked ships, warehouse, time of day. Desktop first.
- **Saves.** Autosave every day, Continue from the title screen, export and import your save as a file.
- **The game is playable in English and Spanish** from day one. No account, no server, no ads: it runs in your browser.
- **Open and clean.** MIT code, CC BY art, every asset credited. Nothing copied from other games.

## Screenshots

| Title | Create your house |
|---|---|
| ![Title screen](docs/img/title.png) | ![Character and coat of arms](docs/img/create.png) |
| **Trade in the market** | **Sail and store goods** |
| ![Market with icons and cheap/dear arrows](docs/img/market.png) | ![Warehouse tab](docs/img/warehouse.png) |
| **Build ships at the slipway** | **Weekly ledger (Spanish UI)** |
| ![Shipyard slipway scene](docs/img/shipyard.png) | ![Weekly report](docs/img/reports.png) |
| **Message inbox (Spanish UI)** | |
| ![Message inbox](docs/img/messages.png) | |

## How to play

1. Pick a name and a home port, then **Start**.
2. Mission 1: earn **50,000 coins in 365 days**.
3. In the **Market** tab, look for the green ▼ (cheap: buy) and red ▲ (dear: sell) arrows.
4. Click a port on the map, or a **Sail to** button, then press **Sail** to move time. Your ship takes days to arrive.
5. Sell where the price is high. Build a second ship in the **Shipyard**. Press **Esc** for the menu.
6. Once a week ship upkeep is settled. Check **Reports** for the numbers and **Messages** for what happened. Keep cash for that day.

Controls on the map: mouse wheel or pinch to zoom, drag to pan, double click to reset.

## What works and what does not (yet)

| Works now | Planned |
|---|---|
| Trading loop, 9 ports, 12 goods, AI traders | Campaign of 2 acts, 12 missions |
| Sea chart with pan and zoom, moving ships, click-to-sail | Crew wages and building upkeep in the weekly ledger |
| Company and character creation | Town halls, building permits, city logic |
| Market, shipyard with ship classes, warehouse, saves | Tavern, workshops, standing ranks |
| Events at sea, market rumours, weekly settlement, reports and messages | More uses for reports and messages (profit per route, price history) |
| ES and EN, 3D port prototype | Sound, tutorial, more ports, world map by historical milestones |

Dates are a plan, not a promise: alpha is targeted for 14 Jul 2027 and 1.0 for 28 Feb 2028. See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/DESIGN.md`](docs/DESIGN.md).

## Run it yourself

You need Node 20 or newer and any static web server:

    npm run serve        # then open http://localhost:8080/web/index.html
    npm test             # simulation, AI traders, game logic, saves, ledger, 3D scene
    sh tools/fetch_data.sh   # downloads the coastline data (not stored in the repo)

The sea-chart background is rebuilt by `tools/build_background.py` from the Natural Earth raster; the finished image is in `assets/map/`.

## Repository map

`src/sim/` simulation core · `src/game/` game rules, saves, profile · `src/view/` map camera · `web/` browser UI · `data/` ports, lanes, goods · `assets/` art (each file credited in [`CREDITS.md`](CREDITS.md)) · `docs/` design, roadmap, decisions · `test/` tests.

## Contribute

Ideas, bug reports, historical corrections and translations are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and [`TRANSLATING.md`](TRANSLATING.md). Open an issue before large changes. Every change goes through a pull request with tests and review. Good first steps: pick an item from [`docs/BACKLOG.md`](docs/BACKLOG.md), fix a translation string, or report a price that feels wrong.

## Licence and credits

- Code and game data: MIT ([`LICENSE`](LICENSE)).
- Original art and documents: CC BY 4.0 ([`LICENSE-ART.md`](LICENSE-ART.md)).
- Third-party material is limited to public domain, CC0 and CC BY; every file is listed with its source in [`CREDITS.md`](CREDITS.md). Map data: Made with Natural Earth.
- The name "Almojarife" is provisional. A free trademark search found no conflict (19 Oct 2026); this is not legal advice.
- Ideas and mechanics from other trading games are studied; no art, text, names, data or code are copied.
