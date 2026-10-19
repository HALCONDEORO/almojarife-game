# Idea: readable stock levels and a per-city reputation

## What the source does
- Patrician IV shows next to each good a stock-level indicator with four states: very expensive and urgently needed, abundant, produced here with large supply, too much on the market. The price changes as you move the quantity slider. Source: Patrician IV manual (Kalypso), "Supply and Demand" and "The Trade Window".
- The same game keeps a reputation per city. Selling goods a city has none of raises it; buying goods the city has none of lowers it; reputation gates privileges such as building. Source: Patrician IV manual, "Reputation".

## Our version
1. Stock-level indicator: a 4-step icon and word per good (scarce, short, normal, plenty) computed from stock against target, shown beside the price. Our prices already follow that ratio, so the indicator is a view over data we have.
2. Quantity preview: while choosing how many to buy, show the average price for that quantity (our market already prices each unit at the stock it leaves).
3. Reputation per port (later): a number that rises when you sell to a port that is short of a good and falls when you buy the last stock of a good the port needs. It unlocks a better price for fees or access to port services. Start with display only, then tie one benefit to it.

## Why
The competition note lists "dry presentation" and unreadable price feedback as weak points of the genre. This is the cheapest fix and it teaches the core rule: buy where plenty, sell where short.

## Cost and risks
- 1 and 2: small (a UI change plus a tested helper). 3: medium; needs balancing, because a reputation that gates too much slows the first ten minutes.
- Risk: indicator thresholds must match what the sim does at the price clamps; test it against the M1b gates (no pinned goods).
- Does not touch the content stance (no trade in people).
