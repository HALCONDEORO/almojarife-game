# P3 sea attacks on towns: participants and neutral traffic

Research date: 13 November 2026. Almojarife main inspected: `7989210`.
Clean-room documentation only. No naval raid, patrol or closure system approved.
No competitor quantities, formulas, quotations, slogans or assets adopted.

## Narrow question and prior coverage

The town-siege note covers land attack, wall construction and guard combat.
The pirate-opening and pirate-mode notes concern the attacker. P4 port patrol
is a different game's service contract. Our existing political boycott/blockade
notes describe sanctions, not an active fight at the waterfront. This note asks
who participates in P3's sea attack and what happens to unrelated port traffic.

The manual treats being present in the port, being held by an attack, and being
a combatant as different states. Only the attackers, defensive towers and the
assigned defensive ships participate. Other ships cannot join, yet neutral ships
cannot depart while the fight is active. This is the useful narrow distinction,
not another proposal to build walls or add indiscriminate group combat.

Real grep covered `docs/research`, `docs/design`, `src`, `web` and `data` for
outrigger, sea/town attack, neutral ships, port raid, patrol and Spanish equivalents.
Pending PRs 930-938 were read/grepped: news, ownership focus, weapon loss, pirate
opening/mode, feast, route portability, statistics and random events. They do not
specify this participant/traffic contract. The municipal-deficit note is separate.

## Public evidence and limits

| Ref | Source read | Use and qualification |
| --- | --- | --- |
| S1 | P3 manual, section 13.5, printed pages 54-55: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Primary PDF pages extracted individually. Sea trade stops; only attackers, port towers and outriggers fight; neutral ships cannot depart; an attacking force defeated or fleeing ends the attack in the defenders' favor; defeat of towers and outriggers leads to treasury plunder; an outrigger owner who flees loses public esteem. Also documents a post-plunder protection period, without its duration being adopted. |
| S2 | Official Steam manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Same manual, not independent corroboration. Matching sea-attack sections read; no separate live observation implied. |
| S3 | FX Italian manual on Yumpu, section 9.4, printed pages 79-80: https://www.yumpu.com/it/document/view/48432083/manuale-di-gioco-fx-interactive/81 | Hosted localized documentation describes the same participant restriction, sea-trade interruption, treasury loss and outrigger flight consequence. Close documentary overlap, not an independent experiment or proof of identical editions. It adds a warning that the closure may lead to food shortage. |
| S4 | P3 wiki, Fortifications, Port Bombard and Port Cannon: https://patrician3.fandom.com/wiki/Fortifications | Community description of port defenses and possible outrigger support; no defenses can mean automatic looting. Its market-warehouse loot, morale, construction recipes and preferred tower counts are not adopted here. |
| S5 | P3 wiki, Piracy, Town Raids: https://patrician3.fandom.com/wiki/Piracy | Community account similarly distinguishes towers/outriggers from other ships and discusses undefended towns. Its rarity, loot quantities, cargo scope and fine/trade-ban claims are not used to reconstruct a complete settlement contract. Same wiki as S4, not independent reproduction. |
| S6 | GRYOnline naval-battle guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/bitwy-morskie/zf36ea | Editorial context for port battles and ships participating in a battle. Does not independently establish the town-wide neutral traffic lock, outrigger pay or closure lifetime. |

Six documents, not six independent observations. The participant and neutral
traffic finding rests chiefly on S1, with localized support from S3. No competitor
session or UI was inspected. A Steam long guide was also fetched, but the returned
text did not reach the relevant outrigger section; search excerpts are not used
as evidence. No excluded modding, binary-derived or utility-chart source used.

## What the documents do and do not settle

Sea-trade interruption is broader than a ship being selected for battle. The
neutral restriction is expressly about departure; the text does not supply a full
arrival/turn-back policy for ships already sailing toward the town. It also does
not specify whether warehouse-to-warehouse movement, local production or every
possible office transaction is disabled. Do not replace those unanswered channel
questions with one universal closed flag. [S1, S3]

The attack can end with defeat or flight of the attackers. The manual also ties
successful destruction of defenses to treasury plunder, and describes a protected
interval after plunder. These are different conditions: ending a failed raid is
not documented as granting the same protection as being successfully plundered.
Exact event ordering, repeat attacks and persistence remain questions. [S1]

The fleeing outrigger owner's reputation consequence belongs to accepting a civic
defense role. Presence alone does not establish that an unrelated merchant agreed
to fight, and a nearby convoy's escort strength is not automatic enrollment in
that service. This is a design distinction drawn from the participant restriction,
not a reconstructed P3 ownership/payment implementation. [S1]

## Current main: existing restrictions must remain distinct

| Inspected code | Actual behavior | Boundary |
| --- | --- | --- |
| `src/game/portmeasures.mjs`, `entryBan`, `blockadeOn`; `src/game/game.mjs`, `doSail`, `dockBlocker`, `doGoTo` | Boycott/blockade already prevent new destination courses; blockade also holds docked ships. | These are political records, not a town-attack session. Neither measure itself closes local market trade. Existing voyage arrival is not turned back by these destination checks. |
| `src/game/game.mjs`, trade wrappers; `src/game/shocks.mjs`, `portClosed` | A shock closure can refuse market trades. | Existing trade closure is real but does not establish hostile participants, an outrigger or a neutral combat role. |
| `src/game/embargo.mjs` | Short grain supply can refuse grain purchases under its gate. | Commodity refusal is not a blockade or sea attack. |
| `src/game/towers.mjs`, `towersKept`, `towersFireWatch` | Wall-mounted towers contribute paid fire-watch effects; counts and upkeep exist. | Bodies do not give them port artillery combat, target selection or a destructible battle role. Do not claim towers themselves are absent. |
| `src/game/battle.mjs`, `resolveBattle`, `applyBattle` | Resolves named ship opponents and settles their report. | No port-defense participant roster or town treasury plunder in these functions. |
| `src/game/privateering.mjs`, `targetsFor`, `attackTrader` | Attackable AI traders must meet sea-lane and legal/feature rules. | This is neither a peaceful port register nor a town-attack target selector. |
| `src/game/convoys.mjs`, `escortOf`; `src/game/encounterdaily.mjs`, `automaticEncounter` | Owned convoys grant same-leg escort support; encounters operate on eligible owned ships at sea. | No municipal defensive assignment or stationary port-defense event in these inspected paths. An anchored voyage does not roll this encounter cadence. |

The absence finding is limited to those paths and the stated search terms. It
does not deny existing closures, combat, defenses, councils or convoy support.
No runtime change is justified merely because their present effects differ.

## Own-design questions, not implementation instructions

- Does a town sea-defense event add enough play beyond existing pirate encounters
  and sanctions? If not, keep the current systems separate and unchanged.
- If selected, explicitly record participants, neutral ships and assigned service.
  Never enroll every owned ship in port or damage neutrals because they are held.
- Specify each affected channel: departure, new courses, incoming voyages, market
  trade and local transfers. Ending one attack must not clear an unrelated embargo,
  political blockade, repair hold or court hold.
- Keep attack outcome, service settlement and any post-plunder protection distinct.
  Reopening a report or save must not grant duplicate loot, pay or protection.
- Determine service consent, pay, recall and liability separately; this note does
  not establish their terms or authorize a forced civic commitment.

## Verification

Author baseline: `node --test test/portmeasures.test.mjs test/embargo.test.mjs
test/towers.test.mjs`: 27 passed, none failed. Existing restrictions and towers
only; no new naval event, participant model, P3 behavior or balancing validated.
No runtime/test edits, UI change, screenshots or competitor execution claimed.
