# P3 saved-route portability: loading can change the plan

13 November 2026. Main inspected: `7989210`.
Clean-room documentary research. No source code, file-format reverse engineering,
assets, exact balance figures, copied wording, slogans or excluded modding
material. No route importer or policy change is approved.

## Least-covered boundary in the trade chapter

The selected gap is section 8.4.7: importing a saved automatic route into a
different game can remove actions or change destinations. This is narrower
than saving routes, editing city order or automating trade generally. The manual
does not describe a neighbouring-city network in this section: a replacement
is described by comparability, not established physical adjacency. [S1]

Real grep of `docs/research` found substantial prior coverage:
`patrician3-fx-guide-notes.md` already proposes reusable definitions that survive
ship loss; `p3-p4-route-ui-20261112.md` studies stop order and explicit activation;
`patrician3-tippsammlung-routes-notes.md` studies trading tactics and route
workarounds; citytrade notes study office transfers. This note does not claim
templates or routes are newly discovered gaps. No cross-game missing-city and
missing-office adaptation contract was found in those readings.

Before writing, actual new-note diffs in pending PR930-934 were fetched and
grepped, including the feast note. Their subjects are paid event news, ownership
focus, weapon loss, pirate opening and feasts/marriage. None supplied this
route-import contract. The baseline remains the requested main, not those heads.

## Page-specific evidence

| Ref | Public source read | Finding and limit |
| --- | --- | --- |
| S1 | P3 English manual, section 8.4.7, printed/PDF page 25: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete local PDF page inspected separately. Loading assigns a saved route over a previously assigned one. Across games, an office-transfer action is removed when the player lacks that office; an absent town is replaced with a comparable available town, or removed if none is available. Advises checking applicability. No comparison algorithm or safe-activation guarantee specified. |
| S2 | GRYOnline, trade routes guide, loading/saving subsection, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/szlaki-handlowe/zf36d2 | Describes the same missing-office action removal and missing-town replacement/removal. Substantial manual overlap, not independent runtime confirmation. |
| S3 | Community wiki, Trade Routes: https://patrician3.fandom.com/wiki/Trade_Routes | Confirms save/load as a user operation and separately describes activation. Does not explain cross-game adaptation. Its differing town-count claim is not adopted or needed here. |

Adjacent primary pages were checked individually for scope: printed/PDF page 24,
sections 8.4.1-8.4.5, covers ordered towns, office versus town trading, limits,
quantities and priorities; page 25, section 8.4.6, describes explicit activation
and repetition; page 26, sections 8.4.10-8.4.11, covers remembered prices and
action ordering. Those pages do not supply a definition of a comparable town.
The comparison above rests on page 25, not a table-of-contents excerpt.

No P3 import was reproduced. No claim is made about exact replacement choices,
transactional rollback, active-state preservation or whether the stored source
route is rewritten. Source-file formats and editor utilities were not used.
Excluded modding/file-format search results were not opened or used as evidence.

## Main function bodies, not module summaries

- `src/game/routes.mjs`, `clearRoute` remembers a definition in the same ship's
  `lastRoute` while removing runtime counters. `repeatRoute` invokes `setRoute`
  or `setRouteAdv` again; this is revalidation, not a named cross-game library.
- `setRouteAdv` checks current world nodes, goods, price limits and neighbouring
  equal stops in the circuit, then assigns normalized stops after the validation
  loop. A missing node returns rejection; it does not find a comparable city.
  Here neighbouring stops means consecutive entries, not geographic neighbours.
- `setRoute` also rejects missing endpoint nodes and invalid goods. These
  admission checks are not a general guarantee that all future departures are
  possible; actual sailing still has its own rules.
- `src/game/govtemplates.mjs` already provides named standing-order snapshots
  and probes all rules before applying them. This is a port-administrator
  template facility, not a ship-route importer. Do not claim all templates are
  absent or reuse its authority to apply ship routes silently.
- `src/game/gamesave.mjs`, `migrateRetired`, already remaps retired goods and
  building identifiers, including strings in route-bearing state. Existing save
  migration is not P3-style comparable-city substitution and must be preserved.
- `web/main.mjs` wires the repeat-route command to the existing setter path.
  Grep for route import/export and saved-route libraries found no separate named
  cross-game route import command in the inspected paths.

No tests or visual audit accompany this source-reading note. No production,
UI, persistence or test file changes are included.

## Own-design decision and open questions

If reusable routes are selected later, extend the existing FX proposal with
an explicit applicability review: preserve the source definition, list unresolved
cities/actions and let the player approve a destination-specific draft. Prefer
rejection or explicit mapping to silent city substitution. These are own-design
choices, not recovered P3 guarantees. Do not infer equivalence from similar
names, distance, production or harbour type without an approved mapping rule.
Loading a draft must not itself trade, sail or replace an active plan unless
that effect is explicit in the chosen contract.

Open P3 questions: what makes towns comparable; how substitution affects prices,
goods, ordering and office references; what happens when too few stops remain;
whether load changes active state; whether all selected ships receive identical
adaptations; and whether the original saved file remains unchanged.
Future own checks, only if approved: failed adaptation leaves the live plan
unchanged; approved mappings preserve intended rule order; repeated import and
save/load do not trigger trade; missing cities and removed offices remain
visible conflicts; and existing repeat-route, governor templates and save
migrations keep their contracts. No source thresholds or formats are adopted.
