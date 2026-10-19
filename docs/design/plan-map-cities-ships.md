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

## Where this sits in the roadmap

ROADMAP.md is the approved plan. M2 (vertical slice) needs "3 screens in a locked style" and harbour orders; M3 (alpha) already lists "storms and pirates". So:

- Steps A, B and C are prototype work toward M2. B and C deliver the three M2 screens: Map, Market and Port. Fleet is a panel inside Map. They do not add scope to M2.
- Steps D and E are M3 scope (pirates are already in the M3 exit criteria). Convoys and automatic trade routes (E) are not in any approved exit criteria; they stay an idea until the owner moves them into M3 or after 1.0, and they are the first thing cut.
- Dates are unchanged. A prototype step that is not finished does not block its milestone.

## Milestones, in build order

| Step | Roadmap | What | Done when |
|---|---|---|---|
| A | toward M2 | Ships move on the map; civil AI ships drawn; play/pause and speed control. Voyages today store only destination and days left, so each voyage gets its route (path of waypoints) and distance travelled when it starts, saved with the game. Animation is only a view: it reads sim state each frame and the sim advances only on the daily tick, so speed never desyncs market, AI or ships | Positions follow lanes; a save made at sea loads with the ship at the same point; sim output is identical at speed 1 and speed 8 (test) |
| B | toward M2 | Panels: Map, Market, Port, with Fleet inside Map, as separate windows in one page | Player can sail, trade and buy a ship without leaving the page; keyboard reachable |
| C | toward M2 | Port view you can enter | Clicking a city opens its view; market and shipyard actions work from it |
| D | M3 | Pirates and encounters, playable and balanced without escorts | See below |
| E | idea, not approved | Convoys and escorts, then automatic trade routes | Only if the owner adds it to a milestone |

## Step D without escorts

- Before escorts exist, pirates are stopped three ways: the player fights an encounter (odds from ship type and cargo), a port can pay for a patrol that removes pirates near it each season, and a hideout that is left alone grows slowly while one that is hit shrinks. Escorts (E) would add a fourth way later and must not be needed to balance D.
- Encounter odds use cargo value, ship type, lane risk and a per-ship armed flag. The player can pay, flee or fight; the choice is part of the test.
- AI traders get the same encounters, resolved automatically by the same odds, with one rule: an AI trader that loses its ship or cargo is replaced the next season by a new trader with starting cash, so the AI never ends in bankruptcy or stops trading. The loss is not reimbursed from nothing: the replaced trader's cash is removed from the economy.
- Validation keeps the M1b gates on top of any pirate test: no good pinned at a price clamp more than 30% of days (per good and per city/good, 0, 6 and 12 traders, unrounded ratio), profitable routes that fade with use, and the 1,000-year run in CI under 5 minutes. Pirates must pass these gates with pirates on, and a pirates-off run is the baseline. "Trade is still possible" alone is not a pass.
