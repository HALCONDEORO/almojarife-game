# El Almojarife v0.5.0-beta.1

The first public beta of El Almojarife, a desktop trading game set around Iberia and North Africa. Start a merchant house, trade between ports, build a fleet and plan routes through changing weather and events at sea. The game is available in English and Spanish.

This is a beta, not the finished campaign. Balance, interface details and saves may change as development continues.

## Trade, sail and build

- Trade across 33 ports with 20 goods, manage storage and workshops, and grow your standing as a merchant.
- Set automatic routes, repeat the last voyage and see profit per trip. Automatic hull repairs respect your route's cash limit.
- Read a seven-day weather forecast and make choices during voyage events. Where pirate-fighting odds are marked approximate, they are estimates rather than exact predictions.
- Use city services, buy plots and build. Neighbours' houses have read-only municipal cards and are separate from plots for sale.

## What is clearer in this beta

**Fewer missed actions.** Pending voyage events remain accessible after the interface refreshes and inside city view. Messages separate actions that need your attention from grouped notices. Panel buttons stay in place during an active mouse press.

**Better trading and ship feedback.** The shipyard explains purchases blocked by your location. Repairs and arming require the ship to be docked at that port. The Market's cargo filter appears only when you have a local warehouse and includes stored goods. Office and City panels explain rank progress and available services.

**More direct navigation.** Right-clicking a free-navigation destination sails immediately. A rejected course still explains why it cannot be taken.

**More readable city and finance panels.** Market columns are centred. Aggregate money values use whole numbers in the top bar and finance card, without changing stored cents or calculations. Construction feedback shows missing coins, and selecting a build action centres its confirmation below the panel header.

**A more useful city view.** Bounded zoom-out keeps the town readable. The first city frame waits for currently needed sprites, with other levels loading in the background. A newly built higher-level building may briefly use level 1 art while its sprite arrives.

**Extra save opportunities.** The game attempts an autosave every three minutes and when the page becomes hidden or is left, skipping identical campaign data. Browser lifecycle saves are best effort, not protection against every crash or shutdown.

## Before you play

- Use a desktop browser with a keyboard and mouse. Phones and tablets are not supported.
- Export a backup before trying a new build. Cross-version save migration is not promised for this beta.
- The campaign and balance are still in development. This is not a 1.0 release.
- The Market no longer offers price-alert controls. Alerts already present in a saved game may still fire, without a management interface in that window.

## Source and verification

PRE-PUBLICATION RECORD. Remove this pending record only after the final checks are complete.

- Final version: `v0.5.0-beta.1`, GitHub pre-release.
- Integrated source checkpoint: `70c8479e720a295a76f4f43cb102698ff7fadecd`, tree `53c8a97d9e93a7553d509ac4e920f778ca847434`. This is not yet the final tested release candidate.
- Exact-head independent review and CI: pending for the release candidate.
- Independent documentation review: pending for this polished text.
- Deployment of the candidate and Spanish desktop new-game Playtest: pending.
- Window scaling, terrain caching, sprite recompression and the plot-purchase guide are still pending. They are excluded from these release claims until integrated and tested.

## Change references

The detailed source history is in [CHANGELOG.md](CHANGELOG.md). This text is grounded in the integrated batch through #594 and #596, including route feedback (#536, #546), event access and choices (#550, #551, #555), messages (#552, #563), dock-local repairs and arming (#569, #570), reliable panel clicks (#582), autosave (#584), Market changes (#585, #586, #589), direct sailing (#587), integer money displays (#588, #590), build confirmation (#592) city plots and neighbours (#593), centred confirmation (#594), and bounded zoom/staged loading (#596). Final publication must replace relative document links with verified release-specific links and reconcile later merged changes.
