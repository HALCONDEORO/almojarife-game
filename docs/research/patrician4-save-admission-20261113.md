# P4 expansion saves: file portability is not semantic compatibility

Research date: 13 November 2026. Main inspected: `bba6320`.
Clean-room documentation only. No code, format conversion, compatibility promise
or release-scope change. No proprietary save file, extracted game data, source
quotation, slogan, balance table or excluded utility reference was used.

## Finding and prior work

The P4 expansion manual explicitly says base-game saves are incompatible with
Rise of a Dynasty because land trade required substantial world/city changes.
The same section explains moving save files between computers. Those statements
are compatible: being able to copy a file does not mean a different edition can
interpret the world and commitments it describes. A product requiring the base
game likewise does not promise continuity of an existing campaign.

Almojarife already has versioned saves, import/export, slots, validation,
normalization and protected import rotation. This is not a missing-save-feature
proposal. The narrow research value is an explicit admission policy when future
world/content changes go beyond the current loader's declared repairs.

Actual grep of the research inventory found the parity note already marks saves
and export/import implemented. Scenario, university and coop notes mention
versioned state and future compatibility; the economy audit warns against
inventing missing historical accounting. None of those references grants a
universal migration promise. This note does not replace their feature-specific
save questions or the copy-policy study.

## Sources and limits

| Ref | Source | Contribution |
| --- | --- | --- |
| S1 | Publisher expansion manual, Previous saves: https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf | Primary explicit base-to-expansion incompatibility and stated world/city reason; also discusses file copying. Does not specify a converter, internal format or all later patch combinations. |
| S2 | Official Steam expansion page: https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/ | Lists base-game requirement and added land-network content. Product relationship, not a save-conversion guarantee. |
| S3 | Publisher product page: https://www.kalypsomedia.com/uk/patrician-iv-rise-of-a-dynasty | Describes land-trade additions and the required base product. Same publisher context, not independent replication of S1. |
| S4 | Steam Savegames discussion, replies across November dates in different years: https://steamcommunity.com/app/57730/discussions/0/341537388325449096/ | Users ask about copying saves to another computer and platform; replies suggest a storage location. No reproduced cross-platform or cross-edition success is established. |
| S5 | GameSave Manager community discussion: https://steamcommunity.com/groups/GameSaveManager/discussions/0/3175526477768579318/ | A user reports that a main-save backup omitted separately saved route/settings material and explicitly leaves another configuration location unresolved. Testimony about backup scope, not an audited file manifest or recommendation to use a utility. |
| S6 | Rick Moscatello, CPUGamer expansion review, July 2011: https://www.cpugamer.com/reviews/patrician-iv-rise-of-a-dynasty-review | Independent context for new systems such as land trade and cooperative play. Does not verify save compatibility or recovery. |

All pages were fetched and relevant text read. Only S1 directly establishes the
edition incompatibility. Product pages, forum reports and review do not count as
independent converter tests. No commercial save files, archives or third-party
backup program were downloaded or inspected. No P4 compatibility matrix or
cross-platform restoration was executed.

## Keep separate contracts separate

- **Readable bytes:** a file can be selected, copied and parsed.
- **Admissible state:** its schema, references and supported game rules are valid
  for this runtime and supplied world.
- **Declared migration:** specified old meanings can be translated without
  silently fabricating money, inventory, geography or completed commitments.
- **Recovery:** a failed write leaves a usable previous copy; this does not prove
  the newly accepted state has the same gameplay meaning.
- **Complete backup:** the intended scope may include reusable policies and
  settings outside a campaign snapshot. Do not infer that scope from a save name.

The source's incompatibility is a documented product decision, not proof that
migration is technically impossible. Nor is it authority for us to discard
existing players' campaigns. Our own policy must state supported transitions,
what changes, and when an unsupported transition is refused without replacement.

## Current main audit

| Inspected path | Existing contract and boundary |
| --- | --- |
| `src/game/gamesave.mjs`, `serialize` | Serializes version, date, company and state while omitting the static world. A load is therefore interpreted against a world supplied by the caller, not a world archived by this serializer. |
| `migrate`, migration registry | Rejects a newer format and requires a declared step for an older format. The inspected registry has no steps; the presence of a migration loop is not proof arbitrary old formats can load. |
| `deserialize`, fleet/market/profile checks | Explicit validation, repairs and normalization exist. Unknown voyage geography rejects; stationary invalid locations can be repaired to a fallback. These are different policies, not a universal reference-preservation guarantee. |
| `migrateRetired`, market backfill | Known retired identifiers are translated with special treatment for observations; missing market rows can be created for added goods/ports. These bounded adaptations already exist. They do not define arbitrary city removals, changed route meanings or future edition conversion. |
| `web/main.mjs`, file import and Continue handlers | File import unpacks before rotating into storage; Continue rereads the current stored save at activation instead of relying on an earlier title-screen snapshot. This is useful existing admission and stale-state protection. |
| `web/savefile.mjs`, `restoreRotate`, `finishPendingRotation` | Writes are read back; parking and backup rotation preserve recovery copies through supported failure cases. A thrown write may already have changed storage, so callers cannot assume failure means no effect. |
| `src/game/saveslots.mjs` | Named copies, slot validation, readback and unavailable/corrupt states exist. Slots are not independent evidence a save matches any future world. |

A real source grep preceded these reads. No separate world/content identity
field is emitted by the inspected serializer envelope. That bounded finding does
not establish an exploitable loader bug or that all content changes need a
fingerprint. A matching format version alone cannot be claimed as experimental
proof of every world transition. This note has not audited every embedded state
field or added a blanket save-rejection rule.

Author baseline tests for gamesave, import write verification, error messaging
and Continue freshness pass. Those existing tests are not a cross-edition
migration test, independent review, full future-world matrix or visual UI audit.

## Own recommendation and acceptance questions

Retain the existing loader and recovery contract. Before a future geography or
rules expansion, classify its transitions as supported unchanged, supported with
an explicit migration, or unsupported. Test against representative owned assets,
active journeys, obligations, observations and feature flags, not just a file
that parses. Do not retrofit a new identifier without deciding what to do with
existing files that cannot contain it.

If a specific migration is chosen later:

- Preserve the original bytes for recovery and preview meaningful changes before
  replacing the live campaign. A save copy is not consent to reset progress.
- Define how changed identifiers affect ownership, route stops, destinations and
  pending settlements. Unknown references must not quietly become free assets.
- Keep inventories and balances conserved under declared mappings; histories
  are observations rather than additive stock. Do not invent old cost basis.
- Repeated loading/migration must not repeat a reward or repair. Specify whether
  the source object is consumed or copied; the current loader can normalize its
  parsed input before constructing the returned state.
- Reject unsupported transitions with an actionable reason and keep the old
  campaign recoverable. Distinguish incompatible content from corrupt bytes and
  unavailable storage rather than claiming every failure is the same.
- Test silent writes, writes that mutate then throw, interrupted rotation and
  subsequent recovery. Do not weaken current storage guarantees while adding
  compatibility checks.
- Define export scope: campaign only or a separate explicit settings/policy
  bundle. Do not promise complete-device backup from a campaign file alone.

No new runtime work is approved. A content-compatibility label is only one
possible own design after the supported transition set is known, not a feature
recovered from the proprietary save format.

## Open P4 questions

Were any later conversions officially supported? Which patch/edition pairs can
share saves? Does copying between operating systems preserve all state? Which
separate configuration files are needed for a complete restoration? What is the
behavior on a failed load, and is the previous campaign retained? The sources
here do not settle these. Do not reverse-engineer proprietary files or promote
an incomplete forum backup report into answers.
