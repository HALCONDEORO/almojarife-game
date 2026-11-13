# P4 family and home: a personal lifecycle, not a household tax

13 November 2026. Main checked: `a477e37` (through PR880).
Scope: public P4 documentation and accounts of marriage, home and family.
The base game and Rise of a Dynasty expansion are identified separately.

## Finding

Almojarife has a home port, a household tribute and city festivals, but no
marriage/family lifecycle was found in the inspected source. The real gap is an
optional personal commitment with preparation and persistent consequences, not
missing local taxation, celebrations, home identity or population simulation.
Earlier research mentions marriage and epidemic loss but does not define that
boundary. This note does not approve family simulation, mortality, inheritance,
new political bonuses or changes to the game's existing plague policy.

## Sources and method

Relevant sections of these public pages were fetched and read on the date above.
No binary, extracted data, utility chart, modding-internals reference, competitor
code, art, dialogue, numerical table or copied source wording was used. No game
experiment was performed. Described mechanics are not measured formulas.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Your Counting House: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Personal information includes spouse, children, local title and moving city. It does not explain the full courtship process. |
| S2 | Publisher expansion manual, Counting house: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf | Adds potential spouse death during epidemics and names protective city infrastructure. Does not supply a family-mortality formula. |
| S3 | P4 Wiki, Counting house: https://patrician4.fandom.com/wiki/Counting_house | Personal tab, home and moving once another counting house exists. Community documentation, not independent measurement. |
| S4 | Heraclitus, Steam guide, Personal Screen: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Family display, wedding date, children and home. An anecdote about birth timing is not adopted as a gestation rule. |
| S5 | Steam discussion, Creating convoys? Getting married?: https://steamcommunity.com/app/57620/discussions/0/1638662230374842059/ | Player explanation of a courtship assignment, goods at the home counting house and a scheduled wedding. Version-specific testimony, not official eligibility conditions. |
| S6 | Steven Loung, CGMagazine, P4 review, page dated December 2010: https://www.cgmagonline.com/review/game/patrician-iv/ | Independent base-game account connecting warehouse food/drink with wedding preparation. Opinionated review, not a consumption specification. |
| S7 | Samuel, GamingLives, P4 review, 5 October 2010: http://www.gaminglives.com/2010/10/05/patrician-iv-review/ | Base-game review reports partner-dependent dowry and political influence. No universal bonus, gender eligibility or exact asset rule inferred. |
| S8 | Rick Moscatello, CPUGamer, expansion review, 12 July 2011: https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review | Marriage expenses, possible dowry, children and epidemic risk. Its broader claims about children and prosperity stay reviewer testimony. |

This is primary documentation, community documentation/discussion and contemporary
independent reviews. Agreement is not an experimental replication. No wedding
goods list, dates from playthroughs, costs, dowry values or probabilities are
reproduced. P3 marriage guides and Rise of Venice family roles are not evidence
for P4 and were not used to fill its gaps.

## Documented and reported behavior

### A personal record attached to a home

P4's counting house has a personal view alongside commercial accounts. The
manual lists family information and moving city; community pages describe the
home and wedding date there, and a move option once another counting house
exists. [S1/S3/S4] That supports distinguishing an individual's residence from
the many commercial establishments they own. It does not prove a move resets
reputation, elections, citizenship or a pending wedding, nor that every building
owned in another town qualifies as a residence.

### Courtship creates a preparation deadline, not an automatic purchase

The player explanation in S5 describes accepting a courtship assignment offered
at a town hall, then placing its required goods in the hometown counting house
before the stated date. It reports automatic completion on that date when the
supplies are present and failure otherwise. S6 independently describes food and
drink stocked for a wedding reception. These support a logistics commitment,
but the acceptance/completion procedure remains lower-confidence testimony:
S1's personal-screen summary does not establish all its guards.

Unresolved: whether goods are reserved or merely checked at the deadline,
whether partially supplied goods are consumed on failure, whether a ship must
be present, whether home can change mid-preparation, and the retry policy.
No exact list or timing is inferred. No P3 matchmaker-letter sequence is imported.

### Family consequences are not a dynasty succession engine

S7 reports political help and a dowry that varies with the partner, and describes
one particular player/partner case. S8 also reports a dowry that may offset the
wedding bill. These are evidence of reported outcomes, not a guaranteed profit,
universal reward asset or an established vote multiplier. S1/S4 establish a
family display including children; they do not establish playable heirs, ageing
into new player characters, inheritance or a game-over rule on death.

The expansion manual explicitly introduces spouse loss during an epidemic and
connects protection to city infrastructure. [S2] S8 reports wider family losses,
but this note does not upgrade that review into an official mortality contract
for children. Health protection is mitigation, not documented immunity. No
analogy from this entertainment system establishes historical medical efficacy.

## Actual source delta

| Almojarife source | Existing behavior / consequence for a proposal |
| --- | --- |
| `src/game/profile.mjs`, `src/game/origin.mjs` | Home, character, background and once-only origin connections already exist. `cleanProfile` returns a declared field set; simply appending spouse fields to the profile would not make save sanitation preserve them. |
| `src/game/household.mjs`, `src/game/game.mjs` | Household is a net-worth-based tribute paid into the home city's fund, with civic-health spending, not spouse/children state. The module comment says default off, but `newGame` currently enables household unless explicitly disabled by its supported options. Do not repeat that stale comment as the live default. |
| `src/game/festivals.mjs` | City festivals have their own scheduled demand and mood effects. They are not a player-funded wedding, warehouse reservation or individual acceptance event. Reuse scheduling discipline, not the festival economy as a substitute for supplies. |
| `src/game/plague.mjs` | The model explicitly does not kill people; plague reduces effective demand and has infrastructure mitigation. Adding family death would be a deliberate policy change, not wiring up a missing existing callback. |
| `src/game/game.mjs` storage operations, `src/game/whlock.mjs` | Warehouses, goods transfers and load locks exist. A wedding commitment would have to coexist with automation and locks, not remove the same goods twice or silently count cargo in a different city. |
| `src/game/buildings.mjs`, `src/game/household.mjs`, `src/game/campaigns.mjs` | Home determines office entitlement, tribute destination and home-related campaign rewards. A residence move would affect more than one display label and needs a separate transition policy. |
| `src/game/gamesave.mjs` | Profile cleanup and state validation are explicit. Family/commitment identity, dates and settlement records would need validation, not reliance on JSON persistence alone. |

## Ranked own proposal, not approved implementation

1. Begin with a design decision about whether a personal family lifecycle fits
   the intended game at all. If yes, keep an optional persistent personal record
   separate from household tribute, market population and decorative NPC names.
   Declining or never receiving a proposal must not block the trading game.
2. The smallest useful mechanics experiment is a voluntary preparation commitment
   with a named location, deadline, required owned stock and a visible status.
   Choose reservation versus deadline checking explicitly. State what failure
   does before acceptance; do not let automatic traders unknowingly consume
   committed goods. A successful settlement may update a personal record, but
   wealth transfer and political effects require separate own-design decisions.
3. Treat relocation separately. Decide which office/warehouse is required and
   how existing home privileges, tribute, missions and commitments transition.
   Do not implement relocation by blindly assigning `profile.home`.

Do not add spouse death, birth rolls, succession, an inheritance economy or
source-derived political coefficients in this first slice. These are separate
content, tone and design decisions; P4's expansion is not authority to override
Almojarife's current non-lethal plague model. Historical Iberian institutions,
terminology and social eligibility are unverified here and need their own work.

### Acceptance contracts if an experiment is later approved

- An offer, accepted commitment and completed personal event have stable distinct
  states. Repeated acceptance or date processing creates neither a second charge
  nor a second marriage/reward. A rejection leaves stock, balances and IDs intact.
- Inventory uses one declared location and ownership rule. Reservations cannot
  overlap; released stock is released once. Deadline checking and automated
  loading/selling have a deterministic documented order.
- Completion is atomic: either valid supplies settle once and the new state is
  written, or the declared failure applies without partial unreported consumption.
  Money/ship/goods rewards, if later chosen, are distinct one-time ledger entries.
- Save/load preserves the accepted date, terms, supplies policy and completed
  status. Profile cleanup cannot erase a commitment or recreate its dowry.
- A home move cannot mint another free office, duplicate an origin bonus, erase a
  pending deadline, or silently rewrite already earned campaign rewards. Missing
  destination permission rejects without changing the home or tribute target.
- Feature omission preserves old saves, household payments, festivals and the
  non-lethal plague model. No UI labels imply a spouse or child exists without
  corresponding validated state.

No code, test run, visual UI or gameplay experiment accompanies this docs-only
note. All exact source balancing and unresolved family rules remain outside it.
