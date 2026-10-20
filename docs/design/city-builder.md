# City construction engine: design (piece 0)

Status: design proposal (owner request 20 Oct 2026, after the city streets prototype #108).
Own design. Desktop only. Depends on the tick time model (#111) for build times.

## 1. What the owner asked

The player places and upgrades workshops, houses, warehouses and more on city parcels.
Costs, construction times, upkeep and a simulated, tested economic effect. Each building
type gets its own model. Small PRs per piece.

## 2. Base that already exists

- Parcels: `src/view3d/cityplots.mjs` turns port data into seeded, deterministic streets
  and plots (vendored gen-city, MIT). Every plot already carries a suggested type
  (warehouse/workshop/house from position and services).
- Materials: `src/sim/recipes.mjs` has construction recipes (warehouse, office, ship
  classes) and one production transform (`weave`: 4 wool -> 2 cloth), with
  `quoteRecipe`/`consumeRecipe` buying inputs straight from the local market stock.
  Marked "not enabled yet" - this design enables them.
- Money and time: weekly ledger accrual (#107 fixes), tick time model proposal (#111).

## 3. Model

- `g.buildings[cityId][plotId] = { type, level, state: "construction"|"active",
  readyTick, paidCost }`. One building per plot. Plots are bought first
  (`plotPrice = f(city pop, district, area)`).
- Types for the first slice (each with its own code-drawn 3D model, same approach as
  the prototype houses, no external assets):
  - house: raises the city's effective population a little -> more demand (ticks the
    existing class demand, nothing new).
  - workshop (weaver, the Alpha chain): each active day it runs `weave` batches with
    `consumeRecipe` on the local market: wool stock down, cloth stock up, cost against
    the building's cash share of the house. Production slows when inputs are dear,
    stops without stock or cash - the market decides, no magic numbers.
  - warehouse extension: +300 storage cap per level at that port (base 300).
- Construction: pay materials + coins, `readyTick = now + buildTicks(type, level)`.
  A scaffold model shows while `state === "construction"`. Upgrades 1-3 per type with
  rising cost and effect.
- Upkeep: per building per day, accrued into the weekly ledger like ship upkeep, with
  its own report line.
- Determinism: plots are seeded; all effects run inside the port's (staggered) market
  tick; every roll keys on absolute tick. Save format gains `buildings`; SAVE_VERSION
  covers it (pre-launch saves are not kept).

## 4. UI (desktop)

City 3D view gains a build mode: click an owned-free plot, choose type, see materials
cost (live quote from the local market), build time and upkeep; construction and
upgrade are buttons with confirm, same pattern as the shipyard. The city window gains
a "Buildings" tab listing owned buildings with state, level, output and upkeep.

## 5. OSS placement/grid check (licence rule applied)

- victorqribeiro/isocity (MIT, 2024): 2D tile-grid isometric canvas city builder.
  Wrong renderer and wrong geometry (square tiles vs gen-city polygon parcels).
- ajacksified/quorra (MIT, 2013): one-author hex/tetra grid experiment, unmaintained.
- Annoraaq/grid-engine, axaq/traviso.js, beakable/isometric: tile engines for
  Phaser/pixi/canvas; wrong renderer (we render Three.js) and tile-based.
- Conclusion: no third-party placement code. Parcels come from vendored gen-city
  (MIT, already credited); placement, buildings, economy and models are own work.
  Nothing new is vendored, so no CREDITS change in this slice.

## 6. PR slicing and tests

1. docs (this file).
2. sim: plots ownership + purchase + construction timing on ticks, upkeep accrual.
   Tests: pricing, timing, upkeep lines, save round-trip.
3. workshop effect: weave batches inside the market tick + economy invariants run.
   Tests: stock conservation, no production without inputs/cash, determinism.
4. 3D models per type + construction scaffold + build mode UI (screenshot per PR).
5. houses/pop effect and warehouse extension, each with tests.

Each piece keeps the full suite green and the economy-invariants suite is the gate for
anything that touches stock, cash or demand.
