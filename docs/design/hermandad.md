# Port brotherhoods, lords and succession (design v3, decisions)

Status: design only. Nothing here changes code or balance until its phase is merged behind the `HERMANDAD_ENABLED` flag (off by default).

## Decisions recorded (owner, 22 Oct 2026, relayed)
- Period: starts in 1480 (code today: `START_YEAR = 1475` in `src/sim/clock.mjs`; change goes with F1). Free play ends in 1600 with a thematic close: the Armada (1588), the Crown bankruptcy (1596) as events, final tally in 1600.
- Succession: up to 3 generations (about 40 years each). The trading company persists; the heir has traits; inheritance and brotherhood rank and reputation pass with a cut.
- Regional brotherhoods plus a world league, scaling to a bigger map by adding data, not rules.
- Names (decided from history, in i18n ES/EN so they are easy to change): North `Hermandad de la Marina` (echo of the Hermandad de las Marismas, until 1494); Atlantic Iberia `Consulado del Atlántico` (echo of the Consulado de Burgos, 1494); western Mediterranean `Consulado del Mar`; North Africa `Fondaco de Berbería`; world league `Liga de los Consulados`.
- Starting port sets: starting brotherhood (rank Oficial), home port (moves only between Member ports), +10 relation with the port's lord, regional rumours and crew names. Ship and starting cash do not change. Ports without a brotherhood start as "aspirante" (one contract to join).
- Port classes: Member, Trading house, Station, Free port, Strong place. Home city and mayor only in Member ports.
- Insurance: out. Siege and blockade: in, tied to the lord and to declared war between brotherhoods.

## Phases (each behind the flag, double PASS, ON/OFF gate with bots B/C)
- F1 data, zero economic effect: classes, lords table, events table, institutions table (all with from/until years), start year 1480.
- Succession: persona vs company split, heir, inheritance (money neutral).
- F2 one brotherhood: ranks by auditable milestones, Diet every 180 simulated days.
- F3 diplomacy (only after F2 is stable and the invariants pass): treaties, embargoes, alliances, reprisals, siege, blockade.
- F4 espionage, several brotherhoods, world league.

## Hard limits (balance and abuse review)
- Common tariff discount at most 10% of the combined effective commission; no stacking.
- Embargo: one per brotherhood, one target port, 30 days max, 180 cooldown, never removes a port's last route, never seizes cargo.
- Espionage: fixed cost, cooldown, data expires, game-seed RNG, result stored before display.
- No change to price floor, caps or the NPC wealth band. Times in simulated days.
- Facts (events, lords, institutions) enter data only with a cited source; unverified rows stay out.
