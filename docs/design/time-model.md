# Time model: from whole days to ticks with hours

Status: study and proposal, 20 Oct 2026. Desktop only.
Sources: own code (src/game/game.mjs, src/sim/trade.mjs, src/sim/market.mjs, web/main.mjs);
Patrician 3 as reference, from reverse-engineering notes at p3modding.github.io (basics/time,
ships) and the official manual (cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf).

## 1. Current model

- The day is the only time unit. `advanceDay(g)` runs every system once per day at the same
  instant: market tick, AI traders, ship `daysLeft--`, upkeep accrual, loans, weekly
  settlement (every 7 days), event rolls, rank updates.
- Travel time is whole days: `ceil(route.km / SHIP_TYPES[type].kmPerDay)` times a crew
  factor. Arrivals happen only at day boundaries; a 30 km hop and an 89 km hop both cost
  one day at 90 km/day.
- Ship positions between days are view-only interpolation (`progress`, `frac`); the
  simulation cannot express "arrives at 14:00".
- Encounters: one seeded roll per ship per day at sea; no time-of-day concept.
- Real-time pacing: 1.5 s per day at 1x (2x, 4x), with pause. The 365-day goal is about
  9 minutes of play at 1x.
- Market arithmetic is deliberately integer-day deterministic: a year repeats exactly.

## 2. How Patrician 3 does it (verified)

- One global tick counter; a day is 256 ticks, a year 93,440; the counter's low byte is
  the time of day.
- Ships move continuously every tick (x/y deltas) and store a computed arrival
  timestamp, so arrivals land at fractional hours, not day boundaries.
- Towns tick their economy once per day but staggered: each town index owns a slot
  inside the day, so updates spread through the day instead of one midnight pulse.
- Real time with pause and a speed setting; ships move perceptibly, so the player can
  react to pirates while under way.

## 3. Proposal

Keep the day as the accounting unit; add a tick as the simulation unit.

- `TICKS_PER_DAY = 240` (10 ticks per hour; hourly UI without P3's 256 binary quirk).
  Game time is a single integer `g.tick`; `day = floor(tick / 240)`. Display as
  "Dia 12, 14:00".
- `advanceTick(g)` replaces the daily loop. Day-boundary hooks keep today's behaviour:
  upkeep accrual, loans, weekly settlement and rank run once per day each, at fixed
  hours, unchanged in amount.
- Continuous voyages: a voyage stores `totalTicks`/`ticksLeft` computed from km, ship
  type, crew factor, captain navigation and a per-leg seeded wind factor (0.8-1.2,
  seasonal mean, logged in the voyage report). Arrivals happen on the exact tick;
  `shipPosition` becomes a pure function of ticks and the `frac` argument dies.
- Staggered economy, P3-style: port i ticks its market once per day at its own hour
  (i * 240 / nPorts). Formulas and daily quantities stay bit-identical; only the
  scheduling inside the day changes, so "a year repeats exactly" still holds per port.
  Gameplay effect: arriving just before a port's daily tick matters, a real route-planning
  depth gain.
- Encounters: convert the daily probability p to per-tick `1-(1-p)^(1/240)` with the same
  seeded determinism keyed on (tick, ship). Long voyages see encounters at varied hours;
  total exposure per day is statistically unchanged.
- Combat/pause behaviour unchanged: a pending decision still stops time.
- UI (desktop): day + clock in the top bar, ETAs in hours ("llegada: dia 12, 14:00",
  "en 37 h"), departure/arrival log lines with hours, shipyard ready times with hours.
  Speeds stay 1x/2x/4x; MS_PER_TICK replaces MS_PER_DAY (same wall-clock feel).
- Saves: add `tick`; bump SAVE_VERSION to 2. Pre-launch saves are not kept, so no
  migration code, per the pre-launch save policy (test saves are not kept).
- Construction engine hook: build times are stored in ticks, so "obra de 3 dias y 6
  horas" falls out naturally when the city builder lands.

## 4. Effects, risks, verification

- Economy: daily quantities unchanged by design; stagger and continuous arrivals change
  *when* goods and cash move inside a day. Re-run the M1b gates (bot finds fading
  profitable routes; 1,000 simulated years in CI under 5 min; no good clamped >30%) and
  the economy invariants suite before merging each step.
- Determinism: every roll keys on absolute tick; replay and save/load round-trip tests
  extended with mid-day saves (save at tick k, reload, identical futures).
- Performance: 240x more loop iterations is trivial for the sim (arithmetic only), but
  the 1,000-year CI gate must be re-measured; AI traders act on their own arrival ticks,
  not every tick.
- Risk of balance drift is real but bounded: quantities per day do not change, only
  intra-day timing. The economy audit harness (test/economy-invariants.test.mjs) is the
  safety net.
- Rollout in small PRs: (a) tick clock + advanceTick skeleton with identical behaviour;
  (b) continuous voyages + ETAs; (c) staggered market; (d) encounters per tick;
  (e) UI clock and log hours. Each PR keeps the suite green and ships with its own
  screenshot of the visible change.
