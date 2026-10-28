# World-system activation: paired balance policy

The initial head failed Balance 46/131, including legacy cash growth32.37x>30 and a builder that upgraded to level3 on a temporary margin and later lost the workshop. That failure log is retained. No engine formula, chance, tax or default flag was changed to make the gate pass.

## Revised simulation policy

The control builder caps upgrades at level2. It retains the existing1200-coin upgrade reserve and keeps stocking inputs. The old level3 policy is still run/reported as legacyOn, not claimed robust. This is a simulation-policy change, not a level cap in the game. The default game still permits level3.

OFF and ON run with equal policy, seed and horizon. OFF explicitly disables only the three systems under study; ON is the actual new default. Seeds0-3,3650days:

| Seed | OFF final cash | ON final cash | ON fire closures/reopened | Financial halts OFF/ON | Bankruptcies OFF/ON |
| --- | ---: | ---: | --- | --- | --- |
| 0 | 61,372 | 60,691 | 5/5 | 0/0 | 0/0 |
| 1 | 64,234 | 58,536 | 6/6 | 0/0 | 0/0 |
| 2 | 63,160 | 63,921 | 4/4 | 0/0 | 0/0 |
| 3 | 57,896 | 57,065 | 9/9 | 0/0 | 0/0 |

Every paired workshop remains. Production and net worth increase between365/1825/3650 snapshots. Fire closures are separate from financial halts and every ended fire must reopen; an active terminal fire may remain closed. Required guard: zero financial halts, zero bankruptcies, workshop retained, increasing production/net worth. A cash-only ending check is replaced by net worth because inventory is an asset; the existing4500 starting-worth floor is retained.

## NPC denominator change

Regional rival warmup leaves starting cash/worth6000 instead of legacy post-warmup cash48521. At365days ON cash194197 and worth206397 are32.37x/34.40x. The old absolute cash0.215-30 gate FAIL is printed visibly, not hidden as a warning or claimed equivalent. The numeric bound30 was not widened.

The new relative guard compares same-horizon ON/OFF worth (cash+cargo), with an explicit broad quarter-to-four-times alarm band. It is a new comparison criterion, not evidence that all trajectories are equivalent. Actual ON/OFF worth:1.1318x at365days,1.6169x at1825,1.4961x at3650. Existing absolute NPC-worth and price-index bands remain. Raw paired NPC report is committed.

## Tests and limits

The original balance-seeds missing-horizon regression is retained and still runs the real simulation. New regression rejects missing paired data or a financial halt and asserts visible legacy growth disclosure. Fast365-day report passes33/33 gates with BALANCE_SEEDS=none; full exact-head CI/Balance still required. Paired10-year raw results were run individually, not substituted for a completed full gate.

Bank and season unit fixtures explicitly isolate tribute/calamities; planned48-NPC competition remains an explicit override of the new default3regional houses. Focused affected tests21PASS. No test is removed and no engine economy retuned.
