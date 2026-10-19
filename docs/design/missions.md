# Campaign: 12 missions (M0, issue #6)

Two acts, six missions each, 10 to 20 minutes per mission. Setup: the player starts with 500 coins and a debt of 1,000 coins (m06 clears it; m02 explains interest in a plain hint). Time is counted in days from the start of each mission. One ladder: standing ranks run Forastero, Mercader, Maestro, Almojarife (the royal customs post is the top rank).

Fail never deletes the save. Fail vocabulary: **retry** (restart the mission, no penalty) or **skip** (move on: all unlocks are still granted, coins and standing rewards are halved). The player picks either after any fail. Characters (invented): Harbour Master, Old Rival, Guild Clerk, Corsair Captain.

## Act 1: La primera nao (tutorial, Alpha)

| # | ID | Goal | Teaches | Reward | Fail rule |
|---|---|---|---|---|---|
| 1 | m01 | Buy 10 salt in Cádiz, sell it in Sevilla for profit | buy and sell | 200 coins | retry or skip |
| 2 | m02 | Earn 300 coins on a two-port route within 30 days | routes, margins | second lane unlocked | retry or skip |
| 3 | m03 | Buy a second ship and run two routes | fleet | ship upgrade unlocked (taught in m05 hint) | retry or skip |
| 4 | m04 | Supply grain to a hungry Valencia before day 40 | demand and events | standing in Valencia | retry or skip |
| 5 | m05 | Build a salt workshop in Cádiz | production | workshop unlock | retry or skip |
| 6 | m06 | Clear the starting debt and join the Guild | standing, finance | Guild rank: Mercader | retry or skip |

## Act 2: El año de la sal (beta)

| # | ID | Goal | Teaches | Reward | Fail rule |
|---|---|---|---|---|---|
| 7 | m07 | Hold a higher margin than the Old Rival on wool in Sevilla for 30 days (margin at least 10 points above his) | competition | market stall | retry or skip |
| 8 | m08 | Keep the Cádiz to Lisboa lane safe through storm season (lose no more than 1 ship; assign an escort ship from your fleet of 3 or more) | risk, escort | convoy unlock | retry or skip |
| 9 | m09 | Feed Barcelona through a bad harvest | supply under shortage | standing in Barcelona | retry or skip |
| 10 | m10 | Open a cloth workshop chain (wool to cloth) | production chains | chain bonus | retry or skip |
| 11 | m11 | Win standing in four ports | politics | port rights | retry or skip |
| 12 | m12 | Deliver a royal order (20 cloth, 20 iron) to Cádiz harbour by day 60, then renew the charter | final test | Rank: Almojarife; free play unlocked | retry or skip |

Act 2 starts with three ships (granted at its start if the player has fewer). Alpha holds Act 1 only; Act 2 ships in the beta (M4).

Side missions (optional, 2 per act) are added at M3 and M4. Texts are keyed `mission.<id>.title`, `.goal`, `.fail` in the locale files (see i18n.md). Numbers are first guesses, tuned in M1b simulation.
