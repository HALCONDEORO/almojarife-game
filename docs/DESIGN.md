# Almojarife - design document (draft 2)

> Historical planning document. Port/goods counts and implementation status below describe earlier scope, not the current build. See [CURRENT-STATE.md](CURRENT-STATE.md) for the current checkpoint and [RELEASE.md](RELEASE.md) for the proposed early pre-release. Existing milestone dates have not been silently changed.

Status: draft for review. Name: Almojarife (final for now, owner decision 19 Oct 2026). Everything here is original. Ideas and genre conventions are used; no data tables, texts, names, art or maps are taken from any other game.

## 0. Name, languages, pronunciation

**Almojarife** (Spanish: al-mo-ja-RI-fe, IPA /al.mo.xaˈɾi.fe/; English players can say "al-mo-ha-REE-fay"). In medieval Castile the almojarife was the royal treasurer and customs officer who collected port and trade duties (RAE dictionary; Spanish Wikipedia). It comes from Arabic (mushrif, "supervisor"). In the game it is the highest standing rank: the merchant who ends up running the harbour's trade and treasury.

Tagline ES: "Del primer barco al tesoro del reino." EN: "From your first cog to the king's treasury."

The game is bilingual Spanish/English. Spanish is the primary language: design text, story and UI are written in Spanish first, English is a full second language. Rules: every visible string has an ID; Spanish text can run 20-30% longer than English so layouts keep room; a small glossary fixes terms (nao, carraca, carabela, lonja, almojarife); fonts must support Spanish characters and be open licence; the player can switch language at any time.

## 1. Concept

A single-player sea-trading and management game. You start as a small merchant with one cog and a few coins in a harbour town. You buy where goods are cheap, sail, sell where they are dear, build workshops, grow a fleet, win the trust of your city, and end as the head of a trading house that shapes the coast it lives on.

Pillars:
1. **Trade is the game.** Every decision is about margins, risk and time.
2. **Readable economy.** Prices move for reasons the player can see and learn (supply, demand, events, other traders).
3. **Slow growth, big stories.** Short sessions feel good; long campaigns tell a story of one house across decades.
4. **Fair and small first.** A finished small world beats an unfinished big one.

## 2. Setting and story (original)

**Where:** Spain and its surroundings in the late Middle Ages: the Crown of Castile and the Crown of Aragon, the Iberian Atlantic, the Canary Islands, nearby North Africa and the western Mediterranean (Marseille, Genoa). Dates and events are historically flavoured but our own; the calendar is "Year 1" onward.

**Story frame:** the player's house starts in a harbour town. Kings farm out the right to collect port duties (the *almojarifazgo*), and the one who holds it is the **almojarife**, treasurer of the trade. Our **Carta de Almojarifazgo** is a royal charter that gives one house the customs of a coast for a term. It comes up for renewal; rivals, storms, pirates and the Crown's needs all push on it.

**Acts:**
- **Acto 1, La primera nao.** Learn buy, sell, route. Goal: clear the starting debt, join the town's merchant guild.
- **Acto 2, El año de la sal.** Workshops, a price war with an old rival, a bad year (hunger, storm season). Goal: win standing in several ports. (Plague is not in 1.0; the bad year is hunger and a storm season.)
- **Acto 3, La Carta** (update 1.1, not in 1.0). Politics, convoys, a pirate league. Goal: hold the Carta.
- **Epilogue, sandbox.** Continue freely.

**Characters (invented):** the harbour master, an old rival merchant, a guild clerk who keeps the books, a corsair captain who used to be a trader.

**1.0 map (9 ports):** Cádiz, Sevilla, Lisboa, Valencia, Barcelona, Palma, Bilbao, Tánger, Cartagena. Málaga, Marseille, Canary Islands, Genoa and Orán are the first expansion candidates. Coastlines from Natural Earth; cities, lanes and numbers are ours.

## 3. Core loop

Check market -> load goods -> pick a route -> sail (events) -> sell -> reinvest -> repeat. Around it: workshops that make goods, warehouses, ship upgrades, city standing.

## 3b. Game modes: free play and campaign with missions

Studied (public pages, 19 Oct 2026): Port Royale 4 has a free game mode plus four campaigns, lets the player play with or without tasks, and lets the player continue endlessly after finishing (Kalypso FAQ). Anno 1800's campaign is built as chapters of story missions with extra voluntary quests and rewards. Patrician IV's campaign works as a tutorial through set tasks with short example videos. High Seas, High Profits leans on hundreds of procedural events instead of a long campaign. What we take (ideas only, our own words): both modes, an optional-goals switch, endless play after the story, tasks that teach, and event variety.

**Free play (sandbox).** Pick a starting port, difficulty and seed. No story. Optional "tasks" toggle gives small goals (reach a net worth, serve a town) and can be turned off. Endless.

**Campaign.** Two acts, 12 missions in total (6 per act), each 10 to 20 minutes, chained by the four characters. Mission types: deliver a cargo, reach a profit, supply a hungry town, build a workshop, keep a lane safe, win standing in a port. Each mission has a clear goal, a reward (money, a ship, a building unlock or standing) and a fail rule that never deletes the save. Optional side missions per act. After the last mission the player continues in free play with the save.

**Tutorial.** The first three missions of Act 1 are the tutorial: each introduces one idea (buy and sell, route, second ship), with plain hints in Spanish and English that can be skipped.

**Progression.** Standing ranks (Forastero to Almojarife) unlock ships, buildings and port rights. Missions grant extra unlocks but the player can also earn them in free play.

**Scope by milestone.** Slice (M2): mission 1 and the hint system. Alpha (M3): free play complete for the 9 ports, tutorial and all of Act 1 (6 missions), ES complete. Beta (M4): Act 2 (6 missions) and side missions, saves carried into free play. 1.0 (M5): polish, balance, proofreading.

## 4. Mechanics with our own numbers (v0, to be tuned by simulation)

### 4.1 Time
- 1 game day = 1.5 real seconds at normal speed; pause and 3 speeds.
- Season = 90 days, year = 360 days. Winter lanes are slower and riskier.

### 4.2 Goods
Start with 12 goods in 4 groups: **staples** (grain, dried fish, salt), **craft inputs** (wool, iron, timber), **crafted** (cloth, olive oil, wine), **luxury** (silk, sugar, pepper). Each has base price, bulk (cargo units per item), and perishability.

### 4.3 Market model
- Each city has stock S and target stock T for each good. Price = base x clamp((T / max(S,1))^0.6, 0.4, 3.0).
- Producers add stock each day. Population consumes stock each day. Both rates are set per city.
- Player buying or selling moves stock immediately, so selling a big load crashes the price.
- Prices relax toward target slowly (about 5 percent per day), so arbitrage fades if you spam one route.
- Spread: buy at price x 1.05, sell at price x 0.95 (market fee), so tiny trades never pay.
- AI traders move stock along the lanes, so the world is never static.

### 4.4 Ships
- Nao (small merchant ship): 40 cargo, speed 4, crew 12, cost 3,000. Carraca (large, slow): 80 cargo, speed 3, crew 20. Carabela (fast): 60 cargo, speed 6, crew 16. Numbers are placeholders and will be tuned.
- Wear grows with distance and storms; repair at shipyard. Crew wages are paid daily.

### 4.5 Production
Workshops turn inputs into goods on fixed recipes (our own recipes, for example 2 wool -> 1 cloth). Capacity grows with upgrades. Profit depends on input supply, so production chains need routes.

### 4.6 Standing and politics
- Five ranks of standing in a city, from Forastero (Newcomer) to Almojarife (the top rank). Ranks unlock buildings, ships and council seats. Rank rises with wealth, donations and completed city orders.
- Council votes on taxes, port fees and convoy law. Standing lets you propose and vote.

### 4.7 Risk
- Storms: chance per leg by season and lane. Pirates: chance by lane and cargo value, reduced by armed escorts or convoys. Insurance is not in 1.0 (post-1.0 update).
- Events: bad harvest, festival demand (plague and blockade come after 1.0). Each changes consumption or lane access for a limited time.

### 4.8 AI traders
Rule-based: each picks the best expected margin among routes in range, with noise and caps. Simple, fast, deterministic with a seed.

### 4.9 Win and lose
Campaign (1.0): finish the Act 2 goal; Act 3 arrives in 1.1. Bankruptcy ends a run. Sandbox: score by net worth and city standing.

## 5. Map size decision

Options:
- **A. Medium (Iberia plus western Mediterranean and Atlantic, 20 cities).**
- **B. Small (8 ports around Spain).** Fastest to a polished build; it is where the name and first audience are.
- **C. Wider world (rest of the Mediterranean, Atlantic, Africa, Asia).** Long-term goal.

Criteria: (1) finishing in months, not years; (2) economy needs enough cities and goods to have real arbitrage, about 8 to 12 cities minimum; (3) cost of art, balancing and events per city; (4) testability, all runs must stay fast in a headless simulation.

Decision (proposed): **1.0 ships with B (8 ports around Spain, 12 goods, 3 ship types), then A (20 cities) and Act 3 as update 1.1, then regions as free expansions toward C.** Each later region is a data pack plus a few events, so the engine does not change.

## 6. Roadmap

The roadmap lives in `ROADMAP.md` (v5.3). Official plan (Option 2, owner decision 19 Oct 2026): engine base 15 Jan 2027, economy prototype 12 Feb, vertical slice 9 Apr, Alpha 14 Jul 2027, public web beta 30 Nov 2027, 1.0 on 28 Feb 2028; 8 ports, 12 goods, 2 acts, web only. Everything else comes after 1.0.

## 7. Where it will be playable

1. **Web (desktop browser), free, first.** Static site, no install. Desktop only: Windows, Mac and Linux browsers with keyboard and mouse; phones and tablets are out of scope. Alpha and Beta ship here.
2. **Desktop builds** (Windows, Linux) after 1.0. 1.0 is web only.
3. **Steam** only if the owner decides to. It needs a paid developer registration and store review, so nothing is done until the owner says so.

## 8. Tech and process

JavaScript, simulation in plain modules with no engine dependency, rendering in the browser (canvas). Seeded deterministic simulation, headless tests, balance by running thousands of simulated years. All code on GitHub by pull request with review. Open source (MIT code, CC BY 4.0 art and docs).

Roadmap: see `ROADMAP.md` (v5.3). Competition study: see `COMPETITION.md`.

## 9. Risks

- Scope creep: mitigated by the phased map plan.
- Review: PR review is the owner reviewing work made with AI help (self-review); outside testers and external reviewers are the independent check.
- Economy that is boring or breaks: mitigated by simulation tests and tuning gates.
- Name or trademark clash: no registry clearance (EUIPO, USPTO) could be checked; record it before any public release.
- Art workload: start with a clean, simple map style and icons, upgrade later.

## 10. What a player can do in the first 10 minutes

Buy salt in one city, sell in the next, see the price fall as you sell, buy a second cog, and take an order from the harbour master. That is the whole promise of the game, and the first build must deliver exactly that.
