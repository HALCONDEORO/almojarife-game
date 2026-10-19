# Roadmap (working reference), v3.1 (audited, final)

Language: Spanish is the main language, English is second. The game is bilingual ES/EN.
Today: 19 Oct 2026. Small and working first, then grow.

## Scope for 1.0
10 cities (Baltic and North Sea), 16 goods (12 if the M1b gate fails), 3 ship types, one campaign in 3 acts, sandbox. Everything else is after 1.0.

## Milestones, exit criteria and gates

| # | Milestone | Target | Exit criteria | Gate and fail rule |
|---|---|---|---|---|
| M0 | Loop lock | 6 Nov 2026 | One-page outline per act; string-ID (i18n) decision; ES/EN glossary; asset licence policy; name chosen by the owner; trademark search done and its scope recorded (EUIPO, USPTO, OEPM, Steam, itch names) | Owner approves. The working title is not final: no public push or release until the name check passes. Slips 1 week at a time |
| M1a | Engine base | 18 Dec 2026 | Deterministic seeds (same seed, identical replay); save format with schema version; save/load round trip; CI running tests; tester recruiting started | Replay and round trip pass. Else no economy work |
| M1b | Economy prototype | 29 Jan 2027 | 10 cities, 16 goods, 3 ships, AI traders, market fees; 1,000 simulated years in CI under 5 min; no good pinned at a price clamp more than 30% of the time | A scripted bot finds profitable routes that fade with use. Retune is time-boxed to 3 weeks (M1b may slip to 19 Feb, absorbed by the M2 buffer); if still failing, cut goods to 12 and re-gate |
| M2 | Vertical slice (browser) | 16 Apr 2027 | First 10 minutes playable incl. harbour orders and a second ship; 3 screens in a locked style; ES and EN complete for the slice; hosting and deploy target chosen; browser matrix, load budget and accessibility baseline (font size, colour-blind palette, keyboard play) | 5 outside testers (3+ native Spanish speakers) finish it unaided, 3+ want more. Fail: iterate the loop 4 weeks, add no content |
| M3 | Alpha | 31 Aug 2027 | 10 cities; acts 1-2; workshops; standing ranks; storms and pirates; save/load with a migration test corpus kept from here on; deploy pipeline; ES complete, EN complete for acts 1-2 | Owner plays acts 1-2 end to end; zero save-loss bugs. Fail: slip 2 weeks or cut workshops to one chain |
| M4 | Public web beta | 31 Jan 2028 | Act 3, one harvest event, tutorial, CC0 or CC BY sound, logged in CREDITS, content and string freeze 13 Dec 2027, native ES and EN proofread, privacy notice naming the feedback method (opt-in survey or opt-in local telemetry) | 20+ testers, 70%+ finish the tutorial, no known crash. Fail: slip 2 weeks or cut Act 3 events |
| M5 | 1.0 (web) | 30 Apr 2028 | Asset licence audit clean; 0 open P1 bugs; 3 full campaign playthroughs by different testers; saves from beta load | Owner go. A P1 bug slips the date in 2-week steps |

Rules: about 25% buffer in each milestone; one content and string freeze, 13 Dec 2027, covers both M4 and M5; holiday weeks count as zero capacity; the owner is the review bottleneck so PRs are small. Storms and pirates are in M3 only; the M4 events are extras.

## Dependencies (must exist earlier than the feature that needs them)
- String IDs, ES/EN glossary and UI room for text 30% longer: from M1a.
- Save format and deterministic seeds: from M1a.
- Orders and a second ship: by M2 (the first 10 minutes need them).
- Asset ledger in CREDITS from the first file; only CC0 or CC BY assets. Fonts must be OFL with Spanish glyphs.

## Deferred (not in 1.0)
Cities 11 to 20 (1.1), desktop builds (unsigned, via itch.io; Mac signing needs a paid account, owner decides), council voting, insurance, plague, blockade, a 4th ship type, regions beyond the base coast. No public promise on expansion cadence; decide after 1.0. Africa and Asia need a written content stance first (trade in people and colonial history).

## Steam
Owner decision only. Needs a paid developer registration; nothing done until the owner says so.

## Change log
- v0 -> v1 (own review): added exit criteria, bilingual rule, dependencies, buffers.
- v1 -> v2 (external audit pass 1, Claude Opus): design freeze split into loop lock (M0) and later number tuning; dates moved out about 4 to 9 months for part-time capacity, then partly pulled back because the prototype already exists (M1 18 Dec, not 29 Jan); Beta split from 20-city expansion (20 cities deferred); sound, fonts, licences and legal items added; council, insurance, plague, blockade and 4th ship deferred; expansion promise removed; testers and measurable gates added.
- v2 -> v3 (audit pass 2, Claude Opus, REVISE light): M1 split into M1a/M1b and moved back to 29 Jan; retune time-boxed; M2 moved to 16 Apr; Alpha 31 Aug 2027, Beta 31 Jan 2028, 1.0 30 Apr 2028 (dates now match the first audit, because the prototype covers only a small part of M1); storms and pirates only in M3; 10 cities locked; native ES and EN proofread at M4; schema-versioned saves and migration corpus; gates have fail rules; telemetry wording tied to the privacy notice; web hosting, accessibility and performance added to M2; Steam wording unified.
- v3 -> v3.1 (audit pass 3, Claude Opus, REVISE light, then ACCEPT once applied): M1a references, M1b slip rule, one freeze date (13 Dec 2027), EN wording, sound licence, working-title rule.
