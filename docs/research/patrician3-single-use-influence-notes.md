# Patrician III: single-use influence and court jurisdiction

Research snapshot: 12 November 2026, Almojarife main `31786ff`. This is a documentation-only study, not approval to add corruption, change justice or override council decisions. It covers game fiction, not historical evidence about Iberian institutions.

## Why this is a new research slice

`docs/BACKLOG.md` groups black-market activity, customs, fines and seizure risk under the smuggling theme. Its status labels are orientation, not permission or proof of implementation. Existing research mentions illegal tavern characters and the possibility of paying an influential person instead of taking a reputation hit. The FX note covers that broad link. It does not describe the narrower contract studied here: influence tied to a jurisdiction and consumed by a decision rather than a permanent reputation bonus.

I checked the research notes on main, including the mechanics overview, FX notes, Tippsammlung notes and events/trader-AI notes. This note does not claim that corruption has never been mentioned anywhere in the repository. It adds a bounded state/lifecycle analysis rather than another general list of features.

## Public sources actually read

1. Official Patrician III manual, sections 10.12 and 12.7 through 12.7.2, printed pages 36 and 49. PDF downloaded and relevant sections extracted: http://cdn.akamai.steamstatic.com/steam/apps/33570/manuals/manual-patrician3.pdf . Primary documentation. Main basis for temporary influence, local versus wider voting scope, and trials.
2. GRYOnline, "Przekupstwa", updated 28 August 2019: https://www.gry-online.pl/poradniki/patrician-iii-rise-of-the-hanse/przekupstwa/z136f2 . Polish editorial guide, read in Polish. Corroborates the next-vote scope and local court connection; includes a personal example of intervening after an accusation but before judgment. Secondary support, not a new formula.
3. Patrician III community wiki, "Bath house": https://patrician3.fandom.com/wiki/Bath_house . Read. Supports the encounter with an official and the connection to elections and court outcomes. Community summary; it does not specify a complete state machine.
4. Steam discussion, "A couple Questions", posts of 14-15 April 2024: https://steamcommunity.com/app/33570/discussions/0/7130962134692962466/ . Read. Player testimony, not a developer statement. Participants disagree about whether routine bathing or prayer prevents charges. Another reply reports that purchased influence can be lost when quitting. Neither claim was independently tested; neither is adopted as an engine fact or recommended behavior.

No competitor assets, dialogue, numerical prices, vote shares, timing constants, tables or code are reproduced. No binaries, utility charts or reverse-engineering pages were used. Unwanted search results were excluded, not treated as evidence.

## What the manual supports, in our words

- A social encounter can purchase support for an upcoming decision. Its effect is temporary: the manual limits it to the next vote, rather than an enduring improvement to standing.
- Local votes require an appropriate local connection; a wider league meeting pools influence from a broader set of towns. Influence therefore has a scope, not merely a strength.
- In a council vote the support follows the player's expressed choice within a short response window. The point is a conditional commitment, not a permanent change in the councillor's beliefs. No response-window value or electoral share is adopted here.
- Trials depend on more than one input: the accusation, material presented to the court and the views of people deciding the case. The manual connects purchased influence with a favorable verdict in the town where the accusation is heard. This is a description of P3's fictional rule, not a claim about real justice.

Limits: the manual does not fully specify when every kind of influence expires, whether a court use consumes the same state as a council use, how unrelated intervening decisions interact, or what must persist across save/load. Do not fill those gaps from player memory. The guide's anecdote supports a preparation window before judgment, but does not establish an exact universal deadline. This is P3-specific research; no corresponding P4 implementation is asserted.

## Actual Almojarife code at the snapshot

- `src/game/justice.mjs` already implements opt-in charges for smuggling, fraud and piracy. A detected deed raises an open charge and infamy. `officersAct` considers open charges from the realm of the port where the player's ship is docked. A seeded check can leave a charge open; when officers act, fines, seizure and detention depend on the existing sentence rules. The charge then becomes tried and the conviction counter advances. This is not an interactive evidence/hearing screen.
- `src/game/justicewire.mjs` connects arrival handling through `arrivalJustice`, gated by justice readiness and registered realm data. Its piracy-charge path also changes reputation in the victim's home port. The comment at the top of justice.mjs is not sufficient to infer that the entire system is unwired; the caller must be checked.
- `src/game/pardon.mjs` already offers an opt-in paid pardon under its own conditions. `buyPardon` reduces cash, records payment and cooldown, and resets infamy. It does not dismiss open charges or rewrite a past verdict. It is therefore not a substitute for a scoped influence/case mechanism.
- `src/game/council.mjs`, `works.mjs` and `walls.mjs` already make treasury-driven decisions and process petitions. Their present decisions do not expose individual councillor support purchased by the player. A narrative use of the word vote does not establish a councillor ballot engine.
- No purchased-support record or action was found in these inspected justice/council paths. That is a scoped code finding, not proof that no generic social feature could ever serve a similar purpose.

## Optional design question, not an implementation instruction

Would a temporary, jurisdiction-bound intervention add a useful choice beyond the existing pardon and fines? It also adds risk: it can trivialize crime, erase the value of reputation, or silently override the council's independent role. A decision to explore it should first answer whether it belongs in this game's tone at all. The existing independent-council and treasury rules must not be bypassed merely because P3 has a superficially similar feature.

If separately approved, an original design could model an intervention as a record tied to a named case or decision and a jurisdiction. Its lifecycle, payment destination, refusal behavior and expiration would be explicit. Linking it to a specific target would be our design choice, not a recovered P3 rule. Costs, success rules and fictional participants would be ours. A UI would distinguish paying for an attempt from a guaranteed result, and would state the consequence before spending game money.

Potential tests for a future proposal, not tests added by this patch:

- Support assigned to one jurisdiction does not affect an unrelated case elsewhere.
- A resolved or consumed target cannot receive the same benefit again through replay or repeated clicks.
- Save/load preserves an unresolved intervention exactly; restarting does not create free influence or duplicate its payment.
- Refusal or insufficient game cash leaves both the case and the treasury unchanged.
- Existing pardons keep their documented scope; they do not silently dismiss charges.
- With any new feature disabled, existing charge, conviction, council and treasury behavior stays unchanged.

## What would change this assessment

A behavior-only observation could test the uncertain lifetime and save persistence of influence in P3. That would improve the comparison, but is not required to decide whether our own game should offer it. Historical claims about bribery, named offices or legal remedies would need a separate historical source review. No such claim or implementation is authorized by this note.
