# Translating

The game is playable in Spanish (main language) and English. Both are complete.

Texts live in two places:
- **Interface**: the object `T` at the top of `web/main.mjs`, with one block per language (`es`, `en`). Goods and ship types are in the same blocks (`goods`, `types`). Translate inside `T`.
- **City events** (famine, epidemic, fair): `locales/es.json` and `locales/en.json`, under `cityEvents`. Each event id has `name`, `start` (message when the player learns of it) and `end` (message when it ends); `active` and `banner` are the labels on the map and in the port panel. `start` and `end` must contain `{city}`; `{name}` and `{n}` (days left) are also filled in. The event rules (ids, days, effects) are in `cityEvents` in `data/world.json`; every id there needs its texts in both files, and `npm test` fails if one is missing.

Port names are in `data/world.json`. The rest of `T` will move to `locales/<lang>.json` later.

To fix or add a language:
1. Copy the `en` block in `T`, rename it to the language code (for example `fr`), and translate the values. Keep the keys and the `{placeholders}` unchanged.
2. The language switch currently has two entries, so a new language needs a small code change in `web/main.mjs`. Do it if you can, or say so in the pull request and a maintainer will help.
3. Keep texts short: Spanish and German run 20 to 30% longer than English.
4. Run `npm test` and open the game to check that nothing overflows. Add a screenshot to the pull request.

Glossary for Spanish: nao, carraca (cog), carabela (caravel), lonja (exchange), almojarife (royal treasurer of a port). Use the same words everywhere.
