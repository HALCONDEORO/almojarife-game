# 3D feasibility (desktop target)

Status: study, no code in the game yet. Rule: the game targets desktop; mobile must not break but is not a design driver.

## Measured
- three.js r170 `build/three.module.min.js`: 691,648 bytes minified, 170,739 bytes gzip-9 (fetched from the jsDelivr copy of the npm package, 2026-10-19). GitHub Pages serves gzip, so the first load costs about 170 KB on the wire.
- Licence: MIT (LICENSE file of the same package). Compatible with the project (MIT code, CC BY 4.0 art).

## Options (all free)
| Option | Licence | Weight | Effort | Note |
| --- | --- | --- | --- | --- |
| three.js | MIT | ~170 KB gzip | low | largest community, plain ES modules, no bundler needed |
| Babylon.js | Apache-2.0 | heavier | medium | more built in, more weight than needed |
| raw WebGL / regl | MIT | minimal | high | full control, much more own code |

## Performance (desktop)
Draw calls, not triangles, are the usual limit. A port scene with instancing and a few materials is far inside the budget of any desktop GPU. Target 60 fps at 1080p on integrated graphics.

## Assets
Procedural models in code (hulls, masts, sails, houses, cranes, water plane with shader waves) keep licences clean and downloads tiny. Any external model needs a verified free licence and a CREDITS row.

## Coexistence with the 2D game
Map, menus and market stay 2D (SVG/HTML). A separate canvas shows a 3D port or shipyard scene, loaded on demand when the player enters a port, with the current 2D scene as fallback when WebGL is unavailable. No migration of game logic: the scene reads the existing game state.

## Effort and risk
- Prototype: one static page with vendored three.js, procedural port, orbit camera. Low risk, about one PR.
- Integration as the port view: medium; risks are art consistency with the 2D map and keeping the fallback working.
- Full 3D game: high effort, not recommended now.

## Recommendation
Do not rewrite the game in 3D. Build an optional 3D port/shipyard scene (desktop first) with vendored three.js, loaded on demand, 2D fallback kept. Decide after the prototype is seen by the owner.

## Decision (owner delegated the engine choice, 21:56)
Engine: three.js (MIT). Why: smallest effort for a desktop target, plain ES modules (the project has no bundler), 170 KB gzip first load, large documentation, clean licence. Babylon.js adds weight we do not need; raw WebGL adds own code we cannot afford.
Approach: optional 3D port scene on a separate canvas, procedural assets, loaded on demand, 2D scene as fallback. Game logic stays untouched. Steps: (1) vendored prototype under web/proto3d; (2) port scene reading real game state; (3) shipyard with ships on the slipway; (4) day/night and water. Each step is a small PR with tests where logic exists and a screenshot.
