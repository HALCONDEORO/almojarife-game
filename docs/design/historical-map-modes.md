# Historical map views (OFF)

Four player information views, opened by a Map button and selector. Not a developer dashboard.
`HISTORICAL_MAPS_ENABLED=false` means no controls, notices or additional fetches. No saved-game/economy changes.

1. Geographic: existing chart, ships, lanes and discovery unchanged.
2. Political: coloured rings on discovered ports, with a named colour key for the current game year. Not invented territorial borders. Uses data/realms.json from corrected #248@30af45cf8060af6878d39f10de4b749e7650487d, when available. This patch does not copy that dependency or activate it. Separate crowns remain separate under a shared monarch. Scope1480-1600; unknown means no verified attribution, not neutral territory. Sub-year changes inherit the upstream annual resolution.
3. Leagues: documented members, dated evidence and source links. No regional shading, no assumed bilateral trade route between all members, no alliance bonuses. Membership outside our port roster is named, not invented as nodes.
4. Trade: existing discovered navigation lanes plus each discovered port's declared makes/needs. These are game production specialisations, not historical volumes or current stock. No prices, flows, ledger, affordability or internal metrics.

Original UI/SVG annotations; no third-party or P3/P4 artwork. Existing base chart preserved rather than imported into a new asset.

Delivery order: scaffold/geographic; political renderer; sourced leagues; trade. Reviews and publication belong to Estudio. Default stays OFF until reviewed.

## Revised player presentation (Marco,18:00)
No sources, links, attribution notices, research warnings or technical holding intervals
are visible in normal play. Political key: current game year and names/colours only.
Leagues: name and short player description only. Trade: produces/needs only.
Sources remain in data and these docs. No developer panel added by this patch.

## Historical changes and borders
The renderer re-evaluates holding intervals at the current calendar year on every
render. Unknown, unsourced, conflicting and invalid rows are uncoloured. Scope1480-1600.
Annual dates inherit #248 precision; this is not a claim that a conquest happened on
1January. A personal union is not a transfer of all ports to one crown.
Verified upstream sources, inspected22October2026:
- Málaga1487: https://en.wikipedia.org/wiki/Siege_of_M%C3%A1laga_(1487)
- Orán1509: https://en.wikipedia.org/wiki/Oran
- Melilla1497: https://en.wikipedia.org/wiki/Melilla
- Argel1516: https://en.wikipedia.org/wiki/History_of_the_Regency_of_Algiers
Do not infer land borders from port rings. Future border dataset must carry:
original/PD geometry, validFrom/validUntil, dated source per segment, precision,
and ambiguous/disputed areas. Render only sourced segments matching the current
year. No such vetted geometry has been supplied yet; land borders are not shipped.
The existing base chart is geographic, not a claim about historical jurisdiction.

Marismas founding roster: https://www.rsbap.org/ojs/index.php/boletin/article/download/1412/1345/2628
Secondary period synthesis ending1494: https://historia.nationalgeographic.com.es/a/hermandad-marismas-asi-gano-castilla-dominio-atlantico_25456
Roster1296 is not annually attested membership. Only Santander/SanSebastián from
that roster have nodes on this map; Bilbao is not inferred. No invented route mesh.
