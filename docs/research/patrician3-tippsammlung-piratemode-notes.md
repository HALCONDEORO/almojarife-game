# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), the FAQ on pirates and piracy charges, 10.3.1 to 10.3.3

13 November 2026. Main inspected: `7989210`. Clean-room research only: ideas in our own words, no copied text, tables or figures, no excluded modding material, no executable inspection. No implementation approved.

Reading scope: 10.3.1 (how to beat a pirate), 10.3.2 (how to become a pirate) and 10.3.3 (how to avoid piracy charges), printed pages 192-193 of the Tippsammlung (10.3 and the start of 10.3.1 on p. 192; the rest of 10.3.1, 10.3.2 and 10.3.3 on p. 193; checked by extracting pages 190-194 of the PDF one by one). Related notes: the piracy note (4.3, covers the captain requirement and entering port flagged as a pirate), the sea-battle note (4.4) and the pirate opening note (9.4, pending). This note adds only what those do not study: how the pirate state is switched, and how the source describes detection. 10.1.3 and 10.2 of the same chapter are summaries of chapters already covered and are not repeated. All ratios and tactics numbers in the source are left out.

Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf. It documents Patrizier II (a community print version). Equivalence with Patrician III is not claimed.

## What the section teaches

1. Beating a pirate. Sinking one is called easy but rarely worth it; boarding one and adding it to the fleet is better because ships are the capital of a sea trader. The two aims call for different tactics: sinking uses heavy armament and keeps the ship from being boarded; boarding wants a full crew, a surplus of boarding weapons, a captain strong in fighting, and an approach from behind into the enemy's flank with enough speed to dodge the broadside, which is risky in weak wind. Players disagree on the best method, and the source says so.
2. Becoming a pirate is a mode of the ship, not a purchase. It needs a captain aboard and a button in the crew menu. The switch only works when the ship is far from towns and no foreign ship is near, so nobody can report it. In pirate mode the ship can attack ordinary traders and pirates, cannot enter towns to trade, and a click on a town on the sea map sends it to attack that town. The same button, relabelled civil, switches back under the same anonymity rule.
3. Piracy charges cannot be prevented. Every piratical act carries some chance of a charge. How that chance is computed was not settled in the community. What the source states as established: the chance does not depend on how many foreign ships are near. The only reliable remedy it gives is saving and reloading around the act, which is a save-scumming workaround, not a mechanic.

## Mapping to Almojarife (verified by reading the cited lines)

- No pirate mode in the sense of the source. A grep of `src` and `web` (.mjs) for pirate mode, modo pirata, isPirate, pirateMode, bandera and civil found nothing. In what was searched, the player does not switch a ship between civil and pirate states; the choice is made per attack.
- The attack is offered at sea for traders on the same route (`src/view/privateeringview.mjs:18-19`) with each target marked as having a valid letter or not, and the click asks for confirmation, warning that the ship can be lost and charges may follow without a letter (`web/main.mjs:1095`). The UI always asks for unlicensed targets as well (`{unlicensed:true}` in both places). `targetsFor` (`src/game/privateering.mjs:21-28`) lists them only when the marque flag is on and, for unlicensed ones, the justice flag is on.
- Detection is not a chance. In `attackTrader` (`privateering.mjs:34-58`) the seeded rolls are used for the battle; the piracy charge is raised whenever the target was unlicensed and there is loot (`privateering.mjs:57`, `chargePiracy` at `src/game/justicewire.mjs:21-27`, which also costs standing in the victim's home port). In the lines I read there is no witness check and no probability. So in the code I read, the charge is certain once loot is taken from an unlicensed target; the source's open question (how a chance is computed) does not arise there. I did not check other callers of `chargePiracy`, nor whether reloading a save changes the seeded battle outcome.
- Boarding versus sinking: the trader attack in our code finishes as plunder (`privateering.mjs:45`); a captured hull comes only from the pirate encounter prize (`src/game/piratefight.mjs:38`). I did not examine the manual-battle tactics the source describes (flank approach, broadsides); the sea-battle note covers the source's tactics at chapter 4.4.
- No rule keeps a pirate-state ship out of ports; no pirate state exists to keep out. The source's "cannot trade in towns while pirate" has no counterpart in what I read.

## Proposals (docs only, owner decides)

1. Record as a design decision that our model is per-attack and deterministic. If a per-ship raider state is ever wanted, the source gives the shape: it needs a captain, it is switched only out of sight of towns and ships, it bars trading in ports while on, and the reverse switch has the same condition. This would need its own flag and tests (flag off: byte-identical).
2. Ask whether charges should stay certain once loot is taken, or whether an owner-chosen chance (the source's design) is wanted. The source gives no formula; any chance is an owner decision, not something to infer.
3. Boarding ships for the fleet instead of plunder is already raised in earlier notes; no new item.

## Open questions

- Whether Patrician III kept the mode switch and its anonymity condition from Patrizier II.
- How the charge chance was actually computed in the source game; not known from this source.
- Whether other code calls `chargePiracy` outside `attackTrader` (not checked).
