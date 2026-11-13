# P3 underworld tavern circuit: illegal weapons, hired break-ins and smuggling

13 November 2026. Main inspected: `bba6320`.
Clean-room research only: no copied source prose, dialogue, assets, balance
values, excluded modding material or executable inspection. No implementation
approved.

## Narrow finding and existing coverage

The P3 manual documents a black-market circuit inside the tavern: a weapons
dealer offering illegal weapons, a thief who can be paid to strike a
competitor's office, and smuggling among the side-room deals - all of it
carrying a risk of being noticed and punished. Almojarife already has the law
side of that circuit (detected deeds become charges, sentences scale with a
bad name) but none of the offer side. The owner-accepted backlog names black
market and smuggling with customs, fines and seizure risk as an accepted
theme (`docs/BACKLOG.md`), so this slice is relevant without changing release
scope.

`patrician3-mechanics.md` lists the tavern characters and remarks that some
belong to the underworld, but does not study their offers. The piracy note
covers hiring pirates (a different tavern character with sea raids). The
single-use influence note covers bribing officials and court jurisdiction -
the defense side. The traveller custody note covers ordinary travellers and
lists the side-room jobs without studying the smuggling one. The P4 sabotage
note references our justice charges for a different game. None of them
studies this illegal-offer circuit.

## Evidence and dependencies

| Ref | Public source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Tavern introduction and its Weapons' Dealers, Thieves and The Side Room sections, plus the Weapon Smith note, printed pages 33-34: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full public PDF text inspected. Primary documentation: the tavern introduction warns that a town guard who notices the player conversing with an outlaw may bring a charge; the dealer's channel is described as flat-out illegal, with advice to prefer the smith; the thief is paid to break into another local trader's office and destroy goods; the side room lists smuggling among its deals; the smith section adds that hand weapons can also be obtained illegally from the tavern dealer, while the legal hand-weapon channel is gated on high office. Does not describe detection odds, fine sizes or what exactly can be bought. |
| S2 | P3 wiki, Tavern: https://patrician3.fandom.com/wiki/Tavern | Community page. Describes the weapons dealer as an underworld character where even talking to him may bring a fine if someone notices; a burglar who appears only in towns where the player has a trading office, breaks into the competitor's warehouse there, shares stolen goods on success and is often caught and then reports the client; and a side-room smuggler where talking is not illegal but accepting the offer may bring a fine. Community claims, no live reproduction. |
| S3 | GRYOnline, action buildings guide, tavern section, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Player guide. Adds that the shady characters are not all present at once, that even an innocent conversation with them can lead to a charge over one's company with the underworld, and that the burglar breaks into a competitor's office to destroy or steal goods. Confirms pirate clients are liable when their pirate is caught. Player guide, not documentation. |
| S4 | Steam thread, I'm the worst criminal, September 2014: https://steamcommunity.com/app/33570/discussions/0/616189106457075768/ | Player testimony: being caught for crimes feels common and the detection rules feel undocumented or vague. Anecdotal; evidence that the detection model is not publicly settled, not of any particular rule. |

The sources disagree on one point. S1 has the thief destroying goods; S2 has
stolen goods shared with the client and the burglar reporting the client when
caught; S3 allows destroy or steal. That difference is left open, not
averaged. Detection is the weakest documented part: every source agrees there
is a chance of being noticed and fined, none gives a model, and S4 suggests
players experience it as opaque.

## Documented behavior, not inferred universal rules

S1 establishes the existence and illegality of the dealer's channel and the
thief's paid break-in, and lists smuggling as a side-room deal. S1 also sets
the detection framing - a guard may charge the player merely for conversing
with an outlaw - which S2 and S3 echo, alongside the burglar's
break-in against a competitor's premises - S1 and S3 name the office, S2 the warehouse. None of this
is a verified engine rule: no source read gives detection odds, fine
formulas, the burglar's success rate or the smuggling job's structure, and
none is adopted here. The burglar's trading-office condition in S2 is a
single-source community claim until tested.

Open source questions: what the hired break-in actually does to the victim
(destroy, steal, or either); who can notice a tavern conversation and what
follows; what the dealer sells compared with the smith and whether his stock
differs beyond legality; how the smuggling deal works once accepted (cargo,
inspection, seizure); whether punishment goes beyond fines (reputation,
office, court); and whether any of this changed between the base game and
Rise of the Hanse. None is filled with a copied schedule, price or
probability.

## Main inspection

Real grep across `src`, `data` and `web/main.mjs` for smuggling, burglar,
thief, thieves, underworld, black market, contraband and customs found no
illegal-offer mechanic; the only hits are the charge kinds inside the justice
module and the court names data file.

- `src/game/justice.mjs:1-6`: port justice exists, flag-gated and not yet
  called from the daily loop, a sale or a sailing; charges are raised on
  detection and tried when the ship next docks in the same realm
  (`src/game/justice.mjs:31-49`). The charge kinds already include smuggling
  beside fraud and piracy, with sentences scaling from a fine to cargo
  seizure to holding the ship, and the fine credited to the town chest
  (`src/game/justice.mjs:14-18`). This is the existing seam any illegal deed
  would plug into, not a system to duplicate.
- `src/game/pardon.mjs` keeps the infamy track those sentences scale with.
- Legal weapon purchase already exists for ships (`src/game/crew.mjs`,
  re-exported through `src/game/game.mjs`); there is no illegal weapons
  channel and no hand-weapon tier.
- `src/game/whwatch.mjs:16-17` states the warehouse watch is a classification
  shown to the player, explicitly not a theft probability: no theft mechanic
  exists against the player's warehouses.
- The tavern branch (`web/main.mjs:998-1005`) already offers origin contacts,
  captain and governor hiring, rumours and charts. Adding an underworld
  character there is not permission to reclassify those characters or to make
  the legal weapon smith illegal.

No test execution or visual audit accompanies these source readings.

## Own design option and acceptance questions

If selected later, start with one bounded illegal offer plugged into the
existing justice seam, not a black-market engine: a deed is offered, the
player accepts, detection rolls by seed, and any detected deed becomes a
`justice.mjs` charge of an existing kind rather than a new law. A flag-off
game must stay byte-identical: no underworld characters, no charges, no
posts. Keep the three documented offers (weapons, break-in, smuggling)
separate decisions with separate acceptance questions; do not bundle them
because one source lists them together.

Future tests should prove: flag-off saves unchanged; detection deterministic
by seed and day; a detected deed raises exactly one charge with the deed's
value; an undetected deed leaves no trace beyond the deed's own effect; the
victim of a break-in is a competitor, never the player's own warehouse watch
contract; and legal purchases, tavern contacts, captains, governors and
rumours stay unchanged whether the system is on or off. Decide the destroy
versus steal question, the detection model, and the punishment ladder as
explicit owner decisions first - the sources do not settle them.
