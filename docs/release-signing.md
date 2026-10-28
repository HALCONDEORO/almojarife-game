# Release signing and provenance

Status: workflow support is merged. Every v* tag runs the desktop package and provenance pipeline. A new release is kept draft until reviewed and published. GPG remains optional and must not be claimed unless its assets and configuration are verified. Cost of this pipeline: 0 EUR.

Three independent layers, cheapest first. A release can ship with any subset;
layer 1 + 2 need no secrets and run on tag pushes without signing secrets.

## Layer 1 - SHA-256 checksums (no setup)

The `release-provenance` job in `.github/workflows/desktop.yml` runs on every
`v*` tag push. It downloads the three platform builds, writes
`SHA256SUMS.txt`, and attaches it plus the packages to the GitHub release.
Safety rule: it only uploads to a **draft** release. If the tag already has a
published release, the job fails without touching any asset; if no release
exists, it creates a draft pre-release, so nothing is published
automatically.

User verification:

```sh
sha256sum -c SHA256SUMS.txt --ignore-missing
```

## Layer 2 - GitHub artifact attestations (no setup)

Each build job attests its packages with
`actions/attest-build-provenance`, and the checksum manifest is attested too.
The attestation cryptographically ties each file to the exact repository,
commit and workflow run that built it.

User verification (needs the GitHub CLI):

```sh
gh attestation verify El.Almojarife_0.5.0.AppImage --repo HALCONDEORO/almojarife-game
```

## Layer 3 - GPG detached signatures (one-time setup)

Adds `*.asc` signatures next to every package and the checksum manifest, so
users can verify downloads without any GitHub account or tooling trust.

Setup (owner only, once):

1. Generate a release key **locally**, never in CI by hand, chat or the repo:

   ```sh
   gpg --quick-generate-key "El Almojarife (release signing) <YOUR-EMAIL>" ed25519 sign never
   gpg --list-secret-keys --keyid-format long   # note the key id
   ```

2. Export and store it as GitHub Actions secrets (repo > Settings > Secrets
   and variables > Actions):

   ```sh
   gpg --export-secret-keys --armor KEYID   # -> secret GPG_PRIVATE_KEY
   # passphrase of the key              -> secret GPG_PASSPHRASE
   ```

3. Publish the **public** key so users can verify (commit it, e.g. as
   `docs/almojarife-release-public.asc`, and optionally upload to
   keys.openpgp.org):

   ```sh
   gpg --export --armor KEYID > docs/almojarife-release-public.asc
   ```

If the secrets are absent, the job logs a warning and skips GPG; checksums and
attestations still run. The private key must never appear in the repository,
issues, PRs or chat.

User verification:

```sh
gpg --recv-keys KEYID            # or import docs/almojarife-release-public.asc
gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt
sha256sum -c SHA256SUMS.txt --ignore-missing
```

## What this does NOT cover

These layers prove the bits came from this repository's CI; they do not put a
trusted publisher name on the binaries. Platform warnings remain until a code
signing certificate is in place:

- **Windows / macOS**: see the SignPath Foundation application draft (pending
  owner review before anything is sent). Free for OSS if accepted.
- The paid options (Azure Artifact Signing ~9.99 USD/month, Apple Developer
  Program 99 USD/year) stay parked; no spending is authorised.
