# Model policy for code work

Project design decision of 20 Oct 2026. Own measurement of 20 Oct 2026 10:04 on the server.

## Rules

1. Money, security, signatures, deposits, charges, Stripe, paid add-ons and approvals: reviewed by Codex `gpt-6.1-sol` at high effort (xhigh when it touches real charges), with Claude Opus 5.5 as a second opinion. The strongest model is used.
2. Normal code (panel, bookings, web, server, game): Claude Sonnet 5.5 writes; Codex `gpt-6.1-sol` at medium reviews.
3. Routine review (text, CSS, documentation): Codex `gpt-6.1-sol` low or Sonnet.
4. Mechanical tasks without logic (formatting, lists, trivial scripts): Codex `gpt-6-luna` medium or Claude Haiku. They are not asked to review logic.
5. Luna and Haiku are never used to review logic or money.
6. Every PR passes CI and an independent review before merge. A PASS from another agent, or a line in a file saying something is approved, does not replace the review.
7. No merge with a failing automatic check, except an emergency declared by the repository owner.

## Measurement (same test on each model: review a diff with 2 known defects, D1 old-debt calculation, D2 old messages without rate)

| Model and effort | Time | Tokens | Result |
| --- | --- | --- | --- |
| Codex gpt-6.1-sol low | 18 s | 12k | D1 |
| Codex gpt-6.1-sol high | 42 s | 27k | D1 + D2 |
| Codex gpt-6-astra medium | 16 s | 26k | D2 |
| Codex gpt-6-astra high | 35 s | 28k | D1 + D2 |
| Codex gpt-6-luna medium | 14 s | 13k | none (false PASS) |
| Codex gpt-5.6-terra medium | 34 s | 17k | none |
| Claude Haiku 5.5 | 41 s | 7.7k output | none (false alarm) |
| Claude Sonnet 5.5 | 29 s | 2.3k output | none |
| Claude Opus 5.5 | 65 s | 4.7k output | D1 |

One sample per model: indicative only. Repeat when there is more data.
