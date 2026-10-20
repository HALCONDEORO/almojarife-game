# Alpha scope

Decision by the project owner (20 Oct 2026): the playable area of the Alpha is **Iberia plus the north of Africa**. The map is frozen at that area. Work after this point goes into game mechanics and graphics, not into more map.

## What is in the map (33 ports)

- Iberia, Atlantic coast: La Coruna, Vigo, Oporto, Lisboa, Setubal, Faro, Huelva, Cadiz, Sevilla (river port).
- Iberia, north coast: Bilbao, San Sebastian, Santander.
- Iberia, Mediterranean coast and islands: Malaga, Almeria, Cartagena, Alicante, Valencia, Tarragona, Barcelona, Palma, Ibiza.
- North Africa, Atlantic and strait: Tanger, Ceuta, Tetuan (river port), Arcila, Larache, Rabat, Casablanca, Mazagan.
- North Africa, Mediterranean: Melilla, Oran, Mostaganem, Argel.

## What is out, and why

- Tunis, Bugia (Bejaia), Tripoli and everything further east: they would widen the map past the Balearic Islands and are not needed for the Alpha.
- Canary Islands, Madeira, Azores: Atlantic islands far from the map frame.
- Southern Morocco (Safi, Agadir): the map stops at Mazagan in the south.
- France, Italy and the rest of the Mediterranean: outside the Alpha.

## Rule

Changing this list (adding or removing a port, or changing the map extent) is a decision of the project owner, not a routine change. The extent also decides the background image, so the image must be rebuilt with `tools/build_background.py` whenever it changes.

## Data quality

- Coordinates come from OpenStreetMap (see CREDITS.md).
- Populations around 1500 come from Bairoch et al. (1988) via a manual transcription; a port the source does not list is `null`, never zero. All 11 North African ports are `null` for 1500.
- The goods each port makes and needs are design choices, not historical data.
