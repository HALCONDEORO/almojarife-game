# P4 port patrol: an active service, not a convoy membership flag

13 November 2026. Main checked: `d8d6a82` (through PR884).
Scope: P4's town-hall patrol provision and the separate sea patrol command.
No runtime formula, command ownership transfer or compensation schedule has been
recovered. This is a documentation-only study, not an implementation approval.

## Finding

The real gap is a convoy's **active service assignment** and the ongoing local
benefit attached to it. Almojarife already groups owned ships, resolves pirate
encounters, supports escort defence and manages city funds. Forming another
convoy is not the missing feature. Neither is a commercial escort contract:
a port patrol protects an area rather than carrying another trader to a named
destination. Existing design notes already propose port patrols; this note adds
source boundaries, persistent-service reputation and the current code delta,
not a claim to have discovered patrols for the first time.

## Sources and method

Relevant fetched sections were read on the date above. No executable, extracted
data, utility chart, modding-internals page, copied text, source asset or exact
balance value was used. No gameplay experiment was performed.

| Ref | Public source | Used for / caveat |
| --- | --- | --- |
| S1 | Publisher P4 manual, Town Hall, The Patrol Function, Reputation: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Primary description of local protection, automatic target engagement and a reputation contribution sustained while the service persists. Not a settlement specification. |
| S2 | GRYOnline, P4 Ratusz: https://www.gry-online.pl/poradniki/patrician-iv/ratusz/zbb333 | Independent guide describes hiring out one's convoy as a paid local patrol. Does not state term, payer accounting or return condition. |
| S3 | Heraclitus, Steam guide, Patrol Screen: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Player documentation of providing/removing a convoy and eligibility involving size, armament and crew. Exact requirements deliberately not imported. |
| S4 | Patrizierforum, Build-up meta strategy: http://www.patrizierforum.net/index.php?thread%2F5687-build-up-meta-strategy%2F= | Player claims patrols drain city funds. Anecdotal budget warning, not proof of a payment formula or an exploit to reproduce. |
| S5 | GameWatcher, P4 review: https://www.gamewatcher.com/patrician-iv/review | Contemporary review describes defensive patrols near cities. Its claim that naval combat is entirely automatic conflicts with S1's documented manual battle controls; it is not used as combat authority. |
| S6 | RuneSoft-hosted P4 manual: https://www.rune-soft.com/upload/documents/Manual_PDF_Patrician4%20.pdf | Same relevant manual wording in another distribution. Cross-check only, not an independent mechanics confirmation or proof of identical platform behavior. |

Coverage includes primary documentation, independent guide/review and community
guide/discussion. Detailed behavior rests chiefly on S1. Sources do not establish
one complete contract for costs, recall, casualties and ownership. No patrol
radius, ship/gun threshold, payment rate, faction vessel name or source slogan
is reproduced.

## Documented distinctions

### Providing a town service and setting a sea command are related, not identical

The manual's town-hall description lets a player provide a convoy that protects
the harbour and approach and automatically engages pirates it detects. It
connects that provision to local reputation. [S1] The guide describes a patrol
screen where the player can both provide and remove convoys. [S3] The independent
guide describes hiring out a convoy for payment. [S2]

Separately, the manual describes toggling a patrol function at a location at
sea, with automatic attacks on pirates within range. It also describes using
that sea command under a pirate flag to target traders, provoking a hostile
response from the League. [S1] Those are different targets and legal contexts.
The documentation here does not prove that activating the sea command also
signs a municipal paid contract, nor that every municipal patrol transfers full
control or legal ownership to the town. Do not conflate them.

The studied material does not settle how long service lasts, whether recall is
instant, who pays wages/repairs, whether damaged members remain eligible, or what
happens to cargo, prizes and insurance. It does not establish immunity from
capture or loss. An initial announcement describing this research as convoy
cession/return was a hypothesis to check, not a verified source-game contract.

### Reputation can be a maintained contribution, not a repeated reward

The manual marks providing a patrol among the reputation sources that remain
while their underlying situation continues. It distinguishes these from deeds
that are eventually forgotten. [S1] This supports an ongoing service contribution,
not earning another permanent increment whenever the assignment button is
pressed or each time a menu is opened.

It does not establish a specific multiplier, immediate removal timing, defeat
penalty or relation to successful kills. Our implementation would need its own
contract. The community account about city funds [S4] makes funding and
opportunity cost worth showing; it does not justify an uncapped town-to-player
money faucet or an intent to prevent civic building through treasury depletion.

## Delta against actual main

Prior work in `docs/design/plan-map-cities-ships.md` already names a port-funded
patrol and proposes seasonal pirate removal. That removal cadence is our older
design idea, not something established by P4's automatic nearby engagement.
The P3 public-convoy note concerns another merchant's delivery, not this service.

| Existing code | Actual boundary |
| --- | --- |
| `src/game/convoys.mjs` | Owns membership/backlinks, formation, disbanding, sailing and companion escort strength. No municipal service record or patrol area. Do not duplicate membership in an unrelated service roster. |
| `src/game/routes.mjs` | Pauses a member ship's route while grouped; it does not transfer automatic route control to a group or patrol. Explicitly define suspended trade orders and their later restoration. |
| `src/game/encounterdaily.mjs`, `src/game/piratefight.mjs` | Pirate encounters are seeded per owned ship at sea. Anchored voyages are excluded; the resolver prepares a decision/report rather than tracking persistent nearby pirate convoys. A stationary patrol cannot protect a region simply by enabling this cadence. |
| `src/game/privateering.mjs` | Attacks eligible trader targets under the marque/legal rules. A pirate-targeting civic patrol must not silently use trader eligibility or become licensed predation. |
| `src/game/towers.mjs`, `src/game/whwatch.mjs` | Kept towers/warehouse guards already mitigate fire. They are not an implemented anti-piracy naval radius, despite watch terminology. |
| `src/game/portmeasures.mjs` | Boycott/blockade are explicit port navigation restrictions. Defeating an encounter does not automatically erase a political blockade or identify its issuer. |
| `src/game/council.mjs`, `src/game/reputation.mjs`, `src/game/rank.mjs` | City treasury and distinct reputation/respect mechanisms exist. A maintained service contribution should not be simulated by repeatedly adding irreversible sales respect. |
| `src/game/gamesave.mjs` | Convoy, ship and pending encounter references have sanitation/remapping. New assignment identity and its funding/report state need explicit validation. |

## Own proposal, not a source reconstruction

First define a voluntary municipal-service assignment that references an existing
convoy and city, with a declared operating area, eligibility, funding and recall
policy. Keep membership ownership and service control separate. Admission must
check every member before changing any member. Show the lost trading availability
and who funds wages, repairs and fees before acceptance. Do not assume a paid
contract from a bare patrol toggle.

Only after that contract exists choose a protection model. A persistent-pirate
world would need spatial detection and target identity; an abstract risk-reduction
model would be a different deliberate design. Neither can be claimed as already
implemented or as P4's recovered algorithm. Do not generate new battles every
view frame, attack ordinary traders, or grant blanket pirate immunity.

If local standing is included, derive one contribution from qualifying active
service and remove/suspend it according to a declared lifecycle. Funding failure,
repair, recall and loss must have visible states. Exact tuning, historical port
service institutions, bot provision and rewards remain separate decisions.

### Acceptance contracts before any implementation is ready

- One convoy has at most one exclusive service assignment. Stale, scattered,
  repairing, held or otherwise ineligible members reject atomically under the
  chosen rules, without taking cash, consuming IDs or suspending other orders.
- Formation/disbanding/sale cannot leave a dangling service reference or let the
  same hull be paid for multiple assignments. Recall and suspended trade orders
  resume once under an explicit co-location/navigation rule.
- Standing reflects the declared active service, not button presses or elapsed
  UI frames. Assignment/revocation cycles cannot farm cumulative reputation.
- Each bill has an identified payer/payee and period. Replay and save/load cannot
  double-pay a stipend, omit upkeep or create a negative municipal balance
  outside a deliberately approved borrowing policy.
- Target selection respects area and identity. A civic patrol never attacks a
  neutral trader because a pirate-flag command shares a UI label.
- Each interception settles once; repair, cargo, prize and casualty consequences
  are explicit. Political port measures do not disappear as an accidental side
  effect of a tactical victory.
- Old saves and ordinary voyages/convoys remain unchanged without assignment
  state. Invalid convoy/ship references cannot create free replacement vessels.

No implementation, new tests, visual UI or gameplay experiment accompanies this
note. Unresolved operational and payment details remain open, not guessed.
