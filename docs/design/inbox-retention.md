# Inbox retention

The inbox keeps the existing hard `MAX_INBOX` cap and newest-first ordering.
On overflow, `post` removes the oldest entry that is not an unread action.
Read actions, notices and log entries are equally replaceable; no new message
categories or importance rules are introduced. The existing classifier is shared
by retention and presentation, with the old view exports retained.

If every entry is an unread action, the oldest action is removed to keep the
hard cap. If the incoming entry is a notice and all older entries are protected,
the incoming notice is removed instead. This is bounded priority retention, not
permanent storage or a guarantee that all unread actions survive arbitrary floods.
Reading an action makes it replaceable on a later post. No messages are
reordered, synthesized, automatically acknowledged or resolved.

Enabled by default, including existing saves. Set the game state's
`protectUnreadActions` to `false` to use the exact previous single-pop path.
The switch is saved with normal game state, with no migration or UI setting.
Disabled mode deliberately does not normalize a pre-existing oversized inbox,
matching the previous behavior. Enabled mode trims oversized inboxes on the next
post. It cannot recover entries already discarded by older versions.

Tests cover classifier identity, notice floods, acknowledgement, replacement
order, all-action saturation, oversized legacy state, save/load and byte-for-byte
legacy output with the switch off. Existing ledger, save and message-triage
suites remain applicable.

Visual evidence uses a local running game with the patch applied: post an unread
maintenance warning and an unread court-topic message, then more arrivals than
the cap. Save/load the fixture, open Messages, and verify both original unread
entries remain. Captures cover ES/EN at 1280x900 and 390x844. The patch changes
retention, not visual layout or message wording.

The shock economy test now observes active shock IDs during the simulation,
not the final inbox: bounded notices are not an occurrence history. This keeps
the original assertion that real shocks happened without weakening retention.
