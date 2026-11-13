# P3 manual chapter 14 and 10.10.6: expeditions and who sees what was discovered

13 November 2026. Main inspected: `6725acc`.
Clean-room documentary note, own words only. No copied prose, source figures,
assets or excluded material. No change is approved.

## Scope and overlap

Source S1: Patrician III English manual, chapter 14 (printed and PDF pages 55-56),
section 10.10 (the guild introduction on page 34, 10.10.6 on page 35), read page
by page. http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf
Only S1 is used. Not opened or verified: any running P3 session or other pages.

Overlap checked. Grep of `docs/research` for expedition, Mediterranean,
discover and "trading centre" found the Tippsammlung expansion notes (the
community compilation's expedition strategy), expansion2, random-events (a
passing mention) and P4 notes. None reads the manual's own chapter 14, and no
note contains "trading centre". PR 930-952 file lists contain nothing on
expeditions or the guild.

## What S1 says

- The Mediterranean is reached by sending a convoy, not a single ship, from the
  sea map. Its towns start unknown, are placed differently in each game, and are
  of distinct kinds: trading posts with larger stocks and demand, and harbour
  towns with less. Success raises standing in the League.
- Each expedition has a limited ordered list of destinations. A known town gets
  buy/sell orders; a stretch of coast with no known town is searched for
  settlements. The text advises spacing destinations widely.
- Known towns show which goods they want and offer; the player can disable
  individual goods, load goods to sell, and give gold to buy. The captain sells
  before buying, so sales can fund purchases. Towns absorb and supply limited
  amounts, so revisiting a destination too often gives an empty return.
- Orders: exploring (larger charted area, better odds of finding partners,
  longer at sea), trading (better prices), contracts (seeks a partner for a
  time-limited agreement for a guaranteed quantity and price; the agreement ends
  at its date whether or not it was fulfilled; normal trade continues alongside;
  negotiation is slow, which limits how many agreements an expedition brings).
- Risks: wear is higher in unknown waters, plus storms and pirates; pirates can
  take the gold and leave the goods.
- On return a letter reports goods and prices, whether a contract was
  fulfilled or signed, and any newly found trading post or harbour town.
- 10.10 introduction (page 34): guild membership is optional but is what gives
  access to expeditions, auctions and public convoys. 10.10.6 (page 35) shows an expedition map of
  discovered trading centres: a non-member sees only what they discovered
  themselves, a member sees what members of all listed guilds discovered.

## Own source (main 6725acc, function bodies read)

- `src/game/fog.mjs:33-40` `discover` and `53-70` `refreshDiscovery`: a port goes
  on the player's chart when a ship is there or passes within a fixed radius, or
  when a tavern rumour makes it live. Discovery state is the single `g.discovered`
  map. `42-51` `startingChart` seeds the home coast.
- `src/game/charts.mjs:29-40` `buyChart`: a purchased chart puts a whole coast on
  the map, no prices revealed; needs a ship in port and cash.
- `src/game/contracts.mjs:26-38` `rollContracts` posts a town offer for a scarce
  good; `75-88` `expireContracts` removes a contract past its due day, counts a
  failure and lowers that town's standing. So a contract ending at its date
  regardless of fulfilment is already close to ours, with a standing penalty the
  manual does not state.
- Real grep of `src` and `web` for guild/gremio found only campaign story text
  in `src/game/campaigns.mjs`; for `discovered`/`isDiscovered` the callers are
  almoneda, botintel, charts, origin and the map in `web/main.mjs`. Among those
  none shares discovery between players or houses. Scope: those terms, those
  directories.
- No code path was found for a convoy-only long trip with orders, a returning
  letter or a separate far region. Scope: grep for expedition and Mediterranean
  found only rival-house names, shock regions and weather regions.

## Reading for Almojarife

Our exploration is passive and per player: sail past, own a ship, hear a
rumour or buy a chart. The manual's expedition is an active, queued action with
orders, money and a report on return, and its guild view makes discovery
partly social. No gap is declared: the setting differs (no far unexplored
region here) and no patch is proposed.
If an exploration action is ever wanted, requirements from this reading: it
must report plainly what was found and what it cost, state its risk before
departure, keep contract-like promises on explicit dates, and avoid giving
members of one house knowledge of another's charts without a visible rule.

## Open questions

- How much guild membership costs, and how much of the shared map is gated:
  not in these pages.
- Whether an expedition with several orders can overlap with route trading of
  the same ships: not stated.
- What decides how many towns are found by an exploring order: not stated.
- Whether a shared-chart idea fits our house rivalry model: own design question.
