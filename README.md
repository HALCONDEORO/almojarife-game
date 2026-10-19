# Kontor Tides

An open-source Hanseatic sea-trading game, early prototype. You run a merchant house in the medieval Baltic and North Sea: buy cheap, sail the lanes, sell dear, grow a fleet.

Status: prototype. A 10-city world, a sea-lane graph, a market model and an SVG map renderer exist. No playable game yet.

## What is here

- `data/world.json`: 10 cities (Lubeck, Hamburg, Bremen, Gdansk, Riga, Visby, Stockholm, Bergen, Bruges, London), lanes, goods.
- `src/sim/`: simulation core (market, routes).
- `tools/`: geometry helpers, map renderer, `fetch_data.sh` (downloads coastline data).
- `test/`: tests.
- `docs/map.svg`, `docs/map.png`: current map render.

## Run

    sh tools/fetch_data.sh      # downloads Natural Earth coastlines into data/
    node --test test/world.test.mjs
    node tools/render_map.mjs

Needs Node 20 or newer. No other dependencies.

## Contribute

See `CONTRIBUTING.md`. Want a city, a good, a ship type or a mechanic added? Open an issue.

## Licence

Code: MIT (`LICENSE`). Art and docs: CC BY 4.0 (`LICENSE-ART.md`). Coastline data: Natural Earth, public domain (`CREDITS.md`).
