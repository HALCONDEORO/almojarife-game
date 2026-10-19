# Decisions log

Every decision that shapes the game, with date, who decided and where it lives. Newest last. Times are Atlantic/Canary on 19 Oct 2026 unless noted.

| Date | Decision | Decided by | Where |
|---|---|---|---|
| 19 Oct | Name is Almojarife (top rank). Public release stays gated by a manual trademark check (OEPM, EUIPO, USPTO), the owner seeing the draft, an external review and a fresh secrets scan | Owner | ROADMAP.md, Risks |
| 19 Oct | Name check "Almojarife", free tools only, not legal advice. TMview (EUIPO, OEPM, WIPO, US, GB, IE offices; all classes): 0 hits for almojarife, almojarifes, almojarifa, almoxarife, almojarif*; a control search worked (patrician: 71 hits, almorávide: 3). Steam store search and itch.io search: 0 results. Domains almojarife.com/.net/.org: RDAP says not registered. Limits: TMview data can lag national offices; USPTO TESS and WIPO Global Brand DB were not queried directly; sound-alike and visual-similarity review not done; common word in Spanish history, so a descriptive-term objection is possible. Gate: name stays provisional, not cleared | Task agent, owner asked for the check | this file |
| 19 Oct | Map is the Iberian coast: 8 ports (Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger), 12 goods. Lisboa and Tánger are not Spanish, so call the world Iberian | Owner, then tests | ROADMAP.md, data/world.json |
| 19 Oct 11:06 | Official plan is Option 2 (scope cut, dates kept). Option 1 removed | Owner | ROADMAP.md v5 |
| 19 Oct 11:17 | Free play and campaign with missions. Act 1 in Alpha, Act 2 in the beta | Owner | ROADMAP.md v5.1 |
| 19 Oct 11:35 | Browser first. Desktop (Windows, Linux) after 1.0 from the same code. macOS dropped for now | Owner delegated to project lead | ROADMAP.md v5.3 |
| 19 Oct | Cut scope, never compress dates or buffers. Advance a gate as soon as it is met, with tests | Owner | ROADMAP.md |
| 19 Oct | Spanish is the main language, English second, string IDs from the start | Owner | docs/design/i18n.md |
| 19 Oct | Legal posture for other games: study ideas and mechanics only. No copying of art, text, names, data or code | Owner | docs/COMPETITION.md |
| 19 Oct | Content stance: the game does not trade in people | Owner | docs/design/content-stance.md |
| 19 Oct | Asset licences: only CC0, CC BY or own work, logged in CREDITS from the first file | Project lead | docs/design/asset-licences.md |
| 19 Oct | Steam and any spend (code signing, registration) need the owner's explicit yes. $0 budget so far | Owner | ROADMAP.md, Steam |
| 19 Oct | Small PRs, each with tests and an external model review, merged when they pass without waiting for the owner | Owner | docs/PROCESS.md |
| 19 Oct 12:10 | M0 documents approved by the owner. Publication gate stays closed | Owner | issues #5-#11 |
| 19 Oct | Producer stock is capped at 4x target so prices do not sit on the floor. Consumers drain to zero until trade exists (M1b) | Project lead | PR #17, test/world.test.mjs |
| 19 Oct 14:03 | Art plan A: 2D nautical-chart map, flat icons, parchment UI, made by own code and SVG, cost 0 EUR. Review commissioning original art (option C) after M2. 3D in the browser is out of scope for 1.0 | Owner | docs/DECISIONS.md |
| 19 Oct 14:03 | Procedural low-poly cog made as a test of level only (tools/make_cog.py, assets/models/cog.gltf, own work CC BY 4.0). Not part of the 1.0 art plan | Project lead | docs/design/cog_preview.png |
| 19 Oct 14:15 | Cartagena added as port 9 (37.60 N, 0.98 W; makes salt and dried fish, needs grain, wine and cloth; 33 lanes). Alpha map is 9 ports. No new goods, no arsenal or silver (wrong era) | Owner (request relayed by the project lead) | data/world.json, docs/design/era-goods-ports.md |

## Open
- Name check: first pass done, see the 19 Oct row. Still open: a lawyer or paid clearance before any commercial release.
- Code of Conduct needs a real contact address before going public.
- Lane-crossing test skips city-to-waypoint lanes beyond the 10 km rule; revisit when ports move.
