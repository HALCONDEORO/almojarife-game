# P4 territorial purchase: permanent relief, but from which pressure?

Research date: 13 November 2026. Almojarife main inspected: `a477e37`.
Clean-room, documentation only. No purchase, political feature or economic
rebalance is authorized by this note.

## Why this is a separate slice

The P4 land-logistics note explicitly leaves territorial purchase and its alleged
permanent protection for separate study. Existing notes describe prince demands,
regional rulers and road permissions. None supplies the narrower distinction
between a temporary satisfaction payment, acquisition of regional rights and the
exact scope of the resulting protection. This is not a road-network extension,
ordinary urban plot purchase, company equity or conquest mechanic.

Read public primary manuals, publisher descriptions and community evidence. No
proprietary executable, extracted data, modding documentation, copied prose,
artwork, source prices or source balance figures were used. No gameplay experiment
was performed. The base manual's prince section was read from its downloaded full
PDF because the fetched text ended before that section.

## Findings, including a material source disagreement

### Recurring satisfaction and territorial acquisition are different transactions

The base P4 manual describes regional princes whose demands rise with city
prosperity. Meeting demands keeps the ruler satisfied; neglect can lead to a siege.
Walls and towers are another response. It also describes inspecting satisfaction,
demands and nearby military strength at the city gate. These are recurring pressure
and preparation mechanisms, not ownership purchases. [S1]

The addon manual adds offers to buy part of a prince's territory when the ruler is
sufficiently satisfied. It presents the purchase as a major late-game expense and
promises that the region's ruler will cease troubling the buyer. That is a broad
manual description, not a precise list of disabled events. [S2]

The publisher's own product page describes territorial purchases as progressively
reducing a ruler's power. Steam's publisher description also lists regional land
acquisition, but neither product page specifies the effect of an initial purchase,
which event types change, or whether the effect is reversible. [S3, S4]

### Do not turn the manual's broad wording into universal immunity

The community guide describes incremental regional possession, an overview showing
possession, and the cessation of city sieges once regional acquisition is complete.
It explicitly says wagon attacks can continue. This is narrower than a literal
reading of the manual's broad protection promise. [S5]

In a later discussion, one player reports no noticeable effect after an initial
partial purchase; another associates completed ownership with an end to sieges.
This corroborates a possible completion threshold for siege relief, not proof of
the behavior of every partial increment or every game version. [S6]

Therefore the safe conclusion is: **P4 documents purchasable regional rights as a
late-game alternative to repeated ruler pressure; the exact protection threshold
and event scope are not fully established.** It is not verified that buying one
parcel stops every demand, toll, ambush, pirate attack or siege. The guide's wagon
exception must remain visible rather than being averaged away.

The discussion also proposes road-unlock prerequisites for purchase offers. The
manual establishes satisfaction as a prerequisite but does not establish that
entire additional sequence. Keep that sequence as a community claim requiring
observation, not a universal eligibility rule. [S2, S6]

## What the current Almojarife code does instead

| Area | Actual inspected behavior | Relevant distinction |
| --- | --- | --- |
| `src/game/household.mjs`, `householdWeek` | Recurring wealth-based charge for player and AI houses, credited to home-port funds; funds support city health works | This is a civic treasury flow, not a prince satisfaction meter or regional-rights sale |
| `src/game/game.mjs`, `newGame` and weekly wiring | The household rule is enabled unless explicitly disabled; its weekly hook is wired | The household module header's old default-off comment is stale; do not use it as current state |
| `src/game/peace.mjs` | Realm-pair peace suspends applicable letters of marque, with explicit treaty/seeded windows | Diplomatic peace is not territorial ownership and must not become a generic protection bit |
| `src/game/portmeasures.mjs` | Separate boycott/blockade checks with distinct entry/exit consequences | A regional purchase cannot silently clear sanctions imposed by a different authority |
| `src/game/buildings.mjs` | Plot/building acquisition and construction are local property operations | Owning urban buildings does not grant regional sovereignty or immunities |

A search of the inspected runtime found no regional-possession purchase registry
or P4-style prince-satisfaction/territorial-buyout lifecycle. This does not mean
politics, property or recurring payments are absent: those existing systems above
are precisely why a generic "pay for peace" flag would be a poor fit.

Author baseline: existing tribute-report and port-measures tests pass. This is a
local regression baseline, not evidence of a new feature or independent review.
No reserved economy or household code was modified.

## Own-design recommendation and trade-offs

Keep territorial buyout as a later optional political design question, not the next
finance feature. Removing recurring pressure permanently is an irreversible change
to the player's long-term incentives. A high price alone does not establish good
balance or historical suitability for Iberia.

If selected later, define the acquired right and its issuing authority before
adding a payment. Prefer a named, scoped right with provenance and explicit effects
over "owns region". Separate payment settlement, ownership record and the event
predicate that respects the right. Do not award town plots, council votes, title,
production revenue, road access or a tax exemption unless each is deliberately
included. These are our design safeguards, not claims that P4 implements them.

Ranked next steps:
- First observe the source behavior at partial and completed acquisition, including
  siege pressure versus road attacks, before claiming a recovered P4 specification.
- If Almojarife wants a similar decision, choose its own historically supported
  institution and limited benefit. Compare a renewable arrangement with a permanent
  right; the source does not make either appropriate to our setting automatically.
- Only then estimate and test an implementation. There is no approval to add new
  spending, alter the household levy or remove existing political consequences.

Candidate acceptance cases for a future selected design:
- The quote names jurisdiction, benefit, persistence and exclusions before payment.
- Refused or duplicate purchases cannot charge twice or grant an unrelated right.
- Save/load preserves the same right without replaying the purchase or repricing it.
- An unrelated realm, pirate faction or port authority is unaffected.
- Pending demands, active sanctions and current sieges have explicit transition
  rules; no silent deletion of liabilities through a new ownership flag.
- Completed rights cannot exceed their cap; partial rights do not accidentally
  satisfy a completion predicate through rounding or malformed imported state.
- AI and player eligibility follows the selected policy, not accidental UI access.
- Off/absent feature preserves old economic fixtures and saves, including civic
  funds and ordinary property rights.

## Open verification work

Partial-ownership benefits, offer timing and prerequisites beyond satisfaction,
which demands cease, whether existing sieges end, ongoing wagon attacks, ruler
succession, resale, refunds and any income or valuation benefit remain unresolved.
The sources do not prove a marketable asset, guaranteed return or sovereign title.
No numeric target, payback calculation or source-game table is imported.

## Sources

All accessed 13 November 2026. Source quantities are not adopted.

- **S1, primary:** Kalypso, P4 English base manual, Princes section. Primary support
  for recurring satisfaction/demands/siege context, not territorial purchase.
  Publication date not shown in inspected text.
  https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- **S2, primary:** Kalypso, Rise of a Dynasty English addon manual, Land possession.
  Primary support for satisfaction-gated offers and broadly described protection;
  not a detailed event matrix. Publication date not shown.
  https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- **S3, publisher:** Kalypso product page, date not shown. Describes incremental
  purchase and reduction of ruler power; marketing, not an edge-case specification.
  https://www.kalypsomedia.com/us/patrician-iv-rise-of-a-dynasty
- **S4, publisher description:** Steam addon product page. Corroborates regional
  territory purchase only; not independent confirmation of immunity semantics.
  https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/
- **S5, community guide:** Steam, Patrician IV Guide, City Gate section. Reports
  completed-possession siege relief with a wagon-attack exception. Date not used;
  lower confidence than a direct permitted observation of a specified build.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- **S6, community discussion:** Steam, I'm Patrician Mayor and Alderman, what to do
  now?, August-October 2024. Partial-purchase anecdote and completed-ownership siege
  claim; not a controlled experiment.
  https://steamcommunity.com/app/57730/discussions/0/4515506995733455856/
