# Ship art

Original vector art for the four ship classes, drawn in code as SVG. No external assets, no fonts, no scripts inside the SVG, fully deterministic output (the same input gives the same bytes). Licence: CC BY 4.0.

## Art direction

- Palette of the game: ink outlines `#2a1d10` / `#3a2a1a`, hull woods `#6b4a2a` / `#8a6a44`, accent red `#7a2a1c`, sail creams `#f4ead0` / `#f6ecd2`, rival greys `#55493a` / `#d8cfba`.
- Transparent background, so the ships sit on the painted webp city art and on the parchment sea map.
- Each class must stay recognisable at about 40-50 px: distinct silhouette, growing sail plan.

## The four rigs (Iberia, 1480-1600)

| Class | Length / height / masts (`HULL_SIDE`) | Rig and features |
| --- | --- | --- |
| barca | 28 / 8 / 1 | Small coastal boat, open hull, one mast with a lateen sail. Modest. |
| cog (coca) | 44 / 12 / 1 | Tubby merchantman, one square sail, high straight stem and stern posts, clinker planking, stern castle, crow's nest. |
| caravel (latina) | 54 / 12 / 2 | Sleek low hull, two masts with lateen sails, small aftcastle, bowsprit. |
| nao (carrack) | 66 / 16 / 3 | Large hull, fore and main masts square-rigged (main with a topsail), mizzen lateen, high ornate sterncastle with stern windows and a lantern, forecastle, bowsprit. |

## View semantics

- **Map (`src/view/ships.mjs`)**: top-down, under sail. Hull, deck centreline, inner rail, castle blocks, curved sails with yard and seam lines, mast tops and a tiny stern flag. Red hull and cream sails for the player, grey for rivals.
- **Port and cards (`src/view/shipside.mjs`)**: side view, bow to the right, sails furled (the ship is docked), with rigging, wales, planking, rudder, a small red ensign and castles per class. Used by the 2D city canvas (`web/city2d/assets/ships/*.svg`), the shipyard cards and the ship window (`shipIconSvg` in `src/view/yardscene.mjs`).

## State cues (same meaning on the map and in the port)

- Hull below 70: one plank patch filled `#6b5136`. Below 30: a second patch and a dark battered stern.
- Weapons: one dark gunport square per mounted piece, capped at the class maximum (two per piece on the map, one per rail). Worn pieces (gun condition below 50) are drawn half-size.

## Provenance

Original vector art, AI-assisted: written with Claude under Instinct orchestration, CC BY 4.0, like the rest of the original art (see `CREDITS.md`).

## Regeneration

The port art in `web/city2d/assets/ships/` is generated; do not edit it by hand:

```
node tools/render_ship_sides.mjs
```
