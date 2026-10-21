# Production chains: a short, coherent catalogue (study, no code)

Status: study and proposal. Nothing here is implemented. The three open patches (fish + fishery,
smokehouse as processor, bread + bakery) are held until this design confirms or replaces them.

Goal (owner request): fewer, saner goods and buildings, every item in a chain, nothing loose or odd.
Method: read public wikis and the official manual of Patrician III (P3) for the goods, buildings,
inputs and outputs; adapt to the Iberian and Mediterranean coast, 15th-16th century; compare with
what the game has; set a cap (20 goods, 16 production buildings after owner decisions); plan small PRs gated by a measured balance sweep.
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

Owner decisions after the first draft: the catalogue has at least 20 goods like P3; meat (and its
chain) is in; buildings need bricks, timber and tools (iron goods) to be built.

| P3 item | Verdict | Reason |
|---|---|---|
| grain, wool, timber, iron, wine, salt | keep | present and historical |
| fish, beer | keep | fish: daily fresh catch from the fishery; beer: grain processed by the brewery (section 8) |
| meat, leather (cattle farm) | keep | owner request; P3 cattle farm gives meat and leather together |
| bricks, brickworks | keep | owner request; construction sink |
| iron goods | keep, called ironware (the "tools") | forges in Biscay and Barcelona (section 8) |
| pottery | keep | Manises and Triana (section 8) |
| hemp, pitch | keep | ships and rigging need cordage and caulking; P3 uses both |
| spices | keep as spices (id pepper), import only | pure trade good, no building |
| honey, beer, skins, whale oil | drop | wine and sugar replace honey and beer; skins and whale oil are niches |
| sugar, silk | add as luxury trade goods | Mediterranean core, no building (cap) |
| bread, bakery | drop | grain is the staple, as in P3 |

## 4. Proposal: 20 goods, 16 production buildings

Rule: a good must be the output of a production building, or an import-only luxury, and must be
used by a citizen class, a construction recipe or another building's input. A building must have an
output in the table. Anything else is out. Cap: **20 goods and 16 production buildings** (the
dock and the office are not production buildings and sit outside the cap).

### 4.1 The 20 goods

Food: grain, fish, meat, salt, beer (id `beer`, "Beer" / "Cerveza").
Drink and fat: wine, olive_oil.
Materials: timber, iron, wool, hemp, bricks, pitch.
Manufactured: cloth, ironware (the tools), pottery, leather.
Luxuries, no building: silk, sugar, spices (id `pepper`).

New against today (12 goods): fish, meat, leather, hemp, bricks, pitch, ironware, pottery.
Renamed on screen: pepper -> "Spices". The old `dried_fish` id is retired; the save migration (PR 0) fills any missing market rows.

### 4.2 Buildings (16) and their chains

| Building | Inputs | Output | Kind | State |
|---|---|---|---|---|
| Farm | none | grain | primary | exists |
| Pasture | none | wool | primary | exists |
| Sawmill | none | timber | primary | exists |
| Mine | none | iron | primary | exists |
| Oil mill | none | olive oil | primary | exists |
| Vineyard | none | wine | primary | exists |
| Saltworks | none | salt | primary | exists |
| Fishery | none | fish | primary | built, held |
| Hemp field | none | hemp | primary | new |
| Ranch | none | meat + leather (by-product) | primary, two outputs | new, needs a small engine extension |
| Workshop (weaving) | wool | cloth | processor | exists |
| Brewery | grain | beer | processor | PR 2 |
| Ironworks | iron + timber | ironware | processor | built, in the gate |
| Brickworks | timber | bricks | processor | new |
| Pitchworks | timber | pitch | processor | new |
| Pottery | timber | pottery | processor | new |

Ranch note: P3's cattle farm consumes salt and timber and gives meat and leather. We keep the
outputs and drop the inputs so the chain stays simple, and give the by-product to the same building
(PRODUCERS gets an optional `byproducts`). There is no meat salting and no separate tannery: the cap.

### 4.3 Construction costs: bricks, timber and tools

Every building pays timber, bricks and ironware (the tools); ships swap part of cloth and iron for
hemp and pitch. Total cost at base prices stays within +-15% of today so payback does not move.
Quantities scale by level as now. First proposal, confirmed or changed by the sweep:

| Building | Timber | Bricks | Tools (ironware) | Other |
|---|---|---|---|---|
| house | 8 | 6 | 0 | |
| warehouse | 12 | 8 | 1 | |
| workshop | 10 | 8 | 2 | |
| farm, pasture, sawmill | 8 | 2 | 2 | |
| mine | 10 | 4 | 3 | |
| oil mill, vineyard | 10 | 6 | 2 | |
| saltworks, fishery, hemp field | 8 | 2 | 1 | |
| brewery | 8 | 6 | 1 | |
| ironworks | 10 | 8 | 3 | |
| brickworks, pitchworks, pottery | 8 | 4 | 2 | |
| ranch | 10 | 4 | 2 | |
| dock | 10 | 6 | 2 | |
| office | 10 | 8 | 0 | cloth 4 |

Ships: hemp 2-3 and pitch 2-3 replace most of the cloth in barca, cog, caravel and nao; the iron stays.

Local-market sourcing is the risk. Materials come from the port market, and the economy gate already
warns that ports without stock cannot upgrade. With two more materials a small port may not build.
The sweep counts, per building, how many ports can build on day 0 and after a year. If too many
are blocked, the fallback is to let construction also draw from the player's warehouse in that
port (P3 draws raw materials from the trading office): one extra PR, only if the sweep requires it.

### 4.4 Ports, to fix with a source (TBD until cited)

| Good | Made in (proposed) | Needed in (proposed) |
|---|---|---|
| fish | malaga, almeria, alicante, ibiza, tarragona, santander | sevilla, valencia, barcelona |
| ironware | bilbao, barcelona | sevilla, lisboa, valencia, malaga, cadiz, argel |
| pottery | valencia, sevilla | lisboa, cadiz, palma, malaga, argel, oran |
| bricks | about 10 ports with clay: TBD, source needed | every port (construction) |
| meat, leather | TBD, source needed (dehesa and Atlantic pasture) | big ports |
| hemp | TBD, source needed | ports with shipyards |
| pitch | timber ports (bilbao, coruna, vigo, larache) | ports with shipyards |

Fish, ironware and pottery ports have sources in section 8. The rest stay TBD until cited; no
city names are written into data/world.json before then.

### 4.7 Use of every good (the guard test checks this)

Classes are poor / middle / rich citizens (daily demand per 1000, `classes.mjs`). "Input" is a building
recipe, "Build" a construction or ship cost. Values for new goods are first proposals, set by the sweep.

| Good | Made by | Citizens eat or use it | Input of | Build / ships | Unused? |
|---|---|---|---|---|---|
| grain | farm | poor 1.3, middle 1.1, rich 0.7 | brewery | no | no |
| fish | fishery | poor 0.4, middle 0.3, rich 0.2 (new) | none | no | no |
| meat | ranch | poor 0.1, middle 0.3, rich 0.5 (new) | none | no | no |
| salt | saltworks | all classes (0.4/0.4/0.3) | none now | no | no |
| beer | brewery | poor 0.3, middle 0.3, rich 0.1 (new) | none | no | no |
| wine | vineyard | 0.15 / 0.6 / 1.4 | none | no | no |
| olive_oil | oil mill | 0.25 / 0.5 / 0.8 | none | no | no |
| timber | sawmill | 0.2 / 0.3 / 0.3 | forge, brickworks, pitchworks, pottery | every building, ships | no |
| iron | mine | 0.1 / 0.25 / 0.25 | forge | ships | no |
| wool | pasture | 0.2 / 0.4 / 0.3 | workshop | no | no |
| hemp | hemp field | none | none | ships (rigging) | no, via ships |
| bricks | brickworks | none | none | every building | no, via construction |
| pitch | pitchworks | none | none | ships (caulking) | no, via ships |
| cloth | workshop | 0.05 / 0.4 / 0.9 | none | office, ships (less) | no |
| ironware | ironworks | 0.1 / 0.3 / 0.2 | none | most buildings | no |
| pottery | pottery | 0.1 / 0.3 / 0.4 (new) | none | no | no |
| leather | ranch (by-product) | 0.05 / 0.2 / 0.4 (new) | none | no | no |
| silk | none (import) | 0 / 0.1 / 2.5 | none | no | luxury, by rule |
| sugar | none (import) | 0.05 / 0.3 / 1.5 | none | no | luxury, by rule |
| spices | none (import) | 0 / 0.25 / 2.0 | none | no | luxury, by rule |

Result: no good is without a use. Hemp, bricks and pitch have no citizen demand and live only on
construction and ships, so the sweep must show they sell (building and ship orders create the demand).
Weak spots to watch: salt, wine, oil and beer are only consumed by citizens (end of chain), which is
fine, and pottery and leather depend on class demand being enough to pay a building back.

Guard test (PR 9): at most 20 goods and 16 production buildings; every good has a maker or is
listed as a luxury; every good has a user (class demand above zero, a recipe input, a construction or ship cost).

### 4.5 Reuse, rename, discard

| Item | Action |
|---|---|
| fish + fishery patch | reuse (PR 1) |
| smokehouse processor patch | dropped (salted fish removed by the owner); the brewery replaces it in PR 2 |
| bread + bakery patch | discard |
| ironware + ironworks (built, in the gate) | reuse, becomes the tool supply (PR 4) |
| existing buildings | keep; only quotes for new construction and upgrades change |
| dock (merged) | keep, outside the cap |

### 4.6 Saved games

Active buildings and constructions in progress keep what they paid. The change is in the quote for new
construction and upgrades. Any new good needs a market row in every port: old saves did not get one
and the AI traders read every good in every port, so loading would fail. PR 0 fills missing rows
on load (fillMissingMarketRows), with a test that loads a save without the new goods.

## 5. Economics: what to measure before any PR

At base prices with the 2% market fee, candidate recipes give:

| Recipe | Input cost | Output value | Margin |
|---|---|---|---|
| weave (existing): 4 wool -> 2 cloth | 245 | 176 | -28% |
| (salting row removed) | - | - | - |
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
3. fish as already measured (fish served and price at Santander). Beer: measure the brewery net per level against its one-off cost, plus grain use and price effect.
4. economy gate, 1-100 years, all PASS and no new WARN, with the new goods in the world.

## 6. Plan of small PRs (each: tests, 8-seed sweep, 1-100 year gate, 4-point report)

0. Save migration: fill market rows for new goods and ports (low risk, prerequisite).
1. fish + fishery (built).
2. Brewery: beer good and grain -> beer processor (like P3). It builds anywhere, so no port list is needed for making it; only demand is sited.
3. bricks + brickworks.
4. ironware + ironworks (built, in the gate).
5. Construction with timber, bricks and tools (behaviour change, medium-high risk, after 3 and 4).
6. pottery.
7. hemp field + pitchworks + ship recipes with hemp and pitch.
8. ranch with by-product (small engine extension), meat and leather.
9. Catalogue guard test: at most 20 goods and 16 production buildings, each good has a maker or is a
   luxury, each good has a user (class demand, construction or input). Low risk.
10. Optional: bonus for owning 3/6/9 facilities of one type; winter penalty on farm goods.

## 7. Risks

- world.json churn on the hot i18n lines (main.mjs): keep each PR to small string deltas, rebase one at a time.
- New goods with no demand pin at the price floor (base 8 failed a year-equilibrium test, 13 passed).
- Timber is shared by construction, brickworks, pitchworks, pottery and ironworks: the sweep measures the
  timber price after each step.
- Construction sourcing from local markets can block small ports (see 4.3).
- Ship recipe changes (PR 7) move fleet costs; keep within +-15% and re-run the dock and shipyard checks.
- The cap of 20 and 16 is an owner decision (at least 20 like P3); the guard test keeps it from growing.

## 8. Historical basis for the adaptation (public sources, read 2026-10-21)

Each claim below is what the cited source supports; it is a basis for the place names in 4.3, not a claim of exact output.

- Iron, Biscay and Gipuzkoa (bilbao, sansebastian, santander): the Basque Country had abundant
  ore and a medieval iron trade; the Basque iron industry stayed the base of Biscay and Gipuzkoa
  into the early modern period. Sources: https://dialnet.unirioja.es/descarga/articulo/6000340.pdf ;
  http://hdl.handle.net/10810/53006 ; https://revistas.ucm.es/index.php/ELEM/en/article/view/56089
  (Basque iron market, 14th-16th c.).
- Ironware, Barcelona: a smiths' guild (Confraria fabrorum Barchinone) organised the iron-working
  trades of late medieval Barcelona; smiths worked on the cathedral works in the 14th-15th c.; a
  foundryman and cannon maker is documented there at the end of the 15th c. Sources:
  https://raco.cat/index.php/BCNQuadernsHistoria/article/view/339892 ;
  https://raco.cat/index.php/EHDAP/article/view/288164 .
- Pottery, Manises (valencia): the manor of Manises, 7 km from Valencia, was a ceramic centre in the
  late Middle Ages, and the 15th c. shows concentration of the workshops. Sources:
  https://doi.org/10.26882/histagrar.090e03f ; https://revistas.um.es/medievalismo/article/view/210581 ;
  https://manisescityofceramics.es/en/history-of-ceramics/ .
- Pottery, Triana (sevilla): the Triana workshops had their peak between the 15th and 16th c. Source:
  https://doi.org/10.33349/2014.85.3440 ; https://asociacionpisano.es/wp-content/uploads/2020/06/Breve-Historia-de-los-talleres-cer%C3%A1micos-de-Triana-AMF-Junio-2020.pdf .
- Pottery, porto: no source found. Porto is dropped from the pottery list until one is found.
- Beer: brewing in Spain starts around the Habsburg court from 1501-1526 (brewers brought from Mechelen),
  in a country dominated by wine; it grew slowly until the 19th c. Sources: https://hdl.handle.net/2445/50506 ;
  http://raco.cat/index.php/Pedralbes/article/view/306330 ; http://tecmadrid.es/wp-content/uploads/2018/06/La-cerveza-en-Espan%CC%83a-Xavier-Garcia-Barber.pdf ;
  https://www.elindependientedegranada.es/ciudadania/cervecita-alhambra-emperador-1526 ;
  https://cvc.cervantes.es/literatura/espana_flandes/9_stols.htm . The sources place beer at the court (Madrid, Valladolid,
  Granada), none of which is a port on our map, and the map has no Flanders. Santander has a brewery study (19th c., Indies
  market): https://doi.org/10.1344/sn2015.19.15122 . Decision for the data: demand is small and mostly rich/middle class,
  spread over the larger ports, and no city is named as a historical maker. Brewery siting is free. Beer stays a modest good.
- Not sourced: the exact ports that make salt in the game today are the existing data
  (docs and world.json); this study does not change them.

