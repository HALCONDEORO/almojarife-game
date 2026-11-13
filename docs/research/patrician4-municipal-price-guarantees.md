# P4 municipal price guarantees: public budget, market incentive

13 November 2026. Main checked: `480de7e` (through PR889).
Scope: publicly described municipal price guarantees in P4, not a recovered
pricing formula. Documentation only; no implementation or balance approval.

## Finding

A municipal intervention financed by the town treasury is a different contract
from a trader's accepted delivery mission. Current Almojarife already has a town
chest, taxes, stock-sensitive prices and shortage contracts. The gap is not a
missing market or reward system: it is an explicit, bounded public liability
attached to eligible market transactions. The current P3 town-trade and board
notes do not specify this P4 mayoral instrument.

## Sources and confidence

Relevant fetched sections were read on the date above. No executable, extracted
data, utility chart, internal modding source, copied text, asset or numerical
balance table was used. No gameplay experiment was performed.

| Ref | Source | Evidence and limit |
| --- | --- | --- |
| S1 | GRYOnline, Polityka, page updated August 2019: https://www.gry-online.pl/poradniki/patrician-iv/polityka/zfb328 | Independent guide says the mayor can guarantee a good's price in a Hanseatic city and the treasury covers the market/guarantee difference. Does not settle transaction direction or exhaustion. |
| S2 | Heraclitus, Steam guide, City Council Screen: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098 | Player guide describes altered trade prices, a selected delivery quantity and treasury funding. Quantity and both-direction wording are testimony, not an experimentally verified algorithm. |
| S3 | Arqade question: https://gaming.stackexchange.com/questions/118728/how-to-use-price-guarantees-in-patrician-4 | A player asks how to use treasury-funded guarantees. The page has no answer; its proposed accounting is the questioner's understanding, not a solved explanation. |
| S4 | PC Games, Die Haendlerkarriere, September 2010: https://www.pcgames.de/Patrizier-4-Spiel-26808/Tipps/Patrizier-4-Komplettloesung-Tipps-Tricks-Handel-Karriere-Piraten-und-mehr-770936/4/ | Contemporary editorial guide lists issuing commodity guarantees among mayoral powers. No detailed settlement contract. |
| S5 | Sothis Spielwiese, September 2010: https://blog.sothi.de/2010/09/patrizier-4-welcher-rang-was.html | Explicitly derives its privilege list from PC Games. Duplicate lineage, not independent confirmation. |
| S6 | Patrizierforum pre-release political discussion: http://www.patrizierforum.net/index.php?thread%2F3095-thema-6-politische-m%C3%B6glichkeiten-landesf%C3%BCrst%2F= | Opening design outline describes guarantees as a means of attracting traders. Pre-release intent, not proof of shipped settlement behavior; later questions about self-fulfilment are not answers. |
| S7 | Publisher manual, Mayor and Town Hall: https://download.kalypsomedia.com/manuals/p4_manual-en.pdf | Establishes broader mayoral authority. The fetched relevant sections do not explain price guarantees; no detailed rule below is attributed to this manual. |

Coverage is primary documentation and pre-release design context, editorial
guides, and community guide/question. The detailed mechanism is chiefly
secondary-source evidence. Sources are not independent gameplay replications.
No source price, volume, treasury value, rate, text or table is reproduced.

## What the evidence supports

S1 and S4 identify a mayoral commodity-price instrument, distinct from taking
a personal job. S1 explicitly describes a difference financed from public
funds. S2 connects it to a selected amount supplied to the city and says trade
prices change. Together they support the qualitative idea of public spending
to alter supply incentives, not creating goods directly.

Do not infer a universal purchase floor, a consumer price ceiling, free stock,
a fixed bonus paid after a personal mission, or an industrial production grant.
S2's broad wording about buy and sell prices does not settle which side receives
a subsidy, whether fees use the original price, or whether the same trader can
repeatedly buy and resell subsidised stock. The unanswered question in S3 cannot
supply those missing rules.

Unresolved: gross arrivals versus net stock accumulation for quota progress;
local production versus imports; NPC versus player eligibility; amendment and
cancellation; treasury exhaustion or borrowing; interaction with taxes; and what
happens when a batch crosses the final eligible unit. No exact payment formula
is recovered. S6 explains an intended incentive but is not a guarantee that AI
merchants respond in every shipped build. A public offer is not assured delivery.

## Actual source delta and grep audit

On the checked clean main, a real search was run over `src/game`, `src/sim`,
`docs/research` and `docs/design` for guarantee/garant, subsidy/subsid,
subvention/subven, price-floor and price-cap terms. The relevant hits were
existing delivery-contract research and price bounds, not a municipal guarantee
record. The following call sites were then read, rather than treating an empty
keyword result as proof by itself:

| Source | Current behavior and boundary |
| --- | --- |
| `src/game/contracts.mjs` | A trader accepts a shortage job; sales count toward completion; completion pays a fixed bonus and standing on top of ordinary market receipts. It does not debit `hallCaja` for that bonus. This is an existing different design, not a source-parity bug. |
| `src/game/council.mjs` | `hallCaja` tracks the city chest, with tax/upkeep decisions and signed credits. A city balance already exists; a new promise needs a liability/budget contract rather than a second treasury. |
| `src/sim/market.mjs`, `src/sim/trade.mjs` | Prices follow stock and ordinary transactions update stock and cash; sale/preview paths also include the existing wholesale-purse cap when binding. That wholesale account is not `hallCaja`. A supplement needs an explicit settlement layer, not a hidden base-curve mutation or bypass of the purse contract. |
| `src/game/game.mjs` | Hold, warehouse and combined sales have separate entry points, tax credits and contract hooks. A new incentive must cover the intended paths consistently and never pay twice on a combined sale. |
| `src/game/routes.mjs` | Automatic orders plan unit by unit with price limits and a cash brake. Any public intervention must make quoted and executed economics agree without bypassing those constraints. |
| `src/sim/ai.mjs`, `src/sim/npcplan.mjs` | Trader decisions use current trade values. A new headline price alone does not prove bots can find, fund or complete the desired supply response. |

## Own proposal, not a P4 specification

If this instrument is later selected, first model a bounded municipal procurement
incentive in isolation: city, good, eligible direction, remaining eligible quantity,
reserved public budget and an explicit termination policy. Keep ordinary market
exchange and the public supplement distinguishable in previews and ledgers.
Do not change the old personal contracts merely to make their names match P4.

Choose gross delivery versus net-supply accounting deliberately before adding
UI. If gross delivery is chosen, repeated buy-back/resale needs an explicit
anti-cycling policy or a knowingly accepted public cost. Budget availability,
quota and stock movement must settle atomically. Do not fund the policy from
player cash or permit municipal borrowing without a separate design decision.
The same eligibility rule should apply to player and bot trades; autonomous
municipal creation and historical Iberian framing are later scope decisions.

### Acceptance contracts for a possible experiment

- Rejected or unaffordable policies leave stock, cash, quota, treasury and IDs
  unchanged. Cancellation releases only unspent reservations, once.
- Each eligible transaction has a conserved market transfer and a separately
  conserved public payment. A combined hold/store sale has one consistent quota
  allocation, never duplicate subsidy through two hooks.
- Quota exhaustion inside a batch pays only eligible units. Splitting or merging
  the same ordered units has the declared equivalent result, including rounding.
- Cash/price limits, fees and previews match execution. Public support never
  grants free capacity, creates stock or silently finances the buyer's balance.
- Insufficient treasury follows a visible stop/proration/rejection policy chosen
  beforehand, not accidental negative funds or a hidden player debit.
- Repeated resale and automated routes obey the selected anti-cycling rule.
  A policy is not credited as successful merely because its menu was opened.
- Save/load preserves policy identity, quota, spent/reserved funds and completed
  payments. Invalid city/good/budget fields cannot mint money or redirect it.
- Omission preserves existing seeded markets, contracts, routes and taxes.
  Tests distinguish actual supply arrival from a merely advertised incentive.

No implementation, new test run or visual UI accompanies this note. Transaction
semantics, source-version differences and all own tuning remain open.
