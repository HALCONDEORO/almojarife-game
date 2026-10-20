# Instructions for coding agents (Codex, Claude Code)

Read `docs/politica-modelos.md` before you start: it says which model writes and which reviews each kind of task. Short version: money and security are reviewed by Codex gpt-6.1-sol high plus Opus; normal code is written by Sonnet and reviewed by Codex medium; Luna and Haiku never review logic or money. A PR needs CI and an independent review; merging with a failing check only in an emergency declared by the repo owner.

Rules for this repo: small PRs with tests, CI must be green, docs in English, no spending, clean licences only (see CONTRIBUTING.md).
