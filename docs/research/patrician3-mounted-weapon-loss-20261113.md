# P3 mounted weapon loss versus repairable armament condition

Research date: 13 November 2026. Almojarife main inspected: `7989210`.
Clean-room documentation only. No combat, economy or armory change approved.
No competitor numbers, source formulas, quotations, slogans or assets adopted.

## Narrow delta and prior coverage

Existing P3 mechanics, seabattle and FAQ notes already cover arming, weapons'
range roles, hull upgrades, crew equipment and combat. The P4 ammunition note
covers a different resource. `docs/design/armory.md` and our code already give
mounted weapons weight, purchase costs, upkeep and condition. Nothing here
claims that weapons, wear or repairs are absent.

The narrower P3 distinction is between a damaged hull, reduced effectiveness
of surviving weapons, and destroyed mounted pieces leaving empty positions.
These are different post-battle recovery needs. A hull repair, condition repair
and purchase of another piece must not be treated as interchangeable without
an explicit design decision.

A real grep of `docs/research` and `docs/design` for weapon damage/destruction,
`repairGuns`, gun repair and Spanish equivalents found the adjacent studies,
not a focused loss/replenishment comparison. Open PRs at research start were
Electron maintenance, escorted-prize work and modal-focus tests, not this topic.

## Sources read and evidence boundaries

| Ref | Public source | Use and limit |
| --- | --- | --- |
| S1 | P3 manual, printed pages 28, 29, 34, 50 and 51: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Primary PDF, relevant pages extracted separately. Weapon destruction during battle leaves empty deck positions. The battle view distinguishes weapon status from hull condition. Hull upgrades add positions but weapons must be bought separately. Purchases pass through the office and crane transfer interface. No destruction probability or repair-versus-replacement algorithm established. |
| S2 | Official Steam manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Same manual, not independent corroboration. Read the weapon-damage and arming sections; no second experiment implied. |
| S3 | GRYOnline naval-battle guide, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/bitwy-morskie/zf36ea | Published guide separately describes weapons being destroyed and deck positions becoming empty. Supports the qualitative distinction, not our loss rate, repair cost or implementation. |
| S4 | P3 wiki, Weapon Smith: https://patrician3.fandom.com/wiki/Weapon_Smith | Community page supports the office purchase/transfer channel and says availability depends on local production and progression. Only qualitative procurement context used; numerical charts, range claims and crew-damage assertions are outside this note. |
| S5 | Steam discussion, Started a single player game, August 2016: https://steamcommunity.com/app/33570/discussions/0/361798516942789215/ | Player reports repaired/upgraded ships with no cannons available, and replies discuss local office and smith stock. Anecdotal support for distinguishing an available mounting position from available equipment. Replies disagree or speculate about supply prerequisites; no exact prerequisite or optimal weapon advice adopted. |

Two additional pages were screened but are not evidence for this note: the
Patrizierforum weaponry thread explicitly attributes a formula to proprietary
source code, so the entire thread was excluded, including observations mixed
with that discussion. The Naval Combat wiki repeats an attributed tactic from
that participant and adds no needed evidence for destruction, so it was also
left out. Neither source's formulas, figures or tactics inform this comparison.
This leaves primary documentation, editorial explanation and community
procurement context; the duplicate manual is not independent evidence.

## Documented mechanics, not a reconstructed damage system

The manual and editorial guide distinguish weapon loss from hull damage:
mounted pieces can disappear while the ship still survives. The manual's
separate arming workflow makes an empty position different from owning a
replacement. It does not prove that a damaged surviving piece can never be
repaired, that every lost piece must be replaced manually, or that automatic
and manual battles use identical loss rules. Those remain questions. [S1-S3]

The wiki and player discussion suggest that procurement has local constraints.
They do not establish a universal replacement deadline, guaranteed stock or an
entitlement to restore a ship's previous loadout. No stock generation recipe,
upgrade threshold or source weapon table is imported. [S4-S5]

## Actual current-main behavior

| Inspected code | Existing behavior | Difference and boundary |
| --- | --- | --- |
| `src/sim/armament.mjs`, `weaponsOf`, `weaponCount`, `gunCond` | Typed mounted counts plus legacy cannon compatibility; aggregate armament condition. | No per-piece damage state or physical side/position model in these readers. Empty capacity and poor condition are already different readings. |
| `src/game/crew.mjs`, `wearGunsBy`, `defenceOf`, `repairGuns` | Wear lowers aggregate condition and therefore defense; repair at the ship's port pays cash and restores condition. Wear does not reduce mounted counts. | Repair restores effectiveness of the existing counts, not a recorded destroyed-piece inventory. Sailing wear also exists independently of battle. |
| `src/sim/armory.mjs`, `buyWeapon`; `mountWeapon` | Purchase validates type, mounting capacity, funds, port and cargo-space consequences; mounts a piece and blends its new condition into the aggregate. | This is direct purchase/mounting, not P3's separate office stock and transfer workflow. No local finite weapon stock is read in this purchase path. |
| `src/game/battle.mjs`, `resolveBattle`, `applyBattle` | Pure resolution reports hull/crew/cargo results. Applying a report changes hull/crew, wears guns and settles loot/destruction once. | Gun wear in application is aggregate. The inspected application does not decrement mounted weapon counts for individual losses. Goods marked destroyed are not a destroyed-weapons ledger. |
| `src/game/privateering.mjs`, attack path | Calls `applyBattle` on the actual combatants. | This path receives the aggregate wear applied there. It must not be confused with every other encounter path. |
| `src/game/piratefight.mjs`, `fightPirates`; `src/game/encounterdaily.mjs`, `resolvePirates`; `src/game/encounters.mjs`, `applyEncounter` | Pirate combat calculates a pure report and translates it to hull loss, cargo loss and delay. The encounter applies that translated outcome to the real ship. | This path does not apply the full battle report to the player. The unused `applyBattle` import is not execution: no battle gun-condition or crew change is propagated through that translated outcome. Daily sea wear remains separate. |

This route distinction comes from function bodies, not the stale battle header
that says it is not wired into the game. A grep of callers confirms both the
privateering application and the narrower pirate translation.

## Own-design questions, not implementation instructions

- Is loss of mounted pieces worth adding beyond the existing aggregate condition
  and maintenance loop? Keeping the current abstraction is a valid choice.
- If selected, define surviving damage versus destruction, then choose recovery
  rules. A condition repair must not recreate an absent piece without an explicit
  purchase or replacement policy.
- Reconcile cargo space, upkeep and firepower when counts fall. A freed weapon
  position must not create goods, a refund or another item by accident.
- Decide whether the pirate translation intentionally omits full-report effects
  before changing it. Passing every report field through would change existing
  combat outcomes and balance, not merely improve documentation.
- Preserve legacy cannon saves and exactly-once battle application. Future tests
  should separate hull repair, condition repair, piece loss, repurchase and replay.

## Verification

Author baseline: `node --test test/battle.test.mjs test/crew.test.mjs
test/repairdock.test.mjs`: 31 passed, none failed. These tests cover current
battle/application, wear/repair and port checks. They do not establish P3 rules,
new weapon-loss behavior or replacement economics. No runtime files changed,
competitor executable run, UI change or visual audit claimed.
