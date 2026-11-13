# P3 crew morale: command authority can fail before the hull does

13 November 2026. Main inspected: `bba6320`.
Clean-room documentation only. No morale rule, combat modifier or forced voyage
is approved. No copied dialogue, source balance figures, assets, binaries or
excluded modding material used.

## Narrow finding and prior coverage

P3 documents a crew condition distinct from headcount and captain ability. Long
voyages and lost battles can lower morale; shore leave can restore it. Neglect
can produce a mutiny that overrides the chosen course and eventually removes
crew and cargo. It is therefore a temporary loss of command with a destination
and settlement, not simply another damage roll.

The roadmap's classic-depth direction does not approve this feature. Existing
FAQ notes mention rebuilding a crew after mutiny, and the events note discusses
city-guard morale during sieges. Captain, crew-transfer, ship wear and urban mood
already have research or implementation. This note adds the shipboard morale
lifecycle and its navigation boundary, not a claim those adjacent systems are
missing or that every mention of mutiny was absent.

## Public source coverage

| Ref | Source read | Contribution and limit |
| --- | --- | --- |
| S1 | P3 manual, Crew's Morale and Mutiny, printed pages 28-29; Blocked Ships and route stop options: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Full PDF text read. Primary documentation of morale loss/recovery, nearest-port diversion, selection without navigation, and losses on arrival. Also lists low morale as a departure blocker and shore leave as a conditional route-stop reason. No exact recovery or trigger formula adopted. |
| S2 | GRYOnline, crew guide, updated August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/zaloga-okretu/z036dc | Editorial guide describes the same qualitative loop and a visible warning through the crew display. Close overlap with manual, not independent experimental confirmation. |
| S3 | Steam, About crew morale, September 2016: https://steamcommunity.com/app/33570/discussions/0/350543389015495587/ | Players disagree whether state belongs to hull or sailors and whether replacing crew resets it. Contradictory testimony, not a proven reset rule or a recommendation to dismiss staff. |
| S4 | Patrizierforum, Happy Ships, April 2006: http://www.patrizierforum.net/index.php?thread%2F1106-happy-ships%2F= | Players report recruitment/transfer-dependent changes and disagree about captain ordering/version effects. Evidence that transfer semantics need checking, not a sequence to implement. |
| S5 | P3 wiki, The flying trader: https://patrician3.fandom.com/wiki/The_flying_trader | Campaign-specific superstition events can affect crew mood or provoke desertion/mutiny. This does not establish those triggers in ordinary free play. No campaign names, story wording or events imported. |
| S6 | Distributor-hosted English manual mirror: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf | Fetched extract was incomplete at the relevant chapter; S1's downloaded full document supplies the substantive text. Same manual lineage, not an extra independent source confirming the mechanism. |

Coverage is documentation, an editorial guide and community reports. No runtime
observation, exact state-location test or current-build reproduction was done.
Several hosts and a guide repeating a manual do not count as multiple independent
experiments. Forum speculation about consuming cargo is not treated as proof of
a provisioning mechanic.

## What is documented and what is not

S1 and S2 link time at sea and battle defeat to morale, and time ashore to
recovery. Repair downtime can overlap that rest. This does not mean a repair
purchase instantly restores morale, every docking guarantees recovery, or a
particular captain makes a crew immune. The manual gives combat relevance too;
no accuracy bonus or boarding multiplier is copied here.

When a mutiny occurs, S1 describes a vessel that remains selectable but refuses
the player's navigation, turns toward the nearest port and loses people and
cargo after arrival. A passive warning alone would not reproduce that contract.
Neither would surrender in battle, ordinary crew casualties or a court hold.

Unresolved: how the nearest port is chosen under access restrictions; treatment
of convoys and prizes; pending orders; losses and cargo-cost basis on arrival;
recovery timing; save persistence; transfer, dismissal and capture semantics;
and whether an automatic route resumes afterward. S3/S4 are inconsistent enough
that their recruitment stories cannot fill these gaps. S5's scripted campaign
triggers must remain separate from the ordinary voyage model.

## Real main inspection

A real grep across `src`, `data` and research for morale, mutiny, motin/motín,
shore leave and crew-mood terms preceded these reads. It found the prior incidental
research mentions but no ship-morale state or mutiny transition in the inspected
source paths. Broader mood matches were checked rather than mistaken for crews.

| Inspected source | Positive existing behavior and boundary |
| --- | --- |
| `src/game/crew.mjs` | Hiring, dismissal, transfer, wages, speed and defence derive from headcount/limits, equipment and condition. They do not calculate mood, time ashore or a disobedience state. Transfers already exist; this is not another request to add them. |
| `src/game/battle.mjs` | Shared battle resolver uses hull, captain defence, crew and gear; reports record casualties and losses. These are actual combat effects, not a persistent morale recovery system. |
| `src/game/moodout.mjs`, `src/game/citylife.mjs` | Mood belongs to city population and affects/narrates local conditions. Reusing city mood for a travelling crew would change its meaning. |
| `src/game/routes.mjs` | Automatic hull repair and diagnostic pause/retry behavior already exist. No shore-leave condition or crew-morale stop was found in these readers. A repair hold must not silently become a morale reset. |
| `src/game/game.mjs`, `dockBlocker`, `doSail`, `doGoTo`, `arrive` | Crew minimum, court/repair holds, political bans and convoy/escort constraints already protect navigation. A forced course needs an explicit policy with these constraints, not bypassing them through an ordinary player command. |

No test execution or visual audit accompanies this source review. No captain
implementation, existing repair behavior or city-mood system is declared broken.

## Own design options and future tests

Prefer a read-only, synthetic morale experiment before any mandatory mutiny.
First choose what the state belongs to, what changes it and how rest is measured.
Changing it through a transfer must conserve whatever history the chosen model
claims to track; dismiss/recruit cannot accidentally create a free reset unless
that is a deliberate policy. All values and timings would be our own design.

If loss of command is later selected, separate warning, active diversion, docking
losses and recovery. Declare a reachable destination policy and how restricted
ports, convoy companions and escorted prizes are handled. Do not duplicate a
voyage, abandon a bound prize or charge cargo losses again after reloading.

Future tests should cover repeated ticks, save/load, transfers, failed commands,
manual rerouting during diversion, an inaccessible nearest port, arrival exactly
at a transition and automatic-route restart. A view may still inspect a ship
without being allowed to command it. Feature omission must preserve current
crew, battle, routes, wages and city mood unchanged.
