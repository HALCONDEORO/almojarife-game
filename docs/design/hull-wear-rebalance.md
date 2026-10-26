# Hull wear rebalance: weather and battles matter (26/10, owner delegation)

Delegation: Marco 26/10 13:04 (via main): "Hay que pulir la mecánica del desgaste de los barcos:
ni mucho ni poco, y las inclemencias del tiempo y las batallas importan" — creative/technical
freedom, measure with simulation and the real playtest, no spending, coordinate warnings with UI.

## Evidence from the year-1480 human playtest

Barca 2 on the Lisboa-Cádiz loop (days ~100-176): hull 78% -> 21% with no storm encounters and no
battles, only the flat 0.5/day sea wear. Effects observed live: ETA slipped day 138 -> 181 as the
hull fell (the live build couples hull to ETA), no critical-hull warning ever fired, and the only
repair prompt is the passive button in the ship window. Conclusion: wear is CONSTANT (weather does
not matter at all), invisible (no warnings), and the player is never pushed to care.

## Current model (main beeddf6)

- `tickShip` (src/sim/trade.mjs): flat -0.5 hull/day at sea, floor 10. Player AND NPC ships.
- Storms only matter through the sea-encounter roll (kind forced to 'storm' inside a cell).
- Battles: ROUND_DAMAGE 12/round at even odds (pirates 4) — already meaningful; unchanged.
- Speed: crew factor x captain x wind-at-departure. Hull is NOT coupled (main).
- Repair: 4/point, full to 100, reputation multiplier. Ship resale values hull. Unchanged.

## New model (player ships)

Daily at sea (replacing `tickShip` for player ships; NPC traders keep the flat model — they are
abstract rivals whose hulls are never repaired, so coupling them would slowly paralyze them):

  wear/day = 0.4  base (calm sea, moderate: a Lisboa-Cádiz round costs ~10-12 points)
           + 0.2 x wind force at the ship's position (rigging strain, 0 in calm air)
           + 3.5 if the position is inside a storm cell that day (storms MATTER)

Floor stays 10: weather never sinks you, battles do. Average fair-weather wear stays ~0.5/day
(0.4 base + ~0.1 wind) — the average cost of sailing is unchanged; the VARIANCE moves to weather,
so routing around a forecast cell (the P7 forecast UI) is worth real money: a 3-day storm
crossing costs ~12-15 points (~50-60 maravedís) plus the delay below.

Hull now slows the player: hullSpeedFactor = 0.65 + 0.35 x hull/100 (100% -> 1.00, 50% -> 0.825,
10% -> 0.685). Exception: a prize keeping station with its winner (claimPrize mid-voyage) marks the
shared voyage escorted/escortedBy and NEITHER leg takes drag — the escorted pair limps together and
arrives together, as the feature already promised. Applied two ways:
1. At departure, into doSail's speedMul (new voyages price the damage in).
2. Mid-voyage, a deterministic drag accumulator on the voyage: each day at sea adds
   240 x (1/hullSpeedFactor - 1) ticks of drag; whole ticks are added to ticksLeft, the fraction
   carries (voyage.dragFrac, absent in old saves = 0). A storm that batters you from 60% to 25%
   visibly stretches the remaining voyage — and the ETA, since it derives from ticksLeft.

Warnings (the playtest gap): crossing below 30% hull posts a "casco bajo" message, below 15% a
"casco crítico" one (once per crossing, via the existing event-message feed — no new T keys in
web/main.mjs). The ship window shows the active speed penalty next to the hull line
("Lento por casco dañado: -18%") using shipwindow's own locale dict. Left-panel/mensajes layout
is unchanged — flagged to the UI agent for any deeper surfacing.

## Declared test change (balance delegation, #229 precedent)

test/continuousvoyages.test.mjs "the arrival day pays its sea wear" pinned the flat 0.5/day:
it now expects the weather-coupled formula, recomputed day by day through the same public
functions (locate + windAt + inStorm), including the arrival-day charge. Everything else in the
file is untouched.

## Measurement

- New test/hull-wear.test.mjs: base/wind/storm wear amounts, floor, speed factor, drag
  accumulator arithmetic, warning thresholds fire once, departure speedMul includes hull.
- tools/sim_hull_wear.mjs: one game year of a barca looping Lisboa-Cádiz (no repairs) under the
  new model vs the flat 0.5/day: wear totals, storm-day count, voyage-time inflation. Numbers
  below are filled from the run.

## Measured (tools/sim_hull_wear.mjs, one game year, barca looping Cadiz-Huelva, NO repairs, blind to weather)

- seed 7: 81 voyages, 66 sea days, 13 storm days (20% of sea days on this lane), wear 90 (floored
  at 10), drag +18.6 days of voyage time, 1 low + 1 critical warning, repair bill at year end 360.
- seed 1: 82 voyages, 69 sea days, 15 storm days, wear 90, drag +20.8 days, same warnings.
- Fair-weather average: ~0.67 wear/sea day on this windy lane vs the old flat 0.5 (+34%: the wind
  strain term); storm days spike to ~4/day. The old model over the same sea days: 33 points.
- Reading: a player who sails blind into every cell pays ~2.7x the old wear and loses ~3 weeks of
  voyage time; a player who reads the forecast and waits out cells pays roughly the old average.
  That is the intended shape: weather avoidance is now a real routing decision. The knob if Marco
  wants it softer is WEAR_STORM_PER_DAY (3.5) — each point is ~4 maravedís of repair per storm day.
- Balance gates: NPC traders keep the flat model by design; sim_buildings_economy seed 1 byte-
  identical to base (A@1y NPC worth 277679, in the old band).
