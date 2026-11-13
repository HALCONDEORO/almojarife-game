# P3 church charity and donations: the paid reputation lane the engine does not have

13 November 2026. Main inspected: `ece23cf`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

P3 gives every town a church with four player actions. Praying is presented
as flavour with no stated effect. Feeding the poor donates food goods from
the trading office or from ships in port and is documented to draw more
people to a town that needs workers. A money donation for the church
interior raises the trader's reputation and social standing, and the
splendour bought this way fades again if the donations stop. Paying toward
extending the church is documented as raising how well the citizens live,
across several upgrade levels; the donation pool is shared with other
benefactors, and the current collected level is visible before giving.

Almojarife has the building but not the lane. A chapel (`capilla`) is a real
civic work the player funds through the public-works rules, with epidemic
mitigation effects; nothing in the engine takes a donation, feeds the poor
or converts spending into standing. Reputation in a port rises only through
trade-coupled channels - selling into scarcity, buying, and contract work -
and decays when the trader stays away.

The towns notes list the church among the catalogued Kapitel 2 buildings
still owed a pass; this note is that pass, limited to the church building
itself. The P4 church
cycle note studies a different game, the politics notes cover rank and the
council, and the comparative statistics note covers ledgers. None covers
paid charity or donations.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Church section of the town buildings chapter, printed pages 35-36: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: four church actions (pray; feed the poor; donation for church interior; extending the church). Feeding donates food from office or ships and is pointed at towns needing workers, cross-referenced to the building chapter. Interior donation raises reputation and social standing, and the bought splendour gradually disappears if donations dry up. Extension has several upgrade levels, is documented as raising how well the citizens live, and shows the current donation level because other benefactors give too; the trader picks an amount. Pray is written as a joke with no stated mechanic. No costs, reputation amounts or decay rates given. |
| S2 | GRYOnline game guide, action buildings part 3, church section: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-3/zf36e1 | Polish walkthrough listing the same four actions in the same order: prayer as a wink, feeding the town beggars to attract more people when hands are needed, steady interior donations improving reputation and social position with splendour vanishing once they stop, and several extension levels with the collected subsidy visible since others give too. Tracks the manual point by point, so this is documentary overlap inside the same source family, not independent confirmation. |
| S3 | Old man's guide to Patrician III (Steam community guide): https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Independent community guide. Its church section adds one operational detail the manual omits: the cost of extending the church rises with each step (its exact figure is deliberately not adopted). Elsewhere the guide names the church among the buildings that raise standing with the law-abiding population. Community claim until tested; no amounts adopted. |
| S4 | Tippsammlung 2010 (community compendium of the pre-P3 era used as reference by P3 players), towns chapter: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf | Adds the population framing: feeding the poor through the church temporarily increases beggar immigration into a town, while a school building is the more permanent way to raise immigration. Exact P3 equivalence of every detail is not claimed by the source itself; treated as doctrine, not as P3 proof. |

## Main inspection

Real grep across `src`, `data` and `web/main.mjs` for church, chapel,
donation, charity, alms, pray and beggar terms found one chapel civic
building, one ambient flavour line and no charity or donation mechanic:

- `src/game/buildings.mjs:59` and `src/game/buildings.mjs:101`: `capilla` is
  a real buildable civic work with fee, build days, upkeep and levels, named
  "la capilla" / "chapel". `src/game/buildings.mjs:114` lists it among
  `CIVIC_BUILDINGS`, and `src/game/buildings.mjs:125` allows two per city.
  Its coded effects are epidemic mitigation: `src/game/plague.mjs:15` gives
  chapel levels days off against plague, and `src/game/calamities.mjs:16`
  counts one working chapel against the malsana calamity. It is the P3
  chapel-as-plague-buffer record, not the church-as-donation record.
- `src/game/buildings.mjs:122` (CIVIC_MIN_RESPECT): public works are
  funded by a citizen the port already knows, so our civic spending is
  gated by standing but does not create standing.
- `src/game/reputation.mjs:52-55` (`addRep`), `src/game/reputation.mjs:62-72`
  (`award`, reputation.mjs:61) and `src/game/reputation.mjs:77-83` (`repOnSale`, `repOnBuy`):
  port reputation moves on trade events only, with gains capped per port
  and day (`REP_DAY_CAP`, reputation.mjs:11) and losses uncapped; a decay
  pass runs daily but only fires on its monthly tick, and then only against
  ports with no trade recorded in that period (`decayRep`,
  reputation.mjs:90-105, called from `src/game/game.mjs:307`). No spend-money
  entry point into this track exists in the inspected modules.
- `src/game/citylife.mjs:1-43`: per-class mood from market basket coverage
  with weekly neighbour drift bounded by housing, and named civic buildings
  (posito, hospital, alhondiga) steadying moods. Classes come from
  `src/sim/classes.mjs`; no beggar pool term appears anywhere in `src` or
  `data`, and growth is a single slow multiplier on market demand
  (`src/game/growth.mjs:1-8`), not class recruitment from an immigrant pool.
- `src/game/identity.mjs:49`: church bells mark the hours of the day as an
  ambient identity line. The only church mention in the engine; it carries
  no mechanic.
- `src/game/festivals.mjs:1-8`: city festival days are own design (demand
  bump and mood lift), not a paid celebration like the market-square
  festivities the manual describes right after the church section; that
  adjacent topic stays out of scope here.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, the smallest faithful slice is a church charity lane on
ports that already have a chapel: a food donation that nudges the existing
growth multiplier for a while (the documented temporary immigration pull,
routed through growth.mjs rather than a new beggar pool), and a money
donation that moves port reputation through the existing `addRep`/`award`
path so the daily gain cap still binds, and lets the bought standing fade
on the same monthly decay tick that already governs trade-earned reputation
when the trader stops giving. Extension levels, other
donors and pray stay out of the first slice. Flag-off must mean no donation
entry points, no state keys and byte-identical saves.

Future tests should prove: flag-off games untouched; donation deltas pass
through `award` so the per-port daily cap binds exactly as for trade gains;
a food donation changes only the growth path, never prices or stock;
donation state round-trips through save/load without drift; and chapel
construction, plague mitigation, festivals and citylife behave exactly as
today whether the lane is on or off. Decide first, as explicit owner calls:
whether any spend-money-for-standing channel fits the game's direction at
all, whether donated food must be real stock from office or ships as the
manual describes, and whether fading splendour should ride the existing
monthly decay tick or carry its own timer.

## Open questions

- Does praying do anything at all in P3, or is it pure theatre as its own
  text implies? No source inspected states an effect; treat as flavour
  until shown otherwise.
- Does feeding the poor also raise reputation, or only immigration? The
  manual attaches reputation to the interior donation and immigration to
  the feeding, and S4 supports the immigration reading, but no inspected
  source states the feeding has zero standing effect.
- Whose donations fill the shared extension pool - rival traders, the town,
  or an abstract counter? Not stated in any inspected source.
- Do donation effects differ in Rise of the Hanse versus the base P3
  campaign? Not covered by the inspected sources.
