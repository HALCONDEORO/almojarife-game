# Historical map views (OFF)

Four player information views, opened by a Map button and selector. Not a developer dashboard.
`HISTORICAL_MAPS_ENABLED=false` means no controls, notices or additional fetches. No saved-game/economy changes.

1. Geographic: existing chart, ships, lanes and discovery unchanged.
2. Political: coloured rings on discovered ports, with a named colour key for the current game year. Not invented territorial borders. Uses data/realms.json from corrected #248@30af45cf8060af6878d39f10de4b749e7650487d, when available. This patch does not copy that dependency or activate it. Separate crowns remain separate under a shared monarch. Scope1480-1600; unknown means no verified attribution, not neutral territory. Sub-year changes inherit the upstream annual resolution.
3. Leagues: documented members, dated evidence and source links. No regional shading, no assumed bilateral trade route between all members, no alliance bonuses. Membership outside our port roster is named, not invented as nodes.
4. Trade: existing discovered navigation lanes plus each discovered port's declared makes/needs. These are game production specialisations, not historical volumes or current stock. No prices, flows, ledger, affordability or internal metrics.

Original UI/SVG annotations; no third-party or P3/P4 artwork. Existing base chart preserved rather than imported into a new asset.

Delivery order: scaffold/geographic; political renderer; sourced leagues; trade. Reviews and publication belong to Estudio. Default stays OFF until reviewed.
