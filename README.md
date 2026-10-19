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
- **Port panel.** Market, shipyard and warehouse tabs: buy a caravel, store goods in a warehouse.
- **Saves.** Autosave every day, Continue from the title screen, export and import your save as a file.
- **The game is playable in English and Spanish** from day one. No account, no server, no ads: it runs in your browser.
- **Open and clean.** MIT code, CC BY art, every asset credited. Nothing copied from other games.

## Screenshots

| Title | Create your house |
|---|---|
| ![Title screen](docs/img/title.png) | ![Character and coat of arms](docs/img/create.png) |
| **Trade in the market** | **Sail and store goods** |
| ![Market with icons and cheap/dear arrows](docs/img/market.png) | ![Warehouse tab](docs/img/warehouse.png) |

## How to play

1. Pick a name and a home port, then **Start**.
2. Mission 1: earn **50,000 coins in 365 days**.
3. In the **Market** tab, look for the green ▼ (cheap: buy) and red ▲ (dear: sell) arrows.
4. Click a port on the map, or a **Sail to** button, then press **Sail** to move time. Your ship takes days to arrive.
5. Sell where the price is high. Buy a second ship in the **Shipyard**. Press **Esc** for the menu.

Controls on the map: mouse wheel or pinch to zoom, drag to pan, double click to reset.

## What works and what does not (yet)

| Works now | Planned |
|---|---|
| Trading loop, 9 ports, 12 goods, AI traders | Campaign of 2 acts, 12 missions |
| Sea chart with pan and zoom, moving ships | Storms, pirates, ship wear |
| Company and character creation | Town halls, building permits, city logic |
| Market, shipyard, warehouse, saves, pause menu | Tavern, workshops, standing ranks |
| ES and EN | Sound, tutorial, more ports |

Dates are a plan, not a promise: alpha is targeted for 14 Jul 2027 and 1.0 for 28 Feb 2028. See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/DESIGN.md`](docs/DESIGN.md).

## Run it yourself

You need Node 20 or newer and any static web server:

    npm run serve        # then open http://localhost:8080/web/index.html
    npm test             # simulation, AI traders, game logic, saves, profile
    sh tools/fetch_data.sh   # downloads the coastline data (not stored in the repo)

The sea-chart background is rebuilt by `tools/build_background.py` from the Natural Earth raster; the finished image is in `assets/map/`.

## Repository map

`src/sim/` simulation core · `src/game/` game rules, saves, profile · `src/view/` map camera · `web/` browser UI · `data/` ports, lanes, goods · `assets/` art (each file credited in [`CREDITS.md`](CREDITS.md)) · `docs/` design, roadmap, decisions · `test/` tests.

## Contribute

Ideas, bug reports, historical corrections and translations are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and [`TRANSLATING.md`](TRANSLATING.md). Open an issue before large changes. Every change goes through a pull request with tests and review.

## Licence and credits

- Code and game data: MIT ([`LICENSE`](LICENSE)).
- Original art and documents: CC BY 4.0 ([`LICENSE-ART.md`](LICENSE-ART.md)).
- Third-party material is limited to public domain, CC0 and CC BY; every file is listed with its source in [`CREDITS.md`](CREDITS.md). Map data: Made with Natural Earth.
- The name "Almojarife" is provisional. A free trademark search found no conflict (19 Oct 2026); this is not legal advice.
- Ideas and mechanics from other trading games are studied; no art, text, names, data or code are copied.
