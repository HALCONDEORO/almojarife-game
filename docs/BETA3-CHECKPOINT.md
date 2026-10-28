# Beta 3 release checkpoint, 28 October 2026

Status: candidate only. No beta.3 tag, release or packaged build is announced by this document. Proposed version: `v0.5.0-beta.3`, GitHub pre-release, public audience. The existing beta.2 assets and tag remain immutable.

## Integrated scope at this checkpoint

| Change | PR | Merge SHA |
| --- | --- | --- |
| Bounded optional justice and peace startup data | #638 | 0c8c4c84b2086d17d053675c462af41fe8ebf893 |
| Letters of marque and prize handling | #635 | fc58eefb473fd47de212b9e742b6286cd6605cc5 |
| Council pardon and grain embargo defaults | #637 | 7c54025fb433c29b324ebb0037c348fafadb2223 |
| Eight living-city defaults | #636 | 0e8e6e3b30041aa73ab0a9fc3262a50b82b5b0ad |
| Household, calamity and regional-rival defaults | #639 | 9f525b13bf85a41851d19b02a3b3f611452a2eda |

The source checkpoint is `9f525b13bf85a41851d19b02a3b3f611452a2eda`. Pages deployment run [40676422895](https://github.com/HALCONDEORO/almojarife-game/actions/runs/40676422895) succeeded for that SHA. A live read of `src/game/game.mjs` confirmed the household, calamity and regional-rival defaults. This is not evidence that a desktop binary contains this batch.

## Candidate fixes, NOT integrated or shipped

- [#640](https://github.com/HALCONDEORO/almojarife-game/pull/640): profitable tutorial sale, retain the prior voyage, visible/scrolled route controls and immediate council-visit save.
- [#641](https://github.com/HALCONDEORO/almojarife-game/pull/641): free-navigation port order dispatches the docked convoy through the existing convoy operation.

Neither is release scope until exact-head independent review, CI/Balance, merge and a final integrated playthrough. Do not tag this checkpoint before those decisions.

## Evidence and limits

1. Real Spanish desktop play on the published game: create a new trading house; buy 10 salt in Cádiz for 193.8; sail to Huelva; arrive with cargo; sell for 342.02; cash approximately 2448 after travel; save and reload in Huelva with empty cargo. The town hall displays justice, letters of marque and a Portuguese peace restriction. No state/save injection was used.
2. Published-game failures found: a losing same-port sale advances the tutorial; the prior voyage is forgotten when the profitable sale happens afterward; the route window extends offscreen at 1280x720; council progress is not immediately saved. #640 is a candidate fix, not a retrospective PASS for the published game.
3. Real local #640 candidate play completes the five-step tutorial through actual market, map, route and council controls, then reloads to check persistence. Its browser regression also rejects the losing round-trip and asserts viewport containment. Unit/affected tests: 56 PASS. This run does not replace final integrated or live verification.
4. Real #641 before/after play orders a barque, lets the real clock reach construction day 8, forms a two-ship convoy and right-clicks Huelva. Before: both stay docked with a refusal. Candidate: both depart for Huelva with equal remaining ticks.42 affected tests PASS. This crosses the first weekly settlement; it does not certify every calamity, pirate encounter or a long-lived convoy.
5. #639 balance PASS is under the new conservative L2 builder and same-horizon NPC ON/OFF 0.25-4x policy. It is NOT a PASS under the retired absolute 30x growth criterion and does NOT establish L3 robustness. The legacy L3 bankruptcies remain recorded in `docs/evidence/world-systems`.

No private saves, credentials or customer data belong in release assets. Screenshots show deliberately created test trading houses only. No paid signing, third-party account changes or external provisioning is in this release.

## Remaining gates before publication

- Resolve #640/#641 against exact-head independent review and green CI/Balance; re-review any changed head.
- Refresh this table, CHANGELOG and release notes to the final integrated source SHA. Review the documentation independently.
- Repeat the real Spanish desktop paths on the final integrated candidate and verify the exact Pages deployment. Keep any incomplete scenario explicit rather than converting it into PASS.
- Show the final short scope, version, SHA and limits before publication. The release owner decides whether remaining limits are acceptable.
- Tag only the reviewed exact commit. A `v*` tag starts Desktop builds; wait for all platform builds, packaged-app smoke checks and provenance to finish. The workflow uploads only to a draft release. Do not publish the draft early.
- Inspect draft assets, checksums, tag commit, pre-release flag, final notes and links. No claim of GPG or platform code-signing without evidence. GPG is optional; paid signing remains out of scope.
- Publish as a pre-release only after those checks. Verify the resulting public release and asset list separately.

## Rollback

Keep beta.2 unchanged. A failed new candidate can remain a draft; do not publish failed assets or move an existing tag. If the web batch must be undone, open and review a revert PR to the selected known-good pre-batch commit, run CI and verify the resulting Pages deployment. Do not force-push main or assume that changing a release changes Pages. If a published beta.3 is defective, stop promoting it and publish a clear correction or a newly reviewed version; never silently replace its binaries.
