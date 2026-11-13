# P3 frozen ports: navigation closure is not a closed market

Research date: 13 November 2026. Main inspected: `bba6320`.
Clean-room documentation only. No new weather rule or map change approved;
no copied source prose, source balance values, assets, executable inspection or
excluded modding material used.

## Narrow delta and recommendation

P3 documents freezing that prevents ships entering or leaving a harbour. That
is not the same effect as frost reducing agricultural output, storms affecting
a voyage, or a market refusing trade. Our code already implements seasons,
weather, economic shocks and political navigation bans, but those effects must
not be conflated to satisfy a frozen-port checklist.

The roadmap has a parity direction, not a requirement to transplant every Baltic
hazard into the current map. `parity-gap.md` already names frozen ports;
`patrician3-mechanics.md` mentions blocked ships; the seafaring note mentions
ice among obstacles; the supply note covers winter consumption. This note adds
the entry/exit-versus-trade contract and the underway-arrival question, not a new
claim that winter or frozen ports had never been researched.

Prefer deferring literal harbour ice. Our current map/weather model covers Iberian
and nearby waters, whereas the P3 evidence concerns its northern trading world.
These game sources supply no historical support for assigning Baltic-style
freezing to our ports. If a physical closure is later wanted, first define a
location-appropriate cause and its own consequences. Do not disguise it as a
political blockade or a sanitation scare merely because those checks exist.

## Public evidence read

| Ref | Source | Supports and limits |
| --- | --- | --- |
| S1 | Distributor-hosted P3 manual, Weather: https://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf?t=1450011557 | Primary documented distinction between frost lowering farm production and hard-winter harbour freezing blocking docking and departure, especially toward the east. Harbour ice is also visible. No exact closure distribution or thaw algorithm established. |
| S2 | FX Italian manual, weather, printed page 31: https://www.yumpu.com/it/document/view/48432083/manuale-di-gioco-fx-interactive/32 | Localized manual repeats the navigation prohibition and distinguishes reduced agricultural production. Documentary overlap, not an independent simulation experiment. Its mention of threatening icebergs does not prove a collision/damage subsystem. |
| S3 | Papillon's Well, P3 review: https://www.geocities.ws/papillonwells/gaming/pwggame1b2.html | Historical player review connects a northern port's winter closure to provisioning and warehouse planning. Not a deterministic annual schedule or a complete closure list. |
| S4 | GOG P3 product page and user reviews: https://www.gog.com/en/game/patrician_3 | Store description supports seasonal consequences generally. A user review discusses adapting a circuit when a port freezes; that specific statement is user testimony, not a vendor guarantee or transport algorithm. |
| S5 | Worthplaying, July 2003 facts/screens: https://www.worthplaying.com/article/2003/7/23/news/11327-patrician-iii-rise-of-the-hanses-facts-screens/ | Contemporary feature announcement links seasonal weather to production and transport. Promotional context, not independent evidence of arrival handling. |
| S6 | P3 wiki, Newbie Aid: https://patrician3.fandom.com/wiki/Newbie_Aid | Community advice on winter provisioning and lower farm production. Not evidence that every seasonal shortage is caused by a frozen harbour. |

These are documentation, review/announcement and community accounts. The manuals
may share provenance; multiple hosts or languages do not multiply experimental
support. No P3 playthrough or current-build observation was performed. An excluded
binary-internals result appeared in search and was not opened or used.

## What remains unverified

S1 establishes prohibition at the harbour boundary. It does not explain a ship
already underway when the destination freezes: waiting offshore, diversion,
return, automatic docking or delayed command execution remain unresolved. Do not
import the political-ban behavior of our code as if it were documented P3 ice.

The sources do not settle whether a ship already docked can keep trading during
the freeze, whether local office trading continues, whether an accepted departure
resumes automatically at thaw, or how deadlines and upkeep behave. A transport
interruption can cause shortages without proving a separate consumption bonus,
price override, warehouse loss or mandatory damage to trapped ships.

Visual weather options are also distinct. The manual describes turning weather
effects off to improve display performance, but that is not evidence that the
simulation's navigation restriction switches off too. No settings equivalence is
inferred.

## Real main inspection

A real grep of `src`, `data`, research and design for frozen-port, ice, hielo,
helada and winter terms found existing notes and seasonal/weather code. Reads
of the following paths found no harbour-ice state or freeze/thaw transition there.

| Inspected code | Actual current contract |
| --- | --- |
| `src/sim/market.mjs`, `seasonMul`, `seasonOf`; `src/game/seasons.mjs` | Calendar production seasonality and seasonal notices already exist. Notices do not themselves block a harbour. |
| `src/sim/weather.mjs` | Regional seasonal wind and storm fields already affect sailing. No temperature-to-harbour closure rule was found in this module. |
| `src/game/shocks.mjs`, `portClosed`, `applyShock` | A sanitation-related port closure blocks trade when callers check it; this shock does not modify navigation. Poor harvest is a separate supply effect. |
| `src/game/game.mjs`, trade wrappers, `dockBlocker`, `doSail`, `doGoTo` | Trade checks the shock's closed-market state. Sailing/course changes check crew, court/repair and political bans; they do not reuse the trade closure as physical ice. |
| `src/game/portmeasures.mjs` | Boycott restricts new courses into a port; blockade also restrains departure. Its explicit policy permits ships already underway to arrive. That is an own-design political rule, not documentary evidence of P3 frozen-port behavior. |

No generic absence of closures or weather is claimed. No test execution or visual
audit accompanies this note, and no existing behavior is presented as defective
merely because it differs from a northern game's hazard.

## Own acceptance questions if physical closure is ever selected

- Keep movement access, market access and agricultural output separate. A cause
  should determine which channels it affects; one ambiguous closed flag cannot
  silently mean all of them.
- Decide the handling of ships already underway, new departures, course changes,
  convoys and automated routes before wiring the first navigation check. Give
  retries an explicit reason and policy rather than charging a fresh voyage twice.
- Compose independent causes. Thawing must not erase a political blockade, repair
  hold or another closure that remains active. A save/load must preserve the same
  cause, affected port and expiry without rerolling a convenient outcome.
- Test boundary ordering: closure and arrival on the same tick, thaw and retry,
  overlapping restrictions and feature omission. Do not promise automatic route
  recovery or deadline relief unless explicitly designed and tested.

No source freeze probability, season dates, port list, damage rate or balance
schedule is imported. Geographic applicability and the missing boundary policies
remain decisions, not implementation instructions.
