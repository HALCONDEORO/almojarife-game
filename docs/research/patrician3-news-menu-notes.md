# P3 manual 7.5.1: news categories, storage filters and deleting an item

13 November 2026. Main inspected: `ef688e9`.
Clean-room documentary note, own words only. No copied prose, source figures,
assets or excluded material. No change is approved.

## Scope and overlap

Source S1: Patrician III English manual, section 7.5.1 News Menu, printed and PDF
pages 20 (the categories and the filter sentence) and 21 (the delete
button), read page by page.
http://downloads.patrizierforum.net/tippsammlung/Patrician_III_-_Manual_-_PC.pdf
Only S1 is used. Not opened or verified: any running P3 session, other pages.

Overlap checked. Grep of `docs/research` for news menu, personal news, official
documents and deleting news found: paid-event-news (informer sales, 10.6.7),
event-bounded-fast-forward (7.5 for fast forward only), player-statistics
(title-bar chronicle). None reads 7.5.1. PRs 930-957 are merged on main and none
concerns the news menu.

## What S1 says

- The news menu has icons, one for each kind of item: official papers (tax
  statements, fees, court rulings, elections and letters); personal news about
  the business and the family; and trade news with special information and
  offers received.
- Filter options let the player decide how news items are saved. The text does
  not say what the filters key on, whether anything is dropped automatically, or
  whether a filtered item can be recovered.
- A separate button deletes the currently selected item.
- Not stated: whether items expire, a size limit, unread markers, ordering,
  or whether deletion is reversible.

## Own source (main ef688e9, function bodies read)

- `src/game/ledger.mjs:9` and `31-35` `post`: every message goes to one inbox,
  newest first; when the inbox is over its cap the oldest entry is dropped
  silently. Cap constant is `MAX_INBOX` at line 9.
- `ledger.mjs:36-38`: `unread`, `markRead`, `markAllRead`. No function deletes or
  filters a message; the only write after posting is the read flag.
- `src/view/msgclass.mjs:4-11`: `msgClass` sorts messages into action, notice
  and log. `actionUnread` counts only unread action items, which is the header
  number. Pure view logic; the simulation still posts everything.
- `src/view/ledgerview.mjs:79-98` `inboxHtml`: shows action items first, collapses
  notices into grouped lines (`msgclass.mjs:13` `groupNotices`), points to Reports
  for weekly reports. Route sales and arrivals live in Reports, price alerts and
  proclamations in the alerts card.
- `web/main.mjs:574-575` and `1544-1545`: click handlers mark one message or all
  as read. No delete handler found.
- Real grep of `src` and `web` for delete/dismiss/clear on the inbox found
  `dismissEncounterReport` (a different single report) and nothing on `inbox`.
  Scope: those terms, those directories.

## Reading for Almojarife

Our single inbox with triage already covers the manual's reason for categories:
separating what needs the player from background news. The manual's
categories are by subject, ours by urgency, so they are different cuts, not a
gap. Open points that do exist: no way to clear a stale item, and the
oldest message disappears silently once the cap is reached, even if unread.
No patch is proposed. If a later change touches this, requirements from this
reading: never drop an unread action item silently, make any delete or filter
state visible and reversible within the session, and keep the header count tied
to what is still visible.

## Open questions

- What the manual's storage filters actually do: not stated on these pages.
- Whether subject categories would help beyond the urgency split; a design call.
- Whether silent eviction of unread notices has been observed in play; not
  tested here.
