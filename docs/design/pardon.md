# Mechanic 7: pardon (perdón)

Seventh mechanic of the piracy set (assigned by the main agent on 22 Oct 2026; owner approval is recorded in the owner channel, not here). Flag `g.pardon` OFF; nothing calls it from the daily loop or the UI, so the game is unchanged and the player sees nothing.

## Rules (first values, to tune with the sweep)
- Minimal infamy: one number 0-100 (`g.infamy`). Mechanic 5 (bad name and justice) will raise it; this module holds it, fades it by 1 a month (`decayInfamy`, once a day) and sells the pardon.
- Buy a pardon in a port with a council (a realm in data/realms.json for that year) while one of your ships is docked there and the port's reputation toward you is at least neutral. Fee: 30 coins per point, at least 100. It is paid to the realm and leaves the game (a sink, counted in `g.pardonPaid`). Infamy drops to 0.
- The same realm will not pardon you again for 365 days (`g.pardonDay[realm]`); another realm will. This stops a cycle of sin and pay.
- Bots: the first version holds the player's record; the same pure functions take a record, so bots can use them when mechanic 5 gives them infamy.

## Not yet
Raising infamy (mechanic 5), any view of infamy or the fine (none while the flag is off; later only as ordinary play text), wiring `decayInfamy` into the daily loop.
