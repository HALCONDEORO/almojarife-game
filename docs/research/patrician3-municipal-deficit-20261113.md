# P3 municipal deficit: service loss and recovery are not private bankruptcy

Research date: 13 November 2026. Almojarife main inspected: `7989210`.
Clean-room documentation only. No spending power, tax, guard or economy change
approved. No competitor amounts, formulas, quotes, slogans or assets adopted.

## Narrow finding and coverage already present

P3's manual describes a municipal cash shortage as a failure of public service:
new defenses cannot be built, unpaid guards gradually leave, and the mayor must
restore public funds. It contrasts a private contribution with a council-approved
extra levy. These are not the same recovery action or the merchant's bankruptcy.

Existing politics/rank-perk notes already record treasury access, transfers,
elections and council privileges. The town-siege note covers municipal funding
and losses to attackers. This note does not claim those subjects are missing.
Its focus is the shortage-to-service-loss-to-recovery sequence and its relation
to our already implemented maintenance suspension.

Real searches of `docs/research`, `docs/design`, `src` and `test` used treasury,
coffers, deficit, insolvency, unpaid/quit guards, caja, impago, and maintenance.
Pending PRs 930-934 were read, including the feast note; they cover news,
ownership focus, weapon losses, a pirate opening and feasts/marriage. None adds
this comparison. Existing wall/works tests are positive implementation evidence,
not grounds to call municipal distress an unbuilt feature.

## Sources read and limits

| Ref | Public source | What it supports |
| --- | --- | --- |
| S1 | P3 manual, Town Coffers, printed pages 46-47: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Primary PDF pages read separately. Public income/expense categories and period comparison; deficit stops new defenses, unpaid guards leave progressively; private contribution or attempted extra levy restores the funds, with private contribution received more favorably. Council approval of the levy appears on p46. No desertion rate, exact trigger boundary or reputation formula established. |
| S2 | GRYOnline, Burmistrz, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/burmistrz/zf36f0 | Published guide repeats the treasury categories, unpaid-guard consequence and recovery choices in the same sequence as the manual. Close documentary overlap, not an independent play test. Its phrasing refers to an empty treasury, so it does not independently settle negative versus insufficient-positive balance. |
| S3 | P3 wiki, Reputation: https://patrician3.fandom.com/wiki/Reputation | Community summary lists treasury contributions as reputation-positive and withdrawals as negative for a mayor. Does not establish recovery timing or exact effects. |
| S4 | P3 wiki, Ranks, Lord Mayor: https://patrician3.fandom.com/wiki/Ranks | Community account similarly links contributions and withdrawals with reputation. Same wiki as S3, not independent verification; its persistence claim is not adopted as a universal rule. |
| S5 | P3 wiki, Create new town: https://patrician3.fandom.com/wiki/Create_new_town | Community account says a settlement's guards cost upkeep and may need private contributions beyond the local tax base. Founder privileges are a special scope, not proof that an ordinary mayor can bypass the council. Its ratios and amounts are not adopted. |
| S6 | P3 wiki, Town Guards: https://patrician3.fandom.com/wiki/Town_Guards | Context for guards as actual trained units, distinct from abstract wall effectiveness. Does not independently explain the unpaid departure process. No training figures or proposed unit mix adopted. |

Six documents, but not six independent experiments: four share a community wiki
and the editorial guide closely follows the manual. Primary documentation carries
the core deficit claim. No competitor game was run; no proprietary or excluded
source is used. The pages do not establish when a restored treasury automatically
recovers departed personnel or whether another recruitment order is needed.

## Service capacity versus physical disappearance

The manual's consequence is progressive loss of personnel, not immediate deletion
of the walls. The restored balance and restored military capacity therefore need
not be the same event. Whether departed guards return or must be trained anew
remains unresolved. No recovery delay or headcount formula can be inferred. [S1]

The manual documents separate public and private purses and explicitly treats a
personal contribution as one recovery choice. An extra levy requires a motion
and approval; it is not a direct player cash transfer. Its warning about taking
public funds concerns civic needs and taxpayer sentiment, not a grant to treat
the town treasury as the player's default emergency account. [S1-S2]

## Actual current-main comparison

| Inspected code | Behavior already implemented | Difference or limit |
| --- | --- | --- |
| `src/game/council.mjs`, `cajaOf`, `creditCaja`, `councilDay` | Separate per-city public balances; daily net municipal income/upkeep; periodic tax response to low/high reserves. Signed balances are representable. | Low reserves already have a fiscal response. This is autonomous council tax adjustment, not a mayor's extra levy or donation command. |
| `src/game/walls.mjs`, `startWalls`, `accrueWalls` | New works check affordability. Existing active walls remain but their benefit is suspended when the chest cannot cover upkeep; restoration requires a recovery reserve. | This is already a service-loss/recovery cycle, triggered by affordability, not only a negative balance. No individual guard desertion is performed by this function. |
| `src/game/works.mjs`, `worksDay`, `keepWork` | Standing civic levels can lose effects when upkeep is unaffordable; construction can pause; recovery has a reserve check. | Retains buildings/progress rather than destroying them. This should not be described as missing public-service insolvency. |
| `src/game/council.mjs`, `creditCaja`; `test/council-public-funds-contract.test.mjs` | A credit/debit changes the specified public ledger, not private cash or another city. Tests preserve signed public balances through save/load. | Calling the low-level credit helper alone would mint a supposed donation or erase a supposed withdrawal's private leg. It is not a two-purse transfer command. |
| `src/game/game.mjs`, trade wrappers; `tolls.mjs`, `justice.mjs`, `almoneda.mjs`, `townindustry.mjs` | Duties, tolls, fines and supported municipal asset-sale proceeds can feed the public chest through existing channels. | Private payments already reach the chest for defined reasons. They are not a discretionary donation, and an asset sale is not an extra tax. |
| `src/view/townhallview.mjs`, `hallView` | Displays the current chest, tax steps and next meeting with the civic names and context. | The inspected projection does not supply the manual's categorized current/prior monthly treasury statement. This is not absence of a treasury display. |

Actual function bodies outrank header claims. No garrison size is decremented in
the inspected council/wall/works maintenance paths; this is a scoped finding, not
a claim that the whole game has no guards or security spending. Warehouse guards
and other expenses belong to different systems.

## Own-design questions, not implementation instructions

- Is the existing reversible suspension the intended abstraction, rather than
  introducing permanent personnel loss? The source is not a reason to replace it.
- If a private contribution is ever chosen, who is allowed to make it, and does
  it have any civic recognition? Validate debit and credit together, with refusal
  leaving both purses unchanged. Never make public deficits an automatic private
  charge or expose unrestricted withdrawal through a ledger helper.
- Would a public treasury statement help explain why an effect lapsed and what
  reserve restores it? Keep current balance, historical flows and committed costs
  distinct, without inventing future guaranteed income.
- Any new path must preserve city separation, signed-balance save behavior,
  exactly-once settlement and existing no-private-charge maintenance rules.

## Verification

Author baseline: `node --test test/council.test.mjs
test/council-public-funds-contract.test.mjs test/walls.test.mjs
test/works.test.mjs`: 61 passed, none failed. These cover current accounting,
maintenance suspension/recovery and related work behavior; not P3, new donation
commands, guard desertion or a new fiscal policy. No runtime or test file changed,
no UI/visual result claimed and no implementation approval inferred.
