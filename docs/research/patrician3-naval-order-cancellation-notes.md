# P3 naval orders: cancellation depends on job kind and start state

13 November 2026. Main inspected: `8290a85`.
Clean-room documentary research only. No copied prose, slogans, source balance
figures, assets, executable inspection or excluded modding material. No runtime
change, refund policy or implementation is approved.

## Narrow finding and earlier coverage

P3 distinguishes a ship waiting to be built from a ship already being built.
The manual permits withdrawal of the former, with only part of the monetary
payment returned and supplied goods not returned. Starting construction closes
that cancellation path. Repairs are different: they can be stopped, but their
material costs are not recovered. A cancellation button therefore does not
imply a universal right to reverse all payment or restore all resources. [S1]

This is not a newly discovered absence of orders in Almojarife.
`docs/design/order-reserve-boundaries.md` already describes our repair refund,
our prepaid ship orders, and a proposed provenance prerequisite before ship
cancellation. `patrician3-mechanics.md` already covers shipyard experience,
queues and upgrades. `patrician4-captain-occupational-skills-20261113.md`
already inspects our repair flow. The new contribution is the P3 documentary
boundary between withdrawal before work and interruption of a different job.

A real grep of `docs/` for cancellation, repairs, order withdrawal and material
forfeiture found that coverage, but no dedicated P3 comparison of these two
cancellation contracts. Open PR titles and bodies were also inspected: the
urban P4 material-wait note in PR920 is a different procurement topic; the
other open PRs concerned Electron, escorted prizes and modal keyboard tests.
This scope does not reopen construction procurement or warehouse reserves.

## Sources and limits

| Ref | Public source read | What it supports and what it does not |
| --- | --- | --- |
| S1 | P3 English manual, printed/PDF page 28, sections 9.2.1-9.2.4; printed/PDF page 30, section 9.6.2: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full PDF text inspected. Repair interruption with unrecovered material costs; queued ship withdrawal before construction with partial monetary refund but no supplied-goods refund; no construction cancellation after starting. The departure section also warns that stopping repairs does not remove payment responsibility. It does not itemise a repair labour refund ledger. |
| S2 | GRYOnline, ship construction, repair and upgrade guide, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budowa-naprawa-i-rozbudowa-okretow/z236d5 | Describes the same construction start boundary and goods non-return. Its repair wording broadly says costs are not recovered, whereas S1 specifically names material costs. Substantial overlap with the manual is not independent runtime confirmation. |
| S3 | Community wiki, Shipyard: https://patrician3.fandom.com/wiki/Shipyard | Says repairs can be cancelled and construction only before starting. Does not specify the refund settlement. Community summary, not measured behavior for a named build. |
| S4 | Steam discussion, Final ship construction speeds, January 2017: https://steamcommunity.com/app/33570/discussions/0/154645299388159500/ | A player revises an initial queue-speed explanation into a displayed-duration complaint. Caution against deriving a start boundary from an estimated completion label; not evidence of cancellation rules. No reported timings adopted. |
| S5 | Steam discussion, Repair docks don't get upgraded: https://steamcommunity.com/app/33570/discussions/0/2632849318062566281/ | Participants report conflicting repair-dock progression observations. Does not test refunds. Kept only as a limit: this note does not infer a cancellation formula from yard experience. |
| S6 | Steam-distributed manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Fetched text was truncated before the relevant complete sections. Same manual, not independent corroboration; S1's complete local PDF supplied the page-specific evidence. |

The authoritative documentary distinction is narrower than a universal
non-refundable repair rule. S1 and S2 differ in specificity; without a runtime
ledger test, which repair cash components are retained remains a question.
The manual's exact monetary fraction is deliberately not reproduced or adopted.
No missing formula is filled from utility charts or modding sources. An excluded
modding result appeared in search and was not opened or used.

## Main inspection: existing behavior is our own contract

Real grep of `src`, `web/main.mjs` and the prior design note, followed by reads:

- `src/game/game.mjs`, `repairQuote` and `orderRepair`: validate hulls and port,
  debit the quoted cash once, then retain an identified repair order with
  original cost and remaining work. No material inventory debit in this path.
- `processRepairs`, `repairRefund`, `cancelRepair`: daily hull improvement,
  proportional refund for unfinished work, order removal and cancellation
  news. Completed hull work remains. A repeat cancellation finds no order.
  This differs from the P3 documentary material-retention rule, and is not
  evidence that our existing refund is defective.
- `orderShip` and `deliverOrders`: catalogue cash payment and a pending record
  containing type, port and due day, followed by ship creation. Those records
  do not contain a distinct actual-work-start marker or historical paid amount.
  No new-ship cancellation command was found in the inspected paths.
- `src/view/repaircancel.mjs`, `src/view/shipwindow.mjs`, `web/main.mjs`:
  cancellation UI already exists for repairs. Do not propose another generic
  cancellation screen as if no current controls existed.

No test execution, visual audit or P3 runtime reproduction accompanies this note.
No production files or tests are changed.

## Decision boundary and open questions

Keep Almojarife's current repair contract. If ship-order withdrawal is selected,
use the already-written provenance proposal rather than importing P3's fraction
or adding a second order queue. A promised refund needs the actual paid amount,
a stable order identity and an owner-approved definition of when work begins.
A due date alone does not establish that work has not begun. Our cash-only ship
orders must not refund materials they never consumed.

Open P3 questions: which repair cost components are retained; what happens to
partly repaired hull condition on interruption; whether withdrawing a queued
job changes the next job's start immediately; exact ordering at the start tick;
and whether upgrades share either cancellation contract across versions.
Open own-design decisions: whether ship withdrawal should exist at all, its
cutoff, settlement and treatment of old orders lacking payment provenance.

If later approved, tests should cover cancellation on each side of the explicit
start transition, an already-completed job, repeated requests, insufficient
provenance, save/load at the boundary, and conservation of money and any actual
inputs. Rejected actions must leave state unchanged. These are proposed checks,
not claims about P3 and not a request to change the existing repair policy.
