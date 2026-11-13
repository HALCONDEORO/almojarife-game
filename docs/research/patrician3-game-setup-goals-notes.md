# P3 game setup and goals: the documented new-game contract behind our campaign shell

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, balance values, excluded
modding material or executable inspection. No implementation approved.

## Narrow finding and existing coverage

The P3 manual's main-menu chapter documents the new-game contract: a set
of campaign scenarios with task descriptions; player settings where the
character's name shapes how the game addresses the player, gender shapes
prospective spouses, the hometown choice gives a first look at where
goods are made, and the start year shapes town sizes and how much the
rival traders have already built; a row of named difficulty presets from
the gentlest to the hardest whose detail screen lets each aspect be tuned
on its own; and a menu of goal definitions -
free play, timed office goals (Lord Mayor, Alderman), timed score and wealth comparisons, a
league-wide population target - where victory goes to whoever fulfils the
goal first, that trader may be computer-controlled, and the player may
then keep playing.

Existing coverage is not reclaimed: the options notes already recorded the
start year as a difficulty axis and the independently adjustable
difficulty factors from the community compendium - this manual chapter is
their primary-source support, and the two are compared, not double-counted.
The price-response note owns the trade-difficulty margin effect as
documented in the trade chapter; the citizens-supply note owns citizen
needs; the ship-upgrade and naval notes own shipyard experience. The
community compendium's start options and the manual's chapter are
different documents saying compatible things (documentary overlap).

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Campaigns, Single-player Game, Player Settings, Difficulty Level and Define your Goal sections (printed pages 15-16): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: the campaign scenarios; player settings as above, including that an early start leaves the top ship type to a few experienced shipyards while a later start has it available from the beginning; the named presets, each aspect (trade margin squeezing both sides of the price, reputation effort, citizen neediness slowing town growth, sea-battle handling, pirate numbers and recruitment, prince demand frequency and siege army size, starting capital tiers, starting fleet size) individually tunable with the resulting rating shown; the goal menu and the may-be-an-AI winner rule. The trade aspect's per-increment price change is stated explicitly in the source: observed but omitted here and not adopted. |
| S2 | Tippsammlung 2010 (community compendium), options chapter, as already recorded in the options notes: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf | Community layer, cited for comparison only: the start year as a disguised difficulty axis and the factor-by-factor difficulty with a compensating overall rating. Exact P3 equivalence not claimed by the source; the manual chapter above is the primary support for the shared shape. |

## Main inspection

Real grep and reading across the new-game path found a deliberately
different contract:

- `src/game/campaigns.mjs:1-12`: one original campaign arc as pure data -
  story missions with ordered steps, optional deadlines, rewards and
  unlocks - gated by the tutorial (`src/game/campaigns.mjs:7`). The
  documented set of scenarios with separate task descriptions has no
  located counterpart; ours is a single narrative arc, not a scenario
  picker.
- `src/game/game.mjs:152`: a new game takes cash and upkeep overrides,
  free-play and no-goal flags, a seed and a campaign opt-out, and sets a
  fixed start year constant (`src/sim/clock.mjs:16`). No start-year or
  gender choice exists in the inspected public flow; the world itself is
  a `newGame` parameter, with no map picker in that flow. The no-goal
  flag is our counterpart to the documented free-play goal.
- `src/game/difficulty.mjs:2-12`: three presets varying starting cash and
  an upkeep multiplier only, as the price-response note already recorded.
  The documented per-aspect tuning (margin, reputation, needs, battles,
  pirates, prince, capital, fleet) has no located counterpart as
  difficulty inputs, though several of those systems carry their own
  independent flags elsewhere.
- The start form collects company, character name, portrait, crest, home
  port and a background choice with small bonuses (inputs generated at
  `web/main.mjs:1681`, options assembled in `src/game/profile.mjs:45`,
  the new-game handler at `web/main.mjs:428`) - no gender, no spouse
  implication, no hometown goods preview in the inspected form. The
  absence of a world-map choice is scoped to this public flow: `newGame`
  itself takes the world as a parameter (`src/game/game.mjs:147`).

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

The documented record here is mostly a map of choices our shell does not
offer, not a build order. Our single narrative arc is a deliberate
identity choice, and the mission-as-data design already admits more
missions of the current scheme as entries - not a competitive timed mode.
Whether such a mode could ride the mission scheme at all, or needs its
own engine, save and UI work, is unresolved and a criterion to settle
with the code before any build. What the record adds as questions:
whether a timed score-or-wealth comparison against the existing AI
houses would fit as an
optional goal mode (our bots already trade, so a timed comparison has a
substrate), whether the winner-may-be-the-AI rule and the keep-playing
prompt suit a game whose campaign currently has one author, and whether
any difficulty aspect beyond cash and upkeep should ever be exposed as a
player knob given the balance work each knob multiplies. All owner calls,
not research conclusions.

Any future change in this area should prove: flag-off and existing saves
byte-identical; whatever a new goal mode turns out to require (engine,
save format, UI) is mapped before any build; an AI winner
is announced by the same news channels as other defeats and victories;
and a scenario or goal addition cannot break the tutorial gate. Decide
first: whether goal modes fit the game's direction at all, and whether
setup choices that reshape the world (start year, map) belong in a game
with one hand-built world.

## Open questions

- In P3's timed comparison goals, what exactly enters the score? The
  manual names score and wealth as distinct goals but not the scoring.
- Does the league-population goal credit any trader specifically, or
  does every trader win together? The manual's winner rule is stated for
  the goals generally.
- Do campaign scenarios share one world state with free play, or are
  they separate rule sets? The manual presents them as scenarios with
  task descriptions only.
