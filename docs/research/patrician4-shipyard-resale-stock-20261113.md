# P4 shipyard resale stock: ready vessels versus construction orders

Research date: 13 November 2026. Inspected Almojarife main: `480de7e`.
Clean-room documentation only; no fleet-market feature or price change approved.

## Scope and overlap check

A real grep of research notes for second-hand ships, pre-built stock, shipyard
stock and resale found company-share resale and territorial rights, but no study
of P4's shipyard resale inventory. P3 auction discussions and shipyard development
already exist. This note is narrower: a yard offers ready ships originating in
other traders' sales, alongside orders to build new ships. It concerns the fleet
and shipyard themes of the backlog, not moored-fleet maintenance, captain skills,
university research or auction price fairness.

Public manuals, published/community guides, a wiki and contemporary reviews were
read. No executable, proprietary data, modding/decompilation documentation, source
price table, copied source text or artwork was used. No live game observation was
performed. The sources establish a documented interface and provenance claim,
not a proven conserved simulation of every vessel's identity.

## What P4 documents

### Buying a ready ship is not placing a construction order

The official manual distinguishes commissioning a vessel from purchasing a ship
already in the yard's stock. It says offered stock comes from ships sold to the
yard by other traders, and permits the player to sell ships there as well. It
also describes ready-stock purchase as expensive. This supports a documented
secondary-market role, but not a hidden inventory-generation formula. [S1]

The published guide and Steam guide corroborate separate construction, purchase
and sale screens. Both describe paying more for a completed vessel to avoid the
construction wait. That is a time-versus-money choice, not a claim that all used
ships are cheaper than new orders. Their advice that selling is often unattractive
is player guidance, not a universal proof about resale value. [S2, S3]

These sources do not establish the condition of every offered ship, whether seller
identity is displayed, whether the player can immediately buy back the exact same
hull, or whether names, armament, crew and captains persist through the sale. Do
not infer a full asset-provenance ledger from the manual's origin description.

### A ready-stock option also differs from an unlimited instant-purchase button

The documented purchase screen offers existing ships rather than a promise to
construct any requested type instantly. The manual does not establish the stock's
refresh cadence, all availability constraints or whether every offer corresponds
to a prior conserved AI asset. The feature can be documented without claiming
that the underlying market is perfectly closed. [S1, S2, S3]

The ship wiki describes construction at a yard and access constraints by city;
contemporary reviews also describe the yard's construction/repair role and the
material demands of new shipbuilding. These are context for why avoiding a wait
can matter, not independent evidence that a second-hand inventory is conserved.
No material recipe or yard-queue rule is imported by this note. [S4, S5, S6]

## Actual Almojarife delta

| Code | Existing behavior | What remains distinct from P4's documented yard stock |
| --- | --- | --- |
| `src/game/game.mjs`, `orderShip` / `deliverOrders` | Pay for a valid catalogue type with docked presence and cash, then create a ship after its build interval | A new-build order, not a ready vessel selected from a resale inventory |
| `src/game/game.mjs`, `buyCaravel` | Pay and create a caravel immediately | Existing instant acquisition, but no yard stock record is consulted or consumed |
| `src/game/game.mjs`, `sellShip` / `shipValue` | Validate owned/unloaded/docked/nonlast/nonrepair ship, pay hull/prize-sensitive value, remove from fleet and convoy | Does not insert the sold hull into a yard resale registry in this path |
| `src/game/almoneda.mjs`, `shipLotOfDay` and ship award | Seeded generated used-ship auction lots with a worn hull; winning delivers a ship at the auction port | Used vessels already exist, but this is auction allocation, not a player-sale-fed fixed-offer yard inventory |
| `src/game/gamesave.mjs` | Versioned state, owned-ship id/reference normalization and next-id protection | A future off-fleet inventory would need explicit identity/reference handling, not just a new UI list |

The missing slice is therefore **sale-to-stock-to-purchase lifecycle**, not selling
ships, acquiring a ship immediately, buying used vessels or obtaining damaged
hulls. Those already have code. A search of the inspected fleet/save paths found
no yard resale-stock registry; this is a bounded code finding, not proof that all
asset sales everywhere disappear from the economy.

Existing shipyard and auction suites pass as an author baseline. No new-feature
or independent-review result is claimed. No runtime code was changed.

## Own-design recommendation, not an implementation request

Defer a new resale market unless it adds a useful choice beyond the existing used
ship auction and instant caravel. A separate yard inventory might help a player
trade immediate availability against condition, type and price, but could also
make current construction or auctions redundant. First compare that intended
choice with the existing acquisition paths before expanding scope.

If selected later, define whether a sold vessel remains the same asset or becomes
a simplified offer. Choose explicitly what happens to hull condition, equipment,
captain, name, prize restrictions and old command references. A simplified offer
must not pretend to preserve provenance it has discarded. A conserved hull must
not remain simultaneously owned and listed for sale.

Keep stock eligibility, quote and settlement in one engine path. Consume a
specific offer once and bind the price to that offer; do not implement a list that
calls the unlimited instant-purchase function without consuming stock. Decide
separately how AI supply is generated. P4's manual description does not authorize
fabricating AI cash transfers or removing an active AI ship by assumption.

Candidate tests if this option is chosen:
- A sale removes ownership, convoy/route obligations and the chosen associated
  fields exactly once, then creates at most one inventory record.
- A bought offer is no longer available; a duplicate click or reload cannot create
  another hull or charge another payment.
- Cash and asset movement reconcile with the chosen dealer funding rule; no
  invented refund or guaranteed buyback spread appears accidentally.
- Sale/buyback cannot wash damaged hulls, equipment restrictions or prize status
  unless a deliberate refurbishment/clearance service accounts for the change.
- Save/load and ship-id repair do not alias an off-fleet offer to a live ship or
  reattach an old repair/route order to a new owner.
- Last-ship, repair, voyage and loaded-hold protections remain intentional across
  both the old sale route and the new stock path.
- Current new-build orders, auctions and old saves retain behavior with no resale
  inventory present; there is no autonomous spending or balance retune here.

## Open verification work

P4 stock refresh, dealer funding, exact physical asset identity, sale/buyback
availability, condition and equipment retention, AI participation, local versus
global inventory and persistence across reload remain unresolved. No price ratio,
stock capacity, repair discount or resale-profit opportunity is recovered here.
These need permitted observation before becoming P4 claims.

## Sources

All fetched 13 November 2026. Source quantities and quotations are not copied.

- **S1, primary:** Kalypso, P4 English manual, Shipyard entry. Date not shown.
  Direct support for separate order/stock purchase and trader-sale origin.
  https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- **S2, published guide:** GRYOnline, Shipyard / Large Shipyard. Page shows a
  guide date in its metadata; not used for edition-specific claims. Corroborates
  purchase/sale screens and the ready-ship time/price trade-off.
  https://www.gry-online.pl/poradniki/patrician-iv/stocznia-duza-stocznia/z1b339
- **S3, community guide:** Steam, Patrician IV Guide, Buildings--Shipyard.
  Corroborates ready-ship purchase versus construction and sales; selling advice
  is opinion, not a market-value formula. Publication date not used.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- **S4, community wiki:** Ship. Construction/access context only, not independent
  proof of stock provenance or conserved hulls. Date not used.
  https://patrician4.fandom.com/wiki/Ship
- **S5, contemporary review:** GamingLives, 5 October 2010. Yard construction,
  upgrading and repair context only; not proof of resale-inventory behavior.
  http://www.gaminglives.com/2010/10/05/patrician-iv-review/
- **S6, contemporary review:** CPUGamer, 12 July 2011. Construction-material/time
  context only; does not establish the used-stock lifecycle.
  https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review
