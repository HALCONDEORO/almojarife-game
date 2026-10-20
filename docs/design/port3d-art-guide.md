# 3D port: art guide

Own work only. Everything is built in code from boxes, cones, cylinders and extrusions (three.js, MIT). No copied art, names or data from other games. Any external model or texture must be CC0 or CC BY with a row in CREDITS.md.

## Goal
A late medieval Iberian port seen from the water, in the spirit of classic merchant-town games: a quay, working buildings you can click, ships at the pier, calm sea, warm light. Readable first, detailed second.

## Camera and scale
- Default view: from the sea, slightly above the masts, looking at the quay. One unit is about one metre.
- Quay at z = -2, building row at z = -5.6, houses behind, tower far back.
- Ships never cover the building row from the default view.

## Palette (own choice)
Walls warm cream (#e7d9b9), roofs terracotta (#9b4a2b), timber brown (#6a4325), stone grey-beige (#cfc4a8), sea teal (#2f6f8f), sail linen (#f1e8cf), accents red (#b33a2a) and gold (#c9962a).

## Buildings (clickable, one panel each)
| Building | Opens | Look at level 1 | Level 2 | Level 3 |
| --- | --- | --- | --- | --- |
| Market | Market | one hall with four striped awnings | taller walls, six awnings, stalls on the quay | second storey, banner, lantern |
| Tavern | Tavern | house with hanging sign | extra wing | second storey, chimney, two signs |
| Shipyard | Shipyard | shed with slipway | longer slipway, crane | covered dock, hull on the slip, banner |
| Bank | Bank | small stone house, three columns | five columns | stone steps, gold roof ridge |

Level comes from the city size today (small, medium, large town) and from upgrades the player buys later. A building never shrinks: the level only goes up in a game.

## Details to add over time
- Quay: bollards every 3 m, barrels, crates, a hand crane, piles in the water.
- Ships: hull shape by type (cog, caravel, carrack), furled and open sails, flag in the company colours, gentle bobbing. Ships at sea are not in this view.
- Water: low-poly waves, slightly darker near the quay, small foam strip at the pier.
- Light: low sun by time of day, long soft shadows, warm hemisphere light, haze in the distance; night adds lit windows.
- Life: smoke from chimneys, gulls (few moving sprites), a cart on the quay. All off with reduced motion.

## Performance
Share geometries and materials, use instancing for houses and crates, keep draw calls under 150, target 60 fps at 1080p on integrated graphics. Procedural only, so no download beyond the vendored three.js (about 170 KB gzip).

## Accessibility
Every building has a name tooltip and can also be opened from the normal tabs. Reduced motion stops waves, bobbing and smoke. Colour is never the only signal.
