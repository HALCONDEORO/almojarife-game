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

## Manual release bot (preparation only)

`Prepare beta release` (`.github/workflows/prepare-release.yml`) is manual-only.
Merging it does not create a tag, release, deployment, schedule or desktop build.
After the owner approves the version, notes and exact source checkpoint, run it
from **main**, supplying the beta tag, full main SHA, previous release tag and
`version@SHA` confirmation. It refuses existing tags/releases, a non-ancestor
baseline, moved main, or missing/failed exact-SHA CI, secret scan and CodeQL runs.
The confirmation is an operator guard, not proof of owner approval or an
independent review. The exact-head PR review gate still applies before merging.

The bot asks GitHub to generate notes for the explicit previous-tag-to-SHA range
(merged PRs/contributors, plus GitHub's compare link), creates an immutable
lightweight tag at that SHA and a **draft pre-release**. Review those generated
notes for accuracy, scope, privacy and the checkpoint's limitations. It never
publishes the draft or marks it latest. This is not authority to release beta.3:
that release remains held until the owner explicitly authorizes it.

This uses the repository's short-lived `GITHUB_TOKEN`, with `contents: write`
only in the preparation job and `actions: read` to check existing runs. One Linux
job, a three-minute limit, no installs, PAT, external service, paid runner or
three-platform packaging. Repository Actions quotas/settings still apply; the
workflow does not purchase capacity. GitHub does not start another push workflow
for a tag created by `GITHUB_TOKEN`, so this does **not** trigger `Desktop builds`.
No binaries, signing, packaged smoke test or provenance are claimed by this bot.
Do not publish a source-only draft as a tested desktop release. Desktop build
integration is separate work; the existing desktop tag pipeline will not attach
assets to an already-published release.

On partial failure after tag creation, the run fails and leaves the tag intact.
Inspect the run, exact tag and draft before recovery; do not blindly rerun,
retarget/delete tags or overwrite releases. Existing-tag rejection is deliberate.
Publication remains the separately approved final step after all release gates.

Reference reviewed: [GeiserX/gramps-web-toolkit release workflow](https://github.com/GeiserX/gramps-web-toolkit/blob/main/.github/workflows/release.yml).
It separates build validation and publication and scopes write permission to the
GitHub-release job. Its tag-triggered PyPI publication and manual TestPyPI dry run
are **not** copied into the game's manual draft-only workflow.
