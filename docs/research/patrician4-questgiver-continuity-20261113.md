# P4 add-on: a recognizable quest giver across the task lifecycle

Date: 2026-11-13. Clean-room documentary research and code inspection.
Base: `65f6088`. Documentation only; no copied artwork or executable-derived data.

## Answer and scope

The Rise of a Dynasty manual documents a small portrait beside a quest when it
is accepted and again on completion, helping the player recognize its source.
The publisher's product descriptions also list quest-giver portraits as an
add-on improvement. This is a continuity cue, distinct from the player's own
portrait or a generic category icon. It does not establish an NPC relationship
simulation, unique identities across all quests, or a universal P3/P4 feature.

Almojarife already has player portraits and its own authored mission narrative.
The inspected council-contract and campaign paths do not carry a shared visual
quest-giver identity from acceptance to completion. A future design experiment
could first show a stable issuer name/role and optional original badge on both
ends of a task, without adding a social simulator or copying competitor art.
Keep this separate from task rules, rewards, political standing and scenarios.

## Sources and confidence

- **S1, official add-on manual, printed/PDF page 7, Portraits:** describes the
  quest NPC portrait at acceptance and completion. This is the primary basis for
  the lifecycle finding. It also distinguishes the player's selectable portrait.
- **S2, Kalypso product page:** explicitly lists portraits for quest givers and
  players. Corroborates the feature's product context, not persistence details.
- **S3, Steam publisher product page:** same broad feature claim. This is another
  publisher distribution surface, not independent behavioral validation.
- **S4, CPUGamer review, 2011-07-12:** describes many tasks and the management
  burden of the expansion. Context only; it does not verify portrait identity or
  reuse at completion.
- **S5, Worthplaying announcement, 2011-01-28:** documents new assignments and
  presentation improvements. Announcement context, not a test of this mechanism.
- **S6, Steam community guide:** documents different quest sources, including
  civic/guild and tavern tasks. Context for task-source recognition only, not
  proof that every source has a unique portrait or retained historical identity.

No live game, current build or source pixels were inspected. The manual does not
settle portrait uniqueness, reuse between NPCs, text alternatives, failed-task
presentation, localization, portrait changes or long-term issuer persistence.
Those remain design questions. No portrait set, dimensions, character likeness,
source dialogue, exact game values or source slogans are reproduced.

## Actual code and inventory inspection

Read `docs/ROADMAP.md`, its historical-status warning, and the research inventory.
The parity list already records player profile/portrait creation; that does not
mean quest-giver continuity exists. A real search for `portrait`, `questgiver`,
`issuer`, `giver`, `comitente`, `contractAccept`, `contractDone` and `missionView`,
then function reads, found the following on the pinned base:

| Path | Current behavior | Bound on the finding |
| --- | --- | --- |
| `src/game/profile.mjs`, `src/view/portraitchoices.mjs` | Original player portrait generator and accessible choice controls exist. | Player customization, not a quest-giver registry. |
| `src/game/contracts.mjs`, offer roll and acceptance | Offers have an ID, goods, quantity, reward and deadline; active entry adds city and delivery progress. Acceptance notification names city and delivery terms. | No issuer-person or issuer-portrait field in these inspected constructors. City identifies an institutional source already. |
| `src/game/contracts.mjs`, completion/expiry | Successful delivery removes the active entry, increments completion count and posts completion terms; expiry posts failed terms. | These notification constructors do not propagate the offer ID or a visual issuer key. Do not claim all game history is absent. |
| `src/game/campaigns.mjs`, mission definitions | Original narrative names people or institutions in prose and uses stable mission IDs. | Narrative identity exists, but is not a separate shared portrait/issuer key. |
| `src/game/campaigns.mjs`, completion/activation and `missionView` | Posts mission narrative and projects mission IDs, titles, steps and progress. | The inspected projection/notification constructors do not expose a quest-giver portrait key. |
| `web/main.mjs`, city contracts and mission summary | Builds contract offers, active delivery lines and a mission-status summary. | No quest-giver portrait binding in those inspected render paths; not a pixel-level audit of every screen. |
| `src/view/ledgerview.mjs` | Uses translated contract/message templates for acceptance and outcome. | Existing text remains useful; an image must not become the only identity cue. |

An isolated non-committed fixture created an offer, called actual acceptance and
completion functions, and inspected emitted records. The active contract kept
its offer ID; the acceptance and completion messages had task terms and city but
no offer ID or issuer portrait. This is a narrow constructor-level check, not an
organic gameplay, save/load or visual test. Unchanged contract, contract-line and
campaign baseline: 37 tests passed, none failed. No implementation is included.

## Ranked options and future contract

1. **Prefer source continuity in text first.** Show an institution/person label
   consistently at offer, active task and outcome. If an institution commissions
   the task, do not invent a private individual merely to fill a portrait slot.
2. **Optional original badge or portrait second.** Use our own licensed/generated
   art or an institutional seal. Pair it with the same readable name and role;
   preserve the label if art fails to load. Do not reuse the player's portrait as
   an implied NPC without an explicit design decision.
3. **Defer persistent NPC social state.** Portrait continuity alone does not
   justify favors, relationship scores, office succession or procedural biography.

For a future implementation, separate `taskId` from `issuerId`; one source can
issue multiple tasks, and an institution can persist when its officeholder
changes. Decide whether outcomes snapshot the accepted source's label or resolve
its current label; otherwise history can appear to change retrospectively.
Verify repeated tasks, same task type in different ports, expired/replaced offers,
completion replay, save/load, missing assets, ES/EN labels and keyboard access.
UI inspection and original asset provenance are required before a visual change
is ready. This note authorizes none of those changes or new assets.

## Source URLs

- S1 https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- S2 https://www.kalypsomedia.com/us/patrician-iv-rise-of-a-dynasty
- S3 https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/
- S4 https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review
- S5 https://www.worthplaying.com/article/2011/1/28/news/79553-patrician-iv-expands-with-rise-of-a-dynasty-add-on-screens/
- S6 https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
