# P3 production capacity: chosen intent is not observed output

13 November 2026. Main inspected: `7989210`.
Clean-room documentary note only. No copied prose, slogans, source balance
figures, recipes, assets, executable inspection or excluded material. No
production, wage or labour-market change is approved.

## Selected production-chapter gap

Section 8.3 documents a player control to raise or lower production capacity,
alongside displays of actual and maximum employment, production, consumption
and costs. It separately describes raw-material shortages and difficulty
recruiting workers. A low output reading therefore must not automatically be
interpreted as the player's intended operating setting. [S1]

Real grep of `docs/research` for capacity, workers, idle costs and production
controls found existing production, production-bonus, chain-ratio, supply and
FAQ notes. They cover inputs, seasonal effects, economic consequences and
labour shortages. The FAQ's idle-capacity heading is not a detailed study of
the production-setting control: its inspected body chiefly checks ship costs.
This note adds the distinction between requested capacity and realized work;
it does not reopen recipe ratios or claim that employment is missing.
Open PR930-935 and the feast note were checked for topic overlap; their listed
subjects do not cover this production-control boundary.

## Evidence with bounded claims

| Ref | Public source read | What it establishes and what it does not |
| --- | --- | --- |
| S1 | P3 English manual, section 8.3, printed/PDF page 24: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete page inspected separately. Capacity adjustment, employment and weekly production/cost display; inputs from the trading office; missing inputs do not erase wages and taxes; labour availability matters. Does not give adjustment delay, hiring formula or a complete marginal-cost model. |
| S2 | Same manual, section 11.4 introduction, printed/PDF page 40, same URL | Catalogue production/consumption and operating/raw-material costs are framed around maximum operation. This is a reference basis, not proof that every expense stays constant at every chosen setting. No catalogue numbers adopted. |
| S3 | Steam discussion, Production Woes, November 2017: https://steamcommunity.com/app/33570/discussions/0/3183345176718168969/ | Player explanation distinguishes setting a hiring ceiling from actual workers and describes gradual hiring/firing. Community-only timing claim, not a reproduced contract or precise delay. |
| S4 | Steam discussion, Are production costs higher if not at full production?, November 2019: https://steamcommunity.com/app/33570/discussions/0/1661194916740419638/ | Players distinguish fixed land cost from wage-linked cost and discuss higher unit cost at reduced utilization. Not a measured general formula; example amounts and fractions not adopted. |
| S5 | Community wiki, Businesses: https://patrician3.fandom.com/wiki/Businesses | Documents several efficiency influences, including location, clustering and season. Used only to bound scope: realized efficiency has more causes than the capacity setting. Its tables and bonus values are not adopted. |

No P3 operating setting was changed or measured. Primary documentation supports
the existence of a control, while hiring lag and cost decomposition remain
community evidence. Do not turn the manual's warning about missing inputs into
a claim that deliberately reducing capacity leaves every expense unchanged.

## Main behavior, checked in function bodies

Reads followed grep of `src/game/buildings.mjs` and nearby production paths:

- `jobsNeeded`, `freeLabor`, `staffingRatio`: demand comes from active,
  non-halted building levels; available population determines a shared port
  staffing ratio. This is an existing labour mechanism, not a new worker system.
- `workshopTick` (`buildings.mjs:429`, called at `game.mjs:383`):
  staffing is read at `buildings.mjs:433` and changes batches over time. Primary producers
  and processors have different paths. Processors also require market inputs,
  cash and a positive quoted margin; a lack of output can have several causes.
  Existing chain-ratio research already records market rather than warehouse
  input procurement. No new supplier-link proposal is made here.
- `accrueBuildings`: upkeep and nominal job wages are accrued from level for
  active non-halted buildings. Cash shortages can halt a building; adequate cash
  can automatically resume it. Fire holds have a separate condition. These
  function bodies take precedence over an old comment implying manual restart
  is always required.
- `restartBuilding`: an explicit restart command also exists, with cash and fire
  checks. Restarting is not the same as selecting partial operating capacity.
- Grep/read of the inspected producer state and commands found no separate
  player-set operating fraction. Building level, halt status, staffing ratio and
  recipe feasibility already affect production and must keep their meanings.

No tests, UI inspection or visual audit accompany this documentation-only patch.

## Decision and open questions

Defer a capacity control until it solves a chosen player problem. If selected,
keep desired operation separate from effective staffing and actual output.
Do not label a lower labour ratio as a deliberate player shutdown, and do not
let a capacity slider silently rewrite a building's upgrade level.

Open P3 questions: control scope across same-type buildings, adjustment steps,
hiring/firing delay, recovery after supply improves, interaction with season and
bonuses, and how each cost responds to deliberate reduction versus involuntary
shortage. Community examples do not settle these universally.
Open own decisions: whether the control is useful with current profit-aware
processors, how jobs and wages respond, and whether fixed upkeep continues.
If approved, future checks should cover distinct intent/output readings,
save/load of intent without duplicate charges, unchanged input conservation,
labour shortage and recovery, and no effect on existing halted/fire recovery
unless explicitly chosen. No P3 figures or new economic rule is requested here.
