# P3 feasts and marriage: player-hosted celebrations the engine does not have

13 November 2026. Main inspected: `7989210`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

P3 lets a trader host a feast for the whole town from the market square.
The required food and drink must be present in the trader's office the day
before; how many citizens attend depends on the trader's popularity and is
described as hard to estimate; guests consume goods per head; a feast that
goes well lifts town reputation strongly, and the reputation chapter warns
that a botched one damages it. The same chapter adds a family lane: a matchmaker
writes offering a partner for a fee, a second letter carries the candidate's
details, the trader has a short decision window, the wedding needs the same
feast goods, a dowry arrives the day after, and spouse and children give a
small standing boost visible in the office's Personal Matters screen.

Almojarife has neither lane. City festivals exist but are ambient: the city
itself keeps a festival day, demand for drink rises and the mood lifts a
little; the player never organizes, provisions or hosts anything. Real grep
across `src` and `data` for wedding, marriage, spouse, dowry and children
terms found no family mechanic, and no feast-specific reputation endpoint
exists; reputation today moves through trade, contract and justice channels
(the paid charity lane from the church note is researched, not built).

The mechanics overview lists holding celebrations among generic reputation
levers in one line; the events/trader-AI note lists feasts with a real
logistics bill per guest and a celebration-before-election timing play as
proposal bullets, without a state analysis; the church note explicitly left
the market square out of scope; the P4 family-home note is a different
game. This note is the bounded look at the feast and marriage contract
itself.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Market Square section (printed page 37; page 36 is prior church context) and the reputation and family parts of the councillor chapter (printed pages 44-45): http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: a celebration can be organized for the town's citizens; the needed goods (grain, beer, wine, honey, fish and meat) must be in the trading office the day before; attendance depends on popularity and is hard to estimate beforehand; a successful feast lifts town reputation strongly. The market-square section does give a per-guest consumption approximation; it is deliberately neither reproduced nor adopted here. The reputation chapter warns that organizing unsuccessful feasts hurts, contrasts quickly-fading feast and delivery reputation with the lasting effect of a donated building, and states that a wife and children raise reputation to a lesser extent while the dowry brings a financial benefit - with no dowry amounts or standing values on those pages. The family section documents the matchmaker letter for a fee, a second letter with the candidate's details, a decision window of a few days, feast goods needed before the wedding day, dowry the day after, and the effect observable in the office's Personal Matters view. |
| S2 | GRYOnline game guide, action buildings part 3, market square section: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-3/zf36e1 | Polish walkthrough listing the same feast contract in the same order: goods staged in the office the day before, attendance tied to popularity and hard to predict, per-head consumption (its exact rates deliberately not adopted), and a strong reputation payoff when the party succeeds. Tracks the manual point by point: documentary overlap inside the same source family, not independent confirmation. |
| S3 | Old man's guide to Patrician III (Steam community guide), festivals and marriage sections: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Independent community guide. Adds community stocking guidance and dowry claims beyond the manual: a per-good split of what to stock for a party (exact rates not adopted), marriage described as especially profitable early, a successful party named as a requirement, and the dowry claimed to scale with how good the party was, arriving as one or more ships loaded with goods of variable value. Community claims until tested; no amounts adopted. |

## Main inspection

Real grep across `src` for feast, celebration, wedding, marriage, spouse,
wife, dowry and children terms found the ambient festival module and no
player-hosted or family mechanic:

- `src/game/festivals.mjs:1-8`: each city keeps its own stable festival
  day; on that day demand for drink doubles in the daily market recompute
  and, with citylife on, the mood lifts a little; a docked ship hears about
  it once a year. Own design, flag-gated (`g.cityFestivals`). Nobody hosts,
  nobody provisions, attendance is not modelled, and reputation is not
  touched.
- No wedding, marriage, spouse or dowry term appears in the inspected
  `src` and `data`. `src/game/household.mjs:1-8` is a household tribute
  into city funds, flag-controlled and enabled by default in new games
  (`src/game/game.mjs:152` sets `household: true` unless the option opts
  out) - a tax channel, not a family simulation.
- `src/game/reputation.mjs:52-55` (`addRep`, the exported generic mover):
  port reputation already moves through several channels - trade events
  (`repOnSale`/`repOnBuy`, reputation.mjs:77-83, with per-port daily gains
  capped inside `award`, a private helper at reputation.mjs:61 that nothing
  outside the module can import today), contract completion and lapse
  (`src/game/contracts.mjs:69` and `src/game/contracts.mjs:84`), and a
  piracy hit at the victim's home port (`src/game/justicewire.mjs:26`).
  Decay is evaluated daily and applied on its monthly tick against ports
  with no trade in the period (reputation.mjs:90-105, called from
  `src/game/game.mjs:307`). What does not exist is a feast-specific
  endpoint, and there is no capped public route for a new caller: giving a
  future feast lane the same daily cap would be an owner decision and API
  work, not an import of `award` as it stands.
- `src/sim/needs.mjs:8` (NEED_GROUP): our goods basket already covers
  grain, beer, wine, fish and meat - the documented feast basket maps
  almost one-to-one onto existing goods, with honey the only member
  without an analog.
- Attendance grounding exists in pieces: per-class mood from market
  coverage (`src/game/citylife.mjs:11-23`, classes from
  `src/sim/classes.mjs`) and a market population figure the growth rule
  rides on (`src/game/growth.mjs:1-8`). No per-event attendance roll
  exists.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, the smallest faithful slice is a host-a-feast action on
a port where the trader has a presence: stage the basket goods the day
before, roll attendance from the city's population figure and mood, consume
stock per guest, and push the outcome through the reputation track, with a
shortfall reading as a failed feast and a small negative. Where the staged
goods come from is genuinely open in our engine: goods live in port
warehouses (`g.warehouses`, `src/game/game.mjs:152` and
`src/game/game.mjs:187`), offices are a separate entity, and a reserved lot
in the spirit of the warehouse goods lock is another option; that
provenance question must be settled before any API or accounting choice.
The marriage lane - matchmaker, decision window, dowry, spouse standing -
is a separate later decision and stays out of the first slice. Flag-off
must mean no feast action, no state keys and byte-identical saves.

Future tests should prove: flag-off games untouched; a feast consumes only
its staged stock, never market stock directly; the reputation delta uses
whatever capped route the owner decision opens; attendance and outcome are
deterministic by seed and day; feast state round-trips through save/load;
and festivals, citylife moods and growth behave exactly as today whether
the lane is on or off. Decide first, as explicit owner calls: whether a
player-hosted celebration fits the game's direction at all, which stock the
feast may draw on and how it is reserved, whether a failed feast may push
reputation negative, and whether the feast's reputation should fade on the
existing monthly tick or faster, given the manual's lasting-versus-fleeting
contrast (the politics note already flagged the missing
permanent-versus-temporary split; this note does not reclaim it).

## Open questions

- What actually drives attendance beyond popularity - town size, class
  mix, timing near elections? The sources name popularity only, and the
  election-timing play from the events note remains a single community
  claim.
- How fast does feast reputation fade relative to trade-earned reputation?
  The manual states the contrast qualitatively; no rate is documented in
  the inspected sources.
- Is the matchmaker offer a one-time event per game, rank-gated, or
  recurring after refusal? Not stated in the inspected sources.
- Does the dowry really scale with feast success, and does it arrive as
  goods and ships as S3 claims? Single-source community claim until
  tested.
- Do the feast basket or the family lane change in Rise of the Hanse?
  Not covered by the inspected sources.
