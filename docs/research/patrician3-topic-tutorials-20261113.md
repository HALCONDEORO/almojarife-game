# P3 topic tutorials versus replaying a linear introduction

13 November 2026. Main inspected: `6725acc`.
Clean-room research only. No tutorial, curriculum, reward, campaign or save
change approved. No competitor text, timings, assets or balance values adopted.

## Selected gap and overlap

P3 documents a tutorial selector organized by topic, separate from its campaign
and ordinary play. A reader can choose the subject they need; the English manual
also says a tutorial can be stopped at any time. That is a narrower interaction
than restarting an entire completed introduction. It does not establish isolated
sandbox saves, chapter-completion prerequisites or universal voice narration.

Real grep across `docs/research` and `docs/design` for tutorial chapters,
selection, replay, sections and Spanish equivalents found no focused note on
this selection boundary. The existing multiplayer note mentions fast-forward
restrictions, not tutorials; P4 advisor research owns current-problem advice,
not a lesson selector. PR heads 930-952 were fetched and their note changes
checked. Minimap, ship upgrades, office reports, citizens' supply and the other
pending subjects do not cover tutorial selection. The event-advance topic was
withdrawn after another author announced it first and is not included here.

## Public evidence and dependencies

| Ref | Source read | Contribution and limit |
| --- | --- | --- |
| S1 | English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Printed p10, Quick Start; p11, 4.1-4.2; p15, 6.1, each extracted/read individually. Topic choice from the main menu, stepwise guidance, stopping a tutorial, and a separate introductory campaign. Primary documentation; not a reproduced menu or save transition. |
| S2 | Steam official manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Same English manual. Fetched tutorial section agrees with S1; not independent corroboration. |
| S3 | Spanish FX manual hosted on Doku: https://doku.pub/documents/manual-patrician-3-rz0x6evddj0n | Section 2.1.1 describes choosing a subject then starting it; textual guidance and forward/back controls are described. 2.1.2 separates campaigns. Localized manual family, not independent runtime evidence or proof of identical editions. |
| S4 | Worthplaying review, December 2003: https://www.worthplaying.com/article/2003/12/27/reviews/14425-pc-review-patrician-iii/ | Describes reading/following tutorial directions and explicitly reports absent voiceovers. Independent editorial experience, not a universal claim about every edition. |
| S5 | DFG review: https://www.download-free-games.com/simulation/patrician_3.htm | Describes subject-specific lessons, distinguishes tutorial/campaign play, and says the tutorial leaves some details unclear. Its approximate lesson count differs from the manual and its duration is reviewer experience, not a specification adopted here. |
| S6 | TerraGame overview: https://www.terragame.com/patrician-iii | Describes a multi-chapter tutorial separately from an introductory campaign. Secondary overview without observed publication date or reproducible test; lower evidential weight. |

Six documents but fewer independent families. Primary documentation establishes
the selector; reviews provide experience and limitations rather than another
precise menu specification. No competitor executable, save or screen inspected.
No excluded modding, code-derived or utility-chart source used.

## What remains uncertain

The English manual's commentator and FX's narrator wording do not settle audio
availability. Worthplaying explicitly describes text without the earlier game's
voiceovers. Treat localization/build differences as unresolved, not a reason to
promise spoken instruction or dismiss the review. [S1, S3, S4]

Selecting a lesson does not prove that the lesson changes the player's current
company, shares its inventory, grants rewards, preserves partially completed
steps or unlocks another lesson. The manuals inspected do not give those
contracts. Exiting a lesson and skipping an integrated onboarding sequence can
have different consequences. [S1, S3]

A topic curriculum also need not copy P3's subjects. The useful own-design
question is whether returning players can practice a chosen skill without
repeating unrelated onboarding. Reviews calling the game difficult or the
tutorial incomplete do not measure whether such a selector improves learning.
[S4, S5]

## Current main: positive implementations and precise difference

| Bodies/call sites read | Existing behavior and boundary |
| --- | --- |
| `src/game/tutorial.mjs`, `initTutorial`, `tutorialStep`, `tutorialNote` | Versioned progress and allowed actions define an ordered introduction; older versions retain their own completion rules. New progress records successful actions, with conditions such as a profitable sale. There is no topic argument or independently selected lesson state in these functions. |
| `src/game/tutorial.mjs`, `skipTutorial`, `restartTutorial`, `tutorialActive` | Skip already exists. Restart is accepted for a finished/skipped valid tutorial, resets its progress with `initTutorial`, and refuses running/off/damaged state. It does not start a chosen topic. Do not call replay or interruption absent. |
| `src/game/tutorial.mjs`, `quietly` | Automated trade can run without advancing player learning progress. Topic practice must not silently treat bot/route activity as a learner's successful action. |
| `src/game/campaigns.mjs`, `campaignEvent`, `campaignTick`, `missionView` | The active tutorial gates mission event progress, mission ticking and visibility. A new lesson mode must not accidentally freeze or reveal this arc unless that consequence is selected. These are current bodies, not authority inferred from comments. |
| `src/game/tutorialstory.mjs`, `awardTutorialStep` | Existing story learning awards are keyed outside the reset tutorial progress; a previously awarded field does not pay again on replay. There are real reward safeguards to preserve, not an invitation to mint repeat practice rewards. |
| `src/view/settingsview.mjs`, `settingsHtml`; `web/main.mjs`, `showSettings` call site | Help can show the existing replay button for a finished tutorial in a non-ended game; its handler calls `restartTutorial`. This is a real entry point but not a topic-selector menu. |

The finding is limited to those modules and the real grep. Current tutorial,
story, replay, campaign and help functionality are expressly retained. This
note does not claim all learning aids or standalone documentation are absent.

## Own-design questions only

- Does a selectable practice topic solve an actual returning-player problem
  better than current replay and help? No new menu is requested yet.
- If selected, decide whether practice uses the current company or a disposable
  scenario. Keep current save, cash, ships, mission timers and tutorial awards
  unchanged unless the player explicitly chooses a consequential transition.
- Distinguish reading guidance, performing a step, completing a lesson, skipping
  onboarding and resetting it. Preserve progress versions and old saves.
- Define exit/resume behavior and automated-action handling before implementation.
  Reopening practice must not duplicate learning rewards or activate missions.
- Test changed state as well as displayed instructions. Do not infer that a
  visually open lesson is safe if it freezes an unrelated ongoing campaign.

## Verification

`node --test test/tutorial.test.mjs test/tutorial-replay.test.mjs
test/tutorial-missions.test.mjs test/tutorial-story.test.mjs`: 36 passed,
none failed. Existing baseline only; no new selector or P3 parity tested.
Every identifier in the current-main table was located and its body or call
site read. No runtime/tests edited, new UI, screenshot or narration reproduced.
