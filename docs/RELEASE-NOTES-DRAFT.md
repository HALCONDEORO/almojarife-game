# Release notes draft: v0.5.0-beta.1

DRAFT ONLY. The public audience is approved conditionally; no tag, release date or final commit has been approved. The final batch is still being integrated. This is a proposal for review, not a published release.

## El Almojarife: first beta batch

A desktop browser trading game set around Iberia and North Africa. Build a merchant house, trade between ports, manage ships and automatic routes, and respond to events at sea. English and Spanish are available in the game.

## Integrated at the documentation checkpoint

- A right panel ordered by priority with a red event warning ([PR #553](https://github.com/HALCONDEORO/almojarife-game/pull/553)).
- Repeat the last route and see profit per trip ([PR #536](https://github.com/HALCONDEORO/almojarife-game/pull/536)).
- Automatic route hull repair while respecting the cash limit ([PR #546](https://github.com/HALCONDEORO/almojarife-game/pull/546)).
- More useful Messages: actionable messages separated from grouped notices ([PR #552](https://github.com/HALCONDEORO/almojarife-game/pull/552)).
- Pending voyage events remain accessible after repainting ([PR #551](https://github.com/HALCONDEORO/almojarife-game/pull/551)) and also appear inside the city ([PR #550](https://github.com/HALCONDEORO/almojarife-game/pull/550)).
- Event choices show probabilities and effects ([PR #555](https://github.com/HALCONDEORO/almojarife-game/pull/555)). Pirate fighting odds marked approximately are estimates, not exact forecasts.
- Clearer feedback for blocked armory purchases ([PR #537](https://github.com/HALCONDEORO/almojarife-game/pull/537)) and purchased offices ([PR #538](https://github.com/HALCONDEORO/almojarife-game/pull/538)).
- A fleet search that appears only when there are more than five ships ([PR #554](https://github.com/HALCONDEORO/almojarife-game/pull/554)).
- Live-data reference pages in the wiki, including seasons ([PR #527](https://github.com/HALCONDEORO/almojarife-game/pull/527)).

## Pending batch candidates, not release claims

Forecasts, variable salvage rewards, workshop margin warnings, persistent course feedback, shipyard and office layouts, city services, rank benefits, risk-free events and other fixes remain under review or integration. The final notes must replace this section with only changes present in the approved release commit. Do not announce these as available yet.

## Before you play

- Desktop browser with keyboard and mouse only. Phones and tablets are not supported.
- Experimental software: balance, UI and saves may change. Export a backup before trying a new build. Cross-version save migration is not promised.
- The campaign and balance remain works in progress. This is not a completed campaign or a 1.0 release.
- No deployment is certified by these draft notes. The final notes must name the tested commit and the verified play link.

## Release record to complete

- Final commit and tree: PENDING.
- Version: v0.5.0-beta.1 under the beta.N policy; no alpha release, full release v1.0.0. Intended audience: PUBLIC, approved conditionally on26 October18:20.
- Independent documentation review: PENDING.
- Exact-head CI and simulation gates for the full batch: PENDING.
- Deployment and ES desktop post-merge playtest: PENDING.
- Asset and privacy review: PENDING final diff review.
