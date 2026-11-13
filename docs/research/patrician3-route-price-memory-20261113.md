# P3 route price memory: an input suggestion is not a market quote

13 November 2026. Main inspected: `7989210`.
Clean-room documentation only. No copied source wording, balance figures,
assets, source code or excluded modding material. No implementation approved.

## Narrow finding and existing coverage

P3 manual section 8.4.10, printed/PDF p.26, describes remembering the last
price entered for a good and suggesting it when automatic trade is configured
again. Purchase and sale values are remembered separately. This is a small
editor convenience, not evidence of price forecasting, profitable trade or an
automatic change to already-running routes. [S1]

A real grep before writing found price ceilings/floors, goods order, stop
reordering, saved routes and activation in existing route notes. The route UI
note already asks for clearer limits; it does not study last-entered-price
suggestions. Pending PR930-944 were checked for overlapping price-memory
coverage. PR936 studies cross-game route adaptation, not this input memory;
PR940 concerns production controls. PR941-944 concern candidacy, contracts,
sea defense and excess crew. This note adds only a remembered-input boundary,
not another claim that automatic trading or saved routes are absent.

## Public evidence read

| Ref | Source | Contribution and limit |
| --- | --- | --- |
| S1 | Full P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Page 26 extracted individually for 8.4.10. Primary documentary anchor for last-entered suggestions and separate purchase/sale memory. No runtime persistence test. |
| S2 | GRYOnline, trade routes, page updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/szlaki-handlowe/zf36d2 | Its prices subsection also describes suggesting the last entered price. Consistent editorial account, not independent measurement of save/load scope. Its unrelated stop-visit description differs from the manual; that dispute is not settled here. |
| S3 | P3 wiki Trade Routes: https://patrician3.fandom.com/wiki/Trade_Routes | Describes price limits, route editing, loading and explicit activation. Context only; does not establish the remembered-input lifetime. |
| S4 | Steam community trading guide: https://steamcommunity.com/sharedfiles/filedetails/?id=275838607 | Describes setting office and route prices. Context only. Its price lists and worked quantities are not used or copied. |
| S5 | P3 wiki Manager: https://patrician3.fandom.com/wiki/Manager | Office purchase and sale setup is a separate control surface. Does not prove that office prices and ship-editor suggestions share memory. |
| S6 | P4 community guide: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Comparative context for route editing only. Different game/version; supplies no proof of P3 price-memory behavior. |

These are a primary manual, editorial guide and community material. S2 is close
to the manual in substance, not a second experiment. S3-S6 constrain context;
they are not extra confirmations of the narrow memory claim. No P3 runtime,
file format, binary or experimental formula was inspected.

Unknown in S1: scope across towns, ships, players and games; lifetime across
closing the editor or restarting; whether an abandoned draft updates memory;
what clears a remembered value; and what happens after changing goods. Separate
buy/sell storage is documented; all those other choices remain open.

## Main source, actual bodies checked

| Source read | Existing behavior and boundary |
| --- | --- |
| `web/main.mjs`, `routeDrafts`, `newRouteDraft` and route-editor event handlers | Per-ship drafts exist in module memory. New rows start with blank buy/sell prices. Input events change that row's `buyMax`/`sellMin`; changing a good updates the selected good, not a per-good remembered price. Do not mistake retention of one row's input for recall indexed by commodity and direction. |
| `web/main.mjs`, advanced-route activation handler | Converts blank/non-finite price strings to no limit, builds buy/sell rules, calls `setRouteAdv`, and deletes that ship's draft on success. Existing activation is explicit; no suggestion should silently cross this boundary. |
| `src/view/routefieldlabels.mjs`, `routeFieldLabel` | Existing contextual labels distinguish buy maximum from sell minimum; the hint explains that blank means no limit. Filling a formerly blank field would change meaning, not merely decorate the UI. |
| `src/game/routes.mjs`, `setRouteAdv` | Validates stops, goods and finite non-negative limits, normalizes rules and assigns the running route. Existing route values are real instructions, not an input-history cache. |
| `src/game/routes.mjs`, `planBuy`, `planSell` | Execution checks current simulated market quotes against the relevant limits while planning quantities. Fees and available budget are handled separately on buying. Recalled input must not be presented as a fresh quote, all-in cost or guarantee of profit. |
| `src/game/gamesave.mjs`, `serialize` | Serializes game state with the static world omitted. The editor's separate module-scoped drafts are not passed as a second input-history store here. Running ship-route state and editor suggestions are different persistence concerns. |

Every identifier cited above was located and its relevant body read on the
stated main base. Grep of editor and source paths found no per-good/direction
last-entered-price recall in these inspected entry points. This is scoped source
evidence, not a claim that no preference storage exists anywhere in the game.
Existing local settings and persistent running routes already exist.

## Original design questions, not recovered P3 internals

- Is reducing repeated price entry worth the risk of reusing a poor old limit?
  Consider an explicit reuse action rather than filling every blank field.
- If adopted later, show that a value is remembered input, not current market
  intelligence. Keep buy and sell distinct and preserve intentional blank values.
- Define commodity, direction, town and save/profile scope before choosing a
  storage key. Do not let one ship's suggestion edit another ship's running route.
- Decide when memory commits: valid activation, valid field edit or an explicit
  save. Cancelled drafts and invalid text need defined outcomes.
- Reset and clear controls should not rewrite activated routes. Unknown goods,
  old saves and malformed preferences must not bypass route validation.
- Reordering rows should retain their entered values without creating a new
  quote or silently refreshing remembered inputs. Test all these choices before
  any implementation, with explicit activation unchanged.

## Author verification

Existing tests run: `advancedroutes`, `route-price-boundaries`,
`route-save-continuity`, `route-field-labels` and `route-order` under `test/`:
25 passed, no failures. These test adjacent existing behavior, not a newly
implemented memory feature. No tests or runtime code changed. No visual audit
or P3 reproduction claimed. Whitespace and clean-base patch application checked
at handoff. Independent documentary review is still required.
