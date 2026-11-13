# P3 civic commemoration: an earned town response, not a purchased perk

13 November 2026. Main inspected: `ece23cf`.
Clean-room documentary note only. No copied prose, slogans, balance figures,
assets, executable inspection or excluded modding material. No implementation,
visual asset, historical claim or scope expansion is approved.

## Narrow finding and scope

P3's manual describes a town erecting a monument to honour an effective lord
mayor. Sustained service beyond initial election and substantial achievements
for citizens are prerequisites in the description. It is not presented there
as a purchase menu or a guaranteed reward for merely holding the office. The
manual does not supply an evaluable performance formula. [S1]

The useful distinction is between a player's action and a community's lasting
response. This note does not claim that every civic building is an honour, that
reputation automatically buys a monument, or that the award changes production,
rents, votes, health or rank. None of those effects is established here.

Real grep across `docs/` for monument, memorial, commemoration and statue found
no dedicated discussion of this mayoral reward. Existing
`patrician3-mechanics.md` covers civic buildings and rank broadly;
`patrician3-tippsammlung-standing-notes.md` covers reputation;
`patrician4-scenario-results-20261113.md` covers results and milestones. Those
are prior coverage, not evidence that our game lacks recognition.
Open PR titles and bodies were checked: P3 siege and harbour-register notes,
Electron maintenance, escorted-prize movement and modal keyboard tests do not
study this reward. The concurrently assigned P4 housing-occupancy topic is also
outside this scope.

## Evidence ledger

| Ref | Public source read | Supported claim and limit |
| --- | --- | --- |
| S1 | P3 English manual, section 11.3.7, printed page 39, PDF page 39: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete local PDF text inspected. Town-built commemoration associated with sustained mayoral service and achievements for citizens. No detailed evaluation rule, settlement of cost or mechanical bonus is specified in this section. Exact tenure count is not adopted. |
| S2 | GRYOnline, other buildings guide, monument subsection, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/inne-budynki-2/ze36e0 | Describes citizens honouring a successful mayor with a monument and a tenure prerequisite. Player guide with substantial overlap with S1, not independent runtime confirmation. Its town-centre location statement is not a placement contract for our map. |
| S3 | ManualMachine, P3 manual transcription: https://manualmachine.com/gamespc/patrician3/1118526-user-manual/ | Fetched as a possible alternate manual view. No additional independent evidence used. The complete original PDF, not this mirror's partial presentation, establishes the page-specific claim. |

This is a deliberately narrow documentary finding, grounded principally in one
manual section and a derivative-looking guide. No runtime award was triggered
or measured. General web results about real monuments were unrelated and not
used to turn the game feature into an Iberian historical claim.

The manual elsewhere refers to a market-square monument as an information
access point (section 8.1.3, printed/PDF page 21). That wording alone does not establish that the
awarded mayoral monument is the same object or unlocks that information.
Do not infer an information gate or a unique monument identity from it.

## Own-source inspection

A real grep of `src`, `data/world.json` and `web/main.mjs` for monument,
commemoration and memorial terms found no award-state implementation. Reads of
nearby systems narrow that statement:

- `src/game/achievements.mjs` already records one-time house achievements and
  posts news. Its local-respect achievement is recognition, but the unlocked
  entry does not record a city-specific monument or mayoral service history.
- `src/view/achievementsview.mjs` already presents those achievements. A new
  recognition idea does not justify inventing another achievement framework.
- `src/game/memory.mjs` records supply deeds by city and lets their influence
  fade. Remembered grain help is not itself a permanent public honour.
- `src/game/townhall.mjs` generates named councils per city; `council.mjs`
  handles treasury and tax votes. These inspected paths do not record player
  mayoral terms or test a civic-commemoration condition.
- `src/game/works.mjs` handles council-owned service works with public spending
  and upkeep. A reward must not silently be another player-owned building or a
  public construction debit. Its funding would need a separate decision.

No tests, screenshots or visual audit accompany these source readings; there
is no UI or runtime change in this patch.

## Decision and questions

Defer a literal mayoral monument until the game has an approved player-service
contract that could support one. If local honours are later selected, consider
using existing achievement/news infrastructure with explicit city, recipient,
reason and grant date, rather than copying P3 art or its eligibility threshold.
That is an own-design possibility, not a recovered P3 save structure.

Open P3 questions: what counts as adequate civic achievement; whether service
must be consecutive; how often eligibility is evaluated; who pays; whether an
honour can be repeated, removed or survive a later fall in standing; whether it
has effects beyond commemoration; and whether the information-access monument
is distinct. These are not filled from intuition.

Future own-design checks, only if approved: one grant per chosen identity and
policy, no duplicate news after reload, no automatic cash or reputation bonus,
and a city-specific reason supported by recorded deeds. Losing an eligibility
condition after the grant must follow an explicit retention policy, not an
accidental daily predicate. Existing achievements, works and city memory must
keep their current meanings.
