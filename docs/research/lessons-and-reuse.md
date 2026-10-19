# Lessons from similar open-source games, and what we may reuse

Rule: MIT or permissive code may be reused with credit in CREDITS.md. GPL, Artistic-with-conditions or unlicensed projects are ideas only, written again from scratch (clean-room). Our code is MIT and our art is CC BY 4.0, so we cannot import copyleft code. Checked 19 Oct 2026 (stars and licences from the GitHub API and the licence files).

Depth of study so far: sea-trader was read at file level (catalog, prices, events, cargo offers, glossary). Endless Sky: the mission data format page was read. The other projects: licence and purpose verified, internals not yet read (listed as open work).

## 1. sea-trader (MIT, TypeScript, active) https://github.com/zyishai/sea-trader
A Taipan remake with a clean game core. Reuse allowed with credit; we mainly take ideas.
What it does well, and what we do with it:
1. **Price trends.** Every port and good has a trend (direction, strength, duration in updates, reliability). Prices move on a fixed "price update" cadence instead of purely each day. Our plan: add trends on top of supply and demand so players can learn "this wine is rising for about three updates".
2. **Seasons.** Four seasons shift prices and event chances. Our plan: seasonal factors per good (grain after harvest, wool after shearing), plus winter effects.
3. **Events as data.** Random events at sea are templates that return a list of "outcomes" (change cash, damage, lose cargo, delay, reputation). Pirate encounters offer fight, flee or bribe, each with a formula. Our plan: an `events/` data folder and one resolver, so the community can add events without code.
4. **Cargo offers and the captain's choice.** Offers that may not fit the hold trigger a choice. Maybe later for the tavern broker.
5. **Seeded random numbers behind one small interface** (chance, pick, int) so every outcome is testable. We already have `src/sim/rng.mjs`; extend it the same way for events.
6. **Domain glossary file** (`CONTEXT.md`) with preferred words and "avoid" words, plus short architecture decision records in `docs/adr/`. Our plan: add a glossary (Spanish and English terms side by side) to keep names consistent in code, UI and docs.
7. **Project hygiene**: CI, changesets for release notes, pre-commit checks. We have CI; changelog automation is optional.
Not taken: single ship, turn-based CLI, Far East setting.

## 2. Endless Sky (GPL-3.0, C++, active) https://github.com/endless-sky/endless-sky
Ideas only.
- Content is plain-text data files, not code. Missions are small declarative blocks: name, description, source and destination filters, conditions, payment, and "on accept / on complete" actions. Most content is made by contributors editing data.
- Our plan: describe missions, events, goods, ports and ranks in JSON with a documented schema and a validator script run in CI. A contributor adds a mission by adding one file. This is the base for the "add a good / port / mission" guides in the community plan.
- Conditions are named values the game tracks (flags and counters); missions read and write them. Our plan: a small "conditions" store in the save so campaign missions can chain.

## 3. OpenTTD (GPL v2, C++, very active) https://github.com/OpenTTD/OpenTTD
Ideas only. Open work: read its public wiki on cargo payment and town growth.
- From its public description: an economy tycoon with AI opponents, a script interface for custom AIs and game scripts, and a large volunteer community. Lesson to check: keep economy rules and AI behind a clear interface so rivals can be tuned or replaced; run a long simulation as a balance test (we already have a 1000-year simulation tool).

## 4. Simutrans (Artistic licence, C++, active) https://github.com/simutrans/simutrans
Ideas only (licence has conditions we have not reviewed). Open work.
- Content ships as separate "paksets" (add-on packs). Lesson to check: a clean split between engine and content pack makes community art and data packs possible. Our plan: keep `data/` and `assets/` loadable as a pack from the start.

## 5. Widelands (GPL-2.0) and Freeciv (GPL-2.0)
Ideas only. Open work.
- Widelands: production chains and workers, supply and demand logistics. Useful when we build production buildings and offices.
- Freeciv: rulesets as data files and several AI skill levels. Useful for our AI difficulty levels.

## 6. Small Hanse-era and Patrician-like projects
Emeraude/Patrician (no licence, abandoned 2018), ragnarlodbrok1992/002-patrician-like (no licence), agentquackyt/Hanse2.0 (no licence), cookierob/hanse-nova (no licence). No licence means no reuse, not even one line. We looked at the descriptions only.

## Concrete improvements queued (each a small PR, in order)
1. Price trends and seasons on the market (tests first). 2. Events as data with outcomes, plus pirate encounter choice (fight, flee, bribe) on voyages. 3. JSON schema and validator for goods, ports, events and missions, wired into CI. 4. Glossary and ADR folder. 5. Mission and conditions store for the campaign shell. 6. AI difficulty levels.

## Open work
Read the OpenTTD wiki (cargo payment, town growth, AI interface), Simutrans pakset docs and licence terms, Widelands economy notes, Freeciv rulesets. Record each source here when read.
