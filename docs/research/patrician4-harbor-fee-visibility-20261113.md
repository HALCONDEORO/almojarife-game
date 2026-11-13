# P4 harbor fees: visible port cost, not a reconstructed tariff

Date: 2026-11-13. Base inspected: `bba632097747e642b4cbd087e85a3148f0dfaef8`.
Clean-room public-source note. No code or UI changes, copied prose, source values,
assets, extracted data or excluded modding references.

## Answer

An official P4 update notice explicitly adds harbor-fee display to town
information and the nautical chart. This supports making destination-related
charges inspectable in planning views. It does not establish a pre-departure
quote for a selected convoy, an immutable price guarantee, or the charging formula.

Almojarife already calculates arrival tolls, reduces them through its own local
rules, accrues them for weekly settlement and exposes town tax information.
The inspected ship/voyage planning views do not call the effective toll reader.
A useful optional next step is a clearly labeled current-state estimate for the
selected ship and destination, reusing the real reader rather than importing
reported P4 rates. This is a design option, not an implementation authorization.

## Sources and disagreements

- **S1, official Steam update notice, dated 2010-12-17:** expressly documents
  harbor-fee visibility in town information and the nautical chart. This is the
  primary evidence for the narrow visibility claim, not a tariff specification.
- **S2, Steam mooring-fee discussion, opened 2020-12-31:** players report recurring
  city fees and a relationship to carried cargo. Responses suggest different ways
  of avoiding or removing fees and include uncertainty about civic requirements.
- **S3, Steam beginner discussion, opened 2019-06-19:** one response describes a
  cargo-based charge; another reports guild membership or an office as a remedy.
  These are player accounts, not verified exemption rules. They do not settle the
  underlying cause, political status conditions or version dependence.
- **S4, Steam community guide:** town information and city-management context.
  It is not independent proof of the exact fee trigger or its calculation.
- **S5, official base manual:** provides the broader city/trade/navigation model.
  It is not used to fill in a harbor-fee formula absent from the inspected text.
- **S6, official add-on manual:** checked its changes/corrections section. It
  corrects maintenance at sea but does not turn maintenance into a harbor fee.
  No claim of identical fee behavior across editions follows from that silence.

Cargo-based reports differ from our hull-size-based rule. They are not grounds to
replace ours. Empty-ship exemption, membership exemption, fee removal, fee growth,
exact cargo valuation and AI parity all remain unverified questions for P4.
No live P4 build or visual UI inspection was performed.

## Actual Almojarife paths

Read the roadmap/inventory and searched `tollFor`, `chargeToll`, `tollsDue`,
`peaje`, `toll`, `destination`, then read the relevant functions:

| Path | Observed behavior | Limit |
| --- | --- | --- |
| `src/game/tolls.mjs` | Effective arrival toll derives from hull class capacity and local respect, dock and council modifiers. Cargo quantity is not an input. | Our own model, not P4 parity. |
| `src/game/game.mjs` | Arrival processing calls `chargeToll`; arrival message is separate. | Full convoy/multi-arrival replay was not audited. |
| `src/game/tolls.mjs`, `chargeToll` | Accrues a positive charge into weekly tolls and credits the municipal treasury. | Not a daily berth-rental or immediate cash charge. |
| `src/game/ledger.mjs` and `src/view/ledgerview.mjs` | Due costs include tolls; weekly/annual reporting shows them separately from maintenance. | Reporting already exists; no global absence claim. |
| `src/view/townhallview.mjs`, `src/view/ui2d.mjs`, `web/main.mjs` hall paths | Show town toll basis, respect discount and council tax state. | These are policy components, not a selected-ship quote calculated by `tollFor`. |
| `src/view/voyagecard.mjs`, inspected `web/main.mjs` planning/render paths | Repository search found no `tollFor` call from these views; that reader is used by the charge function and tests. | No pixel-level verdict on all possible screens or dynamic extensions. |

An isolated non-committed check used the actual toll functions. The same ship
with and without synthetic cargo produced equal estimates; reading the estimate
did mutate initially unnormalized reputation state through lazy normalization
(`rep`/`repV`); the attached check reports `estimateReadOnly: false`. That check
does not establish general reader purity. Charging after normalization matched
the estimate at otherwise unchanged state,
increased weekly tolls and did not debit cash immediately. This verifies a narrow
function contract, not a complete voyage, council-change or settlement replay.
Unchanged toll and ledger baseline: 27 tests passed, none failed.

## Ranked next steps

1. Prefer a read-only current-state toll estimate next to an inspectable destination.
   Explain that the arrival charge settles with the weekly bill, separately from
   maintenance and market fees. Reuse the effective calculation without copying
   its formula, but first address or isolate its initial reputation normalization
   so a planning projection does not mutate the game merely by being opened.
2. Before a convoy total, inspect every member's real arrival-charge path. Do not
   multiply the lead ship's estimate or assume a single shared charge.
3. Defer new fee politics, cargo-based tariffs and P4-style exemptions. They require
   their own source checks and design decisions, not a visibility patch.

A preview should be labeled as an estimate, since council policy, respect, docks,
ship class or convoy composition may change before arrival. Future tests should
cover modifiers, zero toll, changed destination, policy changes while sailing,
weekly accrual, convoy membership and save/load. A future read-only estimate must not
reserve money, alter the treasury, sail a ship or create a charge merely because
someone opens the card. This is a future acceptance criterion, not a property
proved for the current `tollFor` reader. Visual and keyboard checks remain required for any later
UI implementation; this note itself changes no screen.

## Source URLs

- S1 https://store.steampowered.com/oldnews/4807?l=german
- S2 https://steamcommunity.com/app/57620/discussions/0/2994296961830550348/
- S3 https://steamcommunity.com/app/57620/discussions/0/1645418344564697410/
- S4 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
- S5 https://download.kalypsomedia.com/manuals/p4_manual-en.pdf
- S6 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
