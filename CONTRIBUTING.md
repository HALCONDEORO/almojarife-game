# Contributing

This is a hobby, non-commercial, open-source game. Ideas, bug reports, historical corrections, translations and pull requests are welcome, from one-word typo fixes to new ports.

## Quick start
1. Open an issue first for anything big (new mechanic, new screen), so we agree on scope. Small fixes and content additions can go straight to a pull request.
2. Fork, make a branch, keep the change small and focused.
3. Run `sh tools/fetch_data.sh` once (it downloads a pinned Natural Earth dataset over HTTPS, no credentials needed), then `npm test`. Node 20 or newer.
4. Open a pull request that says what changed and why. Add a screenshot if the screen changes.

The game is desktop-only: check changes in a desktop browser (Windows, Mac, Linux) with keyboard and mouse. Phones and tablets are out of scope.

## Where to start
- Issues labelled `good first issue`.
- Adding content without writing code: see [docs/guides/ADD-CONTENT.md](docs/guides/ADD-CONTENT.md) (a port, a good, a language).
- Translations: see [TRANSLATING.md](TRANSLATING.md).
- Roadmap and the quality bar: [docs/ROADMAP.md](docs/ROADMAP.md).

## Rules
- Only submit work you wrote, or that has a compatible open licence (public domain, CC0, CC BY, MIT). No CC BY-SA, NC or ND, no GPL code. Do not copy code, art, text, names or data from other games. Ideas and general mechanics are fine; copying is not.
- Every third-party asset needs a row in [CREDITS.md](CREDITS.md) with source, licence and author.
- Licence of your contribution: code and game data MIT, art and documents CC BY 4.0. Sign off each commit with the Developer Certificate of Origin: add `Signed-off-by: Your Name <you@example.com>` (use `git commit -s`). That line says you wrote it or have the right to submit it under those licences. There is no CLA.
- No secrets, personal data or large downloaded datasets in the repository.
- No ads, tracking, payments or accounts. The project is not monetised.

## Review
See [GOVERNANCE.md](GOVERNANCE.md). In short: CI must pass, one maintainer review, small pull requests are merged faster.
