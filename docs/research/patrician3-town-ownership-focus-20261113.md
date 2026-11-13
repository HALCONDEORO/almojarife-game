# P3: ownership focus in the town view

Research note, 2026-11-13. Clean-room comparison against Almojarife main
`7989210`. Documentation only, not approval to change the city renderer.

## Finding

P3 documents a reversible town-view ownership filter: the player's houses and
businesses remain prominent, other private buildings are reduced to outlines,
and action buildings remain available. It is a visual aid, not acquisition,
demolition or a reduction in the town's simulated population.

Almojarife already distinguishes owned plots, neighboring housing, service
buildings and industry ownership. It already fades an obstructing foreground
building and highlights owned industry. Those are useful existing affordances,
but neither is the documented town-wide ownership focus mode. The narrower
question is whether a reversible focus view would help locate existing property
without hiding services or disguising vacant lots as owned buildings.

No P3 figures, copied interface text, slogans, art or implementation are used.
Public documentation, editorial pages, community context and our source were
checked. No reverse-engineering source was used.

## Sources and limits

| Source | Evidence used |
| --- | --- |
| S1, full English P3 manual: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Section 4.2.3.2, printed/PDF p.12, describes temporarily hiding other buildings to find one's own. Section 7.4.2.1, p.20, clarifies outlines remain. Section 11.4, p.40, distinguishes retained action buildings, owned businesses and houses. Primary documentary evidence. |
| S2, GRYOnline production-building guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/inne-budynki-3/z036e2 | Editorial description independently states that non-owned buildings become outlines while action buildings and owned houses/businesses remain visible. Page shows an update date in 2019; no live reproduction undertaken. |
| S3, GRYOnline interface guide: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/interfejs-gry-cz1/z236b7 | Describes the town ownership button and outlines. Same editorial guide family as S2, not a separate independent play test. Page shows an update date in 2019. |
| S4, FX Spanish manual hosted on Yumpu: https://www.yumpu.com/es/document/view/36555388/manual-de-juego-fx-interactive | Controls/building context checked; not used to fill unknown filter hit-testing or persistence rules. A localized manual is not evidence that every edition has identical rendering. |
| S5, DefKey controls listing: https://defkey.com/patrician-3-shortcuts | Distinguishes entering action buildings from inspecting houses/facilities. This listing cites the game manual and is derivative; it does not establish filter behavior. |
| S6, Steam community guide: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Property-management context checked. Not evidence that hiding a property changes ownership, demolition rights or production. Community account, no reproduction used. |

The English manual's short description of hiding other buildings is qualified
by its own more detailed outline/action-building descriptions. This note does
not interpret hiding as deletion or total invisibility. The sources do not
settle whether an outlined building remains clickable, how focus interacts with
construction previews, or whether the preference persists across towns or saves.
Those are open design questions, not recovered P3 implementation details.

## Almojarife on the stated base

| Inspected code | Existing behavior and boundary |
| --- | --- |
| `src/view/buildingsview.mjs`, `buildingsRows` | Produces rows from the port's owned building records. A list of owned assets is already present; it is not a spatial focus control. |
| `src/view/city2d.mjs`, `resolveVisual` | Resolves appearance from a supplied building object. Its `owned` field reflects whether that argument exists. The scene also supplies fallback visual objects for non-owned scenery, so that field alone is not a reliable town-wide ownership predicate. |
| `web/city2d/scene.mjs`, `lotSet`, drawing loop | Explicitly distinguishes saleable lots from neighboring residential scenery, services and owned entries in `bld`. A free lot is already drawn as a lot, not as a finished building. Keep that distinction. |
| `web/city2d/scene.mjs`, `buildLabels` | Gives labels and click messages to owned entries and recognized service/town buildings. Ownership focus must not remove the normal service paths. |
| `src/view/city2d.mjs`, `obscuresSelection`; scene `focusAlpha` | Fades a nearer sprite that obscures the selected footprint. This is selection visibility, not an ownership filter: ownership is not part of that predicate. |
| `web/city2d/scene.mjs`, `drawIndustry` | Groups industry by type and owner, labels real state, highlights player-owned industry and distinguishes works sold at auction. An ownership mode must include this layer rather than only changing plot sprites. |

These are source-level observations, not a claim about a newly tested UI.
A real grep of `docs/` for ownership filtering and hiding buildings found no
study of this specific visual mode. Existing notes about owned assets,
information buildings and city layouts remain valid and are not replaced.
The live open-PR list checked for this round contained dependency maintenance,
escorted-prize work and modal-focus tests. None covered this view. This novelty
check is scoped to current docs and that list, not every historical branch.

## Candidate design questions, ours rather than P3 rules

1. Prefer a reversible local view setting over changing simulation records.
   Should it reset on town entry or persist as a preference? Decide explicitly.
2. Define categories from real ownership and scene roles: owned property,
   non-owned property, free lots, neighboring housing, services, civic landmarks
   and industry groups. Do not infer ownership from a sprite or fallback object.
3. Retain enough ground context to orient the user. Dimming is not permission
   to erase roads, footprints or collision geometry, or to make a free lot look
   purchased. No balance, housing, output or plot-availability effect follows.
4. Decide hit-testing, labels and keyboard/touch behavior together. A muted
   property must not look inert while an invisible target still intercepts
   clicks. Service controls and the focused selection must remain usable.
5. Resolve interaction with existing occlusion fading, halted/construction
   states, preview mode and clustered industry. Reversing focus must restore
   the normal view rather than accumulating opacity or losing state labels.

## Author verification and follow-up

Existing focused baseline: `node --test test/city2d.test.mjs
 test/buildingsview.test.mjs test/neighbour-houses.test.mjs` passed 38 tests
with no failures. No tests were added or changed. These are adjacent behavior
checks, not evidence that a new filter exists or renders correctly.

A later implementation would need non-mutation tests, category fixtures,
selection and hit-testing checks, localization and keyboard/touch checks, plus
actual-pixel inspection with mixed owned, neighboring, service and industry
content. No new UI or screenshot validation is claimed here. Patch whitespace
and clean-base application were checked at handoff. Independent documentary
review and any implementation approval are separate.
