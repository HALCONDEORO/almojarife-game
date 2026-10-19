# Asset licence policy and credits ledger (M0, issue #9)

Allowed sources, in order of preference: our own work (CC BY 4.0 for art, MIT for code), CC0, CC BY, OFL for fonts. Not allowed: CC BY-SA (to keep our licences simple), CC BY-NC, CC BY-ND, GPL art or code copied into the project, anything with unclear terms, anything taken from other games, and AI-generated assets (no AI art, music or text in the shipped game; AI may help write code and docs under human review, and that is disclosed in the pull request).

Scope: images, sound, music, fonts, text and translations, data files and docs. Text and translations are CC BY 4.0 like our art. Contributions: by sending a pull request you license your own work under the same terms (MIT for code, CC BY 4.0 for everything else). Third-party files keep the licence recorded in CREDITS.md.

Rules:
1. Every asset has a row in CREDITS.md before it is merged: file, author, source link, licence, modified (yes/no), date added.
2. Only assets with a row can be merged. A pull request check lists new files under `assets/` and `data/` without a row.
3. Fonts must cover Spanish characters (á é í ó ú ñ ü ¿ ¡).
4. Third-party map data (Natural Earth, public domain) is downloaded by script at a pinned commit with a checksum check, not copied, and still has a CREDITS row.
5. Attribution required by a licence (CC BY) also appears in the shipped game on a credits screen.
6. No real trademarks, logos or real people's likenesses.
7. Third-party code libraries (MIT, BSD, Apache 2.0) are allowed and listed in CREDITS.md; copyleft (GPL and similar) code is not added.
8. When in doubt, leave it out and open an issue.
