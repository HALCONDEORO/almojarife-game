# Plan: map window, city views, civil and pirate ships (after M2 slice)

Requested by the owner on 19 Oct 2026: a real map window with moving ships, separate windows (market, fleet, port), cities you can enter, and civil and pirate ships on the map. This plan is ideas and mechanics only; nothing is copied from other games (see `content-stance.md`).

## What the genre does (read from manuals and guides, not from screenshots)

Study limit: this is based on text sources (manuals, guides, wiki pages). UI layout and feel were not seen on screen, so the UI choices below are ours and need playtesting.

- Patrician IV has three views: a city view where you click buildings to act, a nautical chart where you send ships between cities, and a sea battle shown as an enlarged piece of the chart. You enter a city by clicking its icon on the chart; right-click sends a convoy there. Source: Patrician IV manual (Kalypso), sections "The City View" and "Nautical chart".
- Patrician IV groups ships into convoys and lets you set automatic trade routes. Guides stress that micro-management costs time, so players set convoys up once. Sources: Patrician IV manual, "Trade routes"; Steam guide "Patrician IV advanced guide".
- Pirates in Patrician IV have hideouts that grow if nobody stops them. A city can keep a patrol convoy that attacks pirates it sees. Sources: Patrician IV manual, introduction and Town Hall section.
- Port Royale 4 uses turn-based naval battles, up to 8 vs 8 ships. Sources: Kalypso Port Royale 4 FAQ; Port Royale 4 manual.
- Anno 1404 uses ships both to carry goods between harbours and to fight, with trade routes set per ship. Source: Anno 1404 wiki, "Ships" and "Trading routes".

## Our design choices and why

1. Ships move on the map in real time between days (animated along the sea lanes). Reason: the chart is where Patrician IV players send ships; our sim already knows each ship's route and days left. Cheap to build.
2. Separate panels, not new screens, at first: Map, Market, Fleet, Port. Reason: three screens are the M2 exit target in `ROADMAP.md`, and the browser has limited space.
3. Entering a city opens a 2D port view with a few clickable places (market hall, shipyard, warehouse later), drawn with flat icons on parchment. Reason: Patrician IV's city view works as "click the building to act"; art stays minimal (decision A in `DECISIONS.md`).
4. Civil ships are the AI traders we already simulate, now drawn on the map. Reason: no new simulation; makes the world look alive and shows the market is shared.
5. Pirates start as simple NPC ships with a hideout port or bay each. Hideouts grow while pirates are not stopped. Reason: the Patrician IV rule gives a clear risk and a clear remedy.
6. Encounters first resolve automatically (odds from cargo value, ship type, escort, and a lane risk number), with three player choices: pay, flee, fight. Tactical battles come later and only if testers want them. Reason: Port Royale 4 and Patrician IV both offer manual battles, but they are a large build; an auto-resolve loop tests the fun cheaply.
7. Convoys and automatic trade routes come after pirates, since escorts only matter once pirates exist.

## Milestones, in build order

| Step | What | Done when |
|---|---|---|
| A | Ships move on the map, civil AI ships drawn, play/pause and speed control | A new player sees 3 AI ships sailing while their own ship moves; tests check positions follow lanes |
| B | Panels: Map, Market, Fleet, Port as separate windows in one page | Player can sail, trade and buy a ship without leaving the page; keyboard reachable |
| C | Port view you can enter | Clicking a city opens its view; market and shipyard actions work from it |
| D | Pirates and encounters (auto-resolve, pay/flee/fight, lane risk, hideouts that grow) | 1,000-year sim shows pirates do not make trade impossible; a test shows risk rises with cargo value |
| E | Convoys and escorts, then automatic trade routes | A scripted player can run a route with an escort; pirate losses drop with escorts |

The owner named city view first, then ships on the map, then pirates. Step A goes first only because it is small and everything else sits on top of it; C follows B.

Each step is its own small PR with tests and an outside review. Dates: none promised. This sits between the M2 slice and M3 in `ROADMAP.md`; scope will be cut before dates move.
