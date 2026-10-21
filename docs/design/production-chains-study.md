# Production chains: a short, coherent catalogue (study, no code)

Status: study and proposal. Nothing here is implemented. The three open patches (fish + fishery,
smokehouse as processor, bread + bakery) are held until this design confirms or replaces them.

Goal (owner request): fewer, saner goods and buildings, every item in a chain, nothing loose or odd.
Method: read public wikis and the official manual of Patrician III (P3) for the goods, buildings,
inputs and outputs; adapt to the Iberian and Mediterranean coast, 15th-16th century; compare with
what the game has; set a cap; plan small PRs gated by a measured balance sweep.
Rule: we copy mechanics and good names (not protectable). We copy no art, text or code from P3.

## 1. What P3 does (sources)

P3 has 20 goods, 12 raw-material businesses and 8 finishing businesses. The manual groups the goods as
food (grain, fish, beer, meat), consumer goods (wool, leather, wood, cloth, oil, pottery, hemp,
salt, iron goods) and luxuries (wine, spices, cloth, oil, furs), plus building materials (bricks,
wood, pitch). Staples feed the poor; if a town lacks food for long it suffers famine. Every town
produces only some goods; the rest is imported. Prices follow stock against expected demand.

P3 businesses, with inputs and outputs from the wiki calculators:

| Business | Inputs | Output | Kind |
|---|---|---|---|
| Grain farm | none | grain | primary |
| Sheep farm | none | wool | primary |
| Sawmill | none | timber | primary |
| Iron smelter | none | pig iron | primary |
| Vineyard | none | wine | primary |
| Hemp farm | none | hemp | primary |
| Apiary | none | honey | primary |
| Fishery (fish) | salt, hemp | fish | processor |
| Fishery (whaling) | salt, hemp | fish, whale oil | processor |
| Cattle farm | salt, timber | meat, leather | processor |
| Weaving mill | wool | cloth | processor |
| Workshop | timber, pig iron | iron goods | processor |
| Brewery | grain, timber | beer | processor |
| Brickworks | timber | bricks | processor |
| Pitchmaker | timber | pitch | processor |
| Pottery | timber | pottery | processor |
| Saltworks | timber | salt | processor |
| Hunting lodge | iron goods, hemp | skins | processor |

Other P3 rules worth copying: a seasonal penalty on farm goods in winter; a modest bonus for owning
3, 6 or 9+ facilities of one type (3%, 6%, 10%); a 25% penalty for goods a town does not make "high";
production cost close to the market price, so building pays through arbitrage, jobs and reputation.

Sources (all read 2026-10-21):
- https://patrician3.fandom.com/wiki/Businesses and /Businesses:_Raw_Materials and /Businesses:_Finishing
- https://patrician3.fandom.com/wiki/Production_Costs
- https://patrician3.fandom.com/wiki/Trade_Prices
- https://patrician3.fandom.com/wiki/Mediterranean_Towns
- Official manual (Steam CDN), chapter 8 "Trade and Goods Production":
  http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf

## 2. What the game has today (data/world.json, 12 goods, 32 ports)

Producers today: primary (farm, pasture, sawmill, mine, oil mill, vineyard, saltworks, smokehouse as a
free producer), processor (workshop: wool to cloth). Goods and where they are made / needed:

| Good | Base | Made in | Needed in |
|---|---|---|---|
| grain | 22 | valencia, larache, rabat, casablanca, mazagan, oran, mostaganem | 9 ports |
| dried_fish | 20 | 12 Atlantic and Strait ports | valencia, barcelona |
| salt | 40 | 11 ports | 6 ports |
| wool | 60 | bilbao, santander, rabat, casablanca, oran, argel | 7 ports |
| iron | 70 | barcelona, bilbao, santander, sansebastian | 13 ports |
| timber | 25 | bilbao, coruna, vigo, larache | 6 ports |
| cloth | 90 | barcelona, porto | 17 ports |
| olive_oil | 50 | 6 ports | bilbao, vigo |
| wine | 45 | 6 ports | 7 ports |
| silk | 220 | valencia, malaga, almeria, tetuan | sevilla |
| sugar | 110 | lisboa, tanger | barcelona, bilbao, casablanca |
| pepper | 200 | lisboa | barcelona, palma |

Problems the table shows:
1. Only one real chain (wool to cloth). Everything else is "land yields good, nobody needs inputs".
2. dried_fish is made in 12 ports and needed in 2: it is the cheapest, most plentiful good and has no use chain.
3. Silk, pepper and sugar are made almost nowhere and needed almost nowhere: the luxury layer is thin.
4. No metal, ceramic or leather goods, so iron, timber and clay have no downstream use beyond construction.

## 3. Adaptation to the Iberian and Mediterranean coast, 15th-16th c.

| P3 item | Verdict | Reason |
|---|---|---|
| grain, wool, timber, iron (pig iron), wine, salt | keep | present and historical |
| fish + salt, salted fish | keep, as one chain | cod and sardine salting is the real Atlantic trade |
| honey | drop, sugar replaces it | cane sugar from Madeira, Valencia and the Maghreb is the period sweetener |
| beer, hops | drop | wine and oil are the drinks and fats of the Iberian coast |
| hemp, pitch | drop | ships are built from timber, iron and cloth already; two more goods only for ship upkeep is clutter |
| bricks | drop | construction uses timber and iron already |
| meat, leather, cattle, skins, hunting | drop for now | a second output and a hunting chain add complexity; reserve a slot |
| whale oil | drop | Basque whaling is real but a niche; revisit |
| iron goods | keep, call it ironware | Biscay and Catalonia forges; real, high value |
| pottery | keep | Manises, Triana, Talavera: real; cheap timber chain |
| spices | keep as pepper (import only) | a pure trade good, no building |
| olive oil, silk, sugar | keep | Mediterranean core; silk and sugar become short chains in the plan below |
| bread, bakery | drop | grain is the staple already (as in P3); a bread good is a second name for the same need |

## 4. Proposal: 15 goods, 12 production buildings

Cap: **15 goods and 12 production buildings**. A good must be the output of a building or an
import-only luxury, and must be used by a citizen class or as an input. A building must have
an output good in the table below. Anything that fails either test is out.

### 4.1 The 15 goods

Staples (poor and middle): grain, fish (fresh), salted fish (id `dried_fish`, shown as "Salted fish"), salt.
Materials: timber, iron, wool.
Manufactured: cloth, ironware, pottery.
Comforts and luxuries: olive_oil, wine, sugar, silk, pepper.

New against today: fish, ironware, pottery. Renamed: dried_fish shows as "Salted fish" (id kept so saves load).
Dropped from the open patches: bread.

### 4.2 Chains (inputs to output, kind)

| Building | Inputs | Output | Kind | State |
|---|---|---|---|---|
| Farm | none | grain | primary | exists |
| Pasture | none | wool | primary | exists |
| Sawmill | none | timber | primary | exists |
| Mine | none | iron | primary | exists |
| Oil mill | none | olive oil | primary | exists |
| Vineyard | none | wine | primary | exists |
| Saltworks | none | salt | primary | exists |
| Fishery | none | fish | primary | patch (held) |
| Smokehouse, renamed Salting house | fish + salt | salted fish | processor | patch (held) |
| Workshop (weaving) | wool | cloth | processor | exists |
| Ironworks | iron + timber | ironware | processor | new |
| Pottery | timber | pottery | processor | new |

Silk and sugar stay primary goods without a building for now (made by the city, as pepper): they
are luxury trade goods and the cap holds. Adding a plantation or a silk press later needs a
slot freed elsewhere.

### 4.3 Ports (proposed, subject to the sweep)

| Good | Made in | Needed in |
|---|---|---|
| fish | malaga, almeria, alicante, ibiza, tarragona, santander | sevilla, valencia, barcelona |
| salted fish | the 12 current dried_fish ports (smokehouses make it from fish + salt) | valencia, barcelona + sevilla, lisboa |
| ironware | bilbao, barcelona (forges, using local iron) | sevilla, lisboa, valencia, malaga, cadiz, argel |
| pottery | valencia (Manises), sevilla (Triana), porto | lisboa, cadiz, palma, malaga, argel, oran |

Citizen demand (units per 1000 citizens per day): fish poor 0.6, middle 0.3, rich 0.1;
ironware poor 0.1, middle 0.3, rich 0.2; pottery poor 0.1, middle 0.3, rich 0.4.

### 4.4 Reuse, rename, discard

| Item | Action |
|---|---|
| fish + fishery patch | reuse (it is the P3 fishery, minus the salt and hemp inputs) |
| smokehouse processor patch | reuse, rename building to Salting house (ES: Salazón), good to Salted fish |
| bread + bakery patch | discard (no new good: grain is the staple) |
| workshop, farm, pasture, sawmill, mine, oil mill, vineyard, saltworks | keep untouched |
| dock (merged) | keep, not a production building, outside the cap |
| silk, sugar, pepper | keep as trade goods, no buildings |

## 5. Economics: what to measure before any PR

At base prices with the 2% market fee, candidate recipes give:

| Recipe | Input cost | Output value | Margin |
|---|---|---|---|
| weave (existing): 4 wool -> 2 cloth | 245 | 176 | -28% |
| salting: 2 fish + 1 salt -> 3 salted fish | 67 | 59 | -13% |
| ironworks A: 2 iron + 1 timber -> 2 ironware at 110 | 168 | 216 | +28% |
| ironworks B: 1 iron + 1 timber -> 1 ironware at 110 | 97 | 108 | +11% |
| pottery A: 2 timber -> 2 pottery at 40 | 51 | 78 | +54% |
| pottery B: 3 timber -> 3 pottery at 45 | 76 | 132 | +73% |

Base-price margin is not the gate. The existing weave is negative at base prices and still pays
where wool is cheap and cloth dear (the workshop only brews when the live margin holds). The
measured smokehouse (3 outputs) gave +5729/year at level 1 at Almeria despite a -13% base
margin, for the same reason. So the gate is the engine A/B, as for dock, fishery and
smokehouse: 8 seeds, one year, building net per level against its one-off cost, payback in
roughly one to four months at level 1, and no ruinous port.

Sweep to run before each PR, in this order, and what each must show:
1. ironworks: payback 60-150 days at the best port, negative or near zero at saturated ports.
2. pottery: same, plus the timber price effect (it competes with construction for timber).
3. fish + salting as already measured (+5729/y L1 at Almeria; fish served and price at Santander).
4. economy gate, 1-100 years, all PASS and no new WARN, with the new goods in the world.

## 6. Plan of small PRs (each: tests, measured balance, risk label)

1. fish + fishery (already built, patch held) with only the display rename planned below.
2. smokehouse as Salting house (already built, held): rename strings and the doc.
3. ironware good + ironworks: data, recipe, 1 building, 4-6 tests, A/B sweep. Risk medium.
4. pottery good + pottery: same. Risk medium.
5. catalogue guard test: fails if goods exceed 15 or buildings exceed 12, or if a good has no maker or no user. Risk low.
6. optional, later: P3 bonus for owning 3/6/9 facilities of one type; winter penalty on farm goods
   (the engine already has seasons for producers).

## 7. Risks

- world.json churn on the hot i18n lines (main.mjs): keep each PR to two-string deltas and rebase one at a time.
- New goods with no demand pin at the price floor (we saw base 8 fail a year-equilibrium test);
  set bases so the floor holds (fish 13 passed).
- Timber is the shared input of ironworks, pottery and construction: check the sawmill supply
  and the price after the sweep before merging.
- The catalogue cap is a judgement call: 15 goods keeps every good in a chain; P3 itself has 20.
  If a later leg (meat, leather, whale oil) earns its slot, drop one of silk, sugar or pepper first.
