<p align="center">
  <img src="docs/images/banner.svg" alt="The Almojarife: ships sailing between ports on a 15th-century sea chart" width="900">
</p>

<h1 align="center">El Almojarife</h1>
<p align="center"><em>An open-source sea-trading game on the Iberian and Mediterranean coast, 15th-16th century.</em><br>
<a href="https://halcondeoro.github.io/almojarife-game/"><b>Play in your desktop browser</b></a></p>

<p align="center"><img src="docs/img/map.png" alt="The sea chart with ports, routes and ships" width="780"></p>

You are a small merchant with one cog and a few coins in a harbour town. Buy cheap where a good is plentiful, sail the sea lanes, sell dear where it is scarce, grow a fleet, and rise to the top rank: the **almojarife**, the royal treasurer who ran a port's trade (say it: al-mo-ha-REE-fay).

**Status: early alpha.** It is playable and free, but rough. The honest list of what is still missing for the alpha is below.

**Platform: desktop only.** El Almojarife is a desktop game: it is played in a Windows, Mac or Linux browser with keyboard and mouse. It is not designed for or tested on phones or tablets.

## Why you might like it

- **A living market.** 33 ports, 22 goods, prices that move with supply and demand. A 4-step signal next to each stock tells you at a glance how full the market is. Selling a big load crashes the price. AI traders compete with you.
- **A real sea chart.** Pan and zoom a hand-styled map built from public-domain Natural Earth data. Ships sail the lanes in real time. Ports you have not visited stay hidden until you buy a chart for them.
- **Your own trading house.** Name your company and character, pick a portrait, design a coat of arms and house colours, choose a home port and a background.
- **A full port.** Market, shipyard (pick a ship class on an illustrated slipway, build it, repair, sell), warehouse with a steward who keeps standing buy/sell orders, tavern (hire captains, buy news), bank (loans with weekly interest and a cap that grows with your rank), the town hall (council duties, respect, time-limited delivery contracts), and your buildings: buy city plots and raise anything from houses, workshops and warehouses to farms, mines, fisheries and workshops of a dozen trades, with upkeep and staffing.
- **A guided rise.** A mission engine drives a growing campaign: an opening chain that teaches the trade, plus optional side missions with deadlines and rewards.
- **Trade while you sleep.** Send a ship on an automatic route between ports, with optional price guards and a cash brake, and it keeps trading on its own.
- **Weekly books.** Ship upkeep is not charged on the spot. It is settled once a week, so you can plan prices and cash. Open **Reports** for the weekly ledger and **Messages** for your inbox (settlements, warnings).
- **Captains and the sea.** Captains with navigation, weather and defence skills change how a ship sails, weathers storms and fights pirates. Storms, pirates, fair winds and drifting cargo bring choices at sea; win a pirate fight and you may keep the enemy ship as a prize. Prices of ports you have not visited are rumours with an age and an error margin.
- **Ranks and respect.** Climb ranks by net worth (they unlock bigger loans and better ships), and earn respect port by port to open offices.
- **Your port, drawn.** Every city is drawn as a 2D plan built from the live game state: plots, buildings, shoreline and the working quay. A three.js harbour prototype (docked ships, warehouse, time of day) remains available with `?city2d=0`. Desktop first.
- **Saves.** Autosave every day, Continue from the title screen, export and import your save as a file. Until launch the save format can change without migration: test saves from earlier builds are not preserved.
- **The game is playable in English and Spanish** from day one. No account, no server, no ads: it runs in your desktop browser.
- **Open and clean.** MIT code, CC BY art, every asset credited. Nothing copied from other games.

## Screenshots

_All eight screenshots were refreshed on 26 Oct 2026 (English). The city plan (`city2d.png`) and sea chart (`map.png`) were captured from the playable build at `main` d8a7383bf9713fd0d4f980363685cc1d06a1a22b; the remaining six were captured from `main` c4ef80d84bdc1f500809eb4c7e163b0894a5fd2e. Refresh screenshots when the UI changes so they never show unmerged work._

| The city plan | Trade in the market |
|---|---|
| ![2D city plan of the home port with the city toolbar](docs/img/city2d.png) | ![Market with prices, charts and cheap/dear arrows](docs/img/market.png) |
| **The sea chart** | **Build ships at the shipyard** |
| ![Sea chart with ports, routes and the port panel](docs/img/map.png) | ![Shipyard tab with the ship classes and their orders](docs/img/shipyard.png) |
| **Tavern: captains and news** | **Bank: loans and interest** |
| ![Tavern tab](docs/img/tavern.png) | ![Bank tab](docs/img/bank.png) |
| **Warehouse and steward** | **Create your house** |
| ![Warehouse tab](docs/img/warehouse.png) | ![Character and coat of arms](docs/img/create.png) |

## How to play

1. Pick a name and a home port, then **Start**.
2. A new game starts in the three-step tutorial, then the mission campaign. There is no fixed coin goal or deadline (games started before this change keep their 50,000 coins / 365 days goal). Going bankrupt still ends the game.
3. In the **Market** tab, look for the green ▼ (cheap: buy) and red ▲ (dear: sell) arrows.
4. Click a port on the map, or a **Sail to** button, then press **Sail** to move time. Your ship takes days to arrive.
5. Sell where the price is high. Build a second ship in the **Shipyard**. Press **Esc** for the menu.
6. Once a week ship upkeep is settled. Check **Reports** for the numbers and **Messages** for what happened. Keep cash for that day.

Controls on the map: mouse wheel or pinch to zoom, drag to pan, double click to reset.

## What is missing for the alpha

The game is being built in public, in small pull requests with tests and review. This is the honest state:

**Still missing or in progress:**

- **The campaign.** The mission engine and the first missions (an opening main chain and two side missions) are playable. The full arc - varied requirements, narrative, more side missions and rewards - is being added mission by mission.
- **A richer city-centred interface.** Clicking a port already opens a city view with market, buildings, council and office tabs; more of the interface is moving city-side, piece by piece.
- **A balance pass.** We measure the game with an internal simulation harness (dozens of bot playthroughs) and fixes keep landing: loans now carry real risk (foreclosure), the bankruptcy flow is kinder, and production respects staffing. The opening goal is still easier than intended for optimal play; tuning continues behind the harness.
- **Importing building materials** for construction is written and in review, not merged yet.
- **Sound, tutorial, full 3D for every city, world map by historical milestones.** Not started.
- **The name** "Almojarife" is provisional.

Dates are a plan, not a promise: alpha is targeted for 14 Jul 2027 and 1.0 for 28 Feb 2028. See [`docs/ROADMAP.md`](docs/ROADMAP.md) and [`docs/DESIGN.md`](docs/DESIGN.md).

## Run it yourself

You need Node 20 or newer and any static web server:

    npm run serve        # then open http://localhost:8080/web/index.html
    npm test             # simulation, AI traders, game logic, saves, ledger, 3D scene
    sh tools/fetch_data.sh   # downloads the coastline data (not stored in the repo)

The sea-chart background is rebuilt by `tools/build_background.py` from the Natural Earth raster; the finished image is in `assets/map/`.

The README banner and the social preview in `docs/images/` are drawn by `tools/build_banner.py` from `data/world.json` and the sea chart. Run `python3 tools/build_banner.py --png` after changing ports or lanes; `--check` fails in CI when they are out of date. The ships on the banner follow the real lanes and are listed in `ROUTES` at the top of the script.

## Repository map

`src/sim/` simulation core · `src/game/` game rules, saves, profile · `src/view/` map camera · `web/` browser UI · `data/` ports, lanes, goods · `assets/` art (each file credited in [`CREDITS.md`](CREDITS.md)) · `docs/` design, roadmap, decisions · `test/` tests.

## Working with AI coding agents

See [AGENTS.md](AGENTS.md) and the [model policy](docs/politica-modelos.md).

## Contribute

Ideas, bug reports, historical corrections and translations are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) and [`TRANSLATING.md`](TRANSLATING.md). Open an issue before large changes. Every change goes through a pull request with tests and review. Good first steps: pick an item from [`docs/BACKLOG.md`](docs/BACKLOG.md), fix a translation string, or report a price that feels wrong.

## Licence and credits

- Code and game data: MIT ([`LICENSE`](LICENSE)).
- Original art and documents: CC BY 4.0 ([`LICENSE-ART.md`](LICENSE-ART.md)).
- Third-party material is limited to public domain, CC0 and CC BY; every file is listed with its source in [`CREDITS.md`](CREDITS.md). Map data: Made with Natural Earth.
- The name "Almojarife" is provisional. A free trademark search found no conflict (19 Oct 2026); this is not legal advice.
- Ideas and mechanics from other trading games are studied; no art, text, names, data or code are copied.
