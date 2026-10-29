# Founder origins: small connections, new games only

Design: https://github.com/HALCONDEORO/almojarife-game/issues/682

The existing origin cash and upkeep modifiers remain unchanged. Profile-created new games also get one modest connection:

- Merchant's child: 5 respect in the home port. The first respect tier starts at20; this does not grant a tier or alter port reputation/market fees.
- Seafarer: the nearest still-uncharted port appears on the map. No market data, cargo, sailing order or full coast chart is given.
- Scholar: approximate market correspondence for the nearest already-charted non-home port, if one exists. The snapshot uses the same 25% stock-error bound as a tavern rumour, does not update remotely and is not exact/live data. No extra port is charted.

The receipt `originStart` records the origin, actual home and successful target (when present). It is created only through the explicit `originConnections:true` new-game option, set by `startOptions`. Existing save loading never calls initialization. Saves without a receipt receive nothing retroactively. `SAVE_VERSION` stays3. Calling the initializer twice with a receipt is a no-op.

Presentation follows in a separate PR. Creation must explain the actual effect, including the no-nearby-port case. In-game copy must use the receipt, not infer an awarded benefit from an old save's profile.

## Checks

Eight focused tests cover all ports for chart/correspondence behavior, no market leakage, detached cells, save round trips, no re-grant, invalid data, old-save/default-call negative controls, deterministic seeding, unchanged starting cash/upkeep/ships/tutorial.

Passive seed42 control pairs at days0,30,90 for all three origins produce identical cash, net worth, AI state and market state, with and without connections. This proves no passive economic drift in those controls, not equal strategic player value. Recognition advances part of a future respect threshold; information can save a small tavern purchase. No general balance claim is made.

Rollback: revert the rules PR. Existing receipt data is inert without presentation; no migration is required.
