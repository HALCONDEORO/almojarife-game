# Regional rival houses, opt-in stage1

`newGame(...,{regionalRivals:true})` only. Missing/false/non-boolean option keeps
legacy state and decisions unchanged, including warmup. No UI or OFF notice.

One fictional named merchant house for each of the three existing gameplay
regions, origin/name/house/profile deterministically selected by seed. Names are
original fiction, not historical people/firms. Does not copy P3/P4 data or assets.
The opt-in mode replaces the three legacy traders, not adds to them; each starts
with the same2000cash and alternating cog/caravel as legacy. Seeded origin changes
warmup results legitimately. Does not enable the separate48-NPC allocation.

Profiles rank positive opportunities, never alter market quotes/costs:
- regional:15%score preference within its region;
- staples:12%score preference for grain/fish/salt/oil;
- diverse:unmodified legacy profit/day score.
Numbers are own gameplay assumptions. All execute the normal buy/sell rules.
Own chart and remembered market only, through botintel; paid report at most on a
weekly scheduled decision, no free remote prices or destination knowledge. No
naming or metrics are rendered for players by this patch. Save captures existing
house/profile/chart/intel/cash directly, no reroll when loaded.

## Remaining ON limitations, not a same-rules certification
This wires identity and private decisions, not a complete player-house economy.
Legacy NPCs still do not own construction, employment, housing or common player
weekly cost settlement. `aiStep` execution sail remains its existing sail path,
not player crew/captain/weather/port-policy coordinator. Building/finance/fee
seams exist separately; they are not implicitly enabled here. No activation or
balance acceptance until same-rules execution and whole-wealth accounting pass.
No bankruptcy respawn, free recapitalisation, sabotage or victory logic added.

Study reference: public mechanics comparison only, not a specification to clone:
https://download.kalypsomedia.com/manuals/p4_manual-en.pdf (competitors/regions).
Historical Iberian house names and trade privileges have not been inferred.
