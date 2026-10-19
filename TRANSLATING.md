# Translating

The game is playable in Spanish (main language) and English. Both are complete.

Today all interface texts live in one object, `T`, at the top of `web/main.mjs`, with one block per language (`es`, `en`). Goods and ship types are in the same blocks (`goods`, `types`). Port names are in `data/world.json`. Moving texts into separate `locales/<lang>.json` files is planned; until then, translate inside `T`.

To fix or add a language:
1. Copy the `en` block in `T`, rename it to the language code (for example `fr`), and translate the values. Keep the keys and the `{placeholders}` unchanged.
2. The language switch currently has two entries, so a new language needs a small code change in `web/main.mjs`. Do it if you can, or say so in the pull request and a maintainer will help.
3. Keep texts short: Spanish and German run 20 to 30% longer than English.
4. Run `npm test` and open the game to check that nothing overflows. Add a screenshot to the pull request.

Glossary for Spanish: nao, carraca (cog), carabela (caravel), lonja (exchange), almojarife (royal treasurer of a port). Use the same words everywhere.
