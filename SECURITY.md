# Security policy

El Almojarife is a client-side game: it runs in your browser or desktop
shell, keeps saves on your own machine and talks to no server. The realistic
worst cases are a malicious save file, a tampered build or a bad dependency.

## Reporting a vulnerability

Use GitHub's **private vulnerability reporting** on this repository (Security
tab > Report a vulnerability) so the maintainer can fix it before it is
public. Please do not open a public issue for a security finding. Bugs that
cannot hurt anyone (wrong price, odd text, visual glitch) are welcome as
normal public issues.

## Notes for players

- Only import save files you made yourself or trust; a save is data the game
  reads, and a hostile file is the main attack surface.
- Download desktop builds only from this repository's Releases or Actions
  artifacts. Until builds are signed (see docs/desktop.md), treat any other
  source as untrusted.
- Third-party code and data are listed in CREDITS.md with their licences.
