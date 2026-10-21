# Captain skills, stage 2: weather and defence activated

The encounter engine already read `ship.captain.weather` and
`ship.captain.defence` (bounded 0..3, absent = 0); no captain could carry
those fields. This slice activates both skills end to end:

- Roster candidates get deterministic `weather` and `defence` levels (0-3)
  from other bit windows of the same city hash; navigation is unchanged.
- `captainOf` carries both with the same `level()` bound; malformed or
  absent values read as 0; old saves are neutral.
- Effects (already in `encounterOutcome`): storm hull/cargo losses scale
  by (1 - 0.15 * weather); pirate fights add 6 defence per level (+4%
  repel chance per level, capped at 0.9 as before).
- Tavern review and the assigned-captain line show all three skills with
  their live effects, ES+EN. Trade stays explicitly inactive.
- No price or wage change: fee 120, wage 2 flat for every candidate.
  Per-skill pricing is a separate balance decision, declared then.

Tests: roster determinism and bounds, malformed reads, hire assignment,
+4%/level pirate chance with a flip case, storm loss reductions. 332
non-ai tests green; the economy invariants are untouched (no stock, cash
or demand change).
