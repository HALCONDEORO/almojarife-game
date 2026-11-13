# P3 random events: the documented skeleton, the community flesh, our own tuning

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

The P3 manual documents its random events sparsely and only qualitatively.
Famine, epidemics and fires exist as town states: wells are described as
fire protection and hygiene, roads as better sanitation, and hospitals and
chapels as lowering epidemics; celebrations
lift a town's spirits especially after surviving a famine, an epidemic or a
siege; war and famine depress the people inside the walls. Storms and
icebergs exist as sea hazards: captains are described as able to evade
them, and ships suffer wear from encountering them, on regular voyages and
on expeditions alike. The interface signals these states with town icons,
and rain in the town view is documented as a tell that a storm lies not far
out at sea. In the inspected passages no rates or
event-duration rules for famine, fire or epidemics were located; adjacent
rules do carry bounds (the winter frost months, a quantified captain
ability), so this is a located gap, not a global claim.

Community sources supply exactly the layers the manual omits: durations,
goods-specific demand shifts, immigration stops, chance couplings between
infrastructure and events, and even mortality of named characters. Those
are claims to test, not documentation. Almojarife already implements the
family as own-design modules whose own headers mark every number as
inference and which deliberately leave mortality and property destruction
out.

Existing notes touch pieces from their own angles and are not reclaimed
here: the towns3 note records the community plague doctrine and already
warns that event flags ship on by default despite stale module headers,
the seafaring note the captain-and-storm doctrine, the frozen-port note
the documented freezing that our code already implements, the events/
trader-AI note the infrastructure-coupling doctrine, and the first
Tippsammlung note the thread's demand-and-prestige special cases with
their provenance caution. The open PR on paid event news
covers the informer channel the manual describes in its tavern section
(printed page 32); this note covers the events themselves, not the news
market for them.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Events and Weather sections (printed page 15), town icon list (printed pages 18-19), captain and ship-wear passages (printed pages 29-30), wells, roads and hospitals passages (printed pages 38-39), expedition wear passage (printed page 56): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation, all of it qualitative: celebrations raise a town's spirits, above all after a survived famine, epidemic or siege; war and famine depress everyone inside the walls; rain in town means a storm nearby at sea; frost in the winter months reduces agricultural production; a frozen port blocks docking and departure. Icons mark a town suffering famine (its people welcome food deliveries), an epidemic (a place to avoid), a fire, a goods shortage and a siege. Wells are documented as fire protection and hygiene, roads as better sanitation, and broad hospital care as lowering the chance of epidemics while lifting satisfaction. Captains can evade storms and icebergs; worn ships take serious damage from them; expeditions take wear from ordinary use, storms or pirate attacks. No rates or event-duration rules for famine, fire or epidemics were located in these passages. |
| S2 | Tippsammlung 2010 (community compendium of the pre-P3 era used as reference by P3 players), towns chapter: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf - read together with the Patrizierforum thread "Part Translation of the Tippsammlung", whose translated chapters were read directly: http://www.patrizierforum.net/index.php?thread/5252-part-translation-of-the-tippsammlung/ | Community layer for the same events: a plague is said to last about a month, to stop immigration, to shrink the population, to raise wood demand, and to be able to kill the player's wife or a town administrator; mitigation is framed as coverage by wells, streets, hospitals and chapels. The thread's siege, plague, famine and frozen-port demand-and-prestige special cases are already recorded with their provenance caution in the first Tippsammlung note and are not reclaimed here. Exact P3 equivalence is not claimed by the source itself: doctrine to test, not P3 proof. |
| S3 | Old man's guide to Patrician III (Steam community guide), production section: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Independent community guide. Claims plagues can increase the demand of wood and cloth, and recommends keeping otherwise inefficient production to cover event-driven shortages. Community claim until tested; consistent in direction with S2's wood claim, but two community claims agreeing is still not documentation. |

## Main inspection

Real grep and reading across `src` for famine, fire, plague, epidemic,
storm and calamity terms found the whole family already built as own
design, with the deliberate boundaries stated in the modules themselves:

- `src/game/calamities.mjs:1-19`: famine, fire and port sanitation scares
  as a weekly seeded roll with building mitigations - posito and alhondiga
  against famine, pozo and hospital against fire, pozo, hospital and
  capilla against the sanitation scare. The header states plainly that no
  probability or duration is documented and every number is own tuning,
  that no mortality and no property destruction are coded (fire halts
  buildings for a while and they reopen), and that famine raises food
  demand while a scare slackens trade. Flag-controlled and ON by default
  in new games (`src/game/game.mjs:174` initializes unless the option opts
  out; the module header's off-by-default wording is stale, as the towns3
  note already warned for this flag family).
- `src/game/plague.mjs:1-10`: a separate plague module, likewise ON by
  default in new games (`src/game/game.mjs:160`, owner order that every
  flag ships on), again with every number marked own tuning; a plague
  never kills in the model - people shut in and trade less - and the
  town's wall level feeds in. Our capilla mitigation mapping
  (plague.mjs:15) parallels the manual's chapels-against-epidemics
  direction.
- `src/game/shocks.mjs:1-10` and `src/game/shocks.mjs:42`: regional
  economic shocks, including a port closing for a few days over a plague
  scare, applied to the market entries themselves and restored on expiry,
  with the household health shield feeding the odds.
- `src/sim/weather.mjs:1-5` and `src/game/seawear.mjs:1-10`: a
  deterministic regional weather field with drifting storm cells, and
  player hull wear from base rate, wind strain and storm exposure. The
  manual's storms-wear-ships direction is the parallel; our rates are own
  tuning, and the captain-evasion doctrine was already studied in the
  seafaring note.
- Fire spotting has its own own-design lane: kept watchtowers and the
  warehouse watch feed `src/game/calamities.mjs:9-10`.
- Event signalling exists, though not as per-city state icons: calamities
  post start and end info messages (`src/game/calamities.mjs:105` and
  `src/game/calamities.mjs:87`) that the sound layer classifies as storm
  notices (`web/main.mjs:1251-1262`), the route view marks storm legs
  (`web/main.mjs:219`), the map projects the real storm cells through
  `atmosphereSvg` (`web/main.mjs:745`), and a burnt building shows a
  halted-fire note (`web/main.mjs:968`). What was not located in the
  inspected views is a per-city event-state icon equivalent to the
  manual's famine, epidemic, fire and siege list; the concejo's scarcity
  proclamations (`src/game/pregon.mjs:1-5`, flavour intel that moves no
  money) and player-set price alerts (`src/game/alerts.mjs:1-5`) are
  adjacent surfaces, and the paid informer channel is the open PR's
  topic, not this note's.
- No celebration-after-survival coupling exists: city festivals are
  ambient own design (`src/game/festivals.mjs:1-8`), and the player-hosted
  feast lane is the pending feasts note's proposal, not built.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

The family is already built with explicit inference markings, so the
documented record adds little that is mechanical. What it still offers is
signalling: the rain-in-town tell for storms at sea, and famine and
epidemic town states made visible the way the icon list describes - a
famine reading as a delivery opportunity and an epidemic as a place to
avoid. If selected later, the smallest faithful slice is a view-and-log
layer over the existing calamities, plague and weather modules: surface
active event states and the rain tell through the existing proclamation
and log channels, with no new rolls, no new numbers and no news-for-money
(the open PR's lane). Flag-off must mean byte-identical saves and no new
log lines.

Future tests should prove: flag-off games untouched; signals read only
existing calamity, plague and weather state; a signal never changes a
price, a roll or a demand figure; and save/load round-trips without drift.
Decide first, as explicit owner calls: whether mortality and property
destruction stay out of the game for good (the modules assume so today),
whether event states should steer trader behaviour or trade availability
beyond the existing short plague-scare port closure
(`src/game/shocks.mjs:30`, `portClosed`), and whether the
celebration-after-survival mood coupling belongs to the pending feasts
lane rather than here.

## Open questions

- Do P3 epidemics actually kill named characters, as S2 claims about the
  wife and the administrator? Single community source, untested.
- Which goods' demand rises during a plague or a famine in P3, and by how
  much? S2 and S3 agree on wood as a plague good but remain community
  claims.
- Do roads reduce plague chance in P3, and do wells limit fire spread
  between buildings? Community coupling claims; the manual states only
  the mitigation direction, not the mechanism.
- Does a P3 fire destroy buildings permanently or only interrupt them, as
  our own-design boundary assumes? No inspected source says.
- The manual's epidemic icon advises avoiding the town, but does that
  state physically close the port in P3, or is it a player-choice
  deterrent? Our shock closure already closes ports briefly; what, if
  anything, should differ for a calamity-state town is unanswered.
- Is a storm at sea in P3 only a wear hazard, or can it sink or scatter
  ships outright? The manual documents wear and evasion; nothing more
  specific was found in the inspected sources.
