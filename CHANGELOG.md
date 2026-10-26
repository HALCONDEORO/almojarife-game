# Changelog

## Unreleased

No GitHub release or tag is announced by this section. The early alpha version and audience remain proposals; see docs/RELEASE.md.

### Integrated source batch, 26 October 2026
- Route and finance cards, missions, tabs, port details and notices in the right panel.
- Repeat the last route and see profit per trip (#536).
- Explain blocked armory purchases (#537) and show purchased offices as owned (#538).
- Automatic route hull repair respects the cash limit (#546).
- Pending events stay accessible after repainting (#551) and appear in the city view (#550).
- Actionable Messages separated from grouped notices (#552).
- Right-panel priority and red event warning (#553); fleet search only above five ships (#554).
- Sea-event probabilities and effects, including sampled pirate-fight estimates (#555).
- Generated reference/wiki updates including seasonal rules.

These entries describe merged source, not a verified deployment. PRs still open at the final release checkpoint must not be promoted into this list without integration checks.

### Earlier unreleased work
- Accessibility: the map hint and the city mission line (including the tutorial steps) are polite live regions, so screen readers announce them when they change. No visual change.
- Town auction: the almoneda now sells more than establishments. Used ships (one every 4 weeks per port, hull 55-90%, below new-ship price) and town houses (one every 2 weeks, level 1-3, trading office required) come up on seeded per-port cadences, sold by the concejo or a named neighbour. Bids are placed per lot; a winning bid the player cannot settle is voided and the lot passes to the next bidder. Municipal proceeds from the player's wins are tracked apart (hallAlmonedaGen) so the council-chest invariant keeps its hard bound; a neighbour's win moves no chest money. Old saves keep their standing establishment bid.
- First-voyage tutorial (easy difficulty): three hint steps teach one buy, one sale, then sailing; progress lives in `g.tut`, only when the game starts with the tutorial on, so other saves are unchanged. Strings in English and Spanish (src/game/tutorial.mjs).
- City view: distinct ground types painted in deterministic texture layers from a shared module (src/view/ground.mjs): packed earth inside the walls, cobbled main square with paving joints, dirt roads with a worn centre, grassland with tufts, scrubland patches, ploughed fields with furrows and a sand band along the south coast. Purely visual; no simulation or save data changes.
- Platform: the game is explicitly desktop-only (Windows, Mac and Linux browsers, keyboard and mouse); phones and tablets are out of scope.
- Pause menu: the shortcut list (Esc, Space to pause, wheel zoom, drag to pan) now shows inside the menu, in both languages.
- Staggered markets: each port ticks its economy once per day at its own slot inside the day (Patrician 3 style), instead of one midnight pulse. Formulas and daily quantities are bit-identical per port; price history is written at the port's tick.
- Continuous voyages: ships move per tick and arrive at a day and hour, not at day boundaries; each leg gets a seeded wind factor (0.8-1.2). Estimates and the ship panel show hours and the arrival ETA. Save format v3 (older test saves are not kept).
- Tick clock: the simulation now advances in ticks (240 per day, 10 per hour); day-boundary systems keep identical behaviour. Save format v2 adds `state.tick` (older test saves are not kept).
- Prototype: market model, world data (Baltic prototype), SVG map renderer, 7 tests.
- Project documents: design, roadmap, competition study.
- Repository organised like other open-source games: CI, issue and PR templates, code of conduct, translating guide.
