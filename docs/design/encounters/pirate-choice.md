# Pirate decisions, superseding the automatic pirate flow

Pirate encounters pause after a completed daily tick. A separate popup offers "Try to flee (X% success)" and "Fight". No pirate damage is applied before that decision. Storms stay automatic. No tactical battle screen.

Original escape chance: round(clamp(35 + hull*0.25 + crew speed factor*10 + navigation level*3,15,85)), using bounded hull and navigation0..3. Hull, crew and captain navigation are real inputs. Chance is stored with the pending encounter and survives saves. This is a candidate balance, not a historical or measured fairness claim.

Successful escape costs one additional voyage day, no hull/cargo. Failed escape falls through to the existing simulated fight, explicitly stated before decision and in the final report. Fight uses current guns, condition and crew. Deterministic versioned roll, owned active ship validation, invalid choices do nothing.

One final popup, held until Continue, plus the same report record in Reports history. No new pirate inbox message or diary copy, no additional outcome rolls on reload. History max80. Report popup survives save/reload until acknowledged. Pending old data-driven pirate/storm encounters remain supported through the existing event flow. Old already-resolved reports remain history only.

The cadence hook now runs after daily ship movement and end checks: a voyage arriving today cannot be held pending without a ship at sea. Pending choices and report acknowledgement block the next day and wait-until-arrival. Modal traps keyboard focus and prevents map shortcuts. No captain Defence/Weather roster changes.

Tests cover both flee results, fight, save/replay, cost books, invalid choices, pause, bilingual content, chance effects, legacy pending event, and compatibility. Visual desktop/mobile checks use a seeded synthetic save with10salt/cost100, not user gameplay. No external assets, code or text copied.
