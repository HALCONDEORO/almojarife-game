# P3: declining nomination is not losing rank or resigning office

Research note, 2026-11-13. Almojarife main inspected: `7989210`.
Clean-room documentation only: no source figures, quotations, slogans, assets,
excluded modding material or implementation approved.

## Finding and choice of scope

P3's manual lets the player withdraw from consideration for mayor and later
allow candidacy again. This is a reversible choice about nomination, distinct
from qualifying for office, winning an election, losing social rank or resigning
an office already held. The manual warns of possible public disappointment but
does not define its amount, duration, timing or exact affected constituency.
No reputation penalty is reconstructed here.

Existing politics and rank-perks notes already cover elected offices, reputation,
nomination eligibility and office loss. This narrower control was not found in
the real docs grep. Contracts and guild sections were considered first, but
`tippsammlung-towns2`, `public-convoy`, `player-consignment` and guild-expedition
notes already cover named brokers, partial deliveries and several guild services.
This is a small extension to political research, not a claim that politics or
contracts have no prior coverage.

## Public evidence and limits

| Source | Evidence actually used |
| --- | --- |
| S1, English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Printed/PDF p.35, section 10.11.3, extracted separately: the town-information screen shows the mayor, election date and candidate information; the player may decline nomination, leave the candidate list and later stand again. Possible disappointment is mentioned without a quantified rule. |
| S1, printed/PDF p.43, section 12.1.1, separately extracted | Social rank and elected office are distinguished: earned rank is retained, while political reappointment is not guaranteed. This does not prove every consequence of declining nomination, and is not a resignation rule. |
| S2, GRYOnline action-buildings guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-3/zf36e1 | Editorial description repeats reversible refusal of candidacy and removal from the list. Consistent with S1. Page shows an update date in 2019; not a live reproduction. |
| S3, Steam player discussion, August 2021: https://steamcommunity.com/app/33570/discussions/0/3038228110735817071/ | A player considers withdrawing before an election to avoid town-management duties, then discusses declining the next election instead. Evidence of the choice's practical appeal, not verification of immediate resignation, a penalty or benefit formulas. |
| S4, community Ranks page: https://patrician3.fandom.com/wiki/Ranks | Election, reputation and candidate-list context. Does not specify withdrawal consequences or settlement timing. Eligibility summaries need not be identical across every account or edition; no exact threshold is adopted. |
| S5, GRYOnline mayor guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/burmistrz/zf36f0 | Describes office responsibilities and council approval. Context for choosing not to seek office, not evidence that a refusal changes the current mayor. Page shows an update date in 2019. |
| S6, Jeuxvideo discussion, 2005: https://www.jeuxvideo.com/forums/1-9240-950896-3-0-1-0-0.htm | Players discuss accepting candidature and eligibility, with disagreement about rank requirements. Informal reports, not a dependable eligibility specification or proof of an opt-out penalty. |

The core reversible-choice claim rests on the manual and editorial guide.
No P3 session, save transition or penalty was reproduced. The sources do not
settle same-day election behavior, cutoff times, persistence through relocation,
or whether an incumbent's refusal affects only the next election. Those remain
questions, not attributed P3 rules.

## Actual main audit

| Code read | What exists and what must remain distinct |
| --- | --- |
| `src/game/townhall.mjs`, `townCouncil` | Generates a deterministic named mayor and councillors for a port. The function's actual body has no candidate list, player nomination preference or electoral transition. This observation comes from the body, not the historical phase header. |
| `src/game/council.mjs`, `councilDay`, `meetingDay`, `nextMeetingDay` | Real recurring tax votes, treasury accounting and meeting dates exist. A council meeting is not a mayoral election. Do not relabel its next meeting as an election date or claim all political simulation is missing. |
| `src/view/townhallview.mjs`, `hallView` | Projects the named officials, respect, taxes, treasury, next meeting and optional town information. No candidacy toggle or nomination list appears in the inspected return object. |
| `web/main.mjs`, hall rendering and wall petition handler | The player can view the council and request an existing wall process. Petition rights are not personal candidacy, voting rights or officeholding. |
| `src/game/rank.mjs`, `heldRank`, `updateRank` | Own-house earned rank already has retention and promotion rules. A future nomination preference must not lower it or replace it with office status. |

A real grep of game/view modules and the main caller for candidacy, nomination,
election and withdrawal identifiers found no player nomination controller under
the searched terms. That narrows the code observation; it is not proof about
every possible identifier. Existing generated officials and real council work
are expressly retained, not treated as an empty politics system.

Real docs and pending-note diffs were checked before writing. PRs 930-936 cover
paid information, ownership focus, weapon loss, a pirate opening, feasts/family,
pirate mode and saved-route adaptation. None studies this nomination choice.
Their review claims were not used as evidence of authority or independent review.

## Design questions, not a feature request

- If player elections are ever approved, should nomination availability be an
  explicit preference separate from eligibility, candidate-list membership,
  election outcome, current office and earned rank?
- When is that preference sampled, and can it change after the candidate list
  is published? Which election does an incumbent's refusal affect?
- Does re-enabling availability merely restore eligibility for consideration,
  rather than guarantee immediate listing or victory? Define that clearly.
- Should declining carry any consequence in our game? The P3 manual's vague
  warning is not a formula, calibration or approval for a penalty here.
- What persists across save/load and home-port changes? Can a repeated command
  have no additional side effects? No save schema is selected by this note.

Adding an isolated opt-out control now would imply a player-election system
that these inspected paths do not implement. Prefer keeping this as future
political-domain research rather than a nonfunctional button or a fabricated
current obligation to become mayor.

## Author verification

Existing baseline: `node --test test/townhall.test.mjs test/council.test.mjs
 test/council-next-meeting.test.mjs test/rank.test.mjs
 test/hall-readonly-reputation.test.mjs` passed 39 tests with no failures.
No tests were added or modified. These check adjacent existing behavior, not a
nomination feature or P3 parity. No runtime, new UI, visual audit or P3 gameplay
reproduction is claimed. Patch whitespace and clean-base application were
checked at handoff. Independent documentary review remains separate.
