# Patrician III: mechanics knowledge base (clean-room notes)

Purpose: understand what makes a Hanse-era trading game feel deep, so that Almojarife reaches the same level of depth with its own world, names, art and numbers.

Rules for this file
- Ideas and general mechanics only. Written in our own words. No text, art, data tables, names or code copied.
- Exact numbers from the other game are not reused. Where a number helps to understand the scale of a mechanic, it is given as a rough order of magnitude only.
- We did not use reverse-engineered game files or decompilation notes. Sources are the official manual, public wikis, community guides and forums.
- Wiki community text is CC BY-SA. We only paraphrase facts and never paste it. If a page is ever quoted, this file must be re-licensed accordingly, so do not quote.
- Videos: not watched in this pass (no free transcript tool available). Marked as open work below.

## Sources read (free, public)
- Official manual (PC), mirrored by the German fan forum: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf (chapters 1-7 read; later chapters not yet).
- Patrician III Wiki (Fandom): Career, Ranks, Reputation, Trade Prices, Production Costs, Businesses, City Buildings, Town Wall, Ship, Shipyard, Naval Combat, Piracy, Tavern, Trade Routes, Manager, Captain, Alderman, Siege, Expeditions. Base https://patrician3.fandom.com/wiki/
- Steam community guide "Old man's guide to Patrician III": https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 (fetched; skimmed).
- Spanish tips PDF (FX Interactive): https://www.fxinteractive.com/p228/images/Secretos%20del%20Imperio%20de%20los%20Mares.pdf (found, not yet read).

## 1. The world
- About two dozen big towns around the Baltic and North Sea, split into tiers: home towns (you can build a career and become mayor), trading offices (same actions, no mayor), small trading stations (only a repair dock). Two or three inland towns are reached by river only, by small ships.
- Towns are not static: people move in when supplies and work are good and leave when goods run short.
- The world map can be swapped (a standard one or a custom one) and the start year changes how developed towns are.
- Weather matters: storms at sea, winter frost cutting farm output, frozen ports that block ships.
Almojarife idea: our map is the Iberian coast and Mediterranean. Same tiers (home port, office port, minor station), river or shallow-water ports reachable by small ships only, winter and storm seasons.

## 2. Population and needs
- Three social classes (poor, well-off, rich), each with its own priority list of goods. The poor are the base: grow them first.
- Satisfaction moves slowly; shortages are remembered for a long time.
- "Big four" staples (beer, grain, fish, timber) matter most. Citizens want a stock of one to two weeks, not just today's supply.
- A market hall shows weekly consumption so the player can plan.
- Migrants arrive as beggars; they become workers only if there is work and housing. Sailors and workers come from this pool.
Almojarife idea: classes (poor, burghers, rich) with needs lists; weekly consumption screen; migration driven by supply.

## 3. Goods and production
- About 20 goods in two layers: raw materials (grain, hemp, honey, pig iron, timber, wine, wool, and so on) and finished goods that need raw materials plus labour (brick, cloth, iron goods, pitch, pottery, salt, skins, meat and leather).
- Each production building has a weekly output and a unit cost that depends on labour and inputs. Seasonal penalty in winter for farming. Several buildings of one type in a town give a small bonus; goods a town is not good at produce less (a "low" production tag).
- Early game: trading gives better margins than production. Production becomes the way to feed a growing Hanse later.
Almojarife idea: we already have 12 goods; add a second layer (processed goods), buildings that convert inputs, seasonal output, and a "good at / poor at" tag per port.

## 4. Prices
- Price falls when you sell (more supply) and rises when you buy (scarcer). Large batches use an average price. A town with low stock pays more.
- Players learn price bands per good: a buy-below level and a sell-above level.
- Selling below a certain level does not upset citizens; selling staples very high does.
Almojarife idea: our market already moves with supply and demand; add the satisfaction link (selling staples too dear costs reputation).

## 5. Ships and shipyards
- Four ship types with trade-offs: small and fast with little cargo, mid-size, large and cheap-per-load but slower, and a very large slow ship. River access only for the small ones.
- Shipyards gain experience from orders and repairs over time, then build bigger and better versions. Queues speed up work. Repair docks only at small stations.
- Ships can be upgraded for more hit points and weapon slots at the cost of cargo space.
- Crews are hired in taverns (from the beggar pool); wages weekly.
Almojarife idea: cog, caravel, then a larger ship; shipyard that levels up with use; upgrade tiers; crew and wages.

## 6. Trading offices, managers, captains and routes
- A trading office in a town stores goods and lets you trade without a ship present.
- Automation is the heart of late game: a captain gives a ship an automatic route of up to about twenty stops with per-stop buy/sell prices and amounts; a manager runs an office's buy/sell limits and minimum stock levels.
- Common player designs: port to port, hub and spoke (a hub per region with small feeder convoys), a "sit and wait" ship that trades locally, and an office-manager route.
Almojarife idea: this is the best path to "play for hours without clicking everything": offices, managers, captains, routes with price limits. Build after offices and stores exist.

## 7. Career, reputation and politics
- Ranks climb from shopkeeper up to the top office, driven by company value (ships, goods, buildings, cash) plus reputation, with guild membership needed above a certain rank.
- Reputation is local or Hanse-wide. It rises by supplying scarce goods, building public works, donating to the church, holding celebrations, completing missions, hunting pirates.
- Town hall: council meetings for higher ranks, mayor elections, taxes, missions and notices; the top rank leads the League and handles disputes (a town taxing too much, a town helping pirates).
- Late missions: found a new town, stop a notorious pirate, destroy a hideout, bring a struggling town to prosperity.
Almojarife idea: ranks from "buhonero" to "almojarife" (our top rank), town halls with permits and taxes (Marco's roadmap), mission board, reputation per town and global.

## 8. Buildings and city logic
- Public buildings: roads, wells, hospital, chapel, church, mint, school, shipyard, tavern, weapon smith, town wall levels. They give permanent reputation and affect health, fire and plague.
- Private buildings: houses and workshops/production buildings. Roads must keep up with houses; space is limited, so layout matters.
- Events: fire, plague, famine, siege, celebrations.
Almojarife idea: a city screen with lots, permits from the town hall, public works that change plague and fire risk, events.

## 9. Tavern
- A hub of characters: sailors, captains, brokers, informers (news about shortages, pirates, famines), traders (bulk offers), travellers, a side room with missions. Some characters are "underworld" and can bring fines (weapons dealer, pirate, burglar).
Almojarife idea: tavern in each port with rotating characters; start with sailors, captain, informer, broker, missions.

## 10. Piracy and naval combat
- Pirates always exist; you can hire one for a share of the loot, which also protects your own ships. Convoys with captains can raise a pirate flag.
- Combat: weapons with different range and damage, boarding with crew and cutlasses, manual or automatic resolution. Attacking towers and hideouts needs a fleet.
- Ships are captured and added to the fleet.
Almojarife idea: after the economy is solid. Start with simple automatic combat and pirate threat on routes; manual combat only if time allows.

## 11. Sieges, princes, wars
- Towns can be besieged; supplying a besieged town earns reputation. Princes and wars exist but have a small effect on the engine. Town guards and walls protect.
Almojarife idea: late, optional.

## 12. AI traders
- Computer competitors trade, build and hire pirates. They exist mainly as pressure on prices, ranks and the council.
Almojarife idea: we already have AI traders; add offices, buildings and election rivalry later.

## 13. Interface lessons
- Town view with clickable buildings; sea map with demand icons next to town names; a trade window with per-unit price, average price paid and cargo space; settable batch size.
- Many dialogs; the weak points are many small windows and tedious manual combat.
Almojarife idea: keep one clear trade panel (done), add demand icons on the map, and avoid micromanagement with automation.

## Open work
- Read the rest of the official manual (chapters 8 to 12: trade and production, shipping, building, politics, Hanse).
- Read the Spanish tips PDF and the German tips collection.
- Videos and forum threads (Steam discussions, Patrizierforum): no transcripts yet.
