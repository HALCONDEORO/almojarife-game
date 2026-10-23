# Almojarife map-PR UI test harness

Headless-Chrome CDP UI checks for map pull requests (labels, zoom/pan, context menus).
No private data: the bundled fixture is a synthetic game save; art is never bundled.

## Prerequisites (read before running — not self-contained)
1. A **worktree of the commit under test**: `git worktree add /tmp/<wt> <SHA>`.
2. **Coastline data**: copy `data/ne_50m_land.geojson` (untracked, fetched by `tools/fetch_data.sh`) into the worktree `data/` — the web build will not serve without it.
3. **Programs on PATH**: `python3`, `google-chrome` (headless), and the python package `websocket-client`.
4. **The save fixture** `fixtures/all-discovered-save.json` is bundled and synthetic. To regenerate it you first need a *base save created by hand in the UI*: start a new game with the optional goods (pottery/legumes/kidMeat) enabled, then export `almojarife.save.v1` from localStorage. With that file: `python3 fixtures/make-all-discovered-save.py <base-save.json> <repo>/src/game/charts.mjs <out.json>`.
5. The expected port count is **derived at runtime** from `src/game/charts.mjs` in the worktree under test; if the port catalog changes, the audits follow it (the bundled fixture still marks the ports it was generated from — regenerate it when charts change).

## Security note: loopback CDP
These scripts launch Chrome with `--remote-debugging-port` bound to 127.0.0.1, `--remote-allow-origins` restricted to the local test origin, and `--no-sandbox` (needed in containers without user namespaces). Anything running as the same local user can drive that Chrome while the test runs; run the harness only on a disposable/local machine or container, never on shared CI runners without isolating or further restricting the debug endpoint. The harness is not wired into CI.

## Usage
Each script takes the worktree path as its first argument (or `MAPTEST_WT`):

    python3 tools/map-pr-tests/map321-test.py /tmp/<wt>
    python3 tools/map-pr-tests/pr323-labels-test.py /tmp/<wt>
    python3 tools/map-pr-tests/pr324-labels-test.py /tmp/<wt>
    python3 tools/map-pr-tests/pr327-freenav-test.py /tmp/<wt>

- `MAPTEST_SAVE=/path/to/save.json` overrides the save fixture.
- `MAPTEST_SHOTS=/path/to/dir` keeps the debug screenshots there (otherwise they are written to a temp dir and deleted on exit, like the Chrome profile).
- HTTP and CDP ports are allocated dynamically, so scripts can run in parallel.

## Scripts
- `map321-test.py` — letterboxed wheel-zoom anchored under cursor, pan tracking, no-bands degenerate case, docked-ship right-click port menu (flag OFF). Motion asserted numerically.
- `pr323-labels-test.py` — port label/marker hit-collision audit with real rendered text, label & dot clicks in dense clusters, Faro/Huelva and Tetuan/Melilla edges, right-click menu, drag-from-label pans without selecting.
- `pr324-labels-test.py` — same audits across zooms 1/1.56/2.44/3.81/5.96/8 (wheel steps), live font-size formula check, anchored zooms for off-viewport ports.
- `pr327-freenav-test.py` — freeNav activation regression through the real new-game form (no fixture save, no hand-forced state): the checkbox defaults OFF and survives form redraws both ways; OFF keeps the classic port menu and ignores open-sea right clicks; ON orders ports and open water directly with no menu (empty point must be map content, not an overlay); both flag states persist across quit+continue. Clicks outside the navigable network (far Atlantic, inland Spain) are refused with the navNoSea hint and leave the current voyage untouched when ON, and stay fully inert (no menu, no hint, no voyage) when OFF.

All print PASS/FAIL lines and exit non-zero on failure; JS exceptions are collected and asserted empty. Exit also cleans up the http server, Chrome and temp dirs.
