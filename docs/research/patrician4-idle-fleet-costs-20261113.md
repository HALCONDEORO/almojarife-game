# P4 fleet costs: base manual and later add-on correction

Date: 2026-11-13. Clean-room research only, based on public documentation and guides.
Base inspected: `480de7e`.

## Answer and boundary

The base P4 manual separates basic operating expense at sea from personnel costs
that continue at anchor. The later Rise of a Dynasty manual expressly corrects
that passage: ship, captain and sailor maintenance is incurred only at sea. These
are edition-specific documented rules, not a single general P4 rule. Almojarife's
inspected accrual path charges hull, crew and weapons regardless of voyage state,
with captain wages added separately. That is not evidence our economy is broken.
Keep current balance; first make its actual cost easier to inspect before
considering an edition-inspired, state-dependent policy.

This is distinct from captain experience/training, expedition unlocks, and the
existing P3 FAQ note. The latter compares empty and loaded holds; this note
compares the same load and staffing while docked, sailing or anchored offshore.
Neither comparison implies the other. No P3 rule is inferred from this P4 source.

No competitor rates, ratios, cost tables, copied source wording, code, assets or
binary-derived material are included. No production code changes are proposed.

## Source findings

- **Base P4 official manual, PDF/printed page 30, later corrected:** basic operating expense is tied to
  sailing; retaining a captain and extra sailors still costs money when waiting.
  The adjacent crew section distinguishes routine sailing crew from extra hands
  assigned to guns. Under that base-manual description, an idle combat-ready
  convoy is not cost-free. This cannot be generalized to the add-on.
- **Official Rise of a Dynasty manual, Changes section, page 16:** explicitly
  corrects base-manual page 30 and limits maintenance of ships, captains and
  sailors to time at sea. The manual explains that updates and the add-on made
  the original manual outdated. This later primary correction supersedes the
  base passage for the documented updated/add-on context. It does not specify
  an offshore-anchor edge case, and was not tested against a particular build.
- **Historical P4 fansite, ship overview:** explicitly describes the listed basic
  daily expense as a seagoing expense. This agrees with the manual but may derive
  from it; it is not an independent behavioral test or a reason to override the
  later official correction.
- **GRYOnline ship guide:** gives a daily base expense alongside each hull's other
  characteristics. It does not establish when that expense accrues. A ship table
  alone is insufficient evidence for port-versus-sea behavior.
- **Community ship reference and Steam guide:** describe refits, crew and convoy
  organization. They add context, not an independent confirmation of the charging
  schedule. The Steam page covers an expansion-era product; avoid assuming all
  descriptions apply unchanged to every base-game release.
- **Official Steam update notice:** reports that town conditions affect wages and
  that harbor fee visibility was added. It does not identify the affected wage
  categories or connect those changes to this sea/anchor distinction. Do not turn
  this wording into a crew-wage formula or a free-port guarantee.

The high-confidence finding is a documented revision: the base manual retains
personnel costs at anchor; the add-on manual corrects that policy to sea-only
ship/captain/sailor maintenance. The Steam update notice neither resolves nor
replaces that explicit correction. No live P4 playthrough, exact update build
comparison, arrival-day rounding, repair-day billing or automatic-route stop
billing was verified here. No claim is made about the currently distributed build.

## Actual Almojarife inspection

A real repository search and function reads on the base above found:

| Path | Observed behavior | Limit |
| --- | --- | --- |
| `src/game/game.mjs`, `dayTick` | Calls `accrueDay` for every owned ship after the voyage-sensitive wear branch. | Other game systems can add separate expenses. |
| `src/game/ledger.mjs`, `accrueDay` | Adds hull/crew and weapon costs plus a separate captain wage entry. There is no voyage-state guard in this function. | Not a claim about every expense in the game. |
| `src/game/crew.mjs`, `dailyUpkeep`, `cannonUpkeep` | Hull component persists; crew component depends on headcount; weapons add their own upkeep. Neither function checks sailing state. | These are our rules, not a P4 mapping. |
| `src/game/captains.mjs`, `captainWage` | Reads the retained captain's wage. | No skill/XP change proposed. |
| `src/view/shipwindow.mjs`, `dataTab` | Renders the hull type's base upkeep value. | That line alone is not a complete staffed/armed ship forecast. |
| `src/view/ledgerview.mjs` and `src/view/cashcard.mjs` | Weekly report has separate cost components; finance summary receives currently due costs. | Existing reporting is not absent; no pixel-level UI audit performed. |

Search terms included `upkeep`, `wages`, `accrueDay`, `captainWage`, `voyage`,
`at anchor` and `idle`. The research search found the existing P3 FAQ discussion;
it concerns cargo utilization rather than state-dependent accrual.

An isolated, non-committed executable check cloned the same locally created cog,
with the same captain and mounted weapon, into port, active voyage and offshore
anchor states, and invoked `accrueDay` once. All three produced identical accrued
component books and totals. This confirms the inspected function's present
contract, not a complete multi-day game trajectory or save-load guarantee.

Baseline tests: `ledger`, `crew`, `crewsize`, `captains`: 48 passed, none failed.
They were run unchanged. This note adds no tests or implementation.

## Ranked design options

1. **Prefer visibility without balance change.** A later owner-approved task could
   show actual current daily components and the already accrued weekly bill next
   to the base hull figure. Use shared cost readers rather than a second formula.
2. **Only after a policy decision, explore split operating/retention costs.** First
   choose whether to take inspiration from the base-manual split or the later
   add-on sea-only policy. Then decide port versus offshore anchor, repair, arrival
   boundary and route stop semantics. Do not treat either document as our rule.
3. **Defer full P4 parity.** It would need deliberate crew-category, convoy and
   billing decisions rather than copying a number or adding a voyage conditional.

Before implementing the second option, pin same-load/same-staff comparisons at
port, at sea, offshore anchor and repair; verify arrival and settlement boundaries,
then review early-game solvency and parked-fleet incentives. Reducing parked costs
could make stockpiling ships easier and alter the value of route downtime.

## Sources read

- Official Rise of a Dynasty manual, Changes, page 16: https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- Official Kalypso base English manual, PDF page 30 (later corrected): https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- Official update notice, dated 2010-12-17: https://store.steampowered.com/oldnews/4807?l=german
- Historical fansite, ship overview: http://old.patrizier-forum.de/josch3/josch1/www.patrizier-fan.de/spielinfos/schiffe.html
- Editorial ship guide: https://www.gry-online.pl/poradniki/patrician-iv/statki/zbb35a
- Community ship reference: https://patrician4.fandom.com/wiki/Ship
- Community Steam guide, updated 2023-07-01: https://steamcommunity.com/sharedfiles/filedetails/?id=682751098

Search-only player comments about unexpectedly expensive sailors were not present
in the fetched page body and are excluded from the evidentiary basis.
