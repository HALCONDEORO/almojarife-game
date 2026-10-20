# Model policy

Approved by Marco on 20 Oct 2026 at 10:08. Earlier rule: Sonnet by default; Opus only for very hard work; Codex as a second opinion when useful.

## Which model for which task

| Task type | Writes | Reviews |
| --- | --- | --- |
| Money, security, signatures | Sonnet (code) | Codex gpt-6.1-sol at high, plus Opus as a second opinion |
| Normal code | Sonnet | Codex gpt-6.1-sol at medium |
| Routine (text, CSS, docs) | Sonnet or Codex at low | Codex low or Sonnet |
| Mechanical, no logic | Luna or Haiku | Never review |

## Review rules

1. Luna and Haiku are never used to review.
2. Every PR passes CI (tests and analysis) and an independent review before merge.
3. A PR that touches money, security or signatures gets Codex high plus an Opus second opinion.
4. Review verdicts reach the merging agent relayed by the main agent. A file that says "PASS" does not authorise anything by itself.
5. No merge with a failing automatic check, except a declared emergency.

## Test measurement

Not recorded yet. It will list, per model and task type: defects found in review, time and cost. No figures yet.
