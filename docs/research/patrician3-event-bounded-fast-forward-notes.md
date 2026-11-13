# P3 fast-forward: advancing until an event is a different control from speed

13 November 2026. Main inspected: `6725acc`.
Clean-room documentary note. No copied prose, slogans, balance figures, assets,
executable inspection or excluded sources. No time-control change is approved.

## Narrow finding and coverage

P3's manual describes fast-forward as a mode that advances time until an event,
with a click allowing interruption. That is a termination condition, not merely
a higher sustained clock rate. The document does not enumerate every event that
ends the mode or prove that every stop leaves simulation time fully frozen.
Community accounts complicate the latter interpretation. [S1-S4]

Real grep of `docs/research` for fast-forward, event-stop and time-compression
terms found the multiplayer house-rule note and a citytrade timing workaround,
not a dedicated single-player comparison of this control. Existing route,
random-event, arrival and current-problem research still matters: this note
must not recast their implemented guards as a missing pause system.
PR930-952 were inspected by title/body for overlap, including pending minimap,
price-memory, citizen-supply, weapon, layout and upgrade notes. None studies
this bounded time command. This is not another minimap or speed-setting note.

## Page-specific sources

| Ref | Public source read | Claim and limit |
| --- | --- | --- |
| S1 | P3 English manual, section 4.2.1, printed/PDF page 11; section 7.5, page 20; section 15.2.4.4, page 58: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Each page inspected separately in the full PDF. Page 11 describes advancing to the next event; page 20 says the mode ends at an event and can be interrupted by clicking; page 58 excludes fast-forward in multiplayer. No complete stop-event rubric provided. |
| S2 | GOG forum, P3 pause-button discussion, February 2014: https://www.gog.com/forum/patrician_series/p3_where_is_the_pause_button | Players distinguish fast-forward arrival stops from normal speed and report the Pause key slowing rather than completely stopping time. One response explicitly lacks firsthand P3 experience. Treat as conflicting community evidence, not a substitute for a version-specific test. |
| S3 | Steam discussion, Game speed, January 2021: https://steamcommunity.com/app/33570/discussions/0/2995423424884406428/ | Players describe slow play combined with fast-forward until arrival or a weekly bill. Examples of stop conditions, not proof of an exhaustive list or precise clock state afterward. |
| S4 | Steam discussion, finding captains, January 2019: https://steamcommunity.com/app/33570/discussions/0/1743358239849665516/ | A player describes returning to a low speed when a ship docks. Supports distinguishing an ended fast-forward mode from a fully stopped clock. Other captain advice is outside this note. |

No P3 runtime clock test was performed. In particular, the manual's general
pause wording and community reports of continuing slow time are not silently
reconciled into a universal guarantee. No real-time or game-time rate adopted.

## Existing main controls and guards

Every code identifier below was checked in the current baseline's function body:

- `src/view/timepolicy.mjs:6-12`, `dayDurationMs`, `nextTimeSpeed` and
  `arrivalNeedsDecision`: view pacing and selectable rates are separate from
  an arrival policy. In automatic-time mode a route-bearing arrival is not
  treated by this reader as needing the same decision stop as a manual ship.
- `web/main.mjs:328-342`, `stepTicks`: advances ticks, then stops a frame at a
  pending event, encounter decision, qualifying arrival or game end. It does
  not run the remainder of the frame's batch past that decision boundary.
- `web/main.mjs:343-350`, `frame`: feeds the running clock with the selected
  speed. These continuous speed controls already exist.
- `src/game/game.mjs:356-365`, `advanceDay`: stops early on any owned arrival
  or pending decision rather than blindly completing a whole day.
- `advanceTick`, at line 395, refuses another tick while an event/encounter
  decision or game end is pending. This is an existing simulation guard.
- `waitUntilArrival`, at line 408, loops while the selected ship travels,
  subject to anchored, pending-decision, game-end and safety-limit conditions.
  It can continue after an unrelated ship's arrival because its outer condition
  still targets the selected ship. It is not a generic next-event command.

These are distinct existing contracts. A news item merely being posted is not
identical to a pending decision in these inspected guards. No generic P3-style
stop-on-every-news rule was found here, nor is one proposed as a missing feature.
No tests or visual audit accompany this documentation-only source comparison.

## Decision and open questions

Keep existing speed, arrival and pending-decision policies. If a new bounded
advance control is later chosen, first define which state transitions stop it,
what clock state follows, and how manual cancellation works. Reuse tick guards;
do not add a second simulator or rename selected-ship waiting as next-event.

Open P3 questions: complete event rubric, simultaneous-event priority, resulting
speed/pause state, route arrivals, offscreen events and version differences.
Open own questions: whether another command helps beyond current automatic time,
and whether the selected-ship wait should ever stop for another ship's arrival.
Those are choices, not bugs established by documentary similarity.
Future checks, only if approved: no batch overshoot at a chosen boundary, no
missed decisions, deterministic economy across speeds, cancellation without an
extra tick, and preservation of existing route-arrival and manual-pause behavior.
