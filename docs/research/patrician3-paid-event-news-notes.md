# P3 paid event news: a purchased report, not a live market subscription

13 November 2026. Main inspected: `7989210`.
Clean-room documentary note only. No copied text, slogans, balance figures,
assets, executable inspection or excluded modding material. No implementation
or purchase policy is approved.

## Narrow finding and prior coverage

The P3 manual's informer sells a news item about unusual supply/demand events
and hazards. Acceptance deducts the demanded payment and places the item in
Personal News. The listed subjects include shortages, famine, fire, epidemic,
siege and pirate presence. The section does not promise exact stock, a live
remote market screen, a recurring service or profitable arrival. [S1]

The gap is not informants in general. Real grep of `docs/` for informer,
informant, paid information and news purchases found generic tavern coverage
in `patrician3-mechanics.md`, the paid-information backlog theme, and the
harbour-register note's explicit distinction between a local ship list and
purchased information. `patrician4-advisor-current-problems-20261113.md`
already separates current problems from retained information. Wiki rules
already describe our recurring port contacts. This note isolates P3's
payment-to-news-item contract and compares those existing mechanisms.

Open PR titles and bodies were checked before choosing: Electron maintenance,
escorted-prize movement and modal-focus tests did not study this subject.
No new tavern, rumour system or inbox is proposed as if those were missing.

## Evidence ledger

| Ref | Public source read | Contribution and limits |
| --- | --- | --- |
| S1 | P3 English manual, section 10.6.7, printed/PDF page 33: http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf | Complete local PDF text inspected. Describes purchase, account debit and delivery to Personal News, with event subjects. No report age, accuracy probability, refresh frequency or refund rule supplied. |
| S2 | GRYOnline, action buildings guide, informer subsection, updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/budynki-akcji-1/ze36da | Also describes event information purchased into personal letters. Near-parallel documentary account, not independent runtime confirmation. |
| S3 | Community wiki, Tavern: https://patrician3.fandom.com/wiki/Tavern | Adds approximate notorious-pirate location and treasure-map information. Community claims, not a universal accuracy contract. Treasure remains in its existing research scope. |
| S4 | Community wiki, Alderman, notorious-pirate mission: https://patrician3.fandom.com/wiki/Alderman | Describes the informer reporting a pirate's last-seen area, with movement after the sighting possible. Supports a warning against reading a report as a live tracker; no timestamps or movement formula given. Same wiki as S3, not independent corroboration. |
| S5 | Oakshield, Old man's guide to Patrician III, Tavern section: https://steamcommunity.com/sharedfiles/filedetails/?id=1956335034 | Full local page previously retained and inspected. Player advice says a competing merchant may exploit a tip before arrival. Its pricing-scaling claim is community-only and no formula or amount is adopted. Fetched text is truncated, so no claim is made to have reread the entire guide through that view. |

No P3 runtime purchase was reproduced. The manual supplies the documentary
transaction; community accounts supply the time-sensitive interpretation.
None establishes a deliberate false-news probability. Almojarife's existing
contact error model is our own design, not verified P3 behavior. Search found
modded-event material; it was not opened or used as vanilla evidence.

## Existing source paths

Reads after real grep of `src/game`, `src/view` and `web/main.mjs`:

- `src/game/intel.mjs`, `buyRumor`: a paid one-time inexact market snapshot
  for a port, stored in `g.intel`. `knownMarket` exposes its age. This is
  already a paid information transaction, but its payload is market cells.
- `src/game/contacts.mjs`, `hireContact` and `tickContacts`: upfront hiring,
  recurring finite reports, inexact market snapshots and retirement. The
  posted news announces new prices; it is not a purchased event report.
  Presence can subsequently replace the same port's information with exact
  data. Do not duplicate the existing recurring-contact contract.
- `src/game/news.mjs`, `arrivalNews`: price talk from passing sailors posts a
  report with provenance and approximate price, without writing live market
  cells into `g.intel`. Existing warnings already say information may change.
  This is a useful report boundary, not proof of a paid event-news command.
- `src/game/botintel.mjs`: rivals have private market knowledge and buy reports
  through their own state view. A human report feature must not bypass that
  boundary or expose rivals' private knowledge.
- `src/game/ledger.mjs`: existing inbox posting infrastructure. Event sources
  already exist elsewhere, including calamities and plague; do not invent
  hazards merely because a new information product might describe them.

No dedicated purchase-to-event-report command was found in these inspected
paths. This is not a claim that all news is absent or that events only happen
at sea. No tests or visual audit accompany this documentation-only patch.

## Decision and open questions

If selected later, start with one identified event report, using the existing
inbox rather than creating another recurring subscription. A report should
retain its subject and what was reported rather than silently become an
oracle when opened later. This is our design option, not a P3 payload schema.
Do not copy the source's prices or infer their scaling.

Open P3 questions: offer availability, selection of subject, observation time,
report accuracy, repeat purchase behavior, price calculation, refund handling,
and whether receiving news updates any separate map marker. Last-seen pirate
information is not proof that ordinary market tips are deliberately false.
Open own decisions: whether event reporting adds useful play beyond current
contacts, which event facts may be sold, what the quote reveals before payment,
and how the report's age and reliability should be shown.

If approved, acceptance checks should cover one debit per successful purchase,
no debit for rejected offers, an immutable purchased account of the event,
save/load without duplicate charging, no hidden live-market refresh and no
leak across human/rival knowledge. Existing contacts, rumours and arrival news
must keep their current rules. No implementation is requested by this note.
