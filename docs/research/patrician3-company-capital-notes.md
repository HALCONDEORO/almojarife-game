# P3 company capital: debt claims are not ownership (clean-room)

Research date: 12 November 2026. Code baseline: main `31786ff412df63bd16b5a1955c007d13db2df14f`.

This is a research option for the credit/finance theme in `docs/BACKLOG.md`, not approval to implement it. No runtime or balance change is proposed for this patch. P3 is the source game throughout; no claim here extends these rules to P4.

## New scope over existing notes

`patrician3-fx-guide-notes.md` already mentions lending spare trading profits. It does not record company-share trading, its multiplayer scope, or the distinction between an investor's exit and a debtor's repayment. Those are this note's focus. Existing references to a prince requesting a loan are not company equity either.

## Evidence and limits

Primary source:

- P3 official PC manual, printed page 34, sections 10.9.3-10.9.6; section 8.5.1 for default and reputation: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf

Public explanatory sources read:

- P3 wiki, Money Lender, sections Grant loan, Granted loans, Buy shares and Sell shares: https://patrician3.fandom.com/wiki/Money_Lender
- GRYOnline, action buildings guide, updated 28 August 2019, moneylender section: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-2/z136dd
- GOG forum, Profit from Usury, February-March 2014: https://www.gog.com/forum/patrician_series/p3profit_from_usury
- Steam P3 discussion, Started a single player game, August 2016: https://steamcommunity.com/app/33570/discussions/0/361798516942789215/
- El Patriciero forum, share-sale discussion, December 2012 and later replies: https://patriciero.mforos.com/260155/10945441-estafando-al-prestamista-republikado/

The manual is evidence of documented features, not proof of exact runtime formulas. The guides may repeat the manual, so agreement is not independent experimental confirmation. Forums are player testimony, not measured rules. No tables, source wording, formulas, screenshots, numerical returns or default probabilities are imported. A binary-internals/modding site appeared in search results and was excluded; it was not opened or used. No utility chart was used.

## 1. An outward loan locks capital until its agreed date

The manual describes requests with an amount, term and proposed interest, followed by acceptance of the chosen terms. Its granted-loans list names the debtor and repayment date. A creditor cannot demand early repayment. Separately, the borrowing side permits partial or full repayment. These are different directions of a loan, not inconsistent UI rules.

The manual also describes default as a choice with a reputation consequence when possessions are seized. GOG players disagree about the safety and profitability of lending, and discuss collecting goods or ships after default. This is a warning against treating lending as a guaranteed savings account, not evidence for a rank-based default formula. The Steam discussion concerns borrowing and maturity, not the return an investor can demand.

**Own-design possibility, not a P3 formula:** if outward loans are added, store a receivable separately from borrowing liabilities. Confirm principal, due date and repayment terms before cash leaves. Do not let a player fund weekly expenses by cancelling a granted loan on demand. The existing borrowing/repayment commands should not be reused in the opposite direction without a separate accounting contract.

## 2. A company stake is a different claim

The manual explicitly describes buying interests in other human-controlled enterprises and selling interests in one's own enterprise or interests already owned. It does not establish purchasing shares in autonomous NPC rivals. The wiki describes participation in another player's profits in multiplayer. That is not direct ownership of a particular ship or workshop, nor a promise to repay principal on a due date.

Single-player needs a qualification: the wiki also describes selling part of one's own company and later buying it back through offers. Its broad claim that shares are useful only in multiplayer is therefore an opinion about usefulness, not proof the single-player share interface does nothing. The Spanish forum reports the same own-company sale/buyback pattern. Neither source establishes a general single-player market for all rival companies.

**Own-design recommendation:** record company equity as a later research branch, not the next finance feature. First define who the investor and issuer are, where purchase cash goes, what earns a distribution, and whether any resale buyer exists. A single-player NPC-company market would be an extension of our own, not a faithfully recovered P3 feature. Do not imply voting rights, takeover rules or a guaranteed exit: these sources do not settle them.

## 3. Valuation is a design risk, not a recipe to copy

The wiki and Spanish forum report opportunities to sell and repurchase one's own shares after the displayed company value changes. The forum attributes a large valuation change to moving cash into an expedition. This is unverified player testimony, not a reproduced bug or an accounting formula we should adopt.

The useful test idea is our own: a transfer between two accounts still owned by the same company must not create profit or erase assets from its chosen equity valuation. Sale proceeds, operating profit, debt proceeds and repayment must remain distinct. A future policy must state whether investors buy newly issued capital or existing owners' stakes; those transactions pay different recipients. No numerical tuning follows from the source examples.

## 4. What main already implements

Checked in source at the baseline above, not inferred from `parity-gap.md` or backlog status labels:

- `src/game/bank.mjs`: `takeLoan`, `repayLoan`, `processLoans`, borrowing room and interest. These are liabilities of the player to the lender. Partial repayment is already allowed from positive cash; the repayment function does not impose the borrowing function's docked-ship requirement.
- `src/game/payrep.mjs` and `foreclosure.mjs`: optional payment-history terms, default recording and local seizure of goods to settle a debt. These do not make the player an investor or grant company shares. A foreclosure result is not a dividend.
- `src/game/botcredit.mjs`: an inactive finance integration seam using the same borrowing primitives for a bot's private accounts. Its presence is not evidence of an NPC equity market or of active rival borrowing in the game loop.
- `src/game/townindustry.mjs`: an establishment's `share` is its fraction of a good's existing city production. `buyEstablishment` transfers a whole establishment into the player's buildings and reduces town production accordingly. It does not buy a financial percentage of a merchant company or distribute company profits.
- `src/game/game.mjs`: `netWorth` counts cash, hold and warehouse goods at base value, less accrued bills, tolls and loans. `houseWorth` adds ship value for tribute. Neither function claims to price all company capital, including buildings; do not silently reuse either as a share quotation.
- Inspection of `src` found no company-stake purchase/sale or dividend command. There is no outward-loan command in the bank module. This is a source inspection of the stated baseline, not a claim about unmerged branches.

## 5. Proposed contracts before any implementation

These are acceptance-test candidates, not completed tests or approved gameplay:

- Separate claims: granting a loan reduces spendable cash and creates a receivable; borrowing raises cash and a liability. Neither operation creates operating profit. Their agreed accounting values must reconcile, including any explicitly chosen valuation discount.
- Loan exit: a creditor's attempt to recall principal before the agreed date fails without mutation; a debtor's permitted partial repayment reduces the correct outstanding claim exactly once.
- Default: forgiveness and seizure are mutually exclusive resolutions of one identified claim. Seizure transfers existing assets or records an explicit settlement source; it must not mint ships or goods as an accidental duplicate reward.
- Company issue versus resale: the named issuer receives a new-capital payment; the selling owner receives a secondary-sale payment. Ownership fractions remain bounded and reconcile to the whole company, with no duplicate distribution after reload.
- Valuation: internal cash/cargo transfers cannot change consolidated ownership value merely by hiding an account. Debt proceeds are not dividend profit. Positive cash alone does not prove distributable earnings.
- Exit risk: a sell request without an eligible counterparty returns an explicit refusal, not free cash. Save/load preserves positions, obligations and settlement IDs; continuing the same date cannot pay the same claim twice.

Open decisions: whether outward lending improves the trading loop; how to represent solvent counterparties and losses; whether equity belongs in a single-player game at all; and how a complete company valuation would relate to the existing rank and tribute metrics. None is resolved by this note.
