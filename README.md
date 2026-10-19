# Almojarife

**ES** Juego de comercio marítimo de código abierto, en desarrollo temprano. Empiezas con una nao y unas monedas en un puerto medieval; compras barato, navegas, vendes caro, montas talleres y flota, y asciendes hasta el rango más alto: el **almojarife**, el tesorero que gobierna el comercio del puerto. Español como idioma principal; también en inglés.

**EN** An open-source sea-trading game, early development. Start with one cog and a few coins in a medieval harbour; buy low, sail, sell high, build workshops and a fleet, and rise to the top rank: the **almojarife**, the royal treasurer who runs the port's trade. Spanish is the main language; English is fully supported.

Pronunciation / Pronunciación: al-mo-ja-RI-fe (EN: "al-mo-ha-REE-fay").

## Estado / Status

Prototype only: 10-city world data, sea-lane graph, market model, SVG map. Not playable yet. / Solo prototipo: no se puede jugar todavía.

## Dónde jugar / Where to play

Navegador primero (gratis, sin instalar). Descargas de escritorio después del 1.0. Steam solo si lo decide el propietario. / Browser first (free, no install). Desktop downloads after 1.0. Steam only if the owner decides.

## Hoja de ruta / Roadmap (target dates, may move)

| Hito / Milestone | Fecha / Date |
|---|---|
| Engine base | 18 Dec 2026 |
| Economy prototype | 29 Jan 2027 |
| Vertical slice (browser) | 16 Apr 2027 |
| Alpha | 31 Aug 2027 |
| Public web beta | 31 Jan 2028 |
| 1.0 (10 cities) | 30 Apr 2028 |

Después / After 1.0: more cities (20), then free regional expansions toward the wider world (Mediterranean, Atlantic, Africa, Indian Ocean, Asia). Details: `docs/ROADMAP.md`. Design and story: `docs/DESIGN.md`. Other games in this space: `docs/COMPETITION.md`.

## Qué hay aquí / What is here

- `data/world.json`: 10 cities (Lübeck, Hamburg, Bremen, Gdańsk, Riga, Visby, Stockholm, Bergen, Bruges, London), lanes, goods.
- `src/sim/`: simulation core (market, routes).
- `tools/`: geometry helpers, SVG map renderer, `fetch_data.sh` (downloads coastline data).
- `test/`: tests.
- `docs/map.svg`: current map render (the PNG is exported from the SVG by hand for now).

## Ejecutar / Run (from the repository root)

    sh tools/fetch_data.sh
    npm test
    npm run map

Needs Node 20 or newer. No other dependencies.

## Contribuir / Contribute

See `CONTRIBUTING.md`. Ideas for cities, goods, ships or mechanics are welcome: open an issue. Translations too.

## Licencia / Licence

Code and game data (`data/`): MIT (`LICENSE`). Art and docs: CC BY 4.0 (`LICENSE-ART.md`). Coastlines: Natural Earth, public domain (`CREDITS.md`). All original; nothing copied from other games.
