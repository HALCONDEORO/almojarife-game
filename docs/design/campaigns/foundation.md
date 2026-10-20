# Campaign foundation, not connected

Pure metadata/state/events. No game or web activation. First draft objective is buy, sail, arrive, sell at destination, read report. This is not a net-profit test. Historical context is separate from fictional objectives. Later chapters metadata only. Existing game victory/deadline rules unchanged.

Integrating callers must send explicit events only after successful real actions, not parse logs. Tests cover order, wrong arrival, early report, zero quantity, unknown IDs, free/legacy no-op, save roundtrip and inactive future chapters. Next PR must add ES+EN UI, successful action hooks, save compatibility and reconcile campaign completion with ordinary victory/deadline rules before activation.
