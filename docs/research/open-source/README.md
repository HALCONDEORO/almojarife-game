# Open-source reuse study

Research cut: 20 October 2026. Preliminary, not a final engine decision.

## Recommendation at this cut

Keep the existing browser ESM and Three.js renderer while testing small reusable components. No third-party code or assets have been integrated by this document. Do not replace the entire economy, UI or engine merely because another game is thematically close.

The strongest inspected references are Portlight for cargo lots, provenance and economic tests; Taipan-rs for deterministic combat state; gen-city for street/plot generation. These are different integration jobs, not one interchangeable ranking. Their upstream license files were read at the commits in the source ledger. A root license does not by itself clear every dependency or third-party asset.

## Preliminary practical ranking

Effort below is an engineering estimate for one narrow, tested adaptation, not a delivery commitment or a whole-game port.

| Priority | Project | Verified root license | Concrete code inspected | Fit and proposed use | Estimated effort / gate |
|---|---|---|---|---|---|
| 1, economy research | Portlight | MIT, copyright 2026 mcp-tool-shop | `engine/economy.py`: scarcity pricing, spread, stock recovery, flood penalty and FIFO cargo lot consumption | Python, not browser JS. Port a small pure routine or test scenario, preserving cost/provenance; do not import its CLI or replace the existing market wholesale | 1-3 days for a bounded lot/accounting adaptation; audit module dependencies and invariants first |
| 1, city prototype | gen-city | MIT, copyright 2023 Nikita Galadiy | `src/building.ts`, `src/utils.ts`, generation/seed paths in `src/city.ts` | TypeScript geometry for 2D streets and building plots. Feed our own 3D models and historical port zoning. It is not a library of medieval 3D buildings | 1-2 days isolated adapter; seed, collision, scale and mobile budgets must be tested |
| 2, combat reference | taipan-rs | MIT, copyright 2026 turlockmike | `src/combat.rs`: Battle/Decision/Report, injected RNG, fight/run/jettison | Rust. Translate selected logic and tests to JS rather than adding a Rust/WASM game runtime. More complex than the current one-choice simulated encounter | 1-3 days narrow prototype; combat balance remains a separate job |
| Hold | Sea Trader | MIT text exists, but copyright is literal `[year] [fullname]` | `src/game/events/pirates.ts`, `src/game/rng.ts`, core organization | TypeScript ESM core is close to JS; full application adds Ink/React/XState. Fight/flee/bribe routines and injected RNG are useful references | Do not copy until attribution/provenance is clarified |
| Lower | mapgen2 | Apache-2.0; embedded dual-mesh also Apache-2.0 | README algorithm/dependency pipeline and license, not a full code audit | Polygon terrain, rivers, noisy edges. Not historical Iberian geography, city buildings, shipping lanes or fog of war | 2-4 days for an isolated terrain/coast prototype; dependencies and icons need separate clearance. README marks it unmaintained |
| Hold | Economia.js | MIT text exists, copyright author blank | `src/Economy.js` order matching | Old global/Class-style JS, unseeded Math.random. Upstream bazaarBot provenance must be followed. Observed matching loop does not check bid >= ask before averaging prices | No integration until attribution and the apparent matching defect are reproduced, fixed and tested |
| Lower | Great Lakes Trader | MIT, copyright 2020 alexander-daniel | `lib/utils.js`, architecture/package metadata | Random prices, seasonal helpers; old Next8/React16/Redux application is not a drop-in for current ESM. Little gain over existing simple helpers | Prefer mechanics/reference only; music has separate attribution without a verified reuse grant |
| Hold for module audit | OpenPatrician | Official wiki declares Apache-2.0 code; artwork CC BY-NC-SA 3.0 | Build metadata and running documentation, NOT economic/AI modules yet | Java/JavaFX/Spring/Maven desktop. A specific algorithm may be portable, not its whole UI | No integration recommendation until selected source modules and file provenance are inspected |
| Excluded | Emeraude/Patrician | No license grant found in inspected root/README/source-tree inventory | README, source organization | C++11/SDL prototype with partial CLI trading | Public source is not permission to copy; inspiration only |

## What has actually been checked

- Cloned eight repositories read-only and pinned their current heads.
- Read seven root license files and mapgen2's embedded dual-mesh license.
- Read concrete combat, RNG, order-matching, price/stock and plot code described above.
- Read OpenPatrician's official license and running pages and current Maven metadata. Its guide was published in 2019 and describes JavaFX11; the inspected current pom declares JavaFX25.0.1 and SpringBoot4.0.1. Do not treat the old guide as a successful current build.
- Inspected three official OpenPatrician 0.3 gallery images for visual comparison. They are not current execution captures. They are NOT included in this repository and are not cleared for game reuse.

No candidate test suite or game build has yet been executed as part of this research. No mobile performance or bundle-size benchmark has yet been measured. Code reading is not a balance or security certification.

## Licensing policy for an integration PR

1. Pin upstream repository, commit, exact source files, original author and license text.
2. Check per-file headers, copied snippets, dependency licenses and asset exceptions. Root badges alone are insufficient.
3. Preserve copyright/permission notices. For Apache code preserve applicable notices and mark modifications; keep original material under its own applicable terms rather than claiming it is solely our MIT work.
4. Add a provenance entry and license copy with the integration, including what changed and what tests guard it.
5. MIT/BSD/Apache/CC0 are candidates, not automatic permission to include any file. CC-BY assets need exact creator/source/version and attribution. GPL/AGPL/CC-BY-SA, noncommercial, unlicensed and incomplete-attribution material are not to be integrated under the present project policy.
6. No proprietary game assets, code, dialogue or copied maps. Mechanics and design references are distinct from source reuse.

## Still in progress

- OpenPatrician economic and merchant AI module audit, license boundaries and build feasibility.
- Three.js baseline versus Babylon.js, Godot Web and Bevy/WASM: exact licenses, dependency and export footprint, startup/load/memory budgets and real mobile constraints.
- Modular city/medieval-building generators, pedestrian/crowd simulation and freely licensed building/character assets.
- Navigation routes and persistent visibility: known versus currently observed cities, owned office/ship access, nearby foreign ships, rumors, radii by ship class and save compatibility. Do not reveal hidden data through tooltips, reports, trails or route previews.
- Minimal isolated prototype and measured comparison before choosing an engine migration.
- Final ranking after experiments, not before.

Source details: [sources.md](sources.md).
