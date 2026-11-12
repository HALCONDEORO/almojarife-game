# P3 public convoys: an escort service, not a shared trading company

Research date: 12 November 2026. Inspected main: `7716ee95b9eba20f4abbccf2a0b48ccb9bd8e8d3`.

Scope: the convoys/crew/guild themes in `docs/BACKLOG.md`. Existing research mentions public convoys as a guild benefit and owned convoys as protection. This note adds the distinct service contract: an advertised destination, other merchants joining, safe-arrival remuneration, and different responsibilities for organiser and follower. It is research, not approval to implement or retune anything. No P4 equivalence is asserted.

## Sources and method

- Primary: official P3 English PC manual, sections 9.7.1-9.7.6, printed pages 30-31, and 10.10.4: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf
- Spanish publisher manual, section 5.6, printed pages 48-49, read through this public transcription: https://www.yumpu.com/es/document/view/36555388/manual-de-juego-fx-interactive
- GRYOnline convoy guide, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/konwoje/z636d9
- GameSpot P3 review, 23 December 2003: https://www.gamespot.com/reviews/patrician-iii-review/1900-6086007/
- P3 wiki Reputation, benefits and losses from public convoys: https://patrician3.fandom.com/wiki/Reputation
- Steam Old man's guide, updated February 2023, inspected as wider convoy/combat context, not evidence for public-convoy fees or departure rules: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034

Only prose mechanics are paraphrased. No source text, exact waiting periods, eligibility thresholds, fee parameters, tables, assets or binary-derived material are imported. Manuals are documentation rather than a reproduced runtime test. The translated manual and guide may share the same underlying text, so they are not independent experiments. The review independently describes joining a competitor's convoy and accepting its destination; it does not establish the exact settlement formula.

## 1. A public convoy advertises a journey before it sells protection

The English manual distinguishes a private group from a public departure. The organiser qualifies a lead ship, chooses a destination, and publishes it through the departure town's guild. Other merchants get a joining window. Once confirmed, that destination cannot be changed. On successful arrival, the guests separate and resume their own activities.

The new idea is not more cargo space. The organiser makes a legible promise about where the escort will go. A participant trades some freedom over departure and destination for protection. GameSpot describes precisely this destination constraint when following another trader. The sources do not establish that joining sells the guest's cargo or gives the organiser permission to trade it.

## 2. Payment rewards delivery, not merely forming a group

The manual ties remuneration from participants to safe passage, with cargo value and journey distance affecting the amount. It also describes reputation benefits. It does not give enough information here to recover a fee formula, how partial losses affect payment, who pays if a follower quits, or how a dispute is settled.

Own-design inference: an escort service needs an identified payer, payee and settlement event. Counting a formation message or a sail command as successful delivery would create reward farming. Any claim that P3 uses escrow, a particular insurance rule, or a particular refund schedule would exceed these sources.

## 3. Responsibility is asymmetric

The manual allows a follower to leave another merchant's convoy, even during a voyage, without the organiser's reputation penalty. Breaking up a public service after guests have joined can hurt the organiser. A blocked lead ship stops departure; an unavailable guest in someone else's convoy can be left behind. Organising and following are therefore different roles, not interchangeable ownership of one fleet.

These are documented P3 choices, not proposed changes to our current departure safety. Mid-voyage departure in particular would need its own navigation and encounter policy before adoption. This note does not recommend bypassing holds, repairs, blockades or course checks.

## 4. Current main has owned groups, not this service

Checked directly in source, not inferred from `parity-gap.md`:

- `src/game/convoys.mjs` resolves every member through `g.ships` and rejects a foreign ship ID. The record has an ID, name, member IDs and creation day; it has no public offer, organising merchant, advertised joining deadline or escort-payment claim.
- `formConvoy` requires a co-located, docked group of owned ships. It does not choose a flagship with a captain as a separate public-service prerequisite. Existing crew rules still affect sailing speed; this is not a claim that crews or captains are absent from the game.
- `sailConvoy` validates all members and aligns their voyage duration to the slowest. Holds, repairs and an insufficient crew can stop the whole group. It does not implement P3's guest-left-behind policy.
- `leaveConvoy` and `disbandConvoy` refuse while a member is at sea. `src/game/game.mjs` also rejects a grouped ship's mid-leg course change. These are deliberate existing contracts, not bugs exposed by the P3 comparison.
- `escortOf` sums the other owned members' defence on the same leg. That is already shared protection; there is no reason to propose it again as missing.
- `src/game/routes.mjs` pauses a grouped ship's automatic route before trading or advancing a stop. It does not make the convoy an autonomous combined merchant with permission to trade guests' goods.
- Inspection of `src` found no public-convoy offer/join command or safe-arrival escort-fee settlement. The owned convoy persists across legs rather than dissolving just because it reaches a port.

## 5. Own-design research option and test candidates

If public escorts are chosen later, add a separate service record around the existing owned fleet. Do not loosen `formConvoy` to accept arbitrary foreign IDs and assume ownership, finance and trade control will work themselves out. A single-player organiser/follower relationship with NPC traders would need explicit shared-navigation and private-account access rules.

Acceptance-test candidates, not implemented tests:

- A published offer fixes origin and destination. Joining checks the guest's current owner, port, availability and the active offer; stale or unaffordable requests cause no membership or money mutation.
- Guest membership does not transfer cargo, cost basis, cash or the right to sell. A trade by the organiser cannot consume the guest's hold merely because it shares the voyage.
- An arrival settlement identifies the service and participant once. Reopening a save, repeating arrival processing or visiting the same port later cannot duplicate fees or reputation.
- Cancellation and withdrawal use separate roles and explicit costs. Refusing an unsafe departure leaves every participant's state unchanged; any permitted exclusion is a separate visible decision before sailing.
- Success, loss and withdrawal outcomes each reconcile payer and payee accounts under the chosen policy. No fee or compensation is minted without a stated source.
- With the new service off, existing owned-convoy formation, escort defence, route pauses and no-mid-voyage-leave behavior remain unchanged.

Open decisions: whether a public escort adds useful play beyond owned fleets, who supplies NPC offers, how fees are quoted, what happens after a loss, and whether followers can leave at sea. The sources give a useful division of roles, not answers for our prices, penalties or implementation order.
