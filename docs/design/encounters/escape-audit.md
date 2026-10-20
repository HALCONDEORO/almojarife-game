# Escape probability audit

20 October 2026. Extends pirate-choice tests; no intended balance change for finite, valid game state.

Before: 278 tests on the pirate-choice branch, 5 dedicated choice tests. After: 4 additional probability tests. New coverage: exact per-factor numeric assertions, invalid navigation, hull clipping and rounding, invalid stored probability, 500 flee save-roundtrip comparisons, 100000 actual flee resolutions across five fixed thresholds with expected-roll equality.

Formula: round(clamp(35 + hull * .25 + crewSpeedFactor * 10 + navigationLevel * 3, 15, 85)). Valid hull is clipped 0..100, navigation integer0..3. Missing or non-finite hull uses100 (the legacy default). Physical factor combinations currently yield35..80;15..85 are safety rails, not reachable extremes in normal state.

## Bug found and fixed

Non-finite or nonnumeric hull could produce NaN, creating an unusable stored chance and blocked encounter. Added a finite-number guard, defaulting to legacy100. NaN, both infinities, invalid string, null and undefined now have explicit tests. This does not change valid ship states. No claim that every other invalid save field is now safe.

## Deterministic distribution regression

For each threshold,20000 independent integer seeds, identical encounter ID `sea-v1:2:1`, direct `resolvePirates` calls. Each outcome also compared with the exact seeded uniform draw and stored threshold. Results:

| Threshold | Escapes | Trials | Observed |
|---|---:|---:|---:|
|15%|3054|20000|15.270%|
|35%|7102|20000|35.510%|
|50%|10051|20000|50.255%|
|70%|14115|20000|70.575%|
|85%|17080|20000|85.400%|

A fixed one-percentage-point envelope is a regression check, not a proof of random-generator quality, balance, or a promised ratio in one game. Artificial stored15/85 thresholds exercise boundaries even though normal factors do not currently produce them. Save tests compare identical state before/after JSON roundtrip then verify a resolved encounter cannot be rerolled. Existing pirate-choice suite tests actual game serialize/deserialize separately.

## Remaining work

Full economy formula inventory, statement/branch coverage and property-style simulations are separate work. This test PR does not certify economy balance, fleet encounter frequency or all malformed saves. No new UI; screenshots of pirate choices remain valid for finite normal state.
