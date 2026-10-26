# Decisions (from 22 Oct 2026)

Versión en español: [es/decisions.md](es/decisions.md).

Continues `docs/DECISIONS.md`. Format: date, decision, why, where it lives. Source is named neutrally; approvals are recorded, not quoted from files.

| Date | Decision | Why | Where |
|---|---|---|---|
| 22 Oct | Price floor and caps stay as they are | Keep the market stable while the saturation design changes | economy.md |
| 22 Oct | Redesign market saturation instead of widening NPC bands | The problem is regenerative arbitrage in the market, not the bots | economy.md, PR #229 |
| 22 Oct | Bots follow the same rules as the player | Bots must behave like real players | bots.md |
| 22 Oct | Public repo text carries no personal names | The repo is public | PR #228 |
| 22 Oct | Internal wiki lives in docs/, tables generated from code, every game PR updates its page | One versioned source that cannot drift | README.md |
| 22 Oct | Meat is dear for the rich; food is split across three classes | Matches the historical split of consumption by class | classes.md (not yet in game) |

| 26 Oct | Political map realm names use smaller labels, a separate Granada callout and an aligned key | Keep all realm and port names readable together at desktop overview; colours remain approximate washes, not borders | src/view/historicalmap.mjs |

| 26 Oct | Northern Castilian coastal wash and map-only Navarre | Cover the northern coast, stop Portugal at the Minho, show southern Navarre separately before its 1515 incorporation; approximate context only, no changes to port holdings or marque rules | data/realms.json |
