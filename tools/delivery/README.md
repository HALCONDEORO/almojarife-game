# Read-only delivery verification

Run from the repository root with Node 22+. No token, package install, new workflow or permission is needed. GitHub's unauthenticated API rate limit applies. HTTP errors, missing evidence and mismatches exit nonzero; do not treat partial output as success.

Before a merge:

```sh
node tools/delivery/verify.mjs candidate PR_NUMBER FULL_HEAD_SHA
```

This reads the current PR head, the newest run of each check and commit statuses. It requires test, gitleaks, CodeQL, the three Analyze checks, DeepSource, and no pending or failed extra check. A truncated check list fails closed. It does not read or supply independent approval and never merges anything. The operator must still obtain independent approval for the exact head and re-read the head immediately before a separately authorized merge.

After a merge:

```sh
node tools/delivery/verify.mjs delivered PR_NUMBER FULL_MERGE_SHA web/main.mjs src/game/CHANGED_MODULE.mjs
```

Replace the example paths with the actual public files affected by the PR. This checks the merged PR SHA, a successful Pages deployment for that exact SHA, and byte-for-byte equality between each requested deployed file and its immutable repository version. JSON includes evidence URLs and SHA-256 hashes. A subsequent merge can legitimately make production newer; a mismatch is not automatically a failed deployment. Investigate rather than retrying a merge.

Coverage is explicit: this does not prove that unlisted files, browser caches, Spanish screenshots, real UI interactions or game behavior are correct. Those remain separate checks. A test-only PR can verify representative public files but must not claim that this proves its tests are deployed to players. Do not commit generated screenshots, credentials or private research material.
