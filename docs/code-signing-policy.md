# Code signing policy

This project distributes release packages for Windows, macOS and Linux from
its GitHub Releases page. Signing and provenance differ by layer and platform;
the current status of each is listed honestly below.

## Release provenance (active after merge of the signing workflow)

- Every release package ships with a `SHA256SUMS.txt` checksum manifest.
- Packages and the manifest carry GitHub artifact attestations linking them
  to the exact commit and CI run that built them
  (`gh attestation verify <file> --repo HALCONDEORO/almojarife-game`).
- Once the release key is configured, every file also carries a GPG detached
  signature (`*.asc`). See `docs/release-signing.md` for verification steps.

## Windows - SignPath Foundation (pending)

We intend to apply to the SignPath Foundation programme for free open source
code signing. If approved, the required statement will read:

"Free code signing provided by SignPath.io, certificate by SignPath Foundation"

Status: **application submitted to the SignPath Foundation on 27 Oct 2026, pending review.** Until then Windows
packages are unsigned and SmartScreen may warn.

## macOS (unsigned)

Status: not signed, not notarized. Apple Developer ID signing requires the
Apple Developer Program (99 USD/year), which is not currently authorised.

## Linux (unsigned)

Status: unsigned, per normal Linux distribution practice. Verify with the
checksums, attestations and GPG signatures above.

## Team roles (single-maintainer project)

- Authors (commit access; can modify source without additional reviews):
  - [HALCONDEORO](https://github.com/HALCONDEORO)
- Reviewers (changes proposed by non-committers, e.g. pull requests, are
  reviewed before merge):
  - [HALCONDEORO](https://github.com/HALCONDEORO)
  - Policy: every external pull request is reviewed by the maintainer.
- Approvers (approve each signing request / release):
  - [HALCONDEORO](https://github.com/HALCONDEORO)
  - Policy: each release is approved explicitly by the maintainer before
    publication; no signing request is automated without that approval.

## Privacy policy

This program will not transfer any information to other networked systems
unless specifically requested by the user or the person installing or
operating it.

## Distribution locations

- GitHub Releases: https://github.com/HALCONDEORO/almojarife-game/releases
- Web version: https://halcondeoro.github.io/almojarife-game/
