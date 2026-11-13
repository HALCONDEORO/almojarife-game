# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), the pirate opening, 9.4

13 November 2026. Main inspected: `7989210`. Clean-room research only: ideas in our own words, no copied text, tables or figures, no excluded modding material, no executable inspection. No implementation approved.

Reading scope: 9.4, 9.4.1 and 9.4.2, printed pages 186-188 of the Tippsammlung (the 9.4 intro on p. 186, 9.4.1 on pp. 187-188, 9.4.2 on p. 188; checked by extracting pages 185-189 of the PDF one by one; p. 189 opens chapter 10). The peaceful-trader guide 9.3 is not read here. Earlier notes that touch this: the options note (assesses 9.3-9.4 in a line as sequencing guides) and the piracy note (4.3, including player piracy and its legal cost). This note studies only the opening sequence. All amounts, fleet sizes and targets in the source are left out.

Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf. It documents Patrizier II (a community print version). Equivalence with Patrician III is not claimed.

## What the section teaches

1. The pirate start is presented as a faster way to raise starting capital, not as a lasting style: town raids supply early capital, which speeds expansion, but the idea that this advantage is unlimited is called a mistake. Piracy is a tool to give the company a base; an oversized captured fleet with no office founded is the named failure.
2. The pirate flag needs a captain aboard the starting ship, so a good captain is the first step. The captain's sailing skill matters for catching targets and fighting skill for keeping crew losses down in boarding. Cutlasses help but are scarce early.
3. Targets: the AI sails minimally crewed small ships and larger cogs. Larger, crewed and armed ships cannot be boarded by a single small ship; the source suggests several ships wearing the crew down in turn. Taking only unprotected small ships is faster but taking a few larger ships is worth it.
4. Growth order: first raise the raiding fleet to a handful of ships, because captured ships feed fleet growth and each needs a captain; then have the home shipyard upgrade some captured small ships fully so they can later carry weapons for town raids.
5. Then the surplus ships go to ordinary manual trade on a circuit, picking high-margin goods. The source recommends looking for especially profitable opportunities specific to the map in use. Chapter 3 advice applies unchanged.
6. Town raids come next: an armed upgraded ship attacks a town, removes the harbour tower and loots the town's treasury, with support using an escort tactic. Dedicated armed ships hunt true pirates; their ships are easier to board than the AI traders' and become the base of a later supply network.
7. An office administrator at home plus regular exchange between office and manual trade ships is advised. The source estimates the raid income as large next to the normal starting purse, which is why expansion is easier.
8. Afterwards the pirate and the peaceful trader face the same problems; the division only matters for the first months, and the pirate simply has more money for offices and works.

## Mapping to Almojarife (verified by reading the cited lines)

- What we have for the player as raider: a sea encounter with pirates fought by the shared battle resolver where a win that leaves the pirate afloat can produce a prize ship (`src/game/piratefight.mjs:33-38`, prize handed on in `src/game/encounterdaily.mjs:78`); and, behind the `marque` flag, an attack on an AI trader (`src/game/privateering.mjs:34-58`) in two kinds: a target of a realm covered by a usable letter, or, only when the caller asks for unlicensed targets and the `justice` flag is on, an unlicensed target (`targetsFor`, lines 21-28; the unlicensed record is read at line 57). It is fought as plunder, and a licensed attack pays the quinto (one fifth) to the issuer while an unlicensed one pays none (line 49). A piracy charge (`chargePiracy`) is raised only in the unlicensed branch and only when there is loot (`privateering.mjs:57`), not on every attack without a letter. Prize goods can be locked until a court settles them (`privateering.mjs:66-68`). A captured prize ship resells at a reduced rate (`src/game/game.mjs:606-607`).
- Differences, in the code I read: the trader attack finishes as plunder, not capture, so it adds no hull to the fleet; the prize-ship path comes only from the pirate encounter. I found no town raid (no attack on a port's tower or treasury) in what I grepped: `src/game/*.mjs` for plunder, saque, sack, pillage, ransack returns only the battle resolver and the privateering and piratefight modules. Not a claim about the whole repo.
- A captain gate exists for captain actions (`src/game/captains.mjs:45`, "no captain"); I did not verify a captain gate for starting an attack, so the source's first step has no confirmed counterpart.
- The source's strategic warning (the early advantage is not unlimited, and after the opening both styles face the same problems) has no explicit counterpart in the code I read; there the legal cost (letter, quinto, charge) is the visible brake. I did not examine other limiting dynamics outside these files.

## Proposals (docs only, owner decides)

1. If a "start as raider" option is ever wanted, use the source's warning as the acceptance frame: the raider advantage should be an early lever and the long game should converge with the trader's. Whether the advantage should decline over time, and through what cause, is an open design question; the source gives no cause. Flag only; no mechanic is proposed.
2. Decide whether a captured trader should be able to join the fleet (the source's growth engine) or whether plunder only is the intended limit; the piracy note already flags the plunder-versus-capture question.
3. A test frame for any future raider opening: a flag-off game byte-identical; no income without an owner decision on each lever.

## Open questions

- Whether Patrician III kept the Patrizier II raid sequence and the treasury-raid income level.
- Whether starting an attack requires a captain in our code (not verified).
- Whether 9.3 (the peaceful opening) shares enough structure with 9.4 to be written as one comparison; not read here.
