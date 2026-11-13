# P4 princes: a satisfaction relationship with tribute, siege and tolls

13 November 2026. Main checked: `65f6088` (through PR898).
Scope: public P4 documentation and accounts of the regional prince as a
political relationship: satisfaction, tribute demands, siege threat, wall
defense, and the expansion's route and toll mechanics. The base game and the
Rise of a Dynasty expansion are identified separately.

## Finding

Almojarife has no regional ruler actor at all. Its walls are council works
voted and paid by the concejo (`src/game/walls.mjs:1-6`), its watchtowers
mount on those walls with siege interactions explicitly not built
(`src/game/towers.mjs:10`), and the only tribute is a flat household charge
on net worth paid to one's home port (`src/game/household.mjs:1-5`,
`src/game/game.mjs:183,321-322`). The governor is a hired warehouse
administrator, not a ruler (`src/game/governor.mjs:1-5`). P4 documents a
different actor: a regional prince with a visible satisfaction (decay over time is
reported by a community wiki but unverified),
escalating tribute demands, a siege threat against the region's cities, and -
in the expansion - control over land routes and armed toll collectors. This
note does not approve a ruler simulation, a siege system or any wall change.
The land-sale slice was already recorded in the territorial-purchase note and
the wagon slice in the land-logistics note; neither is rediscovered here.

## Sources and method

Relevant sections of these public pages were fetched and read on the date
above; both publisher manuals were downloaded in full and searched as text.
No binary, extracted data, utility chart, modding-internals reference,
competitor code, art, dialogue, numerical table or copied source wording was
used. No game experiment was performed. Described mechanics are not measured
formulas, and source figures are deliberately not imported.

| Ref | Source | What it supports / limit |
| --- | --- | --- |
| S1 | Publisher P4 manual, Princes chapter, city gate, rank list and Mayor sections: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Each region has a prince whose envy of city success produces tribute demands that grow with the region's prosperity; fulfilled demands keep him satisfied, neglect can lead to a siege during which businesses outside the walls shut down; the two documented defenses are meeting demands and stronger walls with tower-protected gates, pursued through the council or as mayor; the envoy at the city gate (a rank-gated contact) reports satisfaction, current demands and nearby troop strengths; troops attack the most poorly defended gate; the mayor plans larger walls to bring more buildings under protection. Does not say what demands consist of or how a siege ends. |
| S2 | Publisher expansion manual, land routes and escort sections: https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf | Princes control the land routes and offer to open one only when satisfied, limited to discovered cities of their own region; an unhappy prince is more likely to stop wagon trains with armed toll collectors, escort mercenaries can resist them, and a lost escort fight raises the toll without losing the train. Satisfaction is described qualitatively, with no gauge or threshold. |
| S3 | Japanese trade-game fan wiki, P4 prince page: https://tgp1-silkload.sakura.ne.jp/_trade_game/_pt4/pt4_prince.html | Community wiki: satisfaction is a visible gauge that decays over time, an attack comes at the worst relations, outside-wall production buildings are destroyed and farm goods can only be produced outside the walls; tribute can be money or demanded goods; each realm tends to monopolize one specialty good, so a march can cascade into shortages of dependent goods (player strategy advice, not adopted as rules); in the Gold Edition a fully satisfied prince may request opening an inland route, which unlocks the connected inland city. Where it overlaps the manuals it agrees; its gauge and destruction details are unverified community claims. |
| S4 | Patrizierforum pre-release political discussion: http://www.patrizierforum.net/index.php?thread%2F3095-thema-6-politische-m%C3%B6glichkeiten-landesf%C3%BCrst%2F= | A 2009 pre-release design outline lists prince negotiations including lending, gifting money and gifting goods. Pre-release intent, not proof of shipped behavior. |

## What the sources support

- The relationship is a satisfaction state per region, visible at the city
  gate together with the current demands and troop dispositions (S1; the
  gauge and its decay are community claims, S3).
- Demands escalate with regional prosperity, and meeting them is the
  documented way to keep the peace (S1).
- The manual documents an economic shutdown: a siege stops outside-wall
  businesses (S1) and, on community account, destroys outside-wall
  production buildings, with farm goods unavoidably exposed because they
  can only sit outside (S3).
- The defense is dual: pay, or build walls and towers that bring more of
  the city under protection, through the council or as mayor (S1). The
  mayor's wall planning is explicitly framed against the siege case (S1).
- The expansion turns satisfaction into an unlock economy: land routes open
  only through a satisfied prince (S2), and a community account describes a
  fully satisfied prince requesting an inland route that unlocks a new
  inland city (S3); the expansion also arms the unhappy prince against
  wagon trains with toll collectors (S2).
- Negotiation channels beyond fulfilling demands (lending, gifting) appear
  only in pre-release material (S4) and community account (S3), so they
  remain weakly supported.

## Comparison with current code

- No prince, ruler, tribute-demand or siege mechanic was found in the
  inspected source: searches over `src/game` and `src/sim` for prince,
  tribute and siege terms hit only the household tribute and an explicit
  towers comment that siege interactions are not built.
- Defense infrastructure exists without its threat: three wall levels as
  council works (`src/game/walls.mjs:1-6`) and wall-mounted towers
  (`src/game/towers.mjs:1-10`) currently mitigate nothing siege-like.
- The household tribute is a flat own-design charge per house
  (`src/game/household.mjs:1-5`), not a relationship: no satisfaction
  state, no demands, no regional grouping.
- Realms exist as a piracy concept (`src/game/marque.mjs`, realmOf used by
  justice), a possible seam for regional grouping, but no ruler state rides
  on them.
- The city gate, envoy and troop-strength visibility (S1) have no
  counterpart found in the inspected source.

## Open questions

- What tribute demands consist of in the shipped game: money, goods, or
  both, and how their size is set. S1 does not say; S3 claims both forms.
- How satisfaction moves: exact decay, the effect of fulfilled demands, and
  whether a gauge exists in the shipped base game or only in community
  description (S3).
- How a siege resolves: duration, repel conditions, and exact destruction
  scope. The manual is silent and S3's account is unverified.
- Whether the siege-attacker choice (the most poorly defended gate, S1)
  interacts with tower placement or only wall level.
- Whether negotiation by lending or gifting exists in the shipped game
  (S4 is pre-release intent; S3 implies donations).
- Whether the hired-pirate channel connects to princes: the manual lists a
  prince among those who hire pirates, but no source read describes a
  player-visible link.
- The exact base-versus-expansion split of every mechanic above; only the
  land-route, toll-collector and land-sale items are clearly
  expansion-marked (S2).

## Design observation (own, not implementation)

If this gap were ever filled, the sources suggest a bounded actor per
region: a satisfaction state fed by tribute and drained by neglect, an
economic punishment aimed at outside-wall production that gives the
existing walls and towers their missing threat, and expansion-style
satisfaction rewards gated behind discovery. Any such work would need its
own design approval; this note records the research boundary only.
