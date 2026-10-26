# Almojarife - Roadmap (official reference), v5.3

> Historical planning document. Port/goods counts and implementation status below describe earlier scope, not the current build. See [CURRENT-STATE.md](CURRENT-STATE.md) for the current checkpoint and [RELEASE.md](RELEASE.md) for the proposed early pre-release. Existing milestone dates have not been silently changed.

Language: Spanish is the main language, English second. Today: 19 Oct 2026.
Map: the Spanish coast and its surroundings first. Name: Almojarife is the top rank.
Rule from two audits: shorten the plan by cutting scope, not by squeezing dates or buffers.

## Official plan (Option 2, chosen by the owner 19 Oct 2026)

| | |
|---|---|
| Ports (9) | Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger, Cartagena |
| Goods | 12 |
| Modes | Free play and campaign (2 acts, 12 missions), tasks switch in free play |
| Workshops | One chain in Alpha, the rest after 1.0 |
| Beta extras | None |
| Platform at 1.0 | Web only |

| Milestone | Date |
|---|---|
| M0 Loop lock | 6 Nov 2026 |
| M1a Engine base | 15 Jan 2027 |
| M1b Economy prototype | 12 Feb 2027 |
| M2 Vertical slice | 9 Apr 2027 |
| M3 Alpha | 14 Jul 2027 |
| Content and string freeze | 19 Oct 2027 |
| M4 Public web beta | 30 Nov 2027 |
| M5 1.0 (web) | 28 Feb 2028 |

Not in 1.0: Act 3, 20 cities, council voting, insurance, plague, blockade, a 4th ship type, desktop builds, Marseille, Málaga, Canary Islands, Genoa and Orán (first expansion candidates), regions beyond. Zero-capacity weeks: 21 Dec 2026 to 3 Jan 2027; 22 to 28 Mar 2027; 20 Dec 2027 to 2 Jan 2028 (August is normal capacity). 25% buffer per milestone. All dates assume gates pass; a failed gate shifts later dates by the overrun beyond the buffer.

See [BACKLOG.md](BACKLOG.md) for the work by theme.

## Quality bar: Patrician III parity
The owner's minimum before inviting the public is a game with the depth of a classic Hanse trading game, then continuous improvement. The checklist and build order are in [research/parity-gap.md](research/parity-gap.md); the mechanics notes (clean-room, sources listed) are in [research/patrician3-mechanics.md](research/patrician3-mechanics.md). Dates stay conservative: scope is cut before dates move.

## Milestone exit criteria and gates

| # | Milestone | Exit criteria | Gate and fail rule |
|---|---|---|---|
| M0 | Loop lock | Outline per act (2) and a list of 12 missions; era chosen and a sourced list of goods and ports; string-ID (i18n) decision; ES/EN glossary; asset licence policy; content stance written; trademark scope recorded (EUIPO, USPTO, OEPM, Steam, itch), with OEPM, EUIPO and USPTO checked by hand by the owner; tester recruiting started | Owner approves. No public push or release until the name check is done |
| M1a | Engine base | World data for the chosen ports and lanes; deterministic seeds; save format with schema version; save/load round trip; CI running | Replay and round trip pass. Else no economy work |
| M1b | Economy prototype | 12 goods (cut to 8 on retune fail), 3 ships, AI traders, market fees; 1,000 simulated years in CI under 5 min; no good pinned at a price clamp more than 30% of the time | A scripted bot finds profitable routes that fade with use. Retune time-boxed to 3 weeks; if still failing, cut goods to 8 and re-gate. 5 testers confirmed by now; if fewer, recruiting becomes the top M2 task and M2 cannot exit without 5 |
| M2 | Vertical slice (browser) | First 10 minutes playable incl. harbour orders and a second ship; 3 screens in a locked style; ES and EN complete for the slice; hosting target; browser matrix, load budget, accessibility baseline | 5 outside testers (3+ native Spanish speakers) finish it unaided, 3+ want more. Fail: iterate the loop 4 weeks, add no content |
| M3 | Alpha | Free play for the 9 ports; tutorial and Act 1 (6 missions); one workshop chain; standing ranks to Almojarife; storms and pirates; save/load with migration corpus; deploy pipeline; ES complete, EN complete for Act 1 | Owner plays free play and Act 1 end to end; zero save-loss bugs. Fail: slip 2 weeks (freeze, M4 and M5 move with it) or defer the workshop chain to after 1.0 and update the plan table |
| M4 | Public web beta | Act 2 (6 missions) and side missions; saves continue into free play; sound CC0 or CC BY logged in CREDITS; content and string freeze 6 weeks before beta (not in holiday weeks); native ES and EN proofread; privacy notice naming the feedback method | 20+ testers, 70%+ finish the tutorial, no known crash. Fail: slip 2 weeks or cut random events |
| M5 | 1.0 (web) | Asset licence audit clean; 0 open P1 bugs; 3 full campaign playthroughs by different testers; beta saves load | Owner go. A P1 bug slips the date in 2-week steps |

Rules: the owner's weekly review budget is set in hours; PRs stay small; an M3 slip moves the freeze, M4 and M5 by the same amount.

## Risks
- PR review is the owner reviewing work made with AI help, so it is self-review. Independent checks are outside testers and external model or human reviewers.
- The name and trademark gate is partly closed: a free TMview search (EUIPO, OEPM, WIPO, US) found no hits on 19 Oct 2026. Not legal advice; no paid clearance yet.
- Content stance for Canary Islands and North Africa trade (slavery, colonial history) is an M0 item; the game does not trade in people. Tánger is in 1.0, so the stance is needed for it too.

## Dependencies
String IDs, glossary and UI room for text 30% longer; save format and seeds from M1a; orders and a second ship by M2; asset ledger in CREDITS from the first file; OFL fonts with Spanish glyphs.

## Platform decision
Browser first; desktop builds (Windows, Linux) after 1.0 from the same code. Decision delegated to the project lead by the owner on 19 Oct 2026 11:35. Any spend (code signing, Steam registration) needs the owner's explicit approval after the price is checked.

## Steam
Owner decision only; needs a paid developer registration. Nothing done until the owner says so.

## Change log
- v0 to v3.1: Baltic scope, three external audits, 1.0 on 30 Apr 2028 (see git history).
- v3.1 to v4: map changed to the Spanish coast; two scope options instead of compressed dates (external audit of a compressed draft and a second external review both said not to compress dates or buffers); inconsistencies fixed (insurance, plague, desktop moved out of 1.0 everywhere); M1a moved to 15 Jan; 3-week retune box and 25% buffers kept; era decision and tester recruiting added to M0; self-review risk recorded. Second external audit (Claude Opus) of the options: Alpha date for Option 2 moved to 14 Jul 2027, freeze dates added, zero-capacity weeks defined, failed-gate rule added, USPTO added to the hand check.
- v4 to v5: owner chose Option 2 (19 Oct 11:06). Option 1 removed from the plan (kept in git history). Final audit (Claude Opus, 19 Oct): REVISE with small edits, applied in v5.2 (workshop fail rule, slip rule, 8-goods fallback, tester rule).
- v5 to v5.1 (owner 11:17): free play and campaign with missions added; Alpha now holds Act 1 only and Act 2 moves to the beta (M4); dates unchanged.
- v5.1 to v5.2 (19 Oct): audit fixes applied (gates and fail rules clarified), no date change.
- v5.2 to v5.3 (19 Oct 11:35): platform decision recorded (browser first; desktop Windows and Linux after 1.0; macOS dropped for now: notarization cost and no test hardware), no date change.
