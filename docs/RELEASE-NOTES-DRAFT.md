# Release notes draft: v0.5.0-beta.1

DRAFT ONLY. The intended audience is public; publication is pending final owner approval; no tag, release date or final commit has been approved. The integrated source checkpoint is recorded below; the final release gates remain open. This is a proposal for review, not a published release.

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

## Later integrated changes in this batch

- Seven-day wind and storm forecast ([PR #540](https://github.com/HALCONDEORO/almojarife-game/pull/540)), three-day negative workshop margin warning ([PR #548](https://github.com/HALCONDEORO/almojarife-game/pull/548)) and route-rumour purchase feedback ([PR #557](https://github.com/HALCONDEORO/almojarife-game/pull/557)).
- Variable drifting cargo rewards ([PR #547](https://github.com/HALCONDEORO/almojarife-game/pull/547)); risk-free sea events resolve without pausing ([PR #559](https://github.com/HALCONDEORO/almojarife-game/pull/559)), including fair wind ([PR #560](https://github.com/HALCONDEORO/almojarife-game/pull/560)).
- Persistent rejected-course feedback ([PR #549](https://github.com/HALCONDEORO/almojarife-game/pull/549)); repairs and arming limited to the ship's dock ([PR #569](https://github.com/HALCONDEORO/almojarife-game/pull/569), [PR #570](https://github.com/HALCONDEORO/almojarife-game/pull/570)).
- Cleaner shipyard sections and away-port explanation ([PR #565](https://github.com/HALCONDEORO/almojarife-game/pull/565), [PR #567](https://github.com/HALCONDEORO/almojarife-game/pull/567)), Office rank progress ([PR #566](https://github.com/HALCONDEORO/almojarife-game/pull/566)) and City services tab ([PR #568](https://github.com/HALCONDEORO/almojarife-game/pull/568)).
- One more council order from Trader rank ([PR #561](https://github.com/HALCONDEORO/almojarife-game/pull/561)); Continue reloads the current save ([PR #562](https://github.com/HALCONDEORO/almojarife-game/pull/562)); unread tags only on actionable messages ([PR #563](https://github.com/HALCONDEORO/almojarife-game/pull/563)).
- Panel buttons no longer disappear during an active pointer press when the clock repaints ([PR #582](https://github.com/HALCONDEORO/almojarife-game/pull/582)).
- Extra autosave every three minutes and on hidden/pagehide, skipping identical campaign data ([PR #584](https://github.com/HALCONDEORO/almojarife-game/pull/584)). This is best effort, not a guarantee against every crash or shutdown.
- Centred Market columns ([PR #585](https://github.com/HALCONDEORO/almojarife-game/pull/585)); cargo filter only with a local warehouse, including stored goods ([PR #586](https://github.com/HALCONDEORO/almojarife-game/pull/586)); price-alert block removed ([PR #589](https://github.com/HALCONDEORO/almojarife-game/pull/589)). Existing saved alerts may still fire, without management UI in the Market window.
- Free-navigation right click sails immediately ([PR #587](https://github.com/HALCONDEORO/almojarife-game/pull/587), which reverts the confirmation menu from #583). Rejected-course feedback remains.
- Whole-number aggregate money display in the top bar and finance card ([PR #588](https://github.com/HALCONDEORO/almojarife-game/pull/588), [PR #590](https://github.com/HALCONDEORO/almojarife-game/pull/590)); calculations and saved cents are unchanged. Reputation copy says repairs, not all shipyard purchases ([PR #558](https://github.com/HALCONDEORO/almojarife-game/pull/558)).

Source checkpoint: `e96ab3a2e9c24974d699e29835b79d4a08e9af34`, tree `b192bb3d7ef880d035b07aa5c9dd271222e0c191`. This is merged source, not a certification of deployment or release readiness. Later open proposals and historical archived drafts are not release contents.

## Before you play

- Desktop browser with keyboard and mouse only. Phones and tablets are not supported.
- Experimental software: balance, UI and saves may change. Export a backup before trying a new build. Cross-version save migration is not promised.
- The campaign and balance remain works in progress. This is not a completed campaign or a 1.0 release.
- No deployment is certified by these draft notes. The final notes must name the tested commit and the verified play link.

## Release record to complete

- Final commit and tree: PENDING.
- Version: v0.5.0-beta.1 under the beta.N policy; no alpha release, full release v1.0.0. Intended audience: public; publication pending final owner approval.
- Independent documentation review: PENDING.
- Exact-head CI and simulation gates for the full batch: PENDING.
- Deployment and ES desktop post-merge playtest: PENDING.
- Asset and privacy review: PENDING final diff review.
