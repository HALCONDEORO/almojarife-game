# P3 town defense and land siege: the defender's loop the engine does not have

13 November 2026. Main inspected: `8290a85`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

P3 documents a complete town-defense system. The lord mayor, with council
approval and town-coffer funding, commissions fortifications: gate and port
bombards upgradable to cannons, a town wall that bounds where houses and
public buildings may stand, and gate pitch shoots that only work while the
town stocks pitch.
Town guards of several unit types police in peace and fight in a siege. A
land siege - by marauding mercenaries or a dissatisfied prince - cuts the
town off from overland supply, closes the gates, and leaves the mayor three
answers: counter-attack, surrender, or buy freedom at a price the besieger
does not reveal. Supplying a besieged town by sea earns traders reputation,
and survival lifts the town's spirits.

Almojarife has the works half of this and none of the battle half: council
walls and wall-mounted watchtowers exist, and the tower module states plainly
that pirate and siege interactions are deliberately not built. No troops, no
besieger and no player wartime decision exist; the town hall names a mayor
and concejo for civic presence only.

The piracy note studies the attacker side at sea; the politics notes cover
rank privileges and the council in peace; the faq note touches weapon
effectiveness against towers. None studies the defender's loop. The P4 port
patrol and territorial notes are a different game. This note does not approve
any combat system.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Town Fortifications and Attacks on Town (Land siege), printed pages 43 and 53-54: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: defenses are a lord-mayor commission with council approval paid from town coffers; bombards upgrade to cannons; the wall bounds where town houses and public buildings may stand, while businesses may stand outside it, and old defenses serve until the new wall is finished; pitch shoots need pitch in town. In a siege the town is cut off from land supply, gates close, outside businesses fall to the besiegers, traders are told the attacker and the reason, and the mayor may counter-attack, surrender, or offer money up to the coffers' contents - the expected amount is hidden, a merely low offer earns a second chance, a derisory one ends contact. Sea supply during a siege raises trader reputation; a taken town is looted and its traders asked for rebuilding tax; a surviving town's spirits rise. No odds, prices or army sizes given. |
| S2 | P3 wiki, Siege: https://patrician3.fandom.com/wiki/Siege | Community page. Adds that princely attacks can be postponed but not avoided and that a loan request can signal one; mercenary attacks arrive with advance warning; defense must be prepared before the siege because training during one barely keeps up; gate guns mainly draw siege-engine fire, with the cannon upgrade absorbing more; the pitch shoot also serves against wall climbers and the ram; guard morale - drink availability and enough ranged units - is presented as decisive. Durations and percentages on the page are not adopted. Community claims, no live reproduction. |
| S3 | P3 wiki, Town Guards: https://patrician3.fandom.com/wiki/Town_Guards | Community page. Guards defend in siege and patrol in peace, where patrols are said to lower burglary and fire risk; higher ranks can petition the council to expand the military, with threat and bribery influencing the vote; unit types split into melee watch and ranged wall crews. Numbers on the page are not adopted. Community claims, no live reproduction. |

S2 and S3 overlap each other and the manual; where they add detail beyond S1
(morale factors, petition politics, patrol side-effects) it is single-source
community testimony and stays labeled as such. No source read gives battle
odds, attack frequency, attacker strength scaling or the buy-freedom price
formula beyond the manual's qualitative description.

## Documented behavior, not inferred universal rules

The documented core is a prepared-defense loop: fortify and garrison in
peace, because once the camp is pitched the town mostly reacts. The political
layer is documented too - defense is a mayor-and-council competence paid by
the town, and supplying a cut-off town is a reputation opportunity for
traders. What none of the sources settles: how attacker strength is chosen,
how often sieges come, what exactly morale changes, how the buy-freedom
demand is computed, whether the player's own businesses outside walls are
treated like others, and whether any of this differs in Rise of the Hanse
beyond added unit types. Those remain open questions, not formulas to copy.

## Main inspection

Real grep across `src`, `data` and `web/main.mjs` for siege, assault,
garrison, trebuchet, battering, troops and militia terms found no siege or
troop mechanic; the hits are a tower-module comment saying siege interactions
are deliberately not built (`src/game/towers.mjs:10`) and dated historical
references in `data/realms.json` and `data/hermandad.json`, which are world
flavor data, not mechanics.

- `src/game/walls.mjs:1-8`: town walls already follow the documented funding
  model - the concejo votes them and pays works and watch from the town
  chest, the player at most petitions - and the old wall keeps serving until
  an upgrade completes, the same supersede rule the manual describes. What
  the walls do not do is fight.
- `src/game/towers.mjs:1-15`: wall-mounted watchtowers exist with a fire
  watch effect (own design); pirate and siege interactions are explicitly not
  built, with the pirate lane parked in the parity-gap document.
- A nominal mayor and concejo exist for civic presence
  (`src/game/townhall.mjs:15-20`, `townCouncil` returns one alcalde plus
  regidores), but no player wartime decision and no fighting garrison exist:
  rank is a wealth ladder (`src/game/rank.mjs:5-7`), and the civic channel is
  the petition, not a command.
- Urban event modules (`src/game/calamities.mjs:1-7`, `src/game/plague.mjs:1-6`,
  `src/game/festivals.mjs:1-7`) model per-city hardship and celebration
  without any attacker, and sea encounters (`src/game/events.mjs:1-6`) are
  per ship; no town-targeted attack or siege event family exists in the
  inspected modules.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, keep the first slice far from a battle simulation: a named
siege warning on one town, a supply window in which selling into the besieged
port earns extra reputation through the existing channels, and a resolution
rolled from town defenses already built - walls, towers and concejo spending
- with no troop layer and no player battle commands. Flag-off must mean no
warnings, no resolutions and byte-identical saves. Any mayor wartime option,
any troop type and any looting is a separate later decision.

Future tests should prove: flag-off games untouched; warning and resolution
deterministic by seed and day; the supply reputation uses existing reputation
functions only; a resolved siege cannot resolve twice across save/load; and
walls, towers, calamities and festivals behave exactly as today whether the
system is on or off. Decide first, as explicit owner calls: whether any
hostile town event fits the game's direction at all, who may attack in our
realm data, what a siege costs a town, and whether the player is ever the
defending authority or always a bystanding trader. The sources document P3's
answers; they do not choose ours.
