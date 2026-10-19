# Almojarife

**ES** Juego de comercio marítimo de código abierto, en desarrollo temprano. Empiezas con una nao y unas monedas en un puerto medieval de la costa española; compras barato, navegas, vendes caro, montas talleres y flota, y asciendes hasta el rango más alto: el **almojarife**, el tesorero que gobierna el comercio del puerto. Español como idioma principal; también en inglés.

**EN** An open-source sea-trading game, early development. Start with one cog and a few coins in a medieval harbour; buy low, sail, sell high, build workshops and a fleet, and rise to the top rank: the **almojarife**, the royal treasurer who runs the port's trade. Spanish is the main language; English is fully supported.

Pronunciation / Pronunciación: al-mo-ja-RI-fe (EN: "al-mo-ha-REE-fay").

## Estado / Status

Prototype only: Baltic prototype data (10 cities, to be replaced by the Spanish coast), sea-lane graph, market model, SVG map. Not playable yet. / Solo prototipo: no se puede jugar todavía.

## Dónde jugar / Where to play

Navegador primero (gratis, sin instalar). Descargas de escritorio después del 1.0. Steam solo si lo decide el propietario. / Browser first (free, no install). Desktop downloads after 1.0. Steam only if the owner decides.

## Hoja de ruta / Roadmap

Mapa inicial: la costa de España (Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger). 8 ports, 12 goods, 2 acts, web only.

| Hito / Milestone | Fecha / Date |
|---|---|
| Engine base | 15 Jan 2027 |
| Economy prototype | 12 Feb 2027 |
| Vertical slice (browser) | 9 Apr 2027 |
| Alpha | 14 Jul 2027 |
| Public web beta | 30 Nov 2027 |
| 1.0 | 28 Feb 2028 |

Después / After 1.0: Act 3, more ports (Canarias, Génova, Marsella, Málaga, Orán), desktop builds. Details: `docs/ROADMAP.md`; design: `docs/DESIGN.md`; other games: `docs/COMPETITION.md`.

## Qué hay aquí / What is here

- `data/world.json`: prototype world data (Baltic and North Sea, 10 cities). To be replaced by the Spanish coast at milestone M1a.
- `src/sim/`: simulation core (market, routes).
- `tools/`: geometry helpers, SVG map renderer, `fetch_data.sh` (downloads coastline data).
- `test/`: tests.
- `docs/map.svg`: current map render (the PNG is exported from the SVG by hand for now).

## Ejecutar / Run (from the repository root)

    sh tools/fetch_data.sh
    npm test
    npm run map

Needs Node 20 or newer and curl. No other dependencies.

## Organización del repositorio / Repository layout

`data/` game data; `src/` simulation; `tools/` scripts; `test/` tests; `docs/` documents (index in `docs/README.md`); `locales/` text in ES/EN; `.github/` CI, issue and PR templates. Same layout idea as other open-source games (OpenTTD, Mindustry, Wesnoth, OpenRCT2, Unciv): README, CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG, TRANSLATING, templates, CI.

## Contribuir / Contribute

See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `TRANSLATING.md`. Ideas for cities, goods, ships or mechanics are welcome: open an issue. Translations too.

## Licencia / Licence

Code and game data (`data/`): MIT (`LICENSE`). Art and docs: CC BY 4.0 (`LICENSE-ART.md`). Coastlines: Natural Earth, public domain (`CREDITS.md`). All original; nothing copied from other games.
