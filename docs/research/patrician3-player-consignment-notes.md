# P3 player consignment: listing is not an immediate asset sale

Research date: 13 November 2026. Main inspected: `65f6088`.
Clean-room documentation only. No auction feature, price change or scope increase
is approved. No copied prose, source balance figures, assets, binaries, excluded
modding material or exploitation instructions are reproduced.

## Narrow finding and overlap

P3 documents putting an owned asset into a future auction and losing control of
the listed ship immediately. That is a different contract from buying a generated
auction lot or selling a ship immediately for an assessed amount. The useful gap
is the seller's interval between listing and settlement, not another auction UI.

The roadmap names classic-game depth as a quality direction but keeps scope and
release gates conservative. Existing `patrician3-tippsammlung-towns2-notes.md`
already records guild membership, owned-asset auctions and a source's negative
judgment of their value. It explicitly leaves our auction pricing unaudited.
`town-industry-and-auctions.md` and `almoneda.mjs` already implement substantial
auctions. The P4 shipyard-resale note concerns ready stock, not this listing
interval. This note adds a narrow lifecycle and qualifies the older universal
seller-value judgment; it does not claim those earlier auction studies are absent.

## Public evidence and limits

| Ref | Source | Claim used and confidence |
| --- | --- | --- |
| S1 | P3 English manual, Guild/Auctions/Auction Room, printed pages 34-35: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Primary documentation of own ships/buildings offered for sale, local guild membership, ship in port outside a convoy, immediate loss of ship control, future auction participation and last-bidder result. Full PDF downloaded and relevant text read because the web extract stopped early. |
| S2 | English manual mirror: https://manualmachine.com/gamespc/patrician3/1118526-user-manual/ | Same document, not independent corroboration. The fetched extract was incomplete around the substantive auction section; S1 supplies the evidence, not a search excerpt from this mirror. |
| S3 | FX Italian manual, Aste, printed page 54: https://www.yumpu.com/it/document/view/48432083/manuale-di-gioco-fx-interactive/55 | Published localized manual on a document host. Describes selecting an owned ship/building, local membership, an optional notice, starting/current bid and winner. Not independent runtime verification or proof of identical edition rules. |
| S4 | Steam discussion, closing a business, November 2014: https://steamcommunity.com/app/33570/discussions/0/620695877504658898/ | Players distinguish auctioning, halting and demolition; discuss losing future use of the plot. Opinions on the best option are contextual. |
| S5 | Steam discussion, selling to competitors, November 2016: https://steamcommunity.com/app/33570/discussions/0/282992646977642734/ | Conflicting player judgments of liquidity, retaining productive assets and rivals' use. Does not establish a universal return or a verified AI budget model. |
| S6 | Old man's guide to P3: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Read section on combining captured ships and auctions as a source of income. Community strategy, not proof of net profitability after all costs. No recovery trick or unauthorized-property behavior adopted. |
| S7 | Archived Patricianworld tips: https://archive.kontek.net/patrician.strategyplanet.gamespy.com/html/tips.html | Historical player advice recommends auctioning captured vessels for cash, contrasting with blanket advice against selling. No reproducible economics test or current-build guarantee. |

The coverage is manuals, community guide/tips and discussions. Mirrors and
translations are not extra independent experiments. No P3 runtime, auction-price
regression or P4 equivalent was tested. The full manual was retrieved from the
observed HTTP URL after HTTPS certificate-name validation failed; no login or
private data was involved.

## What the documented loop establishes

S1 makes eligibility, listing and bidding separate operations. It says a listed
ship leaves player control with anything still aboard, and excludes convoy ships
from that listing interface. It does not spell out where each crew member or
cargo item goes, whether their value is paid separately, or whether listing
reversal is possible. Those outcomes remain unresolved here. Loss of control is
not enough evidence to claim physical destruction, a cargo refund or forfeiture.

S1 and S3 then describe a future auction room and incremental bidding. Neither
supports replacing our maximum-bid mechanism with copied increments or importing
an exact commission, reserve formula or schedule. A reminder is information,
not the sale itself. The source leaves the full unsold-lot and seller-payout
contracts insufficiently specified for implementation from this evidence alone.

S4-S7 show why liquidation price is not the whole decision. Selling trades an
asset's future use for liquidity and may put it in other hands. Players disagree
on whether that is wise, especially for captured ships. Thus the older note's
absolute statement about destroying value is an attributed source opinion, not
an established universal economic rule. No recommendation here depends on
claims that NPC money is unlimited or that a buyer will operate a given factory.

## Real main audit

A real grep of `src`, `data`, `docs/design` and `docs/research` for auction,
almoneda, consignment, player/seller and sale/listing terms preceded the reads.

| Inspected code | Verified boundary |
| --- | --- |
| `src/game/almoneda.mjs`, `lotOfDay`, generated lot functions, `lotsOfDay` | Existing table draws unsold town establishments and generated ships, houses, goods and permits. These functions do not take an owned player asset into a consignment registry. Sellers can already be council or townsfolk; this is not an all-municipal system. |
| `sellerOf`, `biddersOf` | Seller metadata and named bidders already exist. A named townsfolk seller is excluded from their own bidding list. No need to rediscover seller identity or prescribe self-bidding. |
| `placeBid`, `almonedaDay`, `bidAuction` | Standing maximum bids and a day-boundary hammer already exist. Invalid settlement can pass to another bidder; a reserve failure leaves a lot withdrawn. These are positive implementations, not missing auctions. |
| `bidAuction`, `settle` | A player win pays from actual cash. Some council proceeds are credited; NPC pockets are expressly not simulated, and generated NPC wins do not mint council income. This shortcut cannot automatically finance a future player consignment payout. |
| `src/game/townindustry.mjs`, `buyEstablishment` | Transfers eligible town works into player ownership with jobs/share accounting. It is not a reverse transfer from an owned building into a simulated rival enterprise. |
| `src/game/game.mjs`, `sellShip`, `shipValue` | Existing immediate cash sale checks active ownership, repair, sea status, last ship and empty hold; removes the hull and its convoy membership. It neither lists the vessel for a later hammer nor creates buyer stock. Do not label this an absent sell feature. |

No test run or visual audit accompanies this note. The findings describe the
inspected data paths, not a claim about every possible view or extension.

## Own options and acceptance questions

Prefer retaining the existing immediate-sale contract unless a seller-side
auction is deliberately selected. If selected, first use a small synthetic
consignment with stable asset and listing IDs, explicit custody and a single
settlement. Do not silently route the current sell button into a delayed sale.
A separate listing action needs an honest preview of availability, included
property, reversibility, payout timing and liabilities while awaiting the hammer.

Before implementing, decide the asset classes, buyer funding, unsold disposition,
fees, ongoing upkeep, crew/cargo handling and whether the last working vessel
may be consigned. These are design questions, not recovered P3 constants.

Future acceptance tests should show that a listed ship cannot also sail, be sold
immediately or serve in a convoy; a building cannot produce twice after transfer;
a seller cannot collect twice after save/load or repeated settlement; and a failed
buyer cannot pay a seller with nonexistent cash. Preserve ownership, location,
condition and declared contents rather than generating a replacement lot.

Compare liquidity now against forgone use with our own model and synthetic
scenarios before making any pricing-fairness claim. That audit remains open.
