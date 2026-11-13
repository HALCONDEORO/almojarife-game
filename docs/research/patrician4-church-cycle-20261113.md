# P4 church cycle: devotion, charity, beggars and paid absolution

13 November 2026. Main checked: `480de7e` (through PR889).
Scope: public P4 documentation and accounts of the interactive church:
prayer, donations, the building upgrade chain, feeding the poor, the beggar
pool and indulgences. The base game and the Rise of a Dynasty expansion are
identified separately where a source distinguishes them; no expansion-specific
church change was found in the sections read.

## Finding

Almojarife's chapel is a civic building whose only documented effect is
shortening epidemics (`src/game/calamities.mjs:16`,
`src/game/plague.mjs:15,62`), and port reputation moves only with trade
(`src/game/reputation.mjs:4-5`). P4's church is instead an interactive town
screen with its own loop: devotion and charity raise reputation, feeding the
poor grows the city's beggar pool, that pool is where tavern sailors come
from, and the top of the building chain sells absolution for past misdeeds.
Our engine has the reputation ledger and the beggar-adjacent population
classes, but no church interaction, no charity lever and no beggar workforce
link. The absolution seam alone was already recorded in the sabotage research
(`docs/research/patrician4-sabotage-competitors-20261113.md`); this note
covers the rest of the loop and does not approve implementing any of it.

## Sources and method

Relevant sections of these public pages were fetched and read on the date
above; the publisher manual was downloaded in full and searched as text. No
binary, extracted data, utility chart, modding-internals reference, competitor
code, art, dialogue, numerical table or copied source wording was used. No
game experiment was performed. Described mechanics are not measured formulas,
and source figures are deliberately not imported.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Town buildings (Church): https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | The church offers prayer and gold donations that fund its expansion and raise reputation; the first upgrade tier unlocks feeding the poor, which increases both beggar numbers and reputation; the top tier sells indulgences that instantly clear negative reputation gained through misdeeds for a large payment. No figures for costs or reputation amounts. |
| S2 | Heraclitus, Steam guide, Church and Tavern screens: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Prayer is offered for the family or the business with no effect the author could confirm (anecdote, not adopted as a rule); donations are repeatable with a per-day cap and raise city reputation; meals for the poor donate sets of commodities and grow the city's beggar numbers; tavern sailors are hired from the city's beggars and released sailors return to that pool. Player experience, no figures adopted. |
| S3 | P4 Wiki, Chapel: https://patrician4.fandom.com/wiki/Chapel | A different religious building: a mayoral construction that raises burgher satisfaction in large cities, gated on the city's status and selected by the city council. Community documentation, stub article; cited only to keep the two religious buildings distinct, not as evidence about the interactive church. |

## What the sources support

- The church is a progression: donations fund its expansion, and each tier
  unlocks a new interaction, from prayer to feeding the poor to indulgences
  (S1).
- Charity has a gameplay payload beyond reputation: feeding the poor grows
  the beggar pool (S1), and beggars are the hiring pool for ship crews,
  with released sailors returning to it (S2). Charity therefore feeds the
  labour supply.
- Reputation from devotion is real but bounded: donations are repeatable
  with a daily limit (S2).
- Absolution is the top-tier product: indulgences clear reputation damage
  from misdeeds for a large payment (S1, S2), the same instrument recorded
  in the sabotage research.
- Whether prayer itself does anything is unverified: the one player account
  found reports no confirmable effect (S2).

## Comparison with current code

- The chapel exists only as epidemic mitigation and a wall-gated civic
  building (`src/game/calamities.mjs:16`, `src/game/plague.mjs:15,47,62`);
  no interactive church screen, prayer, donation or charity was found in
  the inspected source.
- Port reputation is a trade-only ledger that moves market fees and
  shipyard bills (`src/game/reputation.mjs:4-10`); no non-trade lever
  raises it today.
- Population classes exist as housing tiers (`src/game/buildings.mjs:27,493-495`),
  but no beggar pool, beggar growth or poor-relief mechanic was found;
  crew sizing is a per-ship-type table (`src/sim/armament.mjs:13-14`) with
  no link to any city labour pool.
- The absolution seam exists separately as the flag-gated pardon purchase
  (`src/game/pardon.mjs:1-6`), already compared with P4's indulgence in
  the sabotage note; this note adds that in P4 the indulgence sits at the
  top of a donated building chain (S1), not on a realm.
- A mayoral religious building with a satisfaction effect (S3) has no
  counterpart found in the inspected source; our chapel's effect is
  epidemic-only.

## Open questions

- What prayer does, if anything: no source read confirms an effect (S2's
  author found none).
- How donation size maps to reputation and to expansion progress, and what
  the daily cap is. No figures imported or verified.
- Which commodity sets count as meals for the poor and how beggar growth
  scales with them. Unverified in every source read.
- Whether beggars affect the city beyond crew supply: unrest, consumption,
  or reputation drift. Not covered by the sources read.
- How the donated church chain relates to the mayoral chapel of S3:
  whether both exist in the same game version and interact. The wiki stub
  does not say, and no primary source read settles it.
- Whether the expansion changes any church rule; none was found in the
  sections checked, and absence here is not proof of absence elsewhere.

## Design observation (own, not implementation)

If this gap were ever filled, the sources suggest a self-contained town
loop: a donation-funded building progression on the existing chapel, a
charity action that converts goods into a labour pool our crew hiring could
draw on, and a reputation lever beside the trade ledger, with absolution
kept at the top tier where the pardon seam already points. Any such work
would need its own design approval; this note records the research boundary
only.
