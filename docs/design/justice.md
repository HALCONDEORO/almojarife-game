# Port justice: charges, courts and sentences (part of mechanic 5, bad name and justice)

Coordinated with the mechanic 5 work on infamy. Flag `g.justice` OFF; nothing calls it from a sale, a sailing or the daily loop yet, so a flag-off game is identical and the player sees nothing.

## What is coded (every number is a tuning knob of ours; the history only shapes the structure)
- Charges: smuggling, fraud, piracy. A caller that detects a deed calls `raiseCharge(port, kind, value)`; it needs a port with a council (realms.json for that year) and raises infamy (pardon.mjs): smuggling 4, fraud 3, piracy 10.
- Officers: when a ship is docked in a port of the charged realm, `officersAct` tries each open charge once a day with a seeded roll. The chance grows with the town's chest (the concejo pays the watch: council.mjs `cajaOf`) and with infamy, capped at 90%. Missed charges stay open.
- Sentence by infamy tier: below 20 a fine only; from 20 part of the charged cargo is seized (smuggling and piracy; fraud never); from 50 the ship is also held (5 days, 10 days from 80). The fine goes into the town's chest, so cash plus chest is conserved (capped by the player's cash). Seized goods leave the game and are counted in `g.seizedUnits`.
- Recidivism: each earlier conviction in the same realm adds 50% to the fine and 15 points to the seizure share (up to 4), and from the third the ship is held whatever the infamy. A pardon (pardon.mjs) is a separate path.
- Jurisdiction by port (data/courts.json, only rows a source states): Seville's Casa de la Contratación (unregistered cargo was confiscated and suits heard at the Casa), Castile's export-ban magistrates (alcaldes de sacas), the Crown of Aragon's Consulado de Mar. Every other port with a council uses "the port officers", with no claim.

## Sources (HECHO in the study document)
- Castile, export bans and loss of goods; the 1480 Cortes de Toledo graded penalties by amount and repeat offence: https://dialnet.unirioja.es/descarga/articulo/134816.pdf ; magistrates: https://www.um.es/lexico-comercio-medieval/index.php/v/lexico/75531
- Seville, Casa de la Contratación: https://revistascientificas.us.es/index.php/HID/article/download/4440/3882/13307
- Barcelona, Consolat de Mar (jurisdiction framework only): https://ajuntament.barcelona.cat/arxiumunicipal/arxiuhistoric/sites/default/files/pdfs_interns/02.03%20Consolat%20de%20Mar_Presentacio.pdf

## Not coded (not verified, or only a proposal)
- The half to the treasury and half to the informer split: a proposal in the study, not coded.
- Concrete fines of the Consulado de Mar, death penalties, confiscation of all goods: not used as game rules (the game's sentences are milder on purpose).
- The Hansa Kontor judging its own members: not used, no Hansa realm in the table.
- Wiring (a sale or a sailing calling `raiseCharge`, a sailing checking `isHeld`, arrival calling `officersAct`, saving is already automatic: the whole game state is saved). The seams are the three functions above.
