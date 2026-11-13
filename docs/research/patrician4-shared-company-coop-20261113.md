# P4 cooperative control of a shared company: clean-room note

Research date: 13 November 2026. Inspected Almojarife main: `44ce772`.
Documentation only. This does not approve multiplayer development or change the
single-player roadmap.

## New slice and method

P4's Rise of a Dynasty addon documents several humans managing one company,
including joining an already-running game. Existing research on this main covers
P3 shares between companies and briefly lists P4 multiplayer as an addon feature.
It does not analyze the shared-control contract. This slice is not P3 competitive
multiplayer, company investment, land transport, university research or treasure
hunting.

Public manual, product description, contemporary review, game catalogue and
community pages were fetched and read. No proprietary code, executable internals,
modding documents, assets, copied dialogue or source-game balance figures were
used. No multiplayer session was run. Documented interaction is not evidence of a
particular network protocol or of current server availability.

## Findings and evidence limits

### One company, several controllers

The addon manual says participants manage the same business. It explicitly warns
about conflicting control of the same convoy and recommends agreeing who handles
which ships, towns or regions. During sea battles, participants can each control a
ship when suitable ships are available. This describes shared ownership with
potential control contention, not parallel independent businesses that happen to
trade in the same market. [S1]

The contemporary review reports access to the same company cash, convoys and
counting houses. It recommends agreeing on regions and spending budgets through
communication. Those budgets are social agreements in the review, not evidence
of engine-enforced account limits, separate wallets or exclusive regional locks.
The manual's warning likewise does not reveal how simultaneous orders are ordered
or rejected. [S1, S2]

### A running business can admit another participant

The manual's introduction says participants may join and leave during play. Its
session instructions describe hosting through a new or loaded game, online or LAN
visibility, and a distinction between public discovery and a private session found
through a host identifier. The product page corroborates cooperative company
management; the catalogue repeats join/leave support but is not independent proof
of the underlying implementation. [S1, S3, S5]

A community discussion reports a host approval prompt when someone asks to join.
Treat this as historical player testimony, not a tested guarantee for every build.
A private-session search convention is not proof of strong authentication or a
sufficient access-control design for Almojarife. [S4]

The manual documents text and voice communication, a player list, muting, and the
host's ability to ban a participant. These are documented coordination/moderation
surfaces. They do not establish that leaving transfers host authority, preserves
an offline participant's role, or safely rolls back their outstanding commands.
Those lifecycle questions remain open. [S1]

### Cooperative does not mean competitive parity

The community guide distinguishes cooperative play from competitive multiplayer.
That agrees with the manual's shared-business scope. Do not infer that adding a
second controller would provide rival companies, separate victory conditions,
private economies or share trading. Those are different designs. [S1, S6]

The design lesson is bounded: a second human may share management workload without
adding an economic opponent. The review's convenience assessment is an opinion,
not a measured reduction in clicks, difficulty or session length. [S2]

## Actual Almojarife delta on the inspected main

| Area | Existing code | What is not established by it |
| --- | --- | --- |
| Company state | `src/game/game.mjs`, `newGame`, creates a game with company cash, ships, warehouses, profile and AI rivals | There is no per-human controller identity or participant authority in this constructor |
| Commands | `orderShip`, `buyCaravel`, `doSail` and other functions validate and mutate a supplied game; `web/main.mjs` calls them from UI handlers | These entry points do not authenticate a remote participant or serialize competing client requests |
| Time | `web/main.mjs` keeps local playing/speed/time-accumulator state | A local time control is not a shared-session clock or a policy for simultaneous pause requests |
| Persistence | `src/game/gamesave.mjs` serializes company and game state without static world; the web app saves through local storage and exports | A save snapshot is not a join handshake, command log, membership record or network resynchronization protocol |
| Rivals | `src/game/rivalhouses.mjs` models regional AI competition | An AI house is not a second human controlling the player's company |

A search of tracked runtime/view/web/desktop sources found no gameplay cooperative
session implementation. The desktop smoke test's debugger WebSocket is test
infrastructure, not multiplayer transport. This is a bounded inspection, not a
claim about every possible hosting service outside the repository.

Existing game-save and shipyard suites were run as an author baseline and pass.
They test local behavior, not command races, remote authority or network safety.

## Own-design recommendation, not an approved implementation

Keep this as a later architecture option. It is a large cross-cutting feature,
not a second UI pointing at a shared save file, and it should not delay the current
single-player loop. Do not import P4's permissive company access as the default for
an exposed online service.

If selected, decide the authority model first. A useful narrow prototype would
have one authoritative simulation, identified participants, validated commands
and explicit command ordering. Each accepted command should have a unique identity,
a revision expectation and a result that can be safely replayed to a reconnecting
client without charging money or moving cargo twice. These are our engineering
proposals, not recovered facts about P4's internal protocol.

Keep local selection, camera and open panels separate from shared company state.
A joining player should receive a coherent revision and then ordered updates,
not independently advance a copied game and merge its save later. Ship claims or
regional assignments may help coordinate people, but decide whether these are
advisory labels or enforceable permissions. A chat agreement alone cannot enforce
a spending cap.

Membership removal must revoke future command authority without duplicating,
undoing or dropping already-committed economic actions. Define owner approval,
visibility, save/export authority and host-loss behavior separately. None of these
choices is settled by P4's store listing.

### Candidate tests if the feature is chosen

- Simultaneous purchases cannot overspend one company wallet; the rejected command
  has no fee, stock or cargo side effect.
- Replayed/retried command identities return the original outcome without a second
  payment, ship order, voyage or ledger entry.
- A stale command for a sold, moved or already-assigned ship fails visibly.
- Joining mid-tick yields a coherent state, not a mixture of pre/post-tick balances.
- Disconnect, reconnect and membership revocation preserve accepted commands and
  reject unauthorized new ones, including outstanding delayed requests.
- All participants see the same committed game revision and authoritative time;
  local panels and selections do not overwrite one another.
- Single-player saves and deterministic fixtures remain compatible with no session
  present; imported local files never grant online participant permissions.

## Open verification work

P4 command conflict resolution, synchronization model, host migration, pause/speed
arbitration, reconnect recovery and save authority are not established by these
sources. Current online service availability was not checked and is not claimed.
Permitted observation would be needed before describing those as P4 behavior.

## Sources

All fetched 13 November 2026; no source-game quantities are adopted.

- **S1, primary:** Kalypso, Rise of a Dynasty English addon manual, Introduction
  and Multiplayer mode / Joining / Creating / Player list sections. Publication
  date not shown in inspected text. Strong for the documented shared-company,
  join/leave and moderation interfaces, not current online operation.
  https://shared.steamstatic.com/store_item_assets/steam/apps/57730/manuals/P4%20Addon_Manual-enUK.pdf
- **S2, contemporary review:** PC Games, Viktor Eippert, multiplayer review page,
  29 March 2011. Reports shared treasury/access and coordination problems.
  https://www.pcgames.de/Patrizier-4-Aufstieg-einer-Dynastie-Spiel-15623/Tests/Patrizier-4-Aufstieg-einer-Dynastie-im-Test-Dieses-Add-on-hat-wirklich-viel-zu-bieten-817931/2/
- **S3, publisher description:** Steam store, Rise of a Dynasty. Corroborates
  cooperative company management only; no security/protocol claims derived.
  https://store.steampowered.com/app/57730/Patrician_IV_Rise_of_a_Dynasty/
- **S4, community testimony:** Steam, *How to start a co-op game??*, thread started
  23 July 2013, relevant reply dated 24 September 2014. Join approval anecdote only.
  https://steamcommunity.com/app/57730/discussions/0/846959876011442947/
- **S5, catalogue:** Gamepressure, Rise of a Dynasty entry, date not used. Its
  feature description corroborates shared organization and join/leave; the site's
  AI-generated review summary is not used as evidence.
  https://www.gamepressure.com/games/patrician-iv-rise-of-a-dynasty/zf28b3
- **S6, community guide:** Steam, *Patrician IV Guide*, Play Options section,
  publication date not used. Corroborates cooperative versus competitive scope.
  https://steamcommunity.com/sharedfiles/filedetails/?id=682751098
