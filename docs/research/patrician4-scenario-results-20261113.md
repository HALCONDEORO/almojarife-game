# P4 scenarios: timed objectives, completion records and score

Research date: 13 November 2026. Inspected Almojarife main: `d8d6a82`.
Clean-room documentation only. No new mode, scoring formula, balance change or
scenario content is approved by this note.

## Scope and evidence

The existing P3 Tippsammlung overview proposes scenario presets that vary initial
world conditions. That is not the same as a P4 scenario's completion, unlock and
score lifecycle. The existing P4 cooperative note mentions scenario compatibility
but does not cover these rules. This slice concerns bounded challenges rather than
campaign tutorial steps, ordinary delivery contracts or an endless sandbox.

Read public primary documentation, publisher descriptions, a contemporary review,
a catalogue and a community guide. No proprietary data, modding/decompilation
source, executable, artwork, copied mission text or source-game balance figures
were used. A modding-guide search hit was excluded and not opened or used. No
scenario was played; this is documented behavior, not a recovered implementation.

## What P4 documents

### A scenario has its own objective and end horizon

The addon manual separates scenarios from other modes and describes specific
objectives that must be reached before a time limit. It lets the player select a
scenario and difficulty; difficulty affects trade and reputation. Thus a challenge
is more than a different starting wallet: its completion predicate and horizon
matter. The manual does not publish the evaluation order at the exact deadline.
[S1]

The contemporary review likewise distinguishes campaign, endless play and timed
scenarios, describing economic, civic and pirate-hunting tasks. Its assessment that
the limits feel demanding is a reviewer's judgment, not a measured difficulty
curve. The publisher pages corroborate the addon scenario feature but do not
specify completion rules. [S2, S3, S4]

### Completion and score are distinct outputs

The manual says completion produces a score based on elapsed time, difficulty and
accumulated wealth; faster completion improves the score. It also says that some
scenarios become accessible by completing earlier ones. It does not establish that
a score threshold is necessary for every unlock, nor an exact scoring formula.
An unlock for finishing is not automatically an unlock for achieving a medal. [S1]

The Gamepressure catalogue describes later difficulty and wealth as depending on
how quickly scenarios are completed. That is a stronger progression/carryover
claim than the manual's score description. It is not established here: no adaptive
campaign, inherited treasury or cross-scenario starting advantage is inferred from
that wording. The catalogue's AI-generated review summary is not evidence. [S5]

The community guide describes focused timed tasks and says harder challenges need
unlocking. It also suggests liquidating assets near the end of an economic task.
That is player advice, not proof that every scenario measures cash, that assets
are valued equally in score, or that liquidation is optimal under all goals. [S6]

## Verified delta against Almojarife

| Code area | What exists on the pinned main | What this does not already supply |
| --- | --- | --- |
| `src/game/game.mjs`, `newGame` / daily goal block | Global cash-after-loans goal and deadline outside freePlay/noGoal; open-ended options | No scenario-definition selection or per-scenario result record found |
| `doSell`, `doSellStored`, `doSellCombined` | Immediate victory checks after successful sales, as well as the daily check | A new objective policy must cover all these paths, not only the daily tick |
| `src/game/campaigns.mjs` | Step/event/condition missions, dependencies, rewards and failures | Completing a mission does not calculate a time/difficulty/wealth score or unlock a separate scenario selector |
| `src/game/achievements.mjs` | Once-per-game milestone records that read state and post notices | These are not a cross-run scenario completion catalogue or leaderboard |
| `src/game/gamesave.mjs` and `web/main.mjs` | Versioned game state, local saves/slots and startup UI | A save snapshot does not define immutable scored results, challenge versions or cross-run unlock eligibility |

The runtime search found no scenario-result/scoring system in these inspected
modules. AI route scores and civic-work priority scores are unrelated numerical
ranking helpers, not challenge results. The game already has goals and game-over
conditions, so this is not a proposal to build those foundations from scratch.

Important own-code distinctions: the existing victory check uses cash less loans;
`netWorth` and `houseWorth` are different valuations. Do not silently substitute one
for another under a new label such as wealth. The present `noGoal` option retains
campaign logic and bankruptcy, while `freePlay` changes campaign initialization.
Those mode differences need deliberate compatibility handling, not a renamed flag.

Author baseline: the existing game, achievement and campaign suites pass. These
are regression checks, not tests of scenarios or an independent review.

## Own-design recommendation, not an implementation request

Prefer a small optional challenge definition and a separate frozen result record
over changing all campaign missions into scored challenges. A definition should
state initial conditions, objective, time basis, allowed difficulty/settings and
valuation. A result should record what was completed, under which definition and
rules revision, and the final measures that explain any score. No source scenario,
formula, duration or achievement name needs to be copied.

Before coding, decide when completion is evaluated, whether it is terminal, which
loss takes precedence, whether play can continue afterward, and whether completion
or score unlocks later content. Keep a continued sandbox from mutating an already
recorded result. Ordinary save recovery must not silently erase a locally earned
unlock, while an imported save must not automatically certify a ranked result.
Whether any public ranking exists is a separate product/security choice.

The main balance risk is rewarding the wrong objective. A liquid-cash challenge
may favor selling the whole fleet; a sustainable-supply challenge should not
pretend that the same liquidation proves success. Announce the real metric in the
UI and use its own tests. Do not change reserved needs, household or procurement
rules to make an illustrative scenario easier to win.

Candidate acceptance cases if selected later:
- Identical definition, seed, settings and commands produce the same completion
  measures and result, including after save/load.
- Success on the last permitted tick and failure immediately afterward follow one
  explicit convention across manual sales, stored sales, combined sales and time.
- Bankruptcy and success on the same tick have a defined, tested precedence.
- A completed result and its unlock are applied once; replaying a notification or
  continuing a sandbox does not increase the score or grant another reward.
- Difficulty and definition versions remain in the result; different rules are
  not presented as directly comparable without an explicit comparison policy.
- Cash, debt, cargo, ships and buildings count only as the chosen metric states;
  borrowed money, transfers and liquidation cannot exploit an ambiguous label.
- Old free-play/noGoal/campaign saves retain their current behavior when no
  challenge is selected; a broken optional result does not corrupt the game save.

## Open verification work

Exact P4 score formula, wealth valuation, deadline boundary, loss precedence,
retry behavior, continued play after completion, result persistence, unlock storage
and any cross-scenario carryover remain unresolved. No leaderboard or online score
verification is established by the fetched sources. These are observation questions,
not recovered P4 implementation instructions.

## Sources

All accessed 13 November 2026; source quantities are not imported.

- **S1, primary:** Kalypso, Rise of a Dynasty English addon manual, Introduction
  and Scenarios sections. Date not shown. Primary support for deadline, difficulty,
  completion score components and predecessor completion unlocks.
  https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- **S2, contemporary review:** PC Games, Viktor Eippert, 29 March 2011, first
  review page. Confirms timed scenarios separate from campaign/endless play;
  its difficulty assessment is opinion, not a formula.
  https://www.pcgames.de/Patrizier-4-Aufstieg-einer-Dynastie-Spiel-15623/Tests/Patrizier-4-Aufstieg-einer-Dynastie-im-Test-Dieses-Add-on-hat-wirklich-viel-zu-bieten-817931/
- **S3, publisher description:** Steam addon page. Scenario existence only.
  https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/
- **S4, publisher:** Kalypso addon product page. Scenario existence only; not
  independent evidence for scoring details. Date not shown.
  https://www.kalypsomedia.com/us/patrician-iv-rise-of-a-dynasty
- **S5, catalogue:** Gamepressure addon entry. Its stronger progression wording
  is preserved as unverified, not used to infer carryover.
  https://www.gamepressure.com/games/patrician-iv-rise-of-a-dynasty/zf28b3
- **S6, community:** Steam, Patrician IV Guide, Play Options. Supports the broad
  timed-task distinction and records player liquidation advice; not a valuation
  specification. Publication date not used.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
