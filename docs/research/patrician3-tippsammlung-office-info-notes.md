# Patrician III: notes from the full German Tippsammlung 2010 (clean-room), information buildings and the own office, 2.1.2 and 2.2.1

13 November 2026. Main inspected: `ece23cf`. Clean-room research only: ideas in our own words, no copied text, tables or figures, no excluded modding material, no executable inspection. No implementation approved.

Reading scope: 2.1.2 (information buildings) and 2.2.1 (the own office, all seven subsections), printed pages 57-59 of the Tippsammlung (2.1.2 on p. 57 and the top of p. 58; 2.2.1.1 to 2.2.1.4 start on p. 58; 2.2.1.4 continues and 2.2.1.5 to 2.2.1.7 are on p. 59; checked by extracting pages 57-59 of the PDF one by one). The harbour master part of 2.1.2 is deliberately not described here: PR 924 (local anchorage register) covers it. The residential section 2.2.2 starts at the foot of p. 59 and is not read here. All amounts in the source are left out.

Source: http://downloads.patrizierforum.net/tippsammlung/Tippsammlung_2010.pdf. It documents Patrizier II (a community print version). Equivalence with Patrician III is not claimed.

## What the section teaches

1. The competitor's office building tells you who else is established in a town and their rank. The source rates this as minor for single play; in multiplayer it is used to shift surplus between partners.
2. The market hall is the town's information window: stock and buy/sell prices, the town's production, and consumption (weekly demand of citizens and town works). The source calls consumption the most important display, because it tells the player how much to produce; summing production against consumption over all market halls shows whether the player is over- or under-producing. A rule of thumb: keep a stock buffer in the town sized against its consumption, which also gives the price that keeps people content. It also warns that the production figure in the town view is labelled with the wrong time unit (a community-found interface fault, history only).
3. The town monument (town info) shows the mayor, what the town can produce and whether efficiently, and the town's league status. A mayor can turn it into a personal monument that is built after a fixed term in office. Flavour and information, no mechanic.
4. The office is the player's home in each town: build one early everywhere, because permanent access to the town view lets the player react quickly and opens trade and expansion options.
5. The office ledger page hires or fires the office administrator, who makes automatic trade between office and town possible, and summarises company data.
6. Weapons stockpiled in the office are a tip for the military side; a siege-related manipulation of the smith's stock is mentioned (covered by the defence note, not repeated here).
7. Storage: extra space can be rented automatically, but costs creep up if not watched, and the source reports players who run entire games with no extra warehouse. Warehouses lower the storage bill; a guard level should rise once a warehouse exists because a break-in puts the stolen goods on the local market. The source works through when a warehouse beats renting, and the guard wage moves the break-even point. Unused ships parked in harbour are mentioned in the towns3 note and are not repeated.
8. Office trade needs the administrator's settings adjusted at regular intervals. The "personal" page shows standing and the rank you would hold if that town were home, which is the local standing.
9. Moving home is used to speed up a town's defences; build popularity in the new town first and watch the election date. The cost is a share of company value with an upper cap.

## Mapping to Almojarife (verified by reading the cited lines)

- Office: our trading office is a one-time purchase per non-home port and gates construction there (`OFFICE_PRICE`, `src/game/buildings.mjs:160`, purchase at 169-170). Different from the source's "home in every town" in that it is tied to building, not to a permanent town view. I did not check whether an office carries a recurring charge; open question.
- Administrator: our warehouse administrator (`src/game/steward.mjs`, header lines 1-5) runs standing buy and sell orders per good where the player owns a warehouse, with a cash reserve. The source's advice to adjust the administrator's settings at regular intervals has no code analogue; it is player habit.
- Storage: a deposit is capped by free room (`storeGoods`, `src/game/game.mjs:631-636`, capacity `warehouseCap` at line 368 = base plus building bonus). There is no automatic rented overflow here; a deposit above capacity is cut, so the source's "silent cost creep" cannot happen. Whether we want an overflow rental is a design choice, not a gap.
- Guard: our warehouse watch (`src/game/whwatch.mjs`, header and lines 24-26) is a classification shown to the player whose only effect today is spotting fires early; it is not a theft protection and no theft exists (header says so). The source's guard-versus-burglary link therefore has no counterpart.
- Market information: price history is shown in the exchange view (`src/view/lonjaview.mjs`), and a four-step stock indicator (`src/game/stocklevel.mjs:4`, used at `web/main.mjs:818`). A needs and consumption table exists (`src/view/needsview.mjs`) but is shown only in a hidden developer mode (`web/main.mjs:873`). In the views I inspected (the files cited here), no consumption-versus-stock table appears outside the developer mode; I did not audit every view. The source calls this the most useful display; the stock indicator is a player-facing view I found that touches the same question.
- Competitors: I did not find a player-facing list of who else holds an office in a port; not a claim about every file. Open question.
- Moving home: grep over `src/game` for relocat, moveHome, changeHome, homeCity, mudanza and "home port" found no relocation mechanic. Not a claim about the whole repo.

## Proposals (docs only, owner decides)

1. A plain-words consumption versus stock readout in the town view (for example how many days of a good the town can cover at current demand, shown as words, no raw figures), derived from data the market and class model already hold. A small, flag-gated view idea; needs an owner decision on whether players should see it.
2. Decide whether an office should show who else operates in the port; low value in single play, higher with bots as rivals.
3. No change proposed to storage overflow, guards or moving; flag only.

## Open questions

- Whether Patrician III keeps these office and storage mechanics from Patrizier II.
- Whether our office has any recurring charge.
- Whether a relocation feature fits the family, succession and port-defence design; the source ties it to defence speed-up, which is a multiplayer-style tactic.
