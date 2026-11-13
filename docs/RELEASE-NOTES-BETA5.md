# El Almojarife v0.5.0-beta.5

Source-only GitHub pre-release. The previous published source checkpoint is v0.5.0-beta.4 (28 October 2026); desktop packages remain the older beta.2 build. Do not replace those packages or claim they contain this source batch.

## Batch boundary

This release is the final integrated commit recorded under "Final publication record" below. It includes the changes merged into main up to and including #967: clean-room P3/P4 research notes (#958-#961), opt-in long optional missions (#962), the opt-in weekly city-consumption planner (#963), this version preparation (#966) and the weekly-planner table context and mobile width fix (#967). PRs #968 (message retention) and #969 (mobile mission test) are NOT included: their CI and independent review were not verified at cut time, so they stayed out by the release rule.

Research documents paraphrase public mechanics sources and distinguish current behavior from possible own-design work. They do not certify a reproduced P3/P4 engine or promise every researched mechanic is implemented.

## Opt-in behavior and limits

The weekly planner uses the present population, classes and modifiers to project seven identical simulated demand periods. It is not observed consumption, inventory flow or a promise of future purchases. It stays behind its explicit view flag.

Long optional missions are own design, not competitor tuning. They require both the explicit long-missions flag and an open-ended campaign. The ordinary 365-day goal stays unchanged. Free play has no campaign. Re-enabling counts elapsed disabled days; a mission can expire immediately. A failed mission can lose up to two local respect points, with a bounded cooldown on new optional offers. Existing main and accepted missions continue.

## Before playing

- Desktop browser, keyboard and mouse. Mobile checks help detect layout regressions but do not change the supported-platform promise.
- Export a save backup before changing versions. Older-save compatibility and complete campaign/balance/browser coverage are not certified.
- No new installers, signed binaries or packaged-runtime smoke tests are included in this source-only release.

## Final publication record

- Final integrated commit and tag: the commit this file ships in, tagged `v0.5.0-beta.5`.
- Feature-focused tests on the exact pre-tag tree: `test/long-missions.test.mjs` and `test/weekly-planning.test.mjs`, 18 of 18 passing (node --test, 13 November 2026). Exact-head CI and independent review must pass before this source pre-release is published. The 18 focused tests do not certify the full suite, secret scan or CodeQL.
- Independent notes review: the beta.5 preparation patch passed independent documentary review (PASS, 13 November 2026, base 26937a39); this finalization edit requires its own independent review before publication.
- Actual merged-main game pixels were inspected on 13 November for the #967 planner delta (EN 390 and ES 1280). This documentation-only finalization adds no runtime or visual changes.
- Hosted deployment of this exact SHA and smoke check: NOT done. The source release stands alone; no hosted-deployment claim is made.
- Remaining known defects: message retention (#968) and the mobile mission test (#969) remain open outside this release.

Preserve all existing tags and releases. This file records what was and was not verified; do not read it as a certification beyond its own statements.
