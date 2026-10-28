# Piracy, naval combat and plunder: study and design proposal

Design brief (22 Oct 2026, project backlog): weapons need a use. Bots, players and pirates can attack each other; a convoy ship with a captain
can turn pirate, attack other bots' ships, plunder them and break ships; this costs reputation. Study how other games do it, then
propose a design for Almojarife. Same mechanic and same rules for player and bots. Sailors' gear and ship weapons come from the
armory PR (#230, docs/design/armory.md).

Rule for this study: we copy mechanics and ideas, never art, text or code. All sources below were read as public pages or papers;
no game code was read.

## 1. What the games do

| Topic | Game | What it does | Source |
|---|---|---|---|
| Becoming a pirate | Patrician 3 | Three ways: hire a pirate at the tavern (he keeps 30% to 65% of the loot and needs a ship), raise the pirate flag on your own ship or convoy (needs a captain), or raid a town. At least one pirate is always at sea, player or AI. | https://patrician3.fandom.com/wiki/Piracy |
| Becoming a pirate | Port Royale 3 | You are a privateer while you hold a valid letter of marque from one of four nations, a pirate without one. | https://portroyale3-fansite.de/en/politicscharacter/piracyprivateering/ |
| Becoming a pirate | Sid Meier's Pirates! | You start with a letter of marque from your nation; attacks on other nations are favourable or hostile depending on wars between nations. | https://sidmeierspirates.fandom.com/wiki/Factions |
| Combat | Patrician 3 | Ship fights with weapon types by range (catapult long, ballista short, bombard and cannon both). You need slightly more sailors than the enemy to board; cutlasses, one per sailor, give the crew an edge ("unarmed sailors can't do much"). Hits on one side sink, hits spread on both sides capture. Auto-resolve or manual. | https://patrician3.fandom.com/wiki/Naval_Combat |
| Combat | Sid Meier's Pirates! | Hits damage hull, sails, crew and guns; hull loss sinks, sail loss slows, crew loss spoils boarding. Outcomes: sink, board (fencing match, loser is captured), white flag (automatic boarding), escape (both keep damage). A sunk ship gives no loot, no prize, no crew. | https://sidmeierspirates.fandom.com/wiki/Naval_Combat |
| Combat | Port Royale 2 | Convoys of 1 to 5 escorts; chain shot slows a target before boarding; damaged military convoys retreat to repair; captured ships can be kept or sold. | https://gamefaqs.gamespot.com/pc/917958-port-royale-2/faqs/50286 |
| Plunder and prizes | Sid Meier's Pirates! | Winning lets you take cargo, add the ship as a prize, recruit crew. The crew's share when plunder is divided depends on difficulty and on how long the voyage was. | https://gamefaqs.gamespot.com/pc/915017-sid-meiers-pirates/faqs/34143 |
| Plunder and prizes | Patrician 3 | After winning you can capture, plunder, sink, let flee or let go. A pirate hired by the player keeps a loot share. | https://patrician3.fandom.com/wiki/Piracy |
| Reputation and law | Port Royale 3 | Attacking a trader or convoy without a letter: -8% to -10% with the attacked nation and allies, -5% to -6% with everyone else. With a letter: same loss with the victim, +10% with the nation that sold the letter, 0% with the rest. Looting a town: -10%. | https://portroyale3-fansite.de/en/politicscharacter/piracyprivateering/ |
| Reputation and law | Patrician 3 | Raising the flag and attacking can bring a fine. The game sends "indictment" letters: witnesses swear they recognised your ship with the pirate flag firing on, plundering, sinking or capturing Hanse ships. Hunting pirates raises reputation Hanse-wide. | https://patrician3.fandom.com/wiki/Piracy ; https://p3modding.github.io/letters/19-indictment.html ; https://patrician3.fandom.com/wiki/Reputation |
| Hostile ports | Patrician 3 | Every town has a harbour bombard; town raids are sea battles with defences; towns hold a coffer that pirates can plunder. | https://patrician3.fandom.com/wiki/Piracy |
| Hostile ports | Anno 1404 | War must be declared first; military budget caps how many fighting units a population supports; control comes from capturing warehouses. | https://anno1404.fandom.com/wiki/Combat |
| Fame | Uncharted Waters | The player gains fame from battling, trading and discovering; there are national and pirate NPC fleets. | https://en.wikipedia.org/wiki/Uncharted_Waters:_New_Horizons |

Games checked but with no usable public page for combat detail: Corsairs / Sea Dogs (a guide exists at piratesahoy.net, not read in full).

## 2. What the period says (late 15th century, our setting)

- Castilian privateering was regulated by the Crown: the king took a fifth (quinto) of the booty, two thirds of it for the king and one
  third for the admiral. Source: Dialnet 58329, "Apuntes para el estudio de la influencia del corso y la piratería en la política exterior
  de los Reyes Católicos", https://dialnet.unirioja.es/descarga/articulo/58329.pdf
- Victims of a sea attack asked their ruler for a carta de marca y represalia: a licence to retaliate against subjects of the aggressor's
  realm. Sources: https://dialnet.unirioja.es/descarga/articulo/1957430.pdf
- In 1459 to 1461 corsairs raided the coasts of the Crown of Aragon and took refuge in ports such as Cartagena or Marseille; Barcelona
  asked for galleys to chase them. https://dialnet.unirioja.es/descarga/articulo/5746219.pdf
- Marine insurance existed: Barcelona kept a manual of maritime insurance contracts (1428-1429).
  https://raco.cat/index.php/EHDAP/article/view/288065
- State convoys: the Venetian mude were galleys owned by the state, rented to merchants at auction and sailing on fixed dates with an
  armed escort. http://www.arielcaliban.org/PX_mude.pdf
These give us real hooks: a quinto, letters of marque and reprisal, port refuge, insurance and convoys. We use them as the basis of the
rules below; the numbers are ours.

## 3. What Almojarife has today
- A pirate encounter exists for the player only: 2.5% a day at sea, half pirates; the player flees or fights (encounterdaily.mjs,
  encounters.mjs). Defence = weapon power x gun condition x crew factor (+ captain skill x 6); win chance 20% + defence/150, capped 90%.
  A loss costs 10 hull, 20% of the cargo and a day. A won fight may leave a prize ship (hull 30 to 69%, no crew).
- Port reputation per port (-50 to 100, five tiers) and respect (stranger to honoured); captains with skills; a concejo that moves fees.
- AI traders: three, one ship each, no captain, no crew, no encounters. They trade only (src/sim/ai.mjs).
- #230 adds weight for weapons and gear, the armory, and `buyWeapon`/`buyGear` with the same rules for bots and player. Bots arm only
  when a harness reports pirate risk (hook `pirateRisk`), because arming them for nothing inflated NPC wealth 5x to 30x.
- There is no convoy concept, no insurance, no pirate flag, no infamy.

## 4. Design proposal

### 4.1 One resolver for every fight
A pure, seeded function `resolveBattle(attacker, defender, roll)`; it gets two ships plus their owners and returns a report. The
player and the bots use it with no difference. No UI, no state in the function.
- Strength of each side = firepower (weapon power x gun condition x crew defence incl. gear and captain) with hull as a modifier.
- Pursuit: the attacker must be fast enough. Speed ratio (speedFactor x kmPerDay) against the target decides whether the target can
  flee; the escape formula already in the game is kept for the player and applies to bots too.
- Up to three gun rounds. Each round: hull loss on the target, crew loss, wear on guns (wearGunsBy already exists for this).
- Ending, chosen by the attacker's policy (player: a choice; bot: a rule): sink, board, or accept surrender when the strength ratio is at
  least 2 to 1 (white flag). Boarding compares crews with gear (the sailors' gear of #230 is the cutlass of Patrician 3), captain skill
  and hull damage; the loser is captured.
- Result on the loser: ship captured as a prize (the existing prize rules), or cargo looted, or sunk (cargo, ship and crew lost, no loot:
  sinking is the way to leave no witness but gives the attacker nothing).
- Loot: the attacker takes up to the free hold of the best-value goods, at most 60% of the cargo. Money is not created: every loot unit
  leaves the victim's hold (invariant, tested).

### 4.2 Becoming a pirate
- Flag on the ship, not on the owner: `ship.flag = "merchant" | "pirate"`. Switching is a free action in port or at sea; the ship must
  have a captain, at least one weapon, and a crew at or above the minimum.
- Player: a button "raise the black flag" per ship. Bots: a rule, evaluated daily with a seeded roll: a bot ship turns pirate when
  its owner's cash has stayed below 15% of its starting cash for 30 days, the ship is armed above a power threshold and a worthwhile
  target (cargo value) is on a lane it uses. A pirate bot turns merchant again when it holds more than twice the threshold cash or after
  being fined or pardoned.
- Convoys later (phase 4): a group of up to four ships with a lead captain; the flag applies to the whole group.
- Letter of marque (period: carta de marca y represalia): a port's concejo sells a letter naming a hostile port or kingdom. Attacks on that
  named side cost no reputation, and one fifth of the booty is paid to the grantor (the quinto). Without a letter an attack on a
  non-hostile ship is piracy.

### 4.3 Reputation, infamy and justice
- Two new numbers per owner (player or bot): `infamy` 0 to 100 and a bounty derived from it.
- Attack without a letter on a merchant ship: infamy rises by 5 plus 1 per 500 coins of cargo; port reputation falls by 15 in the victim's
  home port and 5 in the ports of the same region (copying the shape of Port Royale 3: a large loss with the victim, a smaller one with
  the rest). Looting a port's ship in its own harbour is not allowed in v1.
- Witnesses: if the victim survives or another ship was within sight, the pirate's identity becomes known (infamy counts in full); if
  the victim is sunk with no witnesses, infamy rises only by half. This is the trade-off of Pirates! (sinking leaves no loot) and of
  Patrician 3 (witnesses swear to the flag).
- Infamy tiers (proposal): below 20 nothing; 20 to 49 "watched": port fees +25%; 50 to 79 "hostile": the harbour fires on entry (hull loss)
  and refuses market access in ports where reputation is below neutral; 80 or more "wanted": a bounty of infamy x 50 coins is posted;
  armed escorts of ports hunt the ship and killing or capturing it pays the bounty.
- Recovery: infamy falls by 1 a month (like the existing reputation decay), or by paying a fine equal to the bounty in a port where
  reputation is at least neutral.
- Pirate hunting gives reputation (Patrician 3): the owner of a ship that captures or sinks a wanted pirate gets the bounty and +10 in
  the ports of the region.

### 4.4 Damage to ships and cargo
- Hull, crew, gun condition and (new, optional) sails speed are damaged by fire. The hull floor of 10% in the current rules stays for
  pirate raids that leave the victim alive; only sinking removes a ship.
- Repairs: existing hull repair and armament repair at port; reputation multipliers already exist (REP_REPAIR_MUL).
- Sunk ship: owner loses ship and cargo; a bot owner with no ships left is bankrupt and respawns after a fixed delay with a small
  starting capital, so the NPC economy does not shrink to zero.

### 4.5 Convoys and insurance (later phases)
- Convoy: up to four ships moving as one unit at the speed of the slowest. The attacker fights the strongest ship first (Port Royale 2);
  a damaged convoy breaks off. Cost: more upkeep, benefit: strength adds up and weapons can sit on dedicated escort ships.
  Basis: Venetian mude and the escorts of Port Royale 2.
- Insurance: pay a premium at departure, a share of the cargo value, set by the recent attacks on the lane (a rolling count per lane,
  per year). If a pirate takes or sinks the ship, the office pays the insured value minus an excess. Basis: the Barcelona insurance manual of 1428-1429. Optional; only if the economy sweep shows pirate losses too punishing for the player.

### 4.6 Weapons and gear
Ship weapon power decides gun rounds; weight (from #230) costs hold space and speed trade-offs make light ships flee and heavy ones
fight. Sailors' gear raises boarding strength. A pirate bot that buys weapons and gear uses the armory with the same rules as the
player. Replace today's `pirateRisk` hook by "the lane has had an attack in the last 60 days".

## 5. Phases (small PRs, each with tests, 8-seed sweep and the 1/5/10/30/50/100 year gate)
0. Resolver `resolveBattle`, pure and tested (no wiring). Conservation test: loot never creates money or cargo.
1. Wire it for the player's existing pirate encounter (same behaviour for the player, the abstract pirate becomes a ship with owner "pirates");
   no change to bots yet. Gate must stay green.
2. Infamy, bounty and port consequences for the player and for any owner flagged pirate; letters of marque from the concejo.
3. Bots: flag rule, targets, bankruptcy and respawn; `pirateRisk` from lane attacks; NPC bands re-measured (section 6).
4. Convoys.
5. Insurance (optional).

## 6. NPC bands to revisit (the mechanic changes the NPC economy on purpose)
Measured finding from #230: arming bots for nothing moved NPC wealth from a boom and bust of about 22k to 709k to 954k at 30 years and
2.66M at 100 years. The NPC economy is also chaotic: +-13 coins of starting cash moved the 100 year result from 85k to 717k on the
unchanged main. So bands must be set on a distribution over seeds, not on one run.

In tools/sim_balance_check.mjs:
- `NPC_WORTH_BAND` per horizon (365 days: 50k to 720k; 1825: 35k to 1.27M; 3650: 180k to 1.95M; 10950: 12k to 930k; 18250: 75k to 1.61M;
  36500: 45k to 590k). Measure with tools/sim_npc_worth_bands.mjs on at least 16 seeds (it takes seeds on the command line), then set
  low = 0.5 x the minimum and high = 4 x the maximum of the distribution, as the current bands were derived.
- "NPC cash growth x0.5 to x30 over 365 days" and "NPC cash sane 10k to 500k" at every horizon.
- The warning "NPC traders bleed cash over the long run" and the info line on NPC worth last 10 years against the start.
- The price index band (0.80 to 1.40): piracy removes cargo from markets, so prices can rise.
- test/npc-cash-measurement.test.mjs and test/npc-competition.test.mjs.
New metrics the sweep must print per seed and per horizon: attacks per year, share of ships flying the pirate flag, merchant ships lost
per year, cargo value looted and destroyed, bots bankrupt and respawned, bounty paid, infamy distribution, plus the player's raid
frequency against today's 2.5% a day base (half pirates). Invariant checks: money plus cargo (at base prices) is conserved except for
what the rules destroy (sunk ships, sunk cargo, fines, bounties, quinto).
Acceptance for each phase: the gate stays green on the new bands, and a player who never goes pirate loses at most the pirate-risk
share that exists today (no more than 1.5x the current raid rate on the same lanes) unless the owner decides otherwise.

## Mechanic 5 wiring (bad name and justice)

The engine is `src/game/justice.mjs` (charges, courts by port or realm, graded sentences with repeat offences). `src/game/justicewire.mjs` connects it to play, all behind `g.justice` (off by default) and data the host registers with `setJusticeData(realms, courts)`:
- an attack on a trader whose realm has no usable letter (opt-in `unlicensed`) takes no fifth, raises a piracy charge in the victim's home port (infamy through `addInfamy`, shared with the pardon) and lowers the name in that port;
- when a ship docks, the officers of that port's realm try its open charges; a prison sentence holds the ship (`heldUntil`);
- a bad name fades one point a month. Nothing is shown to the player while the flag is off.
Not wired yet: smuggling and fraud charges (the game has no export bans yet) and any bot use of courts. Famine as a consequence waits for verified sources.

### Browser activation (28 October 2026)
New games enable port justice by default. The browser loads realms and courts and registers them with the arrival/charge hooks. The town hall shows a read-only justice summary. Explicit `justice:false` remains available to isolated baseline tests. Existing saves keep their saved flags for now. This activation does not change fines, sentences or trade rules. Letters, merchant attacks and prize-court controls are a separate host-UI follow-up; their pure modules alone do not make those actions playable.

### Optional court data availability
The browser bounds justice data loading to 2.5 seconds, validates its structure and catches network/HTTP/JSON errors. If unavailable, the normal title and trading game still start. The title warns that justice is unavailable and offers Retry (reload); the hall repeats the unavailable state. Saved charges are retained, not cleared or marked tried. Loading failure clears only the runtime justice-data registration. Peace-news loading is also bounded and skipped when justice realms are unavailable.

Regression: `node --test test/justicefallback.test.mjs test/justicehost.test.mjs`; optional Playwright browser check in `test/browser/justice-startup.mjs` covers abort, invalid JSON, 503 and a hung request.
### Playable privateering controls
The town hall sells the existing 600-coin, 365-day letters and presents tagged prizes to the existing court. The sea panel lists traders on the same lane and asks confirmation before an attack; unlicensed plunder uses the existing charge hook. Peace is on by default in new games and suspensions are labelled before purchase and after it. Fines, combat, loot, quinto and court decisions use the existing modules without balance changes. A court's release/seizure is reported through the existing inbox.

After the startup-fallback merge, privateering shares the bounded peace-data read and disables its controls when realms, courts or peace data are unavailable. It never treats missing peace data as permission to attack. Saved charges remain intact.
