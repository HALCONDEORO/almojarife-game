# Exact beta desktop packages

The manual `Build exact beta packages` workflow is preparation only. Merging it does not build, publish, change a tag, promote a release or buy runner capacity. Do not dispatch without the existing no-spend/CI permission and exact-head review.

Run from reviewed main with `source_tag`, full `expected_sha` and matching `tag@SHA`. The workflow checks out the immutable source separately from the reviewed tooling, verifies HEAD, local tag and remote tag, and changes only desktop package/lock version metadata in that temporary checkout. Game files come from the tag, not newer main. This version-only overlay is recorded in `packaging-source.json`; it is not a new source tag.

Windows x64 (NSIS and portable EXE), macOS runner-default ARM64 (DMG and ZIP), Linux x64 (AppImage and DEB) use existing build targets. All three runners must build and pass the existing packaged title-menu-only smoke test. This is not an installer, OS trust-prompt, full-campaign or save-migration test. Check the smoke images and logs manually. GitHub provenance attestations are separate from platform code signing. Existing optional GPG key/signatures are used only when already configured. No new key, signing service or payment is added. Without configured keys the packages remain unsigned.

The final artifact `reviewed-beta-package-set` contains six versioned packages, SHA256SUMS, source manifest and smoke evidence. Each checksum is checked before handoff. The workflow has no contents-write or release-upload step, so it cannot mutate an existing published release automatically.

## Separate approved attachment

After exact-head review, a successful manual run and human/agent inspection of all three smoke results, download its `reviewed-beta-package-set` into a fresh directory. Independently confirm that run's inputs identify the expected tag/SHA and that the source manifest matches. Do not mix artifacts from different runs. Preserve the run URL and checksum manifest in the completion report.

With approval for attachment to that existing release, run:

```
node tools/release/attach-packages.mjs DIR TAG SHA attach:TAG@SHA OWNER/REPO RUN_ID
```

The helper verifies six versioned packages, hashes, manifest, successful workflow identity, immutable lightweight tag, release target and absence of existing assets. It uploads only packages, manifest, checksums and existing detached signatures. No clobber, tag deletion, release creation, promotion or binary replacement is allowed. Any partial upload requires inspection and a separately reviewed recovery, never blind retry. Beta.2 assets are untouched.

After attaching, download the public files again, verify checksums and asset names, and report what remains untested. Only then consider the separately authorized normal/Latest promotion, with honest release notes and working download links. If any guard fails, stop before mutation and report it. Uploaded assets may be removed only under separate approval; tags and older binaries remain immutable.

## Workflow permissions and action pins

The workflow is not wholly read-only: both build and checksum jobs request `id-token: write` and `attestations: write` to mint GitHub artifact-provenance attestations for the packages and checksum manifest. `contents` stays read-only, and both checkouts disable persisted credentials. There is no release-write permission or upload in preparation. The separate operator attachment requires its own existing authorized credential.

All action revisions are full upstream commit SHAs, verified with `git ls-remote` on 29 October 2026: checkout v7 `3d3c42e5aac5ba805825da76410c181273ba90b1`; setup-node v7 `949feb2413d6458794dcd2491c4babbbce0c15c1`; attest-build-provenance v3 peeled commit `977bb373ede98d70efdf65b84cb5f73e068dcc2a` (annotated tag object `43d14bc2b83dec42d39ecae14e916627a18bb661`); upload-artifact v7 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`; download-artifact v7 `37930b1c2abaa49bbe596cd826c3c89aef350131`. Re-verify upstream before changing a pin.

The attachment helper checks local consistency, not cryptographic origin of the local files. Its run/source metadata can be copied: those checks do not prove that arbitrary local binaries came from that run. The operator must download the artifact from the successful run, inspect its smoke evidence, and verify GitHub provenance against the reviewed workflow/source before attachment. Do not treat a local manifest or a successful helper check as a substitute for those provenance checks.
