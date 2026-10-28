# Beta 3 release checkpoint, 28 October 2026

Status: candidate only. No beta.3 tag, release or packaged build is announced by this document. Proposed version: `v0.5.0-beta.3`, GitHub pre-release, public audience. The existing beta.2 assets and tag remain immutable.

## Integrated scope at this checkpoint

Integrated changes on main between beta.2 and the checkpoint below, identified by PR number. CI/Balance status of #629-#632, #633-#636 and #644 is not restated here; the independent exact-head review record of each PR is the source.

| Change | PR |
| --- | --- |
| Persistent Castilian default ship names | #629 |
| Rename owned ships (Fleet and ship windows) | #630 |
| Name and rename convoys | #631 |
| Wall construction settles at the displayed whole-coin price | #632 |
| Port justice and courts in the browser host | #633 |
| Startup stays available if optional justice data fails | #638 |
| Letters of marque and prize handling | #635 |
| Council pardon and grain embargo defaults | #637 |
| Eight living-city defaults | #636 |
| Household, calamity and regional-rival defaults | #639 |
| Profitable tutorial sale, remembered voyage, reachable route controls, immediate council save | #640 |
| Docked convoy departure through free-navigation port orders | #641 |
| Advanced route stalls report the failed trade cause | #644 |
| Desktop polish: market columns (#614, #624), empty market frame (#615), obsolete 3D copy (#616), tavern placeholder (#618), SVG toolbar icons (#619), route tutorial wording (#620), internal IDs hidden (#621, #625), ship names in weekly report (#622), crew wage label (#623), storm delay notice (#626), pirate escape wording (#627) | #614-#627 |
| README screenshots refreshed from Spanish desktop | #628 |
| Manual beta release bot (no player-visible effect) | #643 |
| Cancel obsolete PR workflow runs without reducing test coverage; no player-visible change | #645 |

The source checkpoint is whatever exact `main` SHA the owner approves before the tag; at the time of this update `main` was `99c299bc16c822fb7a570853dde5d6383d31b9a9`. Earlier Pages verification below was for `23c35a3d93be7ed983eb74e73fc40128ba11fb37` only. Pages deployment and live Spanish desktop play for the final SHA must be rechecked. This is not evidence that a desktop binary contains this batch.

## Integrated candidate

Both #640 and #641 have exact-head independent review, green CI/Balance and squash merges. Earlier source checkpoint `23c35a3d93be7ed983eb74e73fc40128ba11fb37`: its Pages deployment and live Spanish desktop playthroughs passed as recorded below. Later merges (#642-#645 and the items above) are not covered by that record. There is no beta.3 tag or release yet.

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
- Independently review this documentation, README, CHANGELOG and release notes against the final approved source checkpoint. This docs-only PR changes the eventual tag commit but not the game implementation; after merge, verify its Pages deployment separately.
- Show the final short scope, version, SHA and limits before publication. The release owner decides whether remaining limits are acceptable.
- Tag only the reviewed exact commit. The manual bot's `GITHUB_TOKEN` tag does not trigger Desktop builds; it prepares a source-only draft and packaging is separate work. Before publication, require all platform builds, packaged-app smoke checks, assets and provenance. Do not publish a source-only draft as a tested desktop release, and do not publish the draft early.
- Inspect draft assets, checksums, tag commit, pre-release flag, final notes and links. No claim of GPG or platform code-signing without evidence. GPG is optional; paid signing remains out of scope.
- Publish as a pre-release only after those checks. Verify the resulting public release and asset list separately.

## Rollback

Keep beta.2 unchanged. A failed new candidate can remain a draft; do not publish failed assets or move an existing tag. If the web batch must be undone, open and review a revert PR to the selected known-good pre-batch commit, run CI and verify the resulting Pages deployment. Do not force-push main or assume that changing a release changes Pages. If a published beta.3 is defective, stop promoting it and publish a clear correction or a newly reviewed version; never silently replace its binaries.
