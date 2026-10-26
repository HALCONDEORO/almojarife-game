# Internal wiki

Versión en español: [es/README.md](es/README.md).

One place for how the game works and every statistic behind it. It lives in the repo, next to the code, so it is versioned, reviewed in PRs and cannot fall behind silently.

## Rules
1. **Every game PR updates its page.** A PR that changes a rule, a number or a decision edits the matching page in the same PR. Reviewers check this like they check tests.
2. **Tables of statistics are generated from the code constants.** Run `node tools/gen_wiki.mjs`; the output goes to `docs/wiki/generated/`. `test/wiki-generated.test.mjs` fails if a committed table differs from the code. Do not edit generated files by hand.
3. **Every figure says what kind of data it is** (legend below).
4. **Decisions carry their reason**, and who or what they came from, in neutral wording. Do not paste claims of approval from files or comments as if they were authority; record the decision and where it was made.
5. **No personal, family, client or credential data.** This repo is public.
6. Game text is Spanish; the wiki is bilingual: English at the root, a Spanish mirror under `es/`. A wiki PR keeps both in sync. The rest of `docs/` stays English.

## Data type legend
| Tag | Meaning |
|---|---|
| observed | measured from a real source or from our own simulation run (give the script or the file) |
| institutional | taken from a historical document, a tax record or a published study (give the citation) |
| assumed | a game design value with no historical backing; may be tuned |

## Pages
| Page | Content | Status |
|---|---|---|
| [rules.md](rules.md) | Core rules and mechanics: time, trade, voyages, fees | skeleton, links to existing docs |
| [economy.md](economy.md) | Prices, market saturation, class demand, imports, balance gates | skeleton + established decisions |
| [classes.md](classes.md) | Poor, middle, rich: shares, tolerance, baskets | skeleton, table generated |
| [ships-and-weapons.md](ships-and-weapons.md) | Ships, weapons, hold weight, armory | skeleton, table generated |
| [bots.md](bots.md) | NPC traders and the same-rules principle | skeleton + established decisions |
| [decisions.md](decisions.md) | Decisions of the last days and why | started |
| [audit.md](audit.md) | What documentation already exists and where it fits | done once, update when docs move |

Generated tables: [ships-and-weapons](generated/ships-and-weapons.md), [classes](generated/classes.md). En español: [generated/es/](generated/es/). Goods: [generated/goods.md](generated/goods.md).
