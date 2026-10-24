# Town industry, ownership and auctions (24 Oct 2026)

Status: pieces 1 (roster), 2 (ownership transfer) and 3 (almoneda auction engine) implemented. Own design and own numbers
throughout; nothing taken from any other game. Desktop only.

Owner direction (24 Oct 2026, WhatsApp): the city's industry should exist in the world
("ya hay mecánicas de fábricas, trabajadores y subastas..."), the initial production should be
moderate and owned by the city and other owners, leaving room for the player to build; and
auctions should cover "all kinds: houses, ships, factories, permits, whatever comes to mind".

## The problem

Every city produces goods from day one: `makeMarket` gives each city a production rate for the
goods it "makes", and `tickMarketCity` adds `rate * 2 * seasonMul` units per day
(src/sim/market.mjs). Most of the population already works the town's own economy:
`TOWN_JOBS_SHARE = 0.9` reserves 90% of a city's people before the player's buildings hire
anyone (src/game/buildings.mjs). None of this exists in the world or on screen: `g.buildings`
holds only the player's plots, bots do not build, and the city view draws the player's
buildings plus decorative housing. The industry the game says every city has is invisible.

## Piece 1 (this PR): the town industry roster

`src/game/townindustry.mjs` derives, from world data alone, the establishments behind each
city's abstract production: type, level, jobs, average output and owner. Pure and
deterministic: same world data, same roster in every save, like the town council. It changes
no number of the market model - it is a faithful representation of what the market already
does, sized against it:

- **Output accounting.** An establishment is a legal building: a type from `PRODUCERS` at
  level 1-3 (so it can later be sold as one), sized with the building semantics (batch
  pattern averaged over days, seasons averaging 1). Levels are split largest-first so the
  roster's total average output per (city, good) lands in `[target, target + one level-1
  house)`, where `target` is exactly the abstract production the market already regenerates
  (`rate * 2` units/day). Nothing is added on top: representation, not new production.
- **Coverage.** Goods with no buildable producer get a representation-only type, never a
  pretend chain: the tannery (`curtiduría`) for leather, the trading house (`casa de
  contratación`) for overseas goods (sugar, pepper, silk, saffron). These types are not in
  `BUILDING_TYPES` and are never offered to build.
- **Ownership.** Where a good supports three or more establishments, the concejo keeps the
  first one (municipal works); the rest belong to the port's named neighbours - the regidores
  and the alcalde from the existing `townCouncil` table, round-robin, so the same few
  families hold most of the trade. Small ports stay all private. The concejo is a minority
  everywhere. `share` records each establishment's fraction of the good's production
  (shares sum to exactly 1 per city and good), which is what a sale moves.
- **Labour.** Establishments carry the same `JOBS_PER_LEVEL` hands as player buildings. The
  whole roster stays far below the town's own 90% jobs share (measured: Cádiz 256 of 10,800;
  Sevilla 2,160 of 36,000): the visible industry is the named tip of the town economy, not a
  second workforce.

## Piece 2 (this PR's second branch): shares become real ownership

`buyEstablishment` (src/game/townindustry.mjs) moves one establishment to the buyer at an
agreed price: its share of the good's abstract production leaves the market's regeneration
(`tickMarketCity` multiplies the town's production by the entry's `townShare`, absent = 1,
so untouched rows and old saves are unchanged), the works land in `g.buildings` active at
their level marked `fromTown`, and their hands leave the town's 90% jobs share
(`townJobsFreed` in buildings.mjs: `freeLabor` rises by exactly the sold hands, so the
staffing arithmetic keeps meaning the same thing). A sold establishment then lives by the
player's rules: upkeep, wages, margin checks and halting. Municipal sales pay the town
chest (`creditCaja`); a neighbour's price is his own business (NPC purses are not
simulated). Representation-only types (tannery, trading house) are not for sale yet: they
have no entry in the upkeep and production tables. The whole piece is gated on the
town-industry flag (`g.townIndustry`, off by default): flag-off games are byte-identical.

## Piece 3: auctions (la almoneda)

Owner direction 24 Oct: auctions of all kinds - houses, ships, factories, permits and more.
One general mechanism, several lot sources, everyone under the same rules:

- **Lots.** Town-industry establishments (piece 2), houses, ships (e.g. a bankrupt bot's
  ship, or an old nao the concejo sells), permits (a building plot the concejo opens, a
  trading-office licence, dock rights) and goods lots (what a foreclosure seizes already
  exists in `foreclosure.mjs`: today it sells at half base value; it can sell at the
  almoneda instead).
- **Cadence.** One almoneda per city on a staggered weekly day (like the concejo meetings),
  with the lots cried some days ahead so the player can plan a trip. Deterministic schedule,
  seeded by city and day, like the council votes.
- **Bidders.** Named townsfolk and rival houses bid with their own means, by the same rules
  as the player (cash on hand, a valuation, no credit the player does not get). Valuations
  are deterministic and bounded so the balance gate stays meaningful; a lot with no takers
  is withdrawn, not given away.
- **Money.** The concejo's lots pay into the town chest (`creditCaja` already exists), so a
  port that sells its salinas taxes a little less; foreclosed lots pay the lender. The player
  pays cash on winning - no hidden credit.
- **Anti-abuse.** NPC valuations never chase the player upward without limit; the player can
  always lose an auction; reserve prices keep municipal property from going for a song.

## Later pieces

- UI: the industry roster in the city view (drawn establishments, after the scene handoff),
  an "Industria" section in the port window, and the almoneda itself (lots, bids, results).
- Runtime screenshots (desktop, Spanish) come with the UI piece.

## What this piece deliberately does not do

No production changes, no new buildings for the player, no UI, no auction logic. Saves are
untouched: the module is pure derivation and nothing calls it from the tick yet.
