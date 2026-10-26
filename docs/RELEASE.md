# Release process

## Current status (26 October 2026)

The repository is public. A GitHub pre-release here is publicly readable. The intended first beta audience is public; publication is on hold pending an explicit final go/no-go, verified documentation, integrated code links, polish and Playtest approval. Do not change repository visibility as part of a release.

No GitHub release exists at this checkpoint. Source merged into `main` is not proof that the hosted game has been deployed or tested.

## Proposed versions, not tags

No alpha release is planned. The first public release is `v0.5.0-beta.1`, marked as a GitHub pre-release. Later candidates use `beta.2`, `beta.3`, and so on; the full release is `v1.0.0`. Increase the middle number according to the size of later batches. No save compatibility is promised in `0.x` unless explicitly documented and tested. No tag has been created by this policy.

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
