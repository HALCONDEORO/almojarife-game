# P4 guild expeditions: privileged voyages to an undiscovered trade area

13 November 2026. Main checked: `480de7e` (through PR889).
Scope: public P4 documentation and accounts of guild expeditions to the
Mediterranean: what they unlock, how they are gated, and how discovery and
trade work there. The base game and the Rise of a Dynasty expansion are
identified separately where a source distinguishes them; no expansion-specific
expedition change was found in the sections read.

## Finding

Almojarife's world already includes its Mediterranean as an ordinary on-map
region (`src/game/shocks.mjs:32`), every good in the catalogue is produced
somewhere on that map (sugar appears among the harvest goods,
`src/game/shocks.mjs:19`; silk is a Valencia product,
`docs/design/era-goods-ports.md:16`), and discovery is distance-based chart
knowledge from the home port (`src/game/fog.mjs:11-15,42`). P4's expedition
is a different shape: a rank-and-privilege-gated voyage off the main map into
a separate, initially blank trade area whose ports must be found by
exploration, built around one import-only good that no Hanse city can
produce. Our engine has the seams for the gating (ranks, captain skills) but
no off-map trade area, no import-only good, and no expedition voyage. This
note does not approve a second map, a new good, or a privilege purchase.

## Sources and method

Relevant sections of these public pages were fetched and read on the date
above; the publisher manual was downloaded in full and searched as text. No
binary, extracted data, utility chart, modding-internals reference, competitor
code, art, dialogue, numerical table or copied source wording was used. No
game experiment was performed. Described mechanics are not measured formulas,
and source figures (skill ranks, condition thresholds, port caps) are
deliberately not imported.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Spices, Advanced Options (Expeditions) and captain skill sections: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Spices cannot be produced in the Hanse and otherwise arrive irregularly overland to a few cities; expeditions to buy them at the source require a mid-career trader rank and prior guild permission, start from a corner of the world map, must discover at least one Mediterranean port before trading, always return to the hometown, and produce a captain's report; the captain needs a minimum of navigation experience. Wine and cloth are also cheap there; metal goods, skins and pitch sell there. No figures for costs, voyage length or discovery odds. |
| S2 | Heraclitus, Steam guide, Guild and counting-house screens: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Guild privileges form a progression whose final entry is permission to mount expeditions, taken a single time; a dedicated expeditions screen lists the Mediterranean ports discovered in the current game with each city's size and what it buys and sells; the screen is not the launch point - a convoy must be sent to the expedition marker at the map's edge. Player experience, no figures adopted. |
| S3 | P4 Wiki, Expeditions: https://patrician4.fandom.com/wiki/Expeditions | Convoy requirements beyond the privilege: a captain with enough navigation rank, ships of at least a mid-size class, and a convoy in good condition; the expedition map starts blank and locations are found by choosing a target to explore, with distance driving voyage length; each location sells spices plus wine or cloth depending on region, and buys two of the three Hanse goods; a capped number of locations exists per game. Community documentation, not independent measurement. |
| S4 | P4 Wiki, Captain: https://patrician4.fandom.com/wiki/Captain | Captains have four skills with distinct effects, navigation among them, and a navigation rank gates leading an expedition; tavern trainers can raise one skill for payment, with the offered skill tied to the city. Community documentation; its own expeditions page states a different navigation threshold than this page, so no threshold is adopted. |

## What the sources support

- The economic purpose: spices are an import-only good, otherwise reaching
  the Hanse irregularly overland through a few cities, and expeditions let
  the player buy them at the source (S1, S2).
- The gate is layered: a career rank first (S1), then a guild privilege
  acquired once (S2), then convoy requirements on captain skill, ship class
  and condition (S3). The manual also ties expedition leadership to a
  minimum of captain navigation experience (S1, S4).
- Discovery is active exploration, not distance from home: the expedition
  area starts blank, the player picks targets to explore, and trade with a
  port requires having discovered it (S1, S3).
- The voyage is a distinct mode: launched from a marker at the map's edge,
  always returning to the hometown, with a written captain's report on the
  convoy (S1); discovered ports persist and are listed with their trade
  profile (S2, S3).
- Trade is asymmetric and regional: Mediterranean locations sell spices
  plus wine or cloth by region, and buy a subset of three Hanse goods (S1,
  S3).

## Comparison with current code

- No expedition or off-map voyage exists: a source-wide search finds no
  expedition mechanic; the Mediterranean is one of three on-map regions
  (`src/game/shocks.mjs:32`).
- No import-only good exists: the catalogue's goods are all producible on
  the map (sugar among harvest goods, `src/game/shocks.mjs:19`; silk at
  Valencia, `docs/design/era-goods-ports.md:16`). The production-chains
  study floated luxury goods with no producing building
  (`docs/design/production-chains-study.md:98`) as an adaptation idea, not
  an implemented mechanic.
- Discovery exists but is passive and distance-based: a starting chart
  around the home port plus a fixed discovery radius
  (`src/game/fog.mjs:11-15,42,53`), not exploration voyages into a blank
  area.
- Rank perks exist as a gating seam (`src/game/rankperks.mjs:1-6`) but no
  expedition privilege is among them, and no guild privilege purchase
  exists.
- Captain skills exist with navigation as a sailing-speed skill, levels
  bounded low (`src/game/captains.mjs:1-2,7`), with optional experience
  growth behind a flag (`src/game/captainxp.mjs:1-5`) - a natural seam for
  a skill gate like P4's (S1, S4), unused for that today.

## Open questions

- The exact navigation threshold for expedition leadership: the manual and
  one wiki page disagree with another wiki page, so no threshold is
  adopted (S1, S3, S4).
- What happens on a failed or unlucky exploration leg: whether a convoy can
  find nothing, be lost, or suffer events in the expedition area. Not
  covered by the sources read.
- How Mediterranean prices behave: whether they are static, per-location,
  or react to repeated visits. Unverified in every source read.
- Whether expeditions can be attacked or intercepted en route, and how the
  return-to-hometown rule interacts with blockades or measures at home.
- Whether the expansion changes any expedition rule; none was found in the
  sections checked, and absence here is not proof of absence elsewhere.

## Design observation (own, not implementation)

If this gap were ever filled, the sources suggest the shape without the
specifics: one import-only luxury good, a layered gate on existing rank and
captain-skill seams, and a small set of discoverable trade partners outside
the day-to-day map rather than a second simulated economy. Any such work
would need its own design approval; this note records the research boundary
only.
