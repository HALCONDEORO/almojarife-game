# Era, goods and ports (M0, issue #5)

Status: draft for owner approval. Sources marked "to confirm" must be checked before the data is frozen at M1b.

## Era

Late 15th century, roughly 1480 to 1500 in flavour. Why: the Crown of Castile and the Crown of Aragon are joined by marriage, the Atlantic routes to the Canary Islands and Lisbon are active, Seville and Cádiz handle growing trade, and the western Mediterranean is still busy. The game calendar is our own ("Year 1" onward), so no real event is required. Dates in text are avoided; names of real rulers are not used.

## Ports (1.0, 8)

| Port | Role in play | Main outputs (game) | Main demand (game) |
|---|---|---|---|
| Cádiz | Atlantic gate, starting port | salt, dried fish | wool, cloth |
| Sevilla | Large river port, rich market | olive oil, wine | iron, timber, silk, pepper |
| Lisboa | Atlantic hub | sugar, dried fish | grain, iron |
| Valencia | Mediterranean granary | grain, silk | timber, wool, dried fish |
| Barcelona | Craft and cloth city | cloth, iron | grain, salt, pepper, dried fish, sugar |
| Palma | Island stopover | salt, olive oil | grain, cloth |
| Bilbao | Northern iron and wool port | iron, wool, timber | wine, olive oil, sugar |
| Tánger | Gateway to North Africa | salt, sugar, pepper | cloth, iron |

These are game values (ours, to be tuned by simulation). They follow general trade patterns and do not copy any other game's tables. Historical flavour is approximate (for example Tánger's outputs and sugar origins) and is to confirm before M1b; the game does not claim exact history. Sources to confirm: Spanish and Portuguese maritime history surveys, public encyclopedia pages per port.

## Goods (12, 4 groups)

- Staples: grain, dried fish, salt
- Craft inputs: wool, iron, timber
- Crafted: cloth, olive oil, wine
- Luxury: silk, sugar, pepper

Cut rule: if retuning fails at M1b, cut to 8 goods. The 8-good set is grain, dried fish, salt, wool, iron, cloth, wine, sugar (drop timber, olive oil, silk, pepper). Every port must keep at least one output and one demand, and every kept good at least one producer and one consumer, in the cut set; the table is re-mapped then and the change is recorded in the changelog.

## Content stance link

Tánger and any Atlantic trade follow the stance in `docs/design/content-stance.md` (issue #10). The game does not trade in people.
