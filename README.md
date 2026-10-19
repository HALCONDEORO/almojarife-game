# Almojarife

An open-source sea-trading game set on the Iberian and western Mediterranean coast in the 15th and 16th centuries. Early development: a first playable prototype exists, but it is rough.

You start with one cog and a few coins in a medieval harbour. Buy cheap where a good is plentiful, sail the sea lanes, sell dear where it is scarce, add ships, and aim for the top rank: the **almojarife**, the royal treasurer who ran a port's trade. Pronounced al-mo-ha-REE-fay.

The name "Almojarife" is provisional (a trademark check is still pending).

Playable in **English and Spanish**. Spanish is the primary language of the project.

## Status (honest version)

- Playable now: a browser prototype with a map of 9 ports, 12 goods, a living market with AI traders, sailing, a second ship, and one mission (earn 50,000 coins in 365 days). Placeholder interface, no art, no tutorial, no save games yet.
- Not done: missions and story, harbour orders, buildings and workshops, sound, art, balance beyond the first mission, outside playtesting.
- Dates are a plan, not a promise: alpha is targeted for 14 Jul 2027 and 1.0 for 28 Feb 2028. See `docs/ROADMAP.md`.

## Play the prototype

Online: https://halcondeoro.github.io/almojarife-game/ (once GitHub Pages is live). Or locally:

You need Node 20 or newer (for the tests and tools) and any static web server. From the repository root:

    npm run serve

then open http://localhost:8080/web/index.html. The language follows your browser; the EN/ES button switches it.

## Develop

    sh tools/fetch_data.sh   # downloads Natural Earth coastlines (not stored in the repo)
    npm test                 # simulation, AI traders and game logic tests
    npm run sim1000          # 1,000 simulated years of the economy (about a minute)
    npm run map              # renders the world map to SVG

No dependencies beyond Node and curl.

## What is in the repository

- `src/sim/`: simulation core (world graph and routes, market model, ships, AI traders).
- `src/game/`: game state and player actions, no UI code.
- `web/`: the browser prototype.
- `data/world.json`: 9 ports, 23 waypoints, 33 sea lanes, 12 goods (original data).
- `assets/`: art assets; each one has a row in `CREDITS.md`.
- `docs/`: design, roadmap, decisions, process and studies (index in `docs/README.md`).
- `locales/`, `TRANSLATING.md`: how text is translated.
- `tools/`, `test/`: scripts and tests.

## Contribute

Ideas, bug reports and translations are welcome. Start with `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `TRANSLATING.md`. Open an issue before large changes. Historical corrections (ports, goods, ships, prices) are especially useful.

## Licence

- Code and game data: MIT (`LICENSE`).
- Original art and documents: CC BY 4.0 (`LICENSE-ART.md`).
- Third-party material is limited to public domain, CC0 and CC BY, and every file is listed with its source and licence in `CREDITS.md`.
- Everything here is original work. Ideas and mechanics from other trading games are studied; no art, text, names, data or code are copied.
