# Autosave acknowledgement and recovery

This contract describes the existing browser writer on main f78e925. It adds regression coverage, not a new save format or a new persistence mechanism.

## Boundaries

- The title-screen background game must not overwrite the player's save.
- The writer reports success only after the storage read-back equals the serialized payload it just wrote.
- A quota exception or a silently dropped write reports failure. In the exercised cases, the prior committed payload remains unchanged.
- Failure offers an export of the current game. That export is generated when clicked, not from the prior committed save.
- A later successful write removes the persistent failure warning.
- The automatic changed-payload wrapper retries an uncommitted state instead of treating the previous failed attempt as success.

These are synchronous browser-storage checks. Matching read-back does not guarantee survival of device failure, browser eviction, user deletion, or every external storage fault. The tests do not claim transactions across multiple storage keys or rollback after arbitrary corruption. Backup rotation and manual slots have separate tests.

## Tests

`test/autosave-commit-contract.test.mjs` runs the actual `autosave` and `autosaveIfChanged` function bodies from `web/main.mjs` in a small DOM/storage harness. It does not replace them with a second implementation. The serializer is a deterministic fixture: existing save-format and replay tests own serialization fidelity.

Related command:

```
node --test test/autosave-commit-contract.test.mjs test/autosave-extra.test.mjs test/savefile.test.mjs test/saveslots.test.mjs
```

The read-back guard mutation must fail the silent-write and subsequent-recovery cases. A screenshot of the Spanish menu demonstrates the unchanged warning/export flow and its recovery, not a before/after redesign.

The design principle is original and general: asking to save, writing a payload, and acknowledging a verified write are different steps. No third-party code, constants, assets, or private research records are needed by this contract.
