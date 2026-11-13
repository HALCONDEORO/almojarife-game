# P3 excess crew: people occupy hold space separately from their equipment

13 November 2026. Main inspected: `7989210`.
Clean-room documentary comparison only. No copied prose, slogans, source balance
figures, assets, executable inspection or excluded material. No balance or crew
admission change is approved.

## Selected crew-chapter boundary and prior coverage

P3 manual section 9.3.1 states that sailors beyond a ship's minimum required
crew occupy cargo room. This is a headcount condition, not described there as
conditional on carrying cutlasses. No per-sailor conversion is provided in that
section. More sailors therefore involve a capacity tradeoff distinct from wages
or the separately described transfer of equipment. [S1]

This is not an entirely unmentioned idea. Real grep of `docs/research` for
crew/hold/cargo and excess-crew terms found
`patrician3-tippsammlung-seafaring-notes.md`: its refit paragraph already mentions
extra sailors taking space. Its Almojarife comparison then establishes weapons
and crew-gear weight, not a separate sailor-body occupancy rule. This note
narrows that distinction rather than declaring all crew-space coverage absent.
The FAQ already covers transfer and wages, while the crew-morale note covers
mutiny. None is reopened here.

Open PR930-940 titles were checked, and available new-note diffs930-934 and
937-939 were grepped. Route import and production-intent are also known current
notes. Weapon-loss PR932 concerns mounted pieces, not sailor occupancy. No
pending dedicated treatment of this headcount-versus-gear distinction was found.

## Page-specific evidence and limits

| Ref | Public source read | Supported claim and limit |
| --- | --- | --- |
| S1 | P3 English manual, section 9.3.1, printed/PDF page 28: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete page inspected separately. Excess over minimum crew occupies cargo room, with a separate maximum crew limit. No weight formula, rounding or full-hold hiring behavior supplied. |
| S2 | Same manual, section 9.4, printed/PDF page 29, same URL | Crew cutlasses are a separate equipment category. Does not say their absence removes the excess-crew capacity rule. No equipment values adopted. |
| S3 | Steam discussion, Do crew numbers affect ship speed?, September 2018: https://steamcommunity.com/app/33570/discussions/0/3317353727679381292/?l=italian | Players connect crew occupancy to loading and disagree about practical speed significance. Anecdotal interpretation, not a controlled measurement or an adopted speed formula. |
| S4 | GRYOnline, crew guide, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/zaloga-okretu/z036dc | Hiring, morale and equipment context. The inspected text does not independently establish the excess-body-space rule; no extra corroboration claimed. |
| S5 | Community wiki, Ship: https://patrician3.fandom.com/wiki/Ship | General ship-class/crew/cargo context only. Does not settle the capacity calculation or hiring when full. Catalogue values not adopted. |

Primary evidence for the narrow rule is S1. No P3 runtime hiring or transfer was
reproduced. These readings do not establish that extra crew directly speeds or
slows a ship, or how speed responds to the occupied room.

## Own source, with every identifier checked

- `src/sim/trade.mjs:32`, `shipCapacity`: subtracts `loadWeight` from catalogue
  capacity. `cargoUsed` is defined at line 42 for goods occupancy.
- `src/sim/armament.mjs:28-30`, `gearWeight` and `loadWeight`: total deduction
  combines mounted-weapon weight and gear weight. The gear expression uses
  `crewOf` and `gearOf`, declared at lines 15 and 27. Without gear, that term
  vanishes regardless of how far headcount exceeds the minimum. There is no
  additional excess-sailor-body term in these inspected readers.
- `src/game/crew.mjs:47,57,64`, `hireCrew`, `dismissCrew`, `transferCrew`:
  headcount changes exist already. Hiring and transfer cap against crew room;
  these function bodies do not check remaining cargo room. That is a current
  contract, not permission to introduce rejection or automatic jettison.
- `speedFactor`, `crewDefence`, `dailyUpkeep`, defined in the same module at
  lines 31,38,43, already give crew independent speed, defence and wage effects.
  A missing body-space deduction is not a claim that more crew has no effects.

An independent pure-reader fixture on this baseline compared one hull at minimum
and maximum crew with no gear or weapons: capacity was equal and gear weight
absent, as the expressions predict. It passed. No tests were added, no wider
suite or UI was run, and no visual audit is claimed.

## Decision and questions

Treat this as a documented divergence, not a defect requiring a patch. If a
headcount occupancy rule is selected, choose its reference crew threshold and
interaction with our existing gear weight explicitly. Do not double-count
people and equipment accidentally or copy P3's implied scale.

Open P3 questions: exact occupancy/rounding, treatment of captains, hiring into
a full hold, transfer refusal or partial movement, existing overloaded cargo,
casualties and speed coupling. Open own decisions: whether another hold cost
adds useful play, how existing loaded saves behave, and which admission paths
must reject or clamp an operation. If approved, future tests should cover
zero-gear headcount changes, cargo conservation, partial transfers, casualties,
save/load and unchanged wage/gear semantics. No automatic cargo loss is proposed.
