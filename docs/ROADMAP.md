# Almojarife - Roadmap (working reference), v4

Language: Spanish is the main language, English second. Today: 19 Oct 2026.
Map: the Spanish coast and its surroundings first. Name: Almojarife is the top rank.
Rule from two audits: shorten the plan by cutting scope, not by squeezing dates or buffers.

## Two options (owner chooses)

| | Option 1: Full 1.0 | Option 2: Reduced 1.0 |
|---|---|---|
| Ports | 10 (Cádiz, Sevilla, Lisboa, Málaga, Valencia, Barcelona, Palma, Bilbao, Marseille, Tánger) | 8 (Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger) |
| Goods | 16 | 12 |
| Campaign | Acts 1 and 2 | Acts 1 and 2 |
| Workshops | Full chains in Alpha | One chain in Alpha, rest after 1.0 |
| Beta extras | One harvest event | None |
| M0 Loop lock | 6 Nov 2026 | 6 Nov 2026 |
| M1a Engine base | 15 Jan 2027 | 15 Jan 2027 |
| M1b Economy prototype | 26 Feb 2027 | 12 Feb 2027 |
| M2 Vertical slice | 30 Apr 2027 | 9 Apr 2027 |
| M3 Alpha | 31 Aug 2027 | 14 Jul 2027 |
| M4 Public web beta | 31 Jan 2028 | 30 Nov 2027 |
| Content and string freeze | 6 Dec 2027 | 19 Oct 2027 |
| M5 1.0 (web only) | 30 Apr 2028 | 28 Feb 2028 |

Option 2 is about 6 weeks earlier at Alpha and about 2 months earlier at 1.0. The gain comes from smaller data work (fewer ports, goods and workshop chains), not from skipping gates; acts, ranks, storms, pirates, saves and ES/EN are the same in both. M1a moved from 18 Dec to 15 Jan in both because holiday weeks have zero capacity. Not in either 1.0: Act 3, 20 cities, council voting, insurance, plague, blockade, a 4th ship type, desktop builds, Canary Islands, Genoa and Orán (first expansion), regions beyond.

## Milestone exit criteria and gates (same for both options)

| # | Milestone | Exit criteria | Gate and fail rule |
|---|---|---|---|
| M0 | Loop lock | Outline per act (2); era chosen and a sourced list of goods and ports; string-ID (i18n) decision; ES/EN glossary; asset licence policy; content stance written; trademark scope recorded (EUIPO, USPTO, OEPM, Steam, itch), with OEPM, EUIPO and USPTO checked by hand by the owner; tester recruiting started | Owner approves. No public push or release until the name check is done |
| M1a | Engine base | World data for the chosen ports and lanes; deterministic seeds; save format with schema version; save/load round trip; CI running | Replay and round trip pass. Else no economy work |
| M1b | Economy prototype | Goods, 3 ships, AI traders, market fees; 1,000 simulated years in CI under 5 min; no good pinned at a price clamp more than 30% of the time | A scripted bot finds profitable routes that fade with use. Retune time-boxed to 3 weeks; if still failing, cut goods by a third and re-gate. 5 testers confirmed by now or recruit harder |
| M2 | Vertical slice (browser) | First 10 minutes playable incl. harbour orders and a second ship; 3 screens in a locked style; ES and EN complete for the slice; hosting target; browser matrix, load budget, accessibility baseline | 5 outside testers (3+ native Spanish speakers) finish it unaided, 3+ want more. Fail: iterate the loop 4 weeks, add no content |
| M3 | Alpha | Acts 1-2 playable; workshops per option; standing ranks to Almojarife; storms and pirates; save/load with migration corpus; deploy pipeline; ES complete, EN complete for acts 1-2 | Owner plays acts 1-2 end to end; zero save-loss bugs. Fail: slip 2 weeks (the freeze date moves with it) or cut workshops |
| M4 | Public web beta | Tutorial; sound CC0 or CC BY logged in CREDITS; content and string freeze 6 weeks before beta (not in holiday weeks); native ES and EN proofread; privacy notice naming the feedback method | 20+ testers, 70%+ finish the tutorial, no known crash. Fail: slip 2 weeks or cut events |
| M5 | 1.0 (web) | Asset licence audit clean; 0 open P1 bugs; 3 full campaign playthroughs by different testers; beta saves load | Owner go. A P1 bug slips the date in 2-week steps |

Rules: 25% buffer in each milestone. Zero-capacity weeks: 21 Dec 2026 to 3 Jan 2027; 22 to 28 Mar 2027; 20 Dec 2027 to 2 Jan 2028; 10 to 16 Apr 2028 (August is normal capacity). All dates assume the gates pass; a failed gate shifts later dates by the overrun beyond the buffer, and if Option 1 fails M1b twice we switch to Option 2. the owner's weekly review budget is set in hours and PRs stay small.

## Risks
- PR review is the owner reviewing work made with AI help, so it is self-review. Independent checks are outside testers and external model or human reviewers.
- Option 1 keeps 30 Apr 2028 although M1a moved 4 weeks later than in v3.1; the extra weeks are absorbed by a longer Alpha stretch (M2 30 Apr to M3 31 Aug), which is stated here, not hidden.
- The name and trademark gate is open: EUIPO, USPTO and OEPM could not be checked by tools.
- Content stance for Canary Islands and North Africa trade (slavery, colonial history) is an M0 item; the game does not trade in people.

## Dependencies
String IDs, glossary and UI room for text 30% longer; save format and seeds from M1a; orders and a second ship by M2; asset ledger in CREDITS from the first file; OFL fonts with Spanish glyphs.

## Steam
Owner decision only; needs a paid developer registration. Nothing done until the owner says so.

## Change log
- v0 to v3.1: Baltic scope, three external audits, 1.0 on 30 Apr 2028 (see git history).
- v3.1 to v4: map changed to the Spanish coast; two scope options instead of compressed dates (external audit of a compressed draft and a second external review both said not to compress dates or buffers); inconsistencies fixed (insurance, plague, desktop moved out of 1.0 everywhere); M1a moved to 15 Jan; 3-week retune box and 25% buffers kept; era decision and tester recruiting added to M0; self-review risk recorded. Second external audit (Claude Opus) of the options: Alpha date for Option 2 moved to 14 Jul 2027, freeze dates added, zero-capacity weeks defined, failed-gate rule added, USPTO added to the hand check. A third pass on this final text is pending.
