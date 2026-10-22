# Mechanic 3: peace between realms (letters suspended)

Third mechanic of the piracy set (assigned by the main agent on 22 Oct 2026; owner approval is recorded in the owner channel, not here). Flag `g.peace` OFF (also needs `g.marque` for letters); nothing calls it from the daily loop or the UI yet, so the game is unchanged and the player sees nothing.

## Rules (numbers are first values to tune with the sweep)
- Two realms are at peace from a dated treaty (data/peaces.json, each row with a source) or from a seeded random peace: one draw per realm pair per 6-year epoch, 30% chance, a window starting inside the epoch and lasting 2 to 6 years. It is a pure function of (seed, pair, day): no stored state, a reload cannot change the calendar. Realms under one monarch are never at peace in this sense (they cannot be named anyway).
- A letter is suspended while its issuer's realm (read from the issuer port in the year of purchase) and the named realm are at peace. It is not lost: it works again if the peace ends before it expires, and it still expires on its date. `usableLetter` / `coveredNow` are the lookups that mechanics 2 and 5 should use instead of `coveredBy`.
- The player hears about it in the inbox, once, only for a letter they hold ("tienes que decidir si paras o sigues"); bots use the same lookups and get no message.
- Dated treaties shipped: Alcáçovas 1479 (Castile and Aragon with Portugal), open-ended. Source: https://en.wikipedia.org/wiki/Treaty_of_Alc%C3%A1%C3%A7ovas. Treaty of Medina del Campo (1489) is England with Castile and Aragon, and England is not a realm in the table, so it is not a row.

## Not yet
Wiring into battles and the daily loop, saving `g.peaceSeen`, bots using suspended letters in their attack rule.
