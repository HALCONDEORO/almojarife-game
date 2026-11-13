# P3 citizens and goods supply: the documented population contract behind our city life

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

The P3 manual's town chapter documents a population contract. Every town
holds poor, well-off and rich strata with their own interests; a growing
town draws migrant beggars from the countryside, and a beggar becomes a
citizen only with both work and a home, otherwise moving on - and new
workers come only from that group. Satisfaction per group is visible and
changes very slowly, because a long stretch of need stays in people's
memory. A town thrives only if goods actually arrive: people leave when
goods run short even with work and housing available, each class has its
own priority goods, and citizens like to see several days of stock in
town. Development and infrastructure then shape satisfaction further.

Almojarife implements most of this shape with its own numbers: three
classes with per-class baskets and price sensitivity, a slow mood memory,
a weekly neighbour drift bounded by housing, and a separate market demand
multiplier that rises or falls with how well-fed the city is. The two are
distinct mechanisms: the drift moves actual inhabitants, while the demand
multiplier only scales what the market buys on the census figure.

The documented beggar pool is the gap: in the population and recruitment
modules inspected, a real grep for beggar, mendig, migrant and immigr
terms across `src` and `data` found nothing - no migrant group, no
work-plus-home conversion rule and no workers-recruited-from-beggars
constraint. That is a localized absence within those modules and search
terms, not a universal one.

Existing coverage is not reclaimed: the towns notes record the community
population doctrine from the Tippsammlung (its own chapter numbering, not
the manual's), the random-events note owns the events and weather sections
that follow on the same manual page, the politics notes own reputation,
and the feasts note owns celebrations. No research note takes manual
5.2.1-5.2.3 as primary.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, The Town's Citizens, Goods Supply and Infrastructure sections (printed pages 14-15): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: three strata with distinct interests, and even a wealthy town keeps poor workers; migrant beggars arrive as a town grows, need both work and a home to become citizens, and are the only recruitment source for new workers; an inhabitants view shows each group's size and satisfaction; satisfaction moves very slowly because need is remembered; expansion should focus on the poor as the population's foundation; individual citizens can be asked their needs and the trader's standing with their group; arrivals and departures on the roads can be watched and asked their reasons. Goods supply: people leave over shortages even with jobs and housing; per-class priority goods are listed (the poor center on grain, beer, fish and wood; the well-off on beer, fish and wool; the rich on meat, wine and cloth, each with secondary wants); citizens want several days of stock; the market hall shows weekly consumption. Infrastructure: satisfaction rides on development, housing for all strata, and the town's works. No rates, thresholds or group percentages are given. |
| S2 | Tippsammlung 2010 (community compendium), towns chapter: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf | Community mechanics for the same contract, already recorded in the towns notes and cited here only for the documented-versus-community split: beggars framed as the economy's recruitment pool with housing, jobs and satisfaction gating promotion; class growth bounded by percentage caps; named mood grades; a several-week stock target for high satisfaction. Exact P3 equivalence not claimed by the source: doctrine to test. |
| S3 | Old man's guide to Patrician III (Steam community guide), city growth section: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Independent community guide. Growth doctrine: keep food and drink stocked at reasonable prices and actually sold to the city rather than sitting in the warehouse, provide jobs and housing (timber houses for the poor), and keep luxury goods flowing for the higher classes. Community claims until tested; the sold-versus-warehoused distinction is its own operational detail the manual does not state. |

## Main inspection

Real grep and reading across `src`, `src/sim` and `web/main.mjs` for class,
mood, population, beggar and drift terms found the contract largely built
as own design:

- `src/sim/classes.mjs:1-21`: three classes (poor, middle, rich) with
  shares that grow the rich slice as a town enlarges, per-class daily
  baskets, and a class ceasing to buy a good past its price ceiling.
  Written from first principles per the header; the manual's three strata
  and per-class priorities corroborate the direction without being its
  source.
- `src/game/citylife.mjs:28-31`: mood starts content, moves toward today's
  reading by a small daily fraction over a memory window (`MOOD_MEMORY`),
  has a neutral point where the city neither gains nor loses people, and
  drifts a small share of neighbours weekly. The documented very-slow
  satisfaction is the parallel; our window is own tuning.
- `src/game/citylife.mjs:53-55`: effective population combines the base
  census, the player's houses, the weekly drift (the `citylifeExtra`
  helper at :48) and kept walls (the wall bonus at :54) - housing bounds
  growth, as documented. But in the population and recruitment modules
  inspected, the grep above found no beggar group, so the work-plus-home
  conversion and the workers-only-from-beggars rule have no located
  counterpart there.
- `src/game/growth.mjs:1-8`: a multiplier rides on the market's daily
  population figure, so a well-fed city's demand slowly swells and a
  hungry city's demand slowly shrinks - it adjusts what the market buys,
  it does not remove census inhabitants. Real population exit lives in
  citylife's drift and is gated to acute famine or regional shock
  conditions (`ACUTE_HUNGER_LINE`, `SHOCK_PENALTY`), not to any sustained
  shortage, and no employment gate enters either mechanism - both
  relevant differences from the documented contract, where people leave
  over shortages generally and conversion requires both work and a home.
- Mood surfacing is deliberately verbal: `src/game/moodout.mjs:1-8`
  narrates each city's mood as dockside talk and a town-hall line - words,
  never numbers - and the hall view assembles those living-city lines
  (`web/main.mjs:880`). The documented inhabitants view with per-group
  size and satisfaction numbers has no located numeric counterpart.
- Clicking citizens or road travellers for needs and reasons: no such
  interaction was located in the inspected views; citizens exist as
  aggregate classes, not addressable individuals.
- Weekly consumption figures and market information displays are already
  treated in the office-info and supply notes and are not re-searched
  here.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

The contract is largely built; the documented record's clearest gap in
the inspected population modules is the beggar pool. If selected later, the smallest faithful slice is not a new
class but a recruitment framing on the existing drift: neighbours arrive
as a visible migrant trickle whose conversion into the census requires
both employment capacity and housing, so a town with houses but no work
(or work but no houses) stalls - the documented both-or-neither rule -
while the drift magnitude and mood memory stay as they are. Flag-off must
mean byte-identical saves.

Future tests should prove: flag-off games untouched; conversion requires
both conditions independently; the trickle is deterministic by seed and
day; effective population composition stays consistent between market
demand and every view; and save/load round-trips without drift. Decide
first, as explicit owner calls: whether a visible migrant group fits the
game's direction at all, whether satisfaction should ever surface as
numbers (our surfacing is deliberately verbal), and whether per-class
priority goods should ever steer events or advice, given that our baskets
were written from first principles.

## Open questions

- Do P3 migrants ever arrive without a growing town, and what sends them
  away first - the missing job or the missing home? The manual states the
  both-required rule but not the dynamics.
- Does the slow satisfaction in P3 decay asymmetrically - fast to fall,
  slow to recover - or symmetrically as our memory window implies? The
  manual notes only that need is remembered.
- Do individual P3 citizens carry standing per group that differs from
  the town-level reputation, as the ask-a-citizen passage suggests?
  Untested.
