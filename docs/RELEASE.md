# Release process

## Current status (28 October 2026)

The repository is public. [beta.1](https://github.com/HALCONDEORO/almojarife-game/releases/tag/v0.5.0-beta.1) was published on 26 October; [beta.2](https://github.com/HALCONDEORO/almojarife-game/releases/tag/v0.5.0-beta.2) on 27 October. Existing tags/assets are immutable. Source merged into main is not proof that a packaged build or the hosted game has been deployed or tested.

The proposed next batch is `v0.5.0-beta.3`, a public GitHub pre-release. Its candidate scope, evidence, failed playtest findings, remaining gates and rollback are in [BETA3-CHECKPOINT.md](BETA3-CHECKPOINT.md). That document does not create a tag or announce publication. No alpha is planned; the full release remains a later `v1.0.0`. Save compatibility in 0.x must be documented and tested rather than assumed. Do not change repository visibility as part of a release.

## Batch releases, focused pull requests

Keep one change per PR with an English title and the six sections in the PR template. There is no fixed cap on open PRs. Mark dependencies and merge order. Publish larger, reviewed release batches rather than a release for each small PR.

## Release gates

1. Confirm the batch scope and the approved public audience. Keep parked work, account changes and real-money features outside the batch.
2. Review the live exact head of every PR independently, run the relevant tests and check current CI. A changed head needs a fresh review. Resolve real conflicts without routine rebases.
3. Integrate the batch, then refresh documentation against the final `main` SHA. Open work must not be described as shipped.
4. Review README, CHANGELOG and release notes independently. Check the diff for credentials, personal data, customer data and private operational details. Include no private save files or screenshots.
5. Verify deployment of that exact SHA separately. Check the game in ES desktop and label fixtures or injected scenarios honestly. Record browser dimensions and what remains untested.
6. Show the release notes and version proposal to the owner before publishing. Confirm that the public-release conditions have been met. Only then create a tag on the approved exact commit and a GitHub **pre-release**.
7. Verify the release tag, commit, pre-release flag, notes, links and intended assets. Record the deployment and save-compatibility caveats with the release.

## Known testing prerequisite

`world.test.mjs` needs the Natural Earth coastline file. Run `sh tools/fetch_data.sh` before the suite. A missing local file is not a successful full-suite run. Record environmental failures separately; do not turn them into a blanket waiver for failures in changed code.
