# P4 tavern sabotage: hired villains, warehouse guards and bought absolution

13 November 2026. Main checked: `d8d6a82` (through PR884).
Scope: public P4 documentation and accounts of sabotage between competing
traders: hiring villains in the tavern, defending warehouses with guards,
reputation consequences and indulgences. The base game and the Rise of a
Dynasty expansion are identified separately where a source distinguishes them.

## Finding

Almojarife already carries every seam of the sabotage loop except the offense
itself. Rival houses exist as named competitors
(`src/game/rivalhouses.mjs:1-11`). A per-port warehouse watch with hired guards
and a security grade exists, and its own header states that no theft mechanic
exists behind it (`src/game/whwatch.mjs:1-17`). Port justice raises charges
for smuggling, fraud and piracy (`src/game/justice.mjs:1-6`), and a pardon
module sells infamy absolution for money, flag-gated
(`src/game/pardon.mjs:1-6`). What public P4 sources describe and our game
lacks is the tavern-villain offense: paying dubious characters to harm a
competitor, with guards as the defense and reputation loss on recognition as
the cost. This note does not approve implementing sabotage, rival sabotage
against the player, or any specific crime list.

## Sources and method

Relevant sections of these public pages were fetched and read on the date
above; the publisher manual was downloaded in full and searched as text. No
binary, extracted data, utility chart, modding-internals reference, competitor
code, art, dialogue, numerical table or copied source wording was used. No
game experiment was performed. Described mechanics are not measured formulas.

One source was examined and rejected: a Patrizierforum thread titled "P4
Intrigue in the Hanse" (patrizierforum.net thread 1715). It is a 2007
pre-release Off Topic fan design thread, written before the game shipped; its
intrigue concepts are speculation about a future game, not documentation of
the released one, so nothing from it is cited below.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Town buildings (Tavern), Church and Reputation sections: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | The tavern lets the player hire villains for ethically questionable jobs, sabotaging competitors among them; the reputation list includes sabotage and piracy as lowering reputation, conditional on being recognized; indulgences bought at a cathedral instantly clear negative reputation gained through piracy or sabotage, for a large payment. Does not enumerate the available sabotage actions, their cost or their effect. |
| S2 | Heraclitus, Steam guide, Counting House, Tavern and Church screens: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | The tavern's guest screen offers quests, loans, training and dishonest ways of sabotaging opponents; the warehouse screen lets the player choose how many guards protect the warehouses against sabotage; indulgences restore reputation damaged by underhanded tactics such as piracy or sabotage. Consistent with S1; still no action list or figures. |
| S3 | P4 Wiki, Counting house: https://patrician4.fandom.com/wiki/Counting_house | Guards protect buildings and stored goods against theft and sabotage; goods held in rented storage are described as particularly vulnerable to sabotage by a competing trader. Community documentation, not independent measurement; its per-population guard advice is not adopted. |
| S4 | Steam discussion, How to lower the prices of competitors business: https://steamcommunity.com/app/57730/discussions/0/1628538707064409795/ | A player lists three manual-derived ways to make a competitor remove a production business, one of them sabotage; the thread compares it with market flooding and blockade. Version-specific anecdote, cited only as testimony that sabotage can affect a competitor's production buildings, not as authority on how. |

## What the sources support

- Sabotage exists as a paid offense against competitors, initiated through
  the tavern by hiring villains for questionable work (S1), exposed on
  the tavern's guest screen among quests and loans (S2).
- The defense exists on the warehouse screen: guards the player hires
  protect warehouses from sabotage (S2, S3).
- The cost model is reputational, conditional on recognition: the manual's
  reputation list penalizes sabotage only when the perpetrator is
  recognized (S1).
- Absolution is purchasable: cathedral indulgences erase reputation damage
  from piracy or sabotage for a significant payment (S1, S2). The cathedral
  tier of the church upgrade chain gates this, so absolution is a late,
  expensive option, not a routine fee.
- Whether rivals can sabotage the player is weakly supported: a community
  wiki describes rented storage as vulnerable to sabotage by a competing
  trader (S3), which implies an opposing actor, but no primary source
  confirms rivals initiate sabotage.
- A community anecdote associates sabotage with a competitor demolishing a
  production business (S4). It is testimony, not a mechanism description.

## Comparison with current code

- Competitors to target exist: rival houses with home ports and profiles
  (`src/game/rivalhouses.mjs:1-11`), each with private knowledge
  (`src/game/botintel.mjs:1-3`).
- The defense seam exists but defends nothing: the warehouse watch hires
  guards, grades security and mitigates fires, and its header records that
  no theft mechanic exists (`src/game/whwatch.mjs:16-17`). P4 ties the same
  guard hiring to protection from sabotage (S2, S3).
- The penalty seam exists with other charge types: port justice raises
  charges for smuggling, fraud and piracy, scaled by infamy
  (`src/game/justice.mjs:1-6`); nothing found for sabotage or arson.
- The absolution seam exists: a pardon purchase resets infamy for a
  payment to the realm, flag-gated and rate-limited
  (`src/game/pardon.mjs:1-6`). P4's indulgence plays the same role for
  sabotage and piracy reputation (S1, S2), placed on the church rather
  than on a realm.
- A recognition model exists in spirit: justice charges are raised when a
  deed is detected (`src/game/justice.mjs:4`), matching the manual's
  recognition condition (S1), though detection today is caller-driven
  rather than probabilistic.

## Open questions

- Which concrete sabotage actions the tavern offers (warehouse theft, arson,
  production disruption), their individual costs and effects. No public
  source read enumerates them.
- How recognition works: probability, evidence, witnesses, and whether the
  hired villain can fail or be caught independently of the player's
  exposure. Unverified in every source read.
- Whether rivals sabotage the player in the released game, and if so what
  triggers it. Only a community wiki hints at an opposing actor (S3).
- Whether sabotage targets only warehouses and goods or also production
  buildings; the production-building link rests on one anecdote (S4).
- Whether the expansion changes the sabotage offer. The expansion manual
  was not found to mention sabotage in the sections checked; absence here
  is not proof of absence elsewhere.

## Design observation (own, not implementation)

If this gap were ever filled, the existing seams define the shape: villains
hired where assignments are already surfaced, rival houses as targets, the
warehouse watch's guard level as the defense variable (giving the existing
grade a real threat to grade against), detection feeding a justice charge,
and the pardon/indulgence purchase as the paid reset. Any such work would
need its own design approval; this note records the research boundary only.
