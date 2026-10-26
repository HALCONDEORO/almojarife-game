# Current source checkpoint

Updated 26 October 2026. This is not a release announcement.

## Source and delivery are different

This documentation branch starts at main commit `20ab136e1473d28b1aa0e1e317f93e1a0560f83e` (tree `64c04a606071d19aeb3303e07a2a1d224c74643c`). Later PRs may still be open. Refresh this record after the release batch integrates.

The repository is public. No GitHub release existed when this record was prepared. The proposed version is `v0.5.0-beta.1`; the PUBLIC audience was conditionally approved on26 October18:20; the release date is not decided. No deployment or public-alpha readiness is certified here.

## Implemented in the checkpoint

- `data/world.json` contains 33 cities and 20 goods. These are game data, not a claim of historically exact populations, borders or production.
- Desktop browser play in ES and EN. Market trading, voyages, ships, automatic routes, ranks, buildings, captains, events, saves and a developing mission campaign.
- Right-panel cards, grouped actionable Messages, priority ordering and a compact small-fleet view.
- Route repetition and profit statistics; automatic hull repair on routes with the cash limit respected.
- Pending-event access after repainting and in city view; option probabilities and effects, with sampled pirate fighting odds labelled as approximate.
- Generated wiki/reference tables read from game data. Historical design notes and research are not the current game's API or balance specification.

## Still subject to the release gate

- The open PR batch, including forecasts, variable salvage, workshop warnings, persistent course reasons and UI/simulation improvements, must be reviewed and integrated before being called released.
- Full simulation gates, exact-commit CI, deployment verification and ES desktop playtest must be recorded on the final batch commit.
- Screenshots in README are an older source set. They are not screenshots of an approved release candidate.
- Campaign completion, balance, save migration, accessibility and browser coverage are not declared complete.
- The public audience was approved conditionally on26 October18:20. Final documentation, integrated-code links, polish and Playtest approval remain required.

## Documentation map

- README: player introduction, setup and the current release status.
- CHANGELOG: integrated source changes, not a list of open proposals.
- RELEASE: version proposal, audience decision and release checklist.
- RELEASE-NOTES-DRAFT: draft for owner review; must be reconciled with the final commit.
- ROADMAP and DESIGN: historical planning decisions, explicitly marked where scope has moved on.
- `docs/wiki/`: reference pages. Regenerate generated files rather than editing tables by hand.
- `docs/research/`, `docs/ideas/`, `docs/worklog.md` and old decision logs: dated research/history, not release promises.

No proposed launch date in these files overrides a later owner decision. No dependency update or release task authorizes spending, changing accounts or disclosing private data.
