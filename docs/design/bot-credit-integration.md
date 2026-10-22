# Bot credit integration (inactive)

`botcredit.mjs` is preparation only. Nothing imports it from the live coordinator.
It does not enable lending or change the NPC benchmark policy.

- Call `prepareBotCredit` BEFORE paying for an explicitly selected investment, with
  its current full cash quote and a nonnegative working-cash reserve. It protects
  accrued bills, rounds the shortfall to the bank's 100-coin step, and uses the real
  player's net worth, rank cap, docked-ship requirement and loan functions.
- Requote and execute construction with the future full bot view. This finance-only
  view must not be passed off as a complete construction/player view. If the plan
  fails or is cancelled, call `repayBotCredit`; do not leave unused borrowed cash.
- After sales, repay surplus while retaining the operating buffer and accrued bills.
  No second loan is allowed by this policy while an earlier one is outstanding.
- Credit is not income. The coordinator must assess expected investment returns and
  repayment within the ordinary 56-day term using the bot's private knowledge.
- Before activation the coordinator must run ordinary daily `processLoans` and weekly
  `settleWeek` on the bot view, including ordinary ship/building accruals and tolls,
  and track bankruptcy/rank under player rules. A loan cannot be enabled in isolation
  without interest, maturity collection, asset seizure and complete private state.
- Keep each house's loans, counter, accrued costs, reports and inbox on that house.
  A fresh view on each clock step recovers those same fields. Never inherit human
  state or reuse the human's accrued bill, rank or collateral.
- Activation is a separate change requiring private botview readiness, a source review
  of every ledger hook, tests and the paired 8-seed/economy gates. A passing gate here
  proves non-regression of an inactive module, not balance of a future lending policy.
