# El Almojarife v0.5.0-beta.3

Candidate release notes. Not published yet. The intended audience is public, as a GitHub pre-release.

## Changes

- Letters of marque and prizes, council pardons and grain embargoes are connected to the playable host. Justice and peace data have bounded loading and explicit unavailable states.
- Living-city, household, calamity and regional-rival defaults are enabled. The council view exposes the connected systems.
- The tutorial teaches a profitable sale of known paid cargo, remembers the voyage taken before selling, and saves the council visit immediately. Old v1 tutorial saves keep their original rules.
- Route controls stay reachable on a 1280x720 desktop. Docked convoys depart together when a free-navigation right-click selects a port. Open-sea convoy orders and mid-voyage convoy course changes are still refused.

## Tested web checkpoint

Game source `23c35a3d93be7ed983eb74e73fc40128ba11fb37`, exact Pages deployment successful. Real Spanish desktop UI checks cover a new game, losing-sale rejection, Cádiz→Huelva trade, save/reload, route creation, council completion, barque construction through day 8 and two-ship convoy departure. These are actual UI actions, not injected scenario saves.

All merged changes had independent exact-head review and green CI/Balance. #639 Balance PASS uses a conservative L2 builder and same-horizon NPC ON/OFF 0.25-4x policy. It does not pass the retired absolute 30x criterion or prove legacy L3 robustness. Historical L3 bankruptcies remain visible in the repository evidence.

## Beta limits

This is a desktop keyboard-and-mouse game. No full long campaign, every calamity/justice encounter or all old 0.x saves are certified. Export important saves before trying a new beta. The final binary provenance, platform smoke checks and asset list must be verified before publishing these notes. Packages are not claimed platform-code-signed; operating-system warnings may apply. No paid signing or other purchase is part of this release.

Play the web game: https://halcondeoro.github.io/almojarife-game/

Detailed checkpoint and rollback: [BETA3-CHECKPOINT.md](BETA3-CHECKPOINT.md).
