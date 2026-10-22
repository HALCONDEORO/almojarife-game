# Private bot chart and market book

This patch provides an isolated planning boundary. It does not enable it in the live
loop yet. The game-loop integration must not be called complete until these steps land.

## State ownership

`botintel.mjs` stores `intel`, `discovered` and `warehouses` on each bot. It uses
`bot.ships` if present, otherwise `[bot.ship]`. These collections must be own fields
in any synthetic player view. Never inherit the human's fields via `Object.create(g)`.
`home` should be fixed when the bot is created. Old saves can lazily start from the
bot's current port, with no copied human history.

## Coordinator contract

1. Before each decision call `refreshBotKnowledge(g, bot)`. It refreshes exact prices
   only where that bot has presence. It discovers ports by the same fog radius.
2. Pass `{...economicHooks, ...botIntelHooks(g, bot)}` to `aiStep`. `planningMarket()`
   supplies remembered or paid rumour cells, and `canVisit(city)` gates by its chart.
   All real local purchases and sales still use the shared market.
3. Refresh discovery while sailing, using the tick-time bot view. If optimizing,
   refresh exact intel only at decision points while retaining per-tick discovery.
4. If no plan exists, the policy may call `buyBotReport(g, bot)`, then retry planning.
   A report costs the same 40 coins as a human rumour, or 60 for a route rumour.
   It chooses by report age and port identifier, never by hidden price or stock.
   The policy owns its information budget and must avoid paying every tick.
5. A boat may explore an already charted destination empty when it lacks prices.
   Pick that destination using distance or age of visits, not hidden market state.
6. Apply the same boundary from the first warmup day. A patch that enables the hooks
   only after warmup still gives bots an earlier information advantage.

The helpers do not decide borrowing, upkeep, building or repair policy. Contact hire,
charts and later multiple ships can reuse their ordinary player functions through the
same private view. Those policy choices remain follow-up work, not completed features.

## Tests and limits

`ai-intel.test.mjs` rejects any access to live remote market cells with a Proxy, checks
hidden-price invariance, unknown and partial reports, chart filtering, human/bot state
isolation, stale memories, paid report accounting and save persistence. With no hooks,
the simulator retains its existing behavior for compatibility. Therefore a green
balance run on this patch alone is a regression check, not evidence for the economy
of the future fog-enabled bot policy. That integrated policy needs its own sweep.
