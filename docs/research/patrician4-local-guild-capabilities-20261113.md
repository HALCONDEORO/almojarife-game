# P4 local guild consent: property, production and specialties

Research date: 13 November 2026. Almojarife main inspected: `65f6088`.
Clean-room documentation only; no new licence, fee or construction restriction
is approved.

## Narrow delta and method

A real grep for guild privileges, production privileges, regional privileges and
guild consent found the existing expedition note. It already mentions a progression
of guild permissions. The P3 towns note covers membership as a career key. This
note does not claim guild permissions were never mentioned. It adds the narrower
local construction model: authority to establish an office, authority to produce,
and additional authority for a regional specialty are distinct from owning a
building or paying for a plot.

Read primary documentation, published/community guides, wiki pages and a
contemporary review. No proprietary files, extracted data, modding/decompilation
documents, source numerical tables, quotations, slogans or assets were used.
No game experiment was performed. Described prerequisites are documented claims,
not a reconstructed permission implementation.

## Findings and limits

### Local reputation opens access to permission, not automatic ownership

The official manual says the local guild must consent before a trader can build
a counting house or begin producing. Its reputation section ties acquisition of
local privileges to city reputation. Its construction section describes the
counting house as the prerequisite hub for other construction. These are related
but separate steps: eligibility, permission and the actual property investment.
The manual does not say that crossing a reputation threshold automatically erects
an office or grants every production right. [S1]

The counting-house wiki also ties additional offices to career progression and
joining the target city's guild. The rank wiki distinguishes access to production
rights from access to regional-goods rights. These community summaries support
layered access, but are not a complete account of every edition's ownership and
permission lifecycle. No rank thresholds or office caps are imported. [S2, S3]

### Ordinary production and regional specialties are separate capabilities

The Steam guide distinguishes permission for office/housing, production businesses
and the city's specialty production. A published campaign guide separately tells
the player to obtain a local specialty right and later join another city's guild
before building an office there. The contemporary review also describes local
reputation and payment before production, with more standing and money for special
goods. [S4, S5, S6]

This does not establish that every ordinary good needs its own individually bought
licence, that a local right is valid in every other city, or that an acquired right
vanishes whenever reputation drops. These sources describe access layers, not a
complete revocation, renewal or transfer policy.

There is a terminology conflict worth preserving: the Steam guide introduces its
building access through guild reputation, while the manual explicitly describes
city reputation as the prerequisite for local guild privileges. The note does not
merge those into one universal reputation meter. The exact status checks for each
permission remain an observation question. [S1, S4]

### Permission and production geography are not interchangeable

Being allowed to produce does not itself prove a city can produce any good. The
manual separately describes regional specialties, and the guides associate a
specialty right with local production. A right, a suitable city, a completed works
and operating inputs are different requirements. No commodity list, geography map
or production recipe is reproduced here. [S1, S4, S5]

## Current Almojarife comparison

| Code | What actually exists on the pinned main | Difference from the documented P4 pattern |
| --- | --- | --- |
| `src/game/buildings.mjs`, `buyOffice` | Buys a non-home office with local respect and cash checks; records city ownership | Combines access and property acquisition; no separate guild permission purchase in this function |
| `hasOffice`, `buyPlot`, `quoteConstruction` | Office presence gates construction; legacy saves without an offices array retain compatibility | Existing office gating is real, not a missing foundation |
| `buyPlot`, municipal permit branch | Explicitly selected auction permit pays for a plot instead of cash and is consumed | A consumed payment entitlement, not a persistent guild production privilege |
| `quoteConstruction`, `cityAllowsProducer` | Producer types must be allowed in the city; civic works have separate local-standing checks | Geographic production and civic standing are already checked; they are not a regional-specialty licence registry |
| `src/game/campaigns.mjs`, guild-themed side mission | Respect-based mission and reward | A guild-themed task is not membership or permission state |

A search of these construction/campaign paths found no persistent local guild
production/specialty capability ledger. This is not a claim that permits, property
rights, civic rules or production geography are absent: all already exist and
should remain distinct. The expedition note covers another privilege; it is not
repeated here as a new feature.

Existing premises/office and building suites pass as an author baseline. They do
not test a new guild mechanism and are not independent review. No construction,
needs, household, procurement or reserved initializer code was changed.

## Own-design recommendation, not an implementation request

Do not add another paid gate solely to imitate the source. Current respect plus
office plus plot plus construction already creates investment steps. A guild right
would need a new strategic purpose, such as distinguishing access to a specialized
industry, rather than making the player buy permission to do what current saves
already allow.

If selected, model capability, jurisdiction and acquisition separately from the
asset it permits. Decide whether office ownership implies any grandfathered rights,
which actor issues the right, and whether a specialty right is city-specific or
regional. Do not reuse `almonedaPermits` for permanent access: its current contract
consumes the token to pay for a plot. A new privilege must not silently consume a
valuable existing token or use the word permit to hide a different effect.

Choose purchase eligibility versus continued-operation eligibility explicitly.
Checking standing only when the right is acquired differs from pausing a working
factory whenever standing falls. No source here authorizes retroactive shutdown,
confiscation, renewal fees, monopoly income or resale of the right. Historical
Iberian guild jurisdiction needs its own evidence before choosing the institution.

Candidate tests if a design is later selected:
- Capability checks run in engine purchase/construction paths, not only UI buttons.
- A right in one jurisdiction does not grant global production access accidentally.
- A general right does not bypass local producibility or a selected specialty gate.
- A municipal plot-payment token retains its existing consumed-on-use behavior and
  cannot accidentally grant, revoke or renew guild access.
- Refused acquisition has no charge or plot side effect; duplicate acquisition or
  replay cannot charge twice or create duplicate grants.
- Save/load preserves the chosen scope and grandfathering; malformed imported
  state cannot unlock every city or disable legitimate existing businesses.
- Completed assets, queued works and upgrades follow explicit transition policy if
  standing changes, rather than losing ownership through a transient eligibility check.
- No-feature games retain current construction access, costs and seeded economics.

## Open verification work

Exact P4 eligibility meters, purchase sequence, membership versus privilege scope,
reputation loss after acquisition, revocation, renewal, transfer to another city,
local specialty identity and treatment of inherited businesses remain unresolved.
The sources do not establish a market in tradeable licences or permanent universal
membership. No fee schedule, threshold or source progression table is adopted.

## Sources

All fetched 13 November 2026. No source quantities or quotations copied.

- **S1, primary:** Kalypso, P4 English manual, Guild, Reputation and counting-house
  construction entries. Date not shown. Strong support for local consent and
  city-reputation eligibility, not a full permission lifecycle.
  https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- **S2, community wiki:** Counting house. Local guild and additional-office
  prerequisites, not proof of revocation rules. Date not used.
  https://patrician4.fandom.com/wiki/Counting_house
- **S3, community wiki:** Trader Rank. Distinguishes eligibility for ordinary and
  regional production privileges; no numerical progression imported. Date not used.
  https://patrician4.fandom.com/wiki/Trader_Rank
- **S4, community guide:** Steam, Patrician IV Guide, Guild screen. Permission
  categories and local specialty scope; terminology is not merged with the manual's
  reputation model. Date not used.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- **S5, published guide:** GRYOnline, campaign councilman progression page, updated
  27 August 2019. Local specialty and another-city guild/office sequence; not a
  universal permission policy for every edition.
  https://www.gry-online.pl/poradniki/patrician-iv/awansuj-na-rajce/z1b366
- **S6, contemporary review:** CPUGamer, 12 July 2011. Corroborates local
  standing/payment for production and special goods, not a formula or jurisdiction
  specification.
  https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review
