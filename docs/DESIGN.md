# Almojarife - design document (draft 2)

Status: draft for review. Name: Almojarife (final for now, owner decision 19 Oct 2026). Everything here is original. Ideas and genre conventions are used; no data tables, texts, names, art or maps are taken from any other game.

## 0. Name, languages, pronunciation

**Almojarife** (Spanish: al-mo-ja-RI-fe, IPA /al.mo.xaˈɾi.fe/; English players can say "al-mo-ha-REE-fay"). In medieval Castile the almojarife was the royal treasurer and customs officer who collected port and trade duties (RAE dictionary; Spanish Wikipedia). It comes from Arabic (mushrif, "supervisor"). In the game it is the highest standing rank: the merchant who ends up running the harbour's trade and treasury.

Tagline ES: "Del primer barco al tesoro del reino." EN: "From your first cog to the king's treasury."

The game is bilingual Spanish/English. Spanish is the primary language: design text, story and UI are written in Spanish first, English is a full second language. Rules: every visible string has an ID; Spanish text can run 20-30% longer than English so layouts keep room; a small glossary fixes terms (nao, cog, lonja, almojarife); fonts must support Spanish characters and be open licence; the player can switch language at any time.

## 1. Concept

A single-player sea-trading and management game. You start as a small merchant with one cog and a few coins in a harbour town. You buy where goods are cheap, sail, sell where they are dear, build workshops, grow a fleet, win the trust of your city, and end as the head of a trading house that shapes the coast it lives on.

Pillars:
1. **Trade is the game.** Every decision is about margins, risk and time.
2. **Readable economy.** Prices move for reasons the player can see and learn (supply, demand, events, other traders).
3. **Slow growth, big stories.** Short sessions feel good; long campaigns tell a story of one house across decades.
4. **Fair and small first.** A finished small world beats an unfinished big one.

## 2. Setting and story (original)

The world is a loose, historical-feeling trading coast, not tied to exact real events. Years run from a fictional "Year 1" onward and the calendar is our own.

Story frame: the player's house is one of the **Lantern Houses**, trading families who keep the harbour lights in return for the right to trade. An old charter (the **Tide Charter**) lets Lantern Houses sail under the city's protection, but the charter is up for renewal every generation. Rivals, storms, pirates and the city council all push on it.

Campaign arc (acts):
- **Act 1, The Single Cog.** Learn buying, selling, routes. Goal: pay off your starting debt and win a seat in the guild.
- **Act 2, The Season of Salt.** Build workshops, fight a price war, survive a bad year (famine, plague, storm season). Goal: become a Lantern House.
- **Act 3, The Charter.** Politics and convoys against a pirate league. Goal: secure the Tide Charter for your house.
- **Epilogue, sandbox.** Continue as long as you like.

Characters (all invented): the harbour master, an old rival merchant, a guild clerk who keeps the books, a pirate captain who used to be a trader. Each has a few short event chains.

## 3. Core loop

Check market -> load goods -> pick a route -> sail (events) -> sell -> reinvest -> repeat. Around it: workshops that make goods, warehouses, ship upgrades, city standing.

## 4. Mechanics with our own numbers (v0, to be tuned by simulation)

### 4.1 Time
- 1 game day = 1.5 real seconds at normal speed; pause and 3 speeds.
- Season = 90 days, year = 360 days. Winter lanes are slower and riskier.

### 4.2 Goods
Start with 16 goods in 4 groups: **staples** (grain, fish, salt, timber), **craft inputs** (iron, wool, hemp, clay), **crafted** (cloth, tools, beer, rope), **luxury** (furs, amber, wine, spice). Each has base price, bulk (cargo units per item), and perishability.

### 4.3 Market model
- Each city has stock S and target stock T for each good. Price = base x clamp((T / max(S,1))^0.6, 0.4, 2.5).
- Producers add stock each day. Population consumes stock each day. Both rates are set per city.
- Player buying or selling moves stock immediately, so selling a big load crashes the price.
- Prices relax toward target slowly (about 5 percent per day), so arbitrage fades if you spam one route.
- Spread: buy at price x 1.05, sell at price x 0.95 (market fee), so tiny trades never pay.
- AI traders move stock along the lanes, so the world is never static.

### 4.4 Ships
- Cog: 40 cargo, speed 4, crew 12, cost 3,000. Hulk: 80 cargo, speed 3, crew 20. Caravel: 60 cargo, speed 6, crew 16. Numbers are placeholders and will be tuned.
- Wear grows with distance and storms; repair at shipyard. Crew wages are paid daily.

### 4.5 Production
Workshops turn inputs into goods on fixed recipes (our own recipes, for example 2 wool -> 1 cloth). Capacity grows with upgrades. Profit depends on input supply, so production chains need routes.

### 4.6 Standing and politics
- Five ranks of standing in a city, from Forastero (Newcomer) to Almojarife (the top rank). Ranks unlock buildings, ships and council seats. Rank rises with wealth, donations and completed city orders.
- Council votes on taxes, port fees and convoy law. Standing lets you propose and vote.

### 4.7 Risk
- Storms: chance per leg by season and lane. Pirates: chance by lane and cargo value, reduced by armed escorts or convoys. Insurance (from Alpha 2) pays a share of a lost cargo for a daily premium.
- Events: bad harvest, plague, festival demand, blockade. Each changes consumption or lane access for a limited time.

### 4.8 AI traders
Rule-based: each picks the best expected margin among routes in range, with noise and caps. Simple, fast, deterministic with a seed.

### 4.9 Win and lose
Campaign: finish the Act 3 goal. Bankruptcy ends a run. Sandbox: score by net worth and city standing.

## 5. Map size decision

Options:
- **A. Medium (Baltic and North Sea, 20 cities).** Similar scale to classic hanseatic trade games.
- **B. Small (10 cities, current prototype).** Fastest to a polished build.
- **C. World (Europe, Africa, Asia).** The owner's long-term goal.

Criteria: (1) finishing in months, not years; (2) economy needs enough cities and goods to have real arbitrage, about 8 to 12 cities minimum; (3) cost of art, balancing and events per city; (4) testability, all runs must stay fast in a headless simulation.

Decision (proposed): **1.0 ships with B (10 cities, 16 goods, 3 ship types), then A (20 cities) as update 1.1, then regions as free expansions toward C.** Each later region is a data pack plus a few events, so the engine does not change.

## 6. Roadmap

The roadmap lives in `ROADMAP.md` and is the working reference (three audit passes). Summary: engine base 18 Dec 2026, economy prototype 29 Jan 2027, vertical slice 16 Apr 2027, Alpha 31 Aug 2027, public web beta 31 Jan 2028, 1.0 on 30 Apr 2028, with 10 cities. More cities and regions come after 1.0.

## 7. Where it will be playable

1. **Web (browser), free, first.** Static site, runs on any device, no install. Alpha and Beta ship here.
2. **Desktop builds** (Windows, Mac, Linux) as downloads at 1.0.
3. **Steam** only if the owner decides to. It needs a paid developer registration and store review, so nothing is done until the owner says so.

## 8. Tech and process

JavaScript, simulation in plain modules with no engine dependency, rendering in the browser (canvas). Seeded deterministic simulation, headless tests, balance by running thousands of simulated years. All code on GitHub by pull request with review. Open source (MIT code, CC BY 4.0 art and docs).

Roadmap: see `ROADMAP.md` (audited v3.1). Competition study: see `COMPETITION.md`.

## 9. Risks

- Scope creep: mitigated by the phased map plan.
- Economy that is boring or breaks: mitigated by simulation tests and tuning gates.
- Name or trademark clash: no registry clearance (EUIPO, USPTO) could be checked; record it before any public release.
- Art workload: start with a clean, simple map style and icons, upgrade later.

## 10. What a player can do in the first 10 minutes

Buy salt in one city, sell in the next, see the price fall as you sell, buy a second cog, and take an order from the harbour master. That is the whole promise of the game, and the first build must deliver exactly that.
