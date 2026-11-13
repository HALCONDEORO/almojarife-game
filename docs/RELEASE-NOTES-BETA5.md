# El Almojarife v0.5.0-beta.5 candidate

Source-only GitHub pre-release, in preparation. No tag or release is created by this document. The previous published source checkpoint is v0.5.0-beta.4 (28 October 2026); desktop packages remain the older beta.2 build. Do not replace those packages or claim they contain this source batch.

## Batch boundary

The release includes only changes integrated into its final immutable commit. The current preparation base is `26937a39a77a23a3f32e8cf2a80544db38ba3fb3`. This is not yet the final release commit. The weekly city-consumption planner (#963), long optional missions (#962), message retention and table/mobile layout fixes must be reconciled after their exact-head CI, independent review and merges. Open proposals stay out of the shipped list.

Research documents paraphrase public mechanics sources and distinguish current behavior from possible own-design work. They do not certify a reproduced P3/P4 engine or promise every researched mechanic is implemented.

## Opt-in behavior and limits

The weekly planner uses the present population, classes and modifiers to project seven identical simulated demand periods. It is not observed consumption, inventory flow or a promise of future purchases. It stays behind its explicit view flag.

Long optional missions are own design, not competitor tuning. They require both the explicit long-missions flag and an open-ended campaign. The ordinary 365-day goal stays unchanged. Free play has no campaign. Re-enabling counts elapsed disabled days; a mission can expire immediately. A failed mission can lose up to two local respect points, with a bounded cooldown on new optional offers. Existing main and accepted missions continue. These statements require the reviewed feature to be present in the final commit.

## Before playing

- Desktop browser, keyboard and mouse. Mobile checks help detect layout regressions but do not change the supported-platform promise.
- Export a save backup before changing versions. Older-save compatibility and complete campaign/balance/browser coverage are not certified.
- No new installers, signed binaries or packaged-runtime smoke tests are included in this source-only release.

## Final publication record (must be completed)

- Final integrated commit and tag: pending.
- Exact-commit CI, secret scan and CodeQL: pending.
- Independent notes review: pending.
- Actual merged-main game pixels: pending, ES/EN desktop and relevant mobile checks; label synthetic scenarios and flag state.
- Hosted deployment of that exact SHA and smoke check: pending, separate from source integration.
- Remaining known defects and final PR manifest: pending reconciliation.

Do not turn a preparation checkpoint into a publication claim. Preserve all existing tags and releases. Complete this record before publishing.
