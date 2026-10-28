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
| Profitable tutorial sale, remembered voyage, reachable route controls and immediate council save | #640 | 1d91313db20b625bfd35c40e4dd709476b4bd7da |
| Docked convoy departure through free-navigation port orders | #641 | 23c35a3d93be7ed983eb74e73fc40128ba11fb37 |

The source checkpoint is `23c35a3d93be7ed983eb74e73fc40128ba11fb37`. Pages deployment run [40681478653](https://github.com/HALCONDEORO/almojarife-game/actions/runs/40681478653) succeeded for that SHA. A live read of `src/game/tutorial.mjs` confirmed the new paid-cargo profit criterion. A live read of `src/game/game.mjs` confirmed the household, calamity and regional-rival defaults. This is not evidence that a desktop binary contains this batch.

## Integrated candidate

Both #640 and #641 have exact-head independent review, green CI/Balance and squash merges. Final source checkpoint: `23c35a3d93be7ed983eb74e73fc40128ba11fb37`. Its Pages deployment and live Spanish desktop playthroughs passed as recorded below. There is no beta.3 tag or release yet.

## Evidence and limits

1. Real Spanish desktop play on the published game: create a new trading house; buy 10 salt in Cádiz for 193.8; sail to Huelva; arrive with cargo; sell for 342.02; cash approximately 2448 after travel; save and reload in Huelva with empty cargo. The town hall displays justice, letters of marque and a Portuguese peace restriction. No state/save injection was used.
2. Pre-#640 published-game failures found: a losing same-port sale advances the tutorial; the prior voyage is forgotten when the profitable sale happens afterward; the route window extends offscreen at 1280x720; council progress is not immediately saved. #640 fixes are now merged and deployed. Their source and deployment checks do not retrospectively turn the failed pre-fix playtest into PASS.
3. Real local #640 play completes the five-step tutorial through actual market, map, route and council controls, then reloads to check persistence. Its browser regression also rejects the losing round-trip and asserts viewport containment. Unit/affected tests: 56 PASS. This run does not replace final integrated or live verification.
4. Real #641 before/after play orders a barque, lets the real clock reach construction day 8, forms a two-ship convoy and right-clicks Huelva. Before: both stay docked with a refusal. Candidate: both depart for Huelva with equal remaining ticks.42 affected tests PASS. This crosses the first weekly settlement; it does not certify every calamity, pirate encounter or a long-lived convoy.
5. #639 balance PASS is under the new conservative L2 builder and same-horizon NPC ON/OFF 0.25-4x policy. It is NOT a PASS under the retired absolute 30x growth criterion and does NOT establish L3 robustness. The legacy L3 bankruptcies remain recorded in `docs/evidence/world-systems`.

No private saves, credentials or customer data belong in release assets. Screenshots show deliberately created test trading houses only. No paid signing, third-party account changes or external provisioning is in this release.

## Final live web verification

At 11:43 WET on 28 October, the published Pages game passed both browser scripts without save/state injection:
- `tutorial-playthrough.mjs`: new Spanish game; losing same-port sale does not advance; purchase and real Cádiz→Huelva voyage; profitable sale; save/reload; route button reachable at 1280x720; set route; council visit and completed tutorial survive reload.
- `convoy-port.mjs`: new Spanish game; skip tutorial; order a barque; real game clock to construction on day 8; form two-ship convoy; right-click Huelva; both ships depart with destination Huelva and equal 402 remaining ticks in the action save.

Raw live outputs are alongside this checkpoint in `docs/evidence/beta3-live`. No complete long campaign, all calamity outcomes, hostile justice encounter or new packaged binary is certified by these two checks.

## Remaining gates before publication

- #640/#641 are merged after exact-head independent review and green CI/Balance. Re-review any further code changes.
- Independently review this documentation and release notes against source checkpoint 23c35a3d. This docs-only PR changes the eventual tag commit but not the game implementation; after merge, verify its Pages deployment separately.
- Show the final short scope, version, SHA and limits before publication. The release owner decides whether remaining limits are acceptable.
- Tag only the reviewed exact commit. A `v*` tag starts Desktop builds; wait for all platform builds, packaged-app smoke checks and provenance to finish. The workflow uploads only to a draft release. Do not publish the draft early.
- Inspect draft assets, checksums, tag commit, pre-release flag, final notes and links. No claim of GPG or platform code-signing without evidence. GPG is optional; paid signing remains out of scope.
- Publish as a pre-release only after those checks. Verify the resulting public release and asset list separately.

## Rollback

Keep beta.2 unchanged. A failed new candidate can remain a draft; do not publish failed assets or move an existing tag. If the web batch must be undone, open and review a revert PR to the selected known-good pre-batch commit, run CI and verify the resulting Pages deployment. Do not force-push main or assume that changing a release changes Pages. If a published beta.3 is defective, stop promoting it and publish a clear correction or a newly reviewed version; never silently replace its binaries.
