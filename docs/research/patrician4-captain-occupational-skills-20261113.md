# P4 captain skills: occupational effects and an obsolete automation gate

Research date: 13 November 2026. Almojarife main inspected: `480de7e`.
Clean-room documentation only; no skill, fee, trainer or route restriction is
approved by this note.

## Scope and overlap check

A real grep of the current research notes for captain, trainer, trade experience
and repair experience found P3 scarcity, captain transfer, navigation and trade
purchase-discount discussions. Those are related but not this P4 mechanic:
occupational experience changes trade-stop duration and repair time, while the
addon explicitly removes an old experience prerequisite for automatic routes.
This note does not repackage the P3 purchase discount as a P4 rule, nor the
university or shipyard experience systems as captain training.

Public base/addon manuals, wiki pages, a community guide and a contemporary review
were read. No game code, extracted data, modding/decompilation source, assets,
source coefficients or copied source wording are included. No gameplay experiment
was run. The artifact is one independent docs addition on the pinned main.

## Documented P4 mechanics, with edition boundaries

### Skills affect different activities, not one universal competence multiplier

The base manual describes separate captain experience domains for combat,
navigation, trade and ship-related technical work. Their documented effects are
respectively combat damage, sailing speed, time spent stopped on trade routes and
repair duration. The technical domain's label should not be mistaken for a
shipyard construction-speed bonus: the listed effect is on repair time. [S1]

The community guide and captain wiki align on these activity/effect pairs and
associate practice with the matching activity. The manual more generally describes
experience accumulating and occasional tavern trainers; the contemporary review
also reports paid training in trade, repair and combat skills. These sources support
practice plus training as documented routes to expertise, not a recovered XP
threshold table or a guarantee that every attempted action awards progress. [S1,
S3, S4, S5]

This distinction matters economically. A shorter trading stop improves throughput
through time, whereas a purchase discount changes the price of the transaction.
P3's discount notes do not justify adding a P4 price advantage to every sale or buy.
Neither source family settles the other game's formula.

### The addon expressly corrects a base-manual prerequisite

The base manual lists prior trading experience as a requirement for automated
routes. The addon manual's corrections explicitly remove that requirement.
The captain wiki still reproduces the older gate. For addon behavior, the newer
primary correction is stronger evidence than that undated wiki requirement. [S1,
S2, S3]

The correction removes a trade-experience prerequisite. It does not say captains
or trade experience cease to exist, that all skill effects vanish, or that every
other route precondition is removed. Do not block a newcomer from automation on
the strength of the base-manual table alone.

### Do not invent one universal expedition threshold from conflicting pages

The base manual and captain wiki agree that navigation experience gates expeditions,
while the expedition wiki states a stricter navigation requirement. No build-specific
observation here resolves that disagreement. Therefore navigation-gated expeditions
are documented, but an exact universal threshold is not established by this note.
No source values are imported into Almojarife. [S1, S3, S6]

The captain wiki also marks its own city-specific trainer specialization claim as
needing verification. That warning is preserved: no deterministic port-to-subject
training map is reconstructed from that passage. [S3]

## Current Almojarife code, not historical roadmap labels

| Code | Verified behavior | Narrow delta |
| --- | --- | --- |
| `src/game/captains.mjs` | Deterministic tavern roster; hire/dismiss history; navigation, weather and defence readers; skill-scaled price/wage; navigation speed effect | No trade-stop or repair-specialist skill in this catalogue |
| `src/game/captainxp.mjs` | Experience for the existing skills, bounded promotion and wage adjustment | There is already an experience engine; this is not a missing-XP proposal |
| `src/game/game.mjs`, arrival and encounter wiring | Arrival calls navigation XP; encounter outcomes feed weather/defence experience | P4's trade/repair practice domains are distinct from the current domains |
| `src/game/game.mjs`, `orderRepair` / `processRepairs` | Repair orders quote, advance, finish and support cancellation | No captain repair-skill duration modifier was found in these paths |
| `src/game/routes.mjs` | Executes player route rules with trade-price and cargo checks | No P4-style trade-experience gate or trade-skill lay-time reduction was found |

`newGame` enables captain XP unless explicitly disabled. The module header's old
default-off wording is stale; the live initialization is the evidence. Captains,
automation and repairs already work and must not be reimplemented under a broad
parity label. No reserved lazy initializer or economy code was changed.

Author baseline: existing captain, captain-XP, captain-effects and repair-order
suites pass. These are regression checks, not new-feature tests or independent
review. The grep/effect inspection is bounded to the listed source paths.

## Own-design recommendation, not implementation approval

Retain current automation access. If occupational specialisms are later selected,
first test a bounded repair-time specialization separately from trade-stop timing.
A trade-throughput skill has no useful meaning unless the game actually models a
stop duration that the player can see; it must not become a hidden price discount
as a shortcut. Avoid adding a compulsory skill gate simply to create progression.

Choose who owns the expertise: Almojarife currently attaches a captain to a ship,
while P4 describes a captain leading a convoy. Define whether a specialist affects
only their ship, an entire convoy, or an order at a port. Do not multiply the same
bonus once for every convoy member or leak it to an unrelated ship in the yard.

Settle repair timing when a captain changes, leaves or gains a level mid-order.
A quote-time lock and a daily recalculation are different policies. Cancellation
must preserve its existing settlement contract, not enable repeated repair-start
farming. Likewise decide whether practice requires completed repair work or merely
an accepted order; the sources do not recover that lifecycle.

Paid training, roster renewal, trainer availability and wage changes are separate
product/economy decisions. Public P4 training evidence does not authorize automatic
spending or a retune of current captain fees. Historical suitability for Iberian
crew organization also needs its own sources.

Candidate tests if this option is chosen:
- No new option preserves current route access, fees, seeded travel and saves.
- Trade specialization changes only the selected time behavior, not market quotes,
  treasury income or cargo conservation.
- Repair specialization changes only eligible work and respects the selected
  quote/recalculation policy on captain dismissal, transfer or promotion.
- Repeating a start/cancel pair or reloading an order cannot farm practice or
  duplicate progress, refunds, wage changes or notifications.
- A convoy receives a benefit once under its defined scope; unassigned ships and
  other port occupants cannot inherit it accidentally.
- Imported malformed skill/XP state cannot produce negative durations, infinite
  speed, NaN wages or loss of a valid existing captain.

## Open verification work

Exact P4 practice awards, training availability, city specialization, captain
transfer semantics, convoy-wide application, repair-in-progress changes, and the
expedition prerequisite disagreement remain open. Documentation does not establish
a patch-specific implementation or a universal optimal training strategy.

## Sources

All fetched 13 November 2026. No source balance values or source quotations copied.

- **S1, primary:** Kalypso, P4 English manual, Captains. Date not shown. Primary
  support for distinct activity effects and the base-version route prerequisite.
  https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- **S2, primary correction:** Kalypso, Rise of a Dynasty addon manual, Changes made
  to the Patrician IV manual. Removes the trade-experience route prerequisite;
  stronger than an unrevised base-manual/wiki table for this addon.
  https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- **S3, community wiki:** Captain. Date not used. Corroborates skill domains and
  activity associations, but retains the old route gate and flags city trainers
  for verification. Not treated as current-edition ground truth.
  https://patrician4.fandom.com/wiki/Captain
- **S4, community guide:** Steam, Patrician IV Guide, navigator/experience section.
  Date not used. Corroborates activity/effect pairs, not hidden XP formulas.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- **S5, contemporary review:** Hooked Gamers, P4 review, 1 October 2010, second
  page. Reports practice and paid trainers; not addon prerequisite evidence.
  https://www.hookedgamers.com/pc/patrician_iv/review/article-595-2.html
- **S6, community wiki:** Expeditions. Date not used. Navigation requirement differs
  from the captain page/manual; preserved as unresolved rather than averaged.
  https://patrician4.fandom.com/wiki/Expeditions
