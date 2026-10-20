# Purchasable office proposal, not enabled

Review before implementation. Own gameplay design, not historical monetary figures.

- Home House remains free in recorded starting port, not bought repeatedly. Local management information stays accessible everywhere without purchasing.
- One owned office per non-home port; ship must be docked there. No purchase at sea, in unknown port, after game end or if already owned.
- Proposed construction: 16 timber, 4 iron, 6 cloth at current local marginal buy prices including normal market fee, plus 500 coins for works. This is the existing candidate office recipe, not yet enabled. Not a fixed 500-total purchase.
- Proposed build time: seven game days. No office benefit until completed. No NPC office construction yet.
- Proposed benefit: exact local market intelligence without needing a ship or warehouse there. No extra cargo capacity, remote trade, rank bonus or magic profit.
- Proposed upkeep: 10 coins/week per completed office, ordinary weekly ledger debt/settlement. No build-period upkeep. Both figures need player-cost calibration before activation.
- Persist `offices[city] = { orderedDay, readyDay, completed }`. Old saves default empty. Home stays tied to original profile. No guessed legacy home.
- Quote before action: show every material quantity, local cost, construction cost, total, duration, upkeep and benefit. Requote/revalidate immediately on confirm. Check all preconditions before consuming any stock/cash, add property only on success, never allow duplicate or free orders. No refunds assumed.
- UI: unowned has quote + explicit confirm, construction shows ready day, owned shows upkeep and local prices. Prototype does not mutate any game/save.

Snapshot: default newGame warmup, 33 ports, no player trade. See office-cost-snapshot.json. Prices change during play; not a fixed campaign budget or a claim of balanced economics. A starting 2000 cash cannot afford the Cádiz snapshot total 2217, while background bonuses may change affordability. Total also varies by port. Test 500/2000/5000/10000 budgets, office/hulls and player outcomes before enabling. No real-world money involved.
