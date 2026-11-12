# P4 ammunition as a damage-objective choice: clean-room note

Date: 12 November 2026. Repository checked: main
`31786ff412df63bd16b5a1955c007d13db2df14f`.
Scope: one combat mechanic, not a complete P3/P4 combat specification.

## Sources and method

Read public documentation and guide pages. No game executable, extracted data,
modding reference, utility chart, copied prose, assets or damage table was used.
No gameplay experiment was performed. These are paraphrased documented mechanics,
not a reconstruction of hidden formulas.

- **S1, primary:** Kalypso, Patrician IV English manual, Game Controls / Naval
  Battles. https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
  Retrieved 12 November 2026. Publication date not shown by the fetched page.
  Strong evidence for the documented ammunition selector, target systems and
  availability; not a patch-specific test of actual behavior.
- **S2, community:** Steam, Patrician IV guide, manual-combat discussion.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
  Retrieved 12 November 2026. Publication date not used.
  Corroborates the three target systems and describes secondary damage and
  performance consequences. Those additional claims have lower confidence than
  the manual; no exact secondary-damage ratio is established.
- **S3, community context:** Patrician 4 Wiki, Ship.
  https://patrician4.fandom.com/wiki/Ship
  Retrieved 12 November 2026. Publication date not shown.
  Context only: ships can carry guns and serve combat roles at a cargo-capacity
  cost. This page is not independent proof of ammunition or damage formulas.

## What P4 documents

P4 separates the decision of which ship to command from the decision of what
part of an opponent to damage. The manual describes selectable shot aimed at
rigging, crew or hull. It also says these shot types do not require an ammunition
resupply economy. The choice is therefore a tactical objective, not a purchase
of a consumable cargo item. A player can inspect and change other escort ships'
munition and tactical settings rather than assume every escort follows one
shared setting. [S1]

The community guide describes corresponding hull, crew and sail indicators.
It reports that the selected shot favors one system but can also damage the
others. It connects crew losses with slower gun reloading and sail losses with
slower movement; hull damage can also slow a vessel and ultimately sink it. [S2]
These effects explain why a disable-or-preserve objective can differ from an
objective to destroy a ship. They do not establish a universal best shot type.

This note deliberately does **not** infer:
- exact accuracy, damage coefficients, range or reload times;
- that the community guide's secondary damage is official or identical in every
  edition;
- that P3 has the same ammunition selector;
- any historical suitability for Almojarife's late-fifteenth-century setting;
- that changing shot alone guarantees boarding, capture or escape.

## Delta against the actual Almojarife code

The current research notes describe P3 weapon range and boarding, but do not
record P4's ammunition-objective selector and its separate target systems.
`docs/design/piracy-study.md` already mentions disabling a target with chain shot
in **Port Royale 2**, and discusses hull/sail/crew damage in **Sid Meier's Pirates!**.
Those are prior related ideas, not P4 evidence. This note adds the P4 primary
source, separates documented facts from guide claims, and checks the live engine
instead of treating those older design sections as current state.

At the checked main revision:

| File | Actual behavior relevant to this gap |
| --- | --- |
| `src/game/battle.mjs` | `resolveBattle` tracks hull and crew through a seeded gun-round calculation. Crew loss is derived from hull damage. It has a finishing policy (`capture`, `plunder`, `sink`), not a shot objective or independent sail damage. |
| `src/sim/armament.mjs` | Weapon types have price, power, upkeep and hold weight; there is no ammunition-selector or ammunition inventory in this model. |
| `src/game/piratefight.mjs` | Adapts a seeded battle into the encounter outcome, not a manual aiming or shot-selection interface. |
| `src/game/encounterdaily.mjs` | `resolvePirates` calls `fightPirates` when `g.pirateFight === true`; otherwise it uses the earlier encounter outcome. The old comment in `battle.mjs` saying it is not wired is not evidence that this path is absent. |
| `src/game/encounters.mjs` | Applies hull loss, proportional cargo loss and voyage delay. It has no persistent rigging-damage channel or selected munition. |

The missing mechanic is thus **damage-objective selection with distinct system
consequences**, not combat itself, boarding strength, weapons, capture policy,
or convoy support. All of those already have code and must not be reimplemented
under a stale parity label.

## Concrete proposal for Almojarife, not an approved implementation

Ranked recommendation:

1. First make a small experimental battle policy for a desired effect such as
   damaging the hull, reducing enemy fighting crew, or disabling movement. Keep
   the current battle result byte-for-byte compatible when no policy is selected.
   This is an experiment behind an off-by-default flag, not a balance migration.
2. Only if it creates a useful decision, give independent damage channels their
   own report fields and consequences. Define temporary combat mobility separately
   from persistent voyage damage; do not silently change travel speed or repair
   bills on existing saves. Reuse the existing one-time report-application rule.
3. Expose the choice in the encounter UI only after the shared resolver works
   equally for bots and players and the outcome report explains the trade-off.
   Prefer an objective selector over adding a manual naval battle screen now.

The initial experiment should not introduce ammunition buying, loading, weight,
stock consumption or autonomous spending. P4's documented selector does not need
that economy, and Almojarife has no source-grounded design decision for one.
Historical naming and any persistent rigging repairs need separate research and
approval before they become period claims or new costs.

### Proposed acceptance tests before implementation is considered complete

- Omitted policy preserves the existing seeded reports and cargo-conservation
  behavior, including capture/plunder/sink finishes.
- Equal inputs and rolls produce equal reports for bots and players.
- On paired fixtures, each declared objective shifts its intended damage channel;
  reducing crew is not simply a renamed hull-damage multiplier.
- Applying a report twice still rejects the second application. No additional
  gun wear, lost crew, cargo transfer or damage can occur on replay.
- Disabling movement is explicitly temporary or persistent. If persistent, a
  save/load test and a supported repair path are required before enabling it.
- UI copy states the objective, not a guaranteed capture or guaranteed escape.

No test or implementation is included in this docs-only patch. Exact numbers,
pirate AI policies, campaign balance and save migration remain open decisions.
