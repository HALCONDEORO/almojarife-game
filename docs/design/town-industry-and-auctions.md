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

## Integration findings from the first full-suite run (24 Oct 2026, evening)

Turning the flag ON by default (owner's order, same as citylife) ran the engine inside every
legacy test and surfaced three integration faults. How each was fixed, and why:

1. **Save fidelity.** `townSales`, `townBids` and the transfer's `buildings` maps were created
   with `Object.create(null)`; the JSON round-trip returns plain objects, so a saved game never
   deep-equalled the live one. The repo rule already existed (walls.mjs: persisted state is a
   plain object, never `Object.create(null)`); the stack now follows it everywhere it writes
   state. A round-trip test after a sale plus a standing bid pins it.
2. **Notice reach.** Every port's weekly hammer posted to the player's inbox (~20 ports/week
   against MAX_INBOX 60), evicting older notices - the season notices died unseen. The fix is a
   reach rule, not a bigger box: you hear the hammer where the town is on your chart
   (`isDiscovered`) or where you sat at the table yourself (any bid of yours, including the one
   your purse cannot keep). A far port you have never charted stays silent. Engine state is
   untouched: sales still record, only the gossip is gated.
3. **The concejo's chest.** Municipal proceeds credit the chest per the owner's design, so the
   old idle-year band (chest ≤ 3×target, written when taxes were the only income) failed on
   legitimate one-off sales. Widening the band would have hidden real leaks, so the invariant
   was rebuilt to tell the three money kinds apart: municipal sale income is tracked apart
   (`hallAlmoneda`, per city, on every channel: the NPC hammer, the player's hammer and direct sales), and the gate asserts `0 ≤ caja ≤ 3×target + hallAlmoneda` - never
   bankrupt, and never above taxes-plus-verified-sales. Conservation is proven per sale (chest
   and ledger move exactly the hammer price; a sold works never comes up again) and finiteness
   by exhaustion (each municipal works sells once at ≤1.15× its valuation; once the last one is
   gone the income line stops dead, tested over two idle years plus a quarter). The concejo may
   spend or relieve the windfall - money is fungible - so the tax part alone is not banded.
   Note: auction rosters live in the GAME world (optional goods included); bounds computed from
   the raw data file undercount and fail honestly, as Valencia's pottery showed.

## Piece 4: the almoneda sells more than establishments (25 Oct 2026)

The owner asked for auctions "of every kind: houses, ships, factories, permits, whatever you
come up with" ("subastas de todo tipo casas barcos fábricas permisos lo que se te ocurra",
24 Oct 2026). Factories were the establishment roster (pieces 1-3). This piece adds the first
two generated lot kinds; piece 5 (below) adds goods lots and building permits on the same
rails. Design decisions below are this piece's choices under that creative brief, not user
defaults: each is argued from the existing systems and is tunable in one place
(`src/game/almoneda.mjs`).

**Generated lots, not world objects.** Establishments are finite world objects with a sold
registry. Ships and houses are generated per auction day from the city's seeded rng and need
no registry: the same day always offers the same lot, and the lot either sells that day or is
gone. This keeps save format and world state untouched until a hammer actually falls.

**Cadence (balance choice).** A city offers a used ship every `SHIP_EVERY = 4` auction cycles
(i.e. every 4 weeks) and a town house every `HOUSE_EVERY = 2` cycles, each on its own seeded
offset so ports do not sell the same kind the same week. Rationale: the establishment roster
sells about one works per week while it lasts; a ship a month and a house a fortnight add
variety without flooding the table, and the cadence cap lets the council-chest invariant stay
a hard bound (tested) instead of a hope.

**Valuation (balance choice).** A used ship is valued at `shipLotValue = max(1, round(type.price x
hull/100 x 0.95))` with hull 55-90%: always below the new-ship price (a worn hull is never
worth more than a fresh build), always above scrap. A house reuses `establishmentValue` for
`{type:"house", level 1-3}` so its price tracks the same works-valuation curve as everything
else the almoneda sells. Reserves stay `0.6 x value`; bidder maxima stay the roster's
0.70-1.15x, so second-price mechanics and the 1.15x income bound carry over unchanged.

**Seller (balance choice).** About half of generated lots are sold by the concejo, half by a
named neighbour (seeded). Only the player's real coins move the chest: when a neighbour wins
a generated lot, no chest income is recorded, because neighbour purses are not simulated and
crediting the concejo would mint phantom money every week (verified: it broke the
poor-chest tax behaviour). When the player wins a municipal lot, the price credits the chest
and is tracked apart in `hallAlmonedaGen` so the tax-band invariant stays a tax band; the
bound is cadence-based (`cycles x (max ship / SHIP_EVERY + max house / HOUSE_EVERY) x 1.15`)
and tested over six idle months. A multi-seed (3 seeds x 180 idle days) state-hash comparison
against the pre-change baseline is bit-identical: for a player who never bids, the new lots
change nothing - not the chest, not taxes, not the inbox.

**Bids are per lot.** `townBids[cityId]` is now a map `{lotId: max}`. A bare number from an
old save is read as the establishment table's bid, so old saves keep their meaning. The day
hook brings every lot down in order, one hammer each.

**Settlement.** A won ship is delivered moored at the port with its worn hull (`makeShip` +
hull), a won house needs the same trading office as any building purchase and lands in
`g.buildings` as an active house (it feeds the population bonus like a built one). A winning
bid the player cannot settle - no cash, or no office for a house - is voided with a notice and
the lot passes to the next bidder instead of dying silently (this last part deliberately
changes the old establishment behaviour, where an office-less win silently kept the works).

**Noise budget.** Establishment results keep the old reach rule (discovered port or joined
table). Generated lots cry their result only at a table the player joined: a weekly ship plus
a fortnightly house at the home port would roughly triple the baseline notice rate, and
MAX_INBOX eviction is a real failure mode (see the integration findings above).

## Piece 5: goods lots and building permits (25 Oct 2026)

Two more generated lot kinds on the piece-4 rails. Same rules: seeded per auction day, per-lot
bids, second-price hammer, fall-through when a winner cannot settle, chest tracking apart under
`hallAlmonedaGen`, result notices only at a table the player joined. Design decisions are this
piece's choices under the same owner brief, argued from existing systems and tunable in one
place (`src/game/almoneda.mjs`).

**Goods lot.** A seized or surplus lot of one good the port produces (`city.makes`), 10-60
units (seeded), valued at `qty x live local price x GOODS_VALUE_MUL (0.9)`: an auction discount
off today's market, so the hammer is sometimes a bargain and sometimes not, which is what an
almoneda is for. Cadence `GOODS_EVERY = 6` cycles. Settlement delivers the units into the
player's warehouse in that port under the canonical capacity rule (`whUsed + qty <=
warehouseCap`, the same units-based rule `storeGoods` uses; there is no per-good weight table
today - if one arrives, this check adopts `qty x weight`, one line). The hammer price is
recorded as the goods' `basis` so the profit ledger stays honest. No warehouse or no room: the
bid is void with a notice and the lot falls to the next bidder.

**Building permit.** A municipal paper that pays the plot price of one solar in that port,
redeemed at `buyPlot` (same office gate; the plot is still chosen and validated by the normal
purchase path, so the engine never enumerates the view-owned city layout). Valued at the
`plotPrice` formula with a canonical mid-size plot (area 100, standard type multiplier) on the
port's population: the paper's assessed value, not one specific plot's. Cadence
`PERMIT_EVERY = 5` cycles. A permit for a port without an office waits in
`g.almonedaPermits[cityId]` until there is one. Cash-path `buyPlot` returns are unchanged;
only a permit-paid purchase reports `permit: true`.

**Chest bound.** The cadence cap in `test/council.test.mjs` gains both kinds:
`cycles x (... + max goods / GOODS_EVERY + max permit / PERMIT_EVERY) x 1.15`, with
`maxGoodsLotValue` at the 3x price clamp and `maxPermitLotValue` at the largest port's
population. The invariant stays a hard, tested bound.

**Deliberately not done.** Justice seizures (`justice.mjs` counts seized goods that today leave
the game) and foreclosure stock are the natural future source of real confiscated lots, but
recabling those flags into the almoneda is a cross-flag design decision of its own (piece 6),
not smuggled in here. The barrel/bale cargo-weight idea (owner, 25 Oct) belongs to the market
model; the goods lot follows whatever capacity rule is canonical when it lands.

