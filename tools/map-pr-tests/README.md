# Almojarife map-PR UI test harness

Headless-Chrome CDP UI checks for map pull requests (labels, zoom/pan, context menus).
No private data: the fixture is a synthetic game save; art is never bundled.

## Setup
1. `git worktree add /tmp/<wt> <SHA-under-test>` and copy `data/ne_50m_land.geojson` into the worktree `data/` (untracked, needed by world tests).
2. Deps: python3, websocket-client, google-chrome (headless). Scripts spawn `python3 -m http.server` themselves.
3. Base save: create a real new game with optional goods (pottery/legumes/kidMeat) in the UI, export/localStorage `almojarife.save.v1`. Regenerate the 33-port fixture: `python3 fixtures/make-all-discovered-save.py <base-save.json> <repo>/src/game/charts.mjs /tmp/all-discovered-save.json`.
4. localStorage is per-origin: keep the same http port when reusing a Chrome profile (profiles are temporary per run by default).

## Usage
Each script takes the worktree path as its first argument (or `MAPTEST_WT`):

    python3 tools/map-pr-tests/map321-test.py /tmp/<wt>
    python3 tools/map-pr-tests/pr323-labels-test.py /tmp/<wt>
    python3 tools/map-pr-tests/pr324-labels-test.py /tmp/<wt>

Override the save fixture with `MAPTEST_SAVE=/path/to/save.json` (default: `fixtures/all-discovered-save.json` next to the scripts). Chrome profile dirs are created fresh under the system temp dir per run.

## Scripts
- `map321-test.py` — letterboxed wheel-zoom anchored under cursor, pan tracking, no-bands degenerate case, docked-ship right-click port menu (flag OFF). Motion asserted numerically.
- `pr323-labels-test.py` — 33-port label/marker hit-collision audit with real rendered text, label & dot clicks in dense clusters, Faro/Huelva and Tetuán/Melilla edges, right-click menu, drag-from-label pans without selecting.
- `pr324-labels-test.py` — same audits across zooms 1/1.56/2.44/3.81/5.96/8 (wheel steps), live font-size formula check, anchored zooms for off-viewport ports.

All print PASS/FAIL lines and exit non-zero on failure; JS exceptions are collected and asserted empty.
