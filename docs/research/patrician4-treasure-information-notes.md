# P4 expansion treasure maps: partial information and a recoverable site

13 November 2026. Main checked: `44ce772` (through PR877).
Scope: public descriptions of treasure maps in **Patrician IV: Rise of a Dynasty**.
This is not a reconstruction of its hidden placement, price or reward formulas.

## Finding and boundary

The new research gap is a persistent search objective whose clues, visibility
and recovery are different states. Current Almojarife charts reveal ports;
positive sea events can already pay salvage money. Neither is a collection of
clues leading to a separately recoverable site. An earlier events note names
P4 treasure fragments, but does not study that state contract. The expedition
notes concern searching for trading destinations, not consuming a reward site.

The useful lesson is optional exploration with understandable information,
not copying map art or making players click individual pixels. No feature or
historical Iberian treasure-hunting premise is approved by this note.

## Sources and limits

All sources below were fetched and relevant sections read on the date above.
No gameplay experiment was performed. No binary, extracted table, utility chart,
modding-internals page, competitor code, asset or source wording was used.

| Ref | Public source | Evidence / limit |
| --- | --- | --- |
| S1 | Publisher expansion manual, Treasure maps: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf | Primary documented loop: acquisition, logbook, search, visibility, recovery and reward categories. Intended behavior, not a patch-specific runtime test. |
| S2 | Publisher German expansion manual, Schatzkarten: https://download.kalypsomedia.com/manuals/P4_Addon_Manual_DE_preview.pdf | Clarifies that the completed map leaves the site marked on the sea map. This is a language/preview cross-check of the same documentation, not independent corroboration. |
| S3 | Publisher description on Steam: https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/ | Establishes treasure-map collection as an expansion feature. Marketing does not specify recovery guards. |
| S4 | Heraclitus, Steam community guide, City Screen and World Map: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Describes nearby sea opportunities, including fragments and treasure. Player account, not official detection geometry. |
| S5 | Steam discussion, Treasure maps: how to get the better from them?: https://steamcommunity.com/app/57730/discussions/0/846943082453085888/ | Conflicting player explanations of early recovery and required fragments. Anecdotes, not a settled eligibility rule or price/reward formula. |
| S6 | Gamepressure expansion description: https://www.gamepressure.com/games/patrician-iv-rise-of-a-dynasty/zf28b3 | Editorial overview describes assembling a map from parts. Its generic feature description may derive from publicity; not independent evidence of search mechanics. The page's AI-generated user-review summary is not used. |

Coverage includes primary documentation, publisher description, community guide
and discussion, and an editorial overview. Detailed mechanics rest chiefly on
S1; the other pages do not turn them into an experimentally verified system.
No piece count, price, payout, detection distance, source map or source text is
reproduced. A broad contemporary review was also inspected, but offered no
specific treasure contract and is not counted as proof here.

## What is actually documented

### Acquisition and knowledge are separate from the reward

The manual describes fragments sold by sailors in taverns and fragments found
in bottles at sea. Acquired pieces are assembled in the assignments part of the
logbook. This is a persistent collection, not an immediate payment or an ordinary
port-discovery chart. [S1, S2; broad collection premise also S3/S6]

The manual says a player can begin searching with enough information and that
completing the map reveals the site directly. It does not state an exact minimum
collection threshold or establish a universal requirement to own a particular
marked piece before recovery. Do not invent either rule.

### Search, visibility and collection are distinct actions

A convoy must pass over the hidden site to reveal it; the manual then describes
an explicit collection action. Completing the map provides a visible fallback
rather than forcing an indefinitely blind search. The German manual explicitly
describes the completed-map marker as persistent. [S1/S2] The guide also reports
that sea opportunities become visible near a player's convoys. [S4]

A player in S5 attributes failed collection to lacking the marked fragment;
another describes successful inference from partial clues but complains about
very precise positioning. These explanations do not settle the same mechanism.
We cannot establish a mandatory special-fragment gate, pixel-sized hitbox,
detection-radius change per piece, or a specific-version bug from that thread.
The official description supports a search-to-marker fallback; it does not
supply the geometry or every recovery prerequisite.

### Recovery need not be a sale

The manual lists goods and money as possible treasure categories. [S1/S2]
That does not establish whether a full hold blocks recovery, where overflow
goes, how recovered goods are valued, whether clues are consumed, how many
searches coexist, or whether sites expire or respawn. A comment connecting piece
prices to payout in S5 is not a verified formula. These questions stay open.

## Delta against current code, not old backlog labels

| Existing source | Actual behavior and reuse boundary |
| --- | --- |
| `src/game/charts.mjs` | Coast charts reveal ports; route rumours reveal an unknown port and an explicitly approximate market snapshot. No fragment collection or recoverable site record. Do not replace these working systems or make a treasure clue disclose market cells. |
| `src/game/fog.mjs` | Discovery tracks known world nodes and nearby ports using owned presence and ship position. A reward-site lifecycle must not be stored as port discovery or accidentally become a trade destination. |
| `src/game/freenav.mjs`, `src/game/game.mjs` | Optional free navigation plans travel to points snapped to sea lanes. This is a possible movement substrate, not a guarantee that an arbitrary generated sea coordinate can be reached. Default navigation must not silently become free navigation for a quest. |
| `src/sim/position.mjs` | Provides current interpolated ship coordinates. A future search resolver needs simulation-time, reachable segment checks rather than render-frame or mouse-pixel checks. Fast travel can otherwise skip a small site between samples. |
| `src/game/events.mjs`, `data/world.json` | Drifting cargo already has salvage effects; the resolver pays cash scaled to ship capacity rather than creating a persistent site and goods stack. Safe events may auto-resolve. A fragment event is not supported by merely adding an unrecognised effect key. |
| `src/game/gamesave.mjs` | Validates voyages/free points and remaps pending-event ship references. A new collection/site/recovery record needs an explicit shape and reference policy, not faith in generic serialization. |

## Own design proposal, not a P4 specification

First build a small optional search contract, before map fragments as decorative
images. Give each objective a stable identity, acquired-clue set, bounded search
information, a site on a reachable lane and an explicit recovered state. Keep
the reward fixed for that objective across save/load and repeated inspections.
More information should reduce uncertainty without exposing unrelated world or
market knowledge. Clue acquisition, site visibility and recovery should have
separate guards and separate log messages.

Use a clear search area and accessible recovery control, not pixel hunting.
Decide explicitly whether passing a reachable segment can reveal a site before
the full clue set. If completion guarantees a marker, make it a real reachable
fallback, not a marker over land. This is our usability choice motivated by the
documentary loop and the reported frustration, not a claim about P4's formula.

Start with one modest objective and a declared cash-only reward in synthetic
tests if a code experiment is later approved. Goods recovery would need its own
capacity, book-cost and overflow contract before being enabled. No imported
payout scale, tavern price, automatic clue purchase, new market formula, global
map reveal or full off-map expedition is needed for that first experiment.
Reward ownership, bot competition, historical framing and campaign placement
remain separate choices. Do not present this note as a ready small UI feature.

### Acceptance contracts for a later implementation

- Duplicate clue acquisition changes neither the collection nor cash twice;
  rejecting an unavailable offer leaves IDs, balances and objective state intact.
- Hidden site coordinates are not rendered or included in player-visible
  tooltips/log payloads before the declared reveal rule. This is in-game
  information discipline, not an anti-cheat promise for local save files.
- A fragment never reveals a port or exact remote market data incidentally.
  Ordinary charts, rumours and old saves retain their current behavior.
- Every objective can be completed through the navigation mode actually enabled.
  Segment-crossing detection is deterministic across tick rates and does not
  depend on zoom, screen resolution, interpolation frames or pointer precision.
- Recovering requires the declared live owned presence and objective state.
  Replays, two ships arriving together and repeated UI actions pay at most once.
  A sold or missing ship cannot recover by stale reference.
- Save/load preserves acquired clues, revealed/recovered status and reward
  identity. Malformed objectives reject or repair under a documented policy;
  reloading cannot reroll an expensive clue or regenerate a claimed reward.
- A failed recovery explains its reason without consuming the reward. If goods
  rewards are added later, capacity/overflow/book cost must be explicit and
  conserved; salvage cash must not also create free cargo or sales reputation.

No implementation, test run, gameplay experiment or UI is supplied here. Source
eligibility details, historical suitability and our own balance remain open.
