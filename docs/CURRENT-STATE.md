# Current source checkpoint

Updated 28 October 2026. Source-checkpoint history and published-release status are recorded separately.

## Source and delivery are different

The integrated source checkpoint is main commit `e96ab3a2e9c24974d699e29835b79d4a08e9af34` (tree `b192bb3d7ef880d035b07aa5c9dd271222e0c191`). This identifies source contents, not a final release candidate or a verified deployment. Refresh the record if more changes enter the batch.

The repository is public. [v0.5.0-beta.2](https://github.com/HALCONDEORO/almojarife-game/releases/tag/v0.5.0-beta.2) was published on 27 October 2026 at 08:19:46 UTC with seven assets: Linux DEB and AppImage, macOS ARM64 ZIP and DMG, Windows portable EXE and installer, and SHA256SUMS.txt. This supersedes the earlier beta.1 proposal. Publication does not certify every later main-branch change or platform-specific runtime behavior.

## Implemented in the checkpoint

- `data/world.json` contains 33 cities and 20 goods. These are game data, not a claim of historically exact populations, borders or production.
- Desktop browser play in ES and EN. Market trading, voyages, ships, automatic routes, ranks, buildings, captains, events, saves and a developing mission campaign.
- Right-panel cards, grouped actionable Messages, priority ordering and a compact small-fleet view.
- Route repetition and profit statistics; automatic hull repair on routes with the cash limit respected.
- Pending-event access after repainting and in city view; option probabilities and effects, with sampled pirate fighting odds labelled as approximate.
- Seven-day weather forecasts, variable salvage rewards, risk-free automatic events and workshop margin warnings.
- Persistent rejected-course feedback, warehouse-aware Market filtering, centred Market controls and integer aggregate money displays. The Market price-alert block is removed; existing saved alerts still run without a management UI there.
- Shipyard sections and away-port feedback, dock-local repairs and arming, Office rank progress, City services tab and current-save Continue.
- Clock repaint waits for pointer release to protect panel clicks; extra autosave runs every three minutes and on hidden/pagehide when campaign data differs. Browser lifecycle delivery is best effort.
- Free-navigation right click sails immediately. The confirmation menu introduced in #583 was reverted by #587; no confirmation is promised.
- Generated wiki/reference tables read from game data. Historical design notes and research are not the current game's API or balance specification.

## Remaining validation and future release gates

- Beta.2 is published. Later open proposals must still be reviewed and integrated separately before being called available.
- Full simulation gates, exact-commit CI, deployment verification and ES desktop playtest must be recorded on the final batch commit.
- README screenshots were refreshed in #628 on 28 October 2026. They document that source checkpoint, not a certification of every later main-branch change or platform build.
- Campaign completion, balance, save migration, accessibility and browser coverage are not declared complete.
- Future releases still require their own final documentation, integrated-code links, polish, Playtest and release gates. The earlier publication hold is historical, not the current beta.2 status.

## Documentation map

- README: player introduction, setup and the current release status.
- CHANGELOG: integrated source changes, not a list of open proposals.
- RELEASE: version proposal, audience decision and release checklist.
- RELEASE-NOTES-DRAFT: draft for owner review; must be reconciled with the final commit.
- ROADMAP and DESIGN: historical planning decisions, explicitly marked where scope has moved on.
- `docs/wiki/`: reference pages. Regenerate generated files rather than editing tables by hand.
- `docs/research/`, `docs/ideas/`, `docs/worklog.md` and old decision logs: dated research/history, not release promises.

No proposed launch date in these files overrides a later owner decision. No dependency update or release task authorizes spending, changing accounts or disclosing private data.

## Beta preparation after the source batch

- Integrated #592, #593, #594 and #596: visible construction confirmation, real free plots (decorative neighbours removed by the current candidate), centred confirmation and bounded zoom/staged sprite loading.
- #595, #597, #598 and #599 are integrated at 4afd05024bf879820483a57e850a37b436e97cf8. The #600 candidate adds painterly ground, clearer own-plot text, block-filling lot drawings, fixed Cádiz presentation and no decorative neighbour buildings. Final exact-candidate review and Playtest remain pending.
- The beta preparation notes above describe earlier source candidates. Beta.2 is now published at the linked tag; they are not a current publication hold. New changes still need exact-head CI, independent review and relevant playtests.
