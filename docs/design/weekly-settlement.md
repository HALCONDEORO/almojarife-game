# Weekly settlement, reports and messages

Request (owner, 20/10/2026): running costs of ships should arrive every week, not at once, so prices can be calculated better. Add buttons to see the reports and the messages the game sends. Look at how Patrician does it.

## What Patrician shows (read only, paraphrased, free sources)
- The official manual describes a news menu on the button bar with three groups: official documents (tax statements, fees, charges, court decisions, elections, letters), personal news (business and family), and trade information (special information and offers received). Filters decide how items are kept. Source: Patrician III manual, section 7.5.1, https://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf
- Clicking the gold pile shows statistics on the enterprise (manual, section 7.4).
- NOT found in the manual: the exact rhythm of crew and upkeep payments. Players describe costs as recurring, but this was not verified, so the weekly rhythm here is our own design choice, not a copy.

## Design
- Upkeep accrues each day per ship (same daily rate and profile discount as before) and is paid on every 7th day.
- Settlement always charges the full bill. If cash cannot cover it, cash goes negative (an overdraft). Each settlement charges 2% interest on the deficit, and past a deficit of 3000 the house is bankrupt (game over). Buying and repairs still need positive cash. Old saves with carried debt fold it into cash at the next settlement.
- Net worth subtracts upkeep owed but not yet settled, so waiting for settlement day gives no free money. The goal check (cash >= goal) is unchanged.
- Each settlement writes a report (one line per ship, totals, debt, cash after) and posts an inbox message. Ship arrivals, finished ship orders and resolved events also post messages.
- Two header buttons: Reports (next payment in N days, due now, last 12 weeks) and Messages (unread count, mark one or all as read). Spanish and English.
- Saves: new fields are optional, old saves load and start accruing from day one.

## Devil's advocate
- Weekly payment makes cash look higher than it is. Mitigation: the Reports screen shows "due now", and net worth counts the debt.
- A player can sell and spend right before settlement day. Mitigation: debt carries over, so overspending is paid next week, and net worth already includes it.
- Interest and the bankruptcy limit (added 20/10) answer the free-credit objection. Rates and limit are constants in src/game/ledger.mjs to tune. It come with the credit and reputation feature.
- Crew wages, guns and building upkeep are not in yet. The ledger takes any cost line, so they can be added as new accrual lines.
- The inbox is capped at 60 messages and 52 weekly reports to keep saves small.

## Bank (moneylender)

- Borrow at a port where you have a docked ship, in steps of 100. Total debt is capped at half of net worth (max 5000). Borrowing does not change net worth, so the cap does not grow by borrowing.
- Interest 1% a week, charged in the weekly bill and shown in the report. Cheaper than the 2% overdraft, so asking is better than falling into debt.
- Term 56 days. A message warns 7 days before. At the due date the bank takes the rest from cash, even if cash goes negative (it then follows the overdraft rules, no instant game over).
- Borrowed money does not count toward the win goal.

## Trade profit in the report

- Every purchase adds to an average-cost basis per good. Every sale takes its cost from that basis, so profit = revenue minus average cost of the units sold.
- Selling more than the log knows (old saves, goods taken from a warehouse bought earlier) never invents cost: the extra units count at zero cost.
- At each weekly settlement the report lists profit per good, best first, with a total; the weekly counter then resets. Per-route profit is still open.
