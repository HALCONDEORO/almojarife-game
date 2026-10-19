# Idea: automatic trade routes and a port administrator

## What the sources do
- Patrician IV lets you set a list of cities a convoy visits in order; at the last city it returns to the first; a city can appear twice. For each stop you choose what to buy and sell. Source: Patrician IV manual, "Trade routes".
- A "counting house administrator" can be told to buy a good up to a stock level at a maximum price, and to sell a quantity at a minimum price. The manual gives two uses: keep a raw material in stock, and hold goods back when a city's demand is too low. Source: Patrician IV manual, "The Counting House Administrator".
- Players write that automation saves micro-management and recommend setting convoys up correctly the first time; they also say routes need slack, for example bringing more than is needed. Sources: Steam guide "Patrician IV advanced guide" (id 1889979415); Steam discussion "Making the most of Auto-trade" (app 57730).
- Anno 1404 also sets trade routes per ship. Source: Anno 1404 wiki, "Trading routes".

## Our version
- Route: ordered list of ports with, per stop, "buy up to N of good G if price is below P" and "sell all of G if price is above Q". Nothing else.
- Run only when the owner approves step E in `plan-map-cities-ships.md`; a route needs a second ship, so it fits after M2.
- Safety rules: a route never spends below a cash floor the player sets; it stops and reports when a port has no stock or price limits block a stop for 3 visits.

## Why
With 3 ships and 9 ports, doing every trip by hand becomes the tedious part after the first hour. Automation gives the player a reason to think about margins, not clicks.

## Cost and risks
- Medium. Needs a saved route format, tests for stuck routes and a clear message when a limit blocks a stop.
- Risk: a strong automatic route removes the game. The M1b gate "profitable routes fade with use" must hold for a scripted route bot, not only for the greedy one.
- Not approved; first thing to cut from M3.
