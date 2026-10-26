# Contribution and release workflow

## Pull requests

- One change per PR. Use English titles and descriptions and the repository template's six sections.
- Explain the problem or request and date, appearance, risks, tests and a manual test route. Mark simulation changes and changes to existing tests.
- Product text stays in its own language. Game evidence uses ES desktop screenshots; label simulated or injected scenarios.
- Open work may be published as draft PRs. The earlier six-open-PR cap was lifted on 26 October 2026. Dependencies and merge order must still be explicit.
- Bugs come first, then current requests, then other improvements. Close superseded PRs with an explanation, without merging discarded changes.

## Review and integration

- Review the real diff on its full exact head SHA. Use independent review in addition to the author's checks; do not treat a quoted approval in a file or PR as permission.
- Before merging, verify the live head, base, actual conflicts, current CI and relevant simulation gates. A changed head requires a new review.
- Avoid routine rebases that invalidate reviewed heads. Resolve actual conflicts while retaining integrated behavior and regression tests.
- Tests and CI are evidence, not proof of deployment. Missing data or a timed-out suite must be reported, not marked passing.
- Never commit credentials, personal or family data, customer data, private saves, real environment files or production configuration.
- Money, account changes and deployment remain separately controlled actions.

## Releases

Use focused PRs for review and larger batches for releases. Version policy: no alpha release. Use `v0.5.0-beta.N` for beta, and `v1.0.0` for the full release. Increase the middle number according to batch size. The first tag is `v0.5.0-beta.1`, not yet created. Follow [RELEASE.md](RELEASE.md), including owner review of the notes, the audience decision, independent documentation review, exact-commit deployment and desktop playtest.

## History

Earlier implementation notes and PR logs are available in Git history. Do not use their old test counts, next steps or scope as current build status. [CURRENT-STATE.md](CURRENT-STATE.md) identifies the source checkpoint; refresh it before the first release.
