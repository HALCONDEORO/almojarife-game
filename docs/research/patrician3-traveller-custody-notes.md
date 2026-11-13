# P3 travellers: a timed arrival contract needs a carrier

13 November 2026. Main inspected: `30ec686`.
Clean-room research only: no copied source prose, dialogue, assets, balance values,
excluded modding material or executable inspection. No implementation approved.

## Narrow finding and existing coverage

The P3 manual describes a tavern traveller who offers payment for reaching a
specified destination within a stated time. The useful distinction is a person
aboard an identified carrier, not generic arrival by any ship the player owns.
This is separate from hiring sailors, shipping saleable cargo or providing a
public-convoy escort service.

The roadmap's parity direction and side-mission theme make this relevant without
changing release scope. `patrician3-mechanics.md` already names travellers among
tavern characters, but does not specify their transport contract. The public
convoy note studies escorting other traders, and the newer mission-issuer note
studies who commissions work. This note concerns who is actually being carried,
which ship has custody, and what arrival can complete that job.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Tavern, Travellers and Side Room, printed page 33: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation of destination, time allowance and payment offer. Separately lists escorting endangered citizens among side-room jobs. Does not establish a boarding algorithm or every failure rule. |
| S2 | P3 wiki, Tavern: https://patrician3.fandom.com/wiki/Tavern | Community page distinguishes ordinary Traveller from Fugitive/Escort side-room jobs, with attacks described for the latter. Does not make attacks universal for ordinary travellers. |
| S3 | Old man's guide to P3, Tavern and available missions: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Community guide describes choosing a ship for the ordinary traveller and inability to transfer him later, warning about automatic routes and inaccessible river destinations. Its escort section completes on arrival of the ship carrying the contact. No live reproduction was performed. |
| S4 | Starter Tips, June 2023: https://gameplay.tips/guides/patrician-iii-starter-tips.html | Player advice describes escort people jobs and pirate attacks; not proof that every ordinary traveller generates an attack. Its reported city-specific crash is not adopted as a universal defect. |
| S5 | P3 wiki, The flying trader: https://patrician3.fandom.com/wiki/The_flying_trader | Campaign walkthrough describes taking a named person between ports. Campaign-specific context, not proof of ordinary tavern availability, rewards or deadline rules. No names or story text imported. |
| S6 | Steam, Collecting a shipment bug, January 2019: https://steamcommunity.com/app/33570/discussions/0/1744480967032770682/ | Players distinguish a single carrier from aggregate convoy capacity for a goods-transport job. Useful contrasting failure report only: it does not establish passenger capacity, passenger transfer rules or an engine bug. |
| S7 | P3 wiki, Reputation: https://patrician3.fandom.com/wiki/Reputation | General mission/reputation context. Not evidence of a specific traveller payout, penalty or reputation formula. |

S1 is the narrow documentary anchor. The remaining coverage is community guides,
wiki pages and player testimony, not independent experiments. Related mission
families are deliberately kept separate. No additional authority is created by
several community pages describing similar jobs.

## Documented behavior, not inferred universal rules

S1 establishes an offer with a destination and time allowance. S3 supplies the
more specific carrier-selection and non-transfer account. Treat that as a
community claim until tested; do not describe it as a verified engine invariant.
Selecting a ship already on an automatic route can be inconvenient without
proving that the game silently cancels that route or changes its stops. S3's
river warning likewise does not establish our own ship/port restrictions.

S2-S4 discuss dangerous escort/fugitive jobs. They do not justify attaching a
forced pirate battle to every ordinary traveller. Arrival of the carried person
is the service; defeating a pirate is a separate objective if a particular job
requires it. S5 is evidence that a campaign may carry a person as story progress,
not a universal contract generator.

Open source questions: when payment occurs; penalties for late arrival, loss of
the carrier or voluntary cancellation; whether the passenger occupies cargo
space; exact boarding requirements; whether transfer is impossible in every
edition; and whether arriving exactly at the deadline succeeds. None is filled
with a copied schedule, reward or probability.

## Main inspection

Real grep across `src/game`, `src/sim`, `data`, `docs/research` and `docs/design`
for passenger, traveller, viajero, pasajero and person-transport terms found the
prior character listing but no passenger contract/custody entity in those source
modules. A separate tavern search reached the existing UI instead of inferring
that a missing `tavern.mjs` meant there was no tavern.

- `web/main.mjs`, tavern branch: origin contacts, captain and governor hiring,
  and rumours already exist. A new passenger offer is not permission to replace
  those characters or reclassify the captain as a transported customer.
- `src/game/contracts.mjs`: council offers track a good, quantity, destination,
  deadline and delivery by market sale. They are real timed jobs but do not attach
  a passenger to a specific ship. Selling cargo is not passenger arrival.
- `src/game/campaigns.mjs`, `campaignEvent`: existing successful-action events
  match kind, city and optionally good/quantity. This matcher does not check a
  carrier or passenger ID. Existing campaigns are not therefore broken; their
  current goals do not request that identity.
- `src/game/game.mjs`, `arrive`: the common arrival path knows the arriving ship
  and records it in messages, but sends campaign progress only kind and city.
  Reusing that event unchanged for a carrier-bound job could let another ship's
  arrival complete it. That is a future-extension risk, not a current bug report.
- `src/game/voyages.mjs`: per-ship voyage trade profit already exists. A passenger
  fee is service income, not sale of inventory and not evidence of trade margin.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, start with a bounded carrier-specific transport job, not a
universal tavern mission engine. Confirm destination feasibility and the chosen
ship before boarding; expose any restriction on transfer, sale, convoy changes
or auto-route behavior. Do not silently promise arrival using a current ETA as
if storms, delays and port closures could not change it.

Future tests should distinguish the assigned carrier from another ship arriving
at the same port; keep read/accept/board/arrive/settle separate; prevent repeated
arrival or save/load from paying twice; and define the order of deadline expiry
and docking. Decide cancellation, carrier loss, transfer and capacity policies
explicitly. Crew hiring, cargo selling and ordinary campaign arrivals must stay
unchanged when the optional system is absent.
