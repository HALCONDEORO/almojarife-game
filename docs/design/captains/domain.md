# Captain domain candidate, not connected

Pure deterministic roster and hire/dismiss functions plus bounded navigation/salary readers. Port roster is stable, does not replenish, and a hired/dismissed candidate never respawns. All names are original fictional names, not historical captains. Rejects foreign ship object, sea, wrong port, duplicate, no cash and game over before mutation. Fee120 and wage2 are candidate values. Navigation levels1..3 give theoretical1.04..1.12 multiplier.

No game/UI imports this module yet. No actual sailing speed, salary, defence, weather or trading effect is active. A function returning a multiplier/wage is not an integrated effect. Salary/estimates/actual travel integration needs its own tests and ES+EN UI before activation. Existing save serialization retains optional fields and old missing fields are neutral.

Four tests cover deterministic no-mutation roster, fee/assignment/dismiss/no-respawn, rejected-action no-mutation, cross-ship duplicate, save roundtrip, old/malformed safe reads and dismiss constraints. Not a balancing proof or UI deliverable.
