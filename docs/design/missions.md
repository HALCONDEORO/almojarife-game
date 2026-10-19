# Campaign: 12 missions (M0, issue #6)

Two acts, six missions each, 10 to 20 minutes per mission. Fail never deletes the save: a failed mission can be retried or skipped with a lower reward. Characters (invented): Harbour Master, Old Rival, Guild Clerk, Corsair Captain.

## Act 1: La primera nao (tutorial, Alpha)

| # | ID | Goal | Teaches | Reward | Fail rule |
|---|---|---|---|---|---|
| 1 | m01 | Buy 10 salt in Cádiz, sell it in Sevilla for profit | buy and sell | 200 coins | Run out of money: restart mission |
| 2 | m02 | Earn 300 coins on a two-port route within 30 days | routes, margins | second lane unlocked | Time out: retry |
| 3 | m03 | Buy a second ship and run two routes | fleet | ship upgrade | Time out: retry |
| 4 | m04 | Supply grain to a hungry Valencia before day 40 | demand and events | standing in Valencia | Town starves: lower reward, continue |
| 5 | m05 | Build a salt workshop in Cádiz | production | workshop unlock | Not built by day 60: retry |
| 6 | m06 | Clear the starting debt and join the Guild | standing, finance | Guild rank: Mercader | Debt grows past limit: retry |

## Act 2: El año de la sal (beta)

| # | ID | Goal | Teaches | Reward | Fail rule |
|---|---|---|---|---|---|
| 7 | m07 | Beat the Old Rival's price in Sevilla for 30 days | competition | market stall | Lose margin: retry |
| 8 | m08 | Keep the Cádiz to Lisboa lane safe through storm season | risk, escort | convoy unlock | Lose two ships: lower reward |
| 9 | m09 | Feed Barcelona through a bad harvest | supply under shortage | standing in Barcelona | Starvation: lower reward |
| 10 | m10 | Open a cloth workshop chain (wool to cloth) | production chains | chain bonus | Not done by day 90: retry |
| 11 | m11 | Win standing in four ports | politics | port rights | Time out: retry |
| 12 | m12 | Deliver a royal order of goods to the harbour, then renew the charter | final test | Rank: Almojarife; free play unlocked | Missed deadline: retry or continue in free play |

Side missions (optional, 2 per act) are added at M3 and M4. Texts are keyed `mission.<id>.title`, `.goal`, `.fail` in the locale files (see i18n.md). Numbers are first guesses, tuned in M1b simulation.
