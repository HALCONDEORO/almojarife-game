# Automatic daily encounters and report log

Stacked on rules module #102. Enabled only where existing eventsOn is true. Per sea day/ship candidate frequency2.5%, half pirates/half storms, deterministic seed/day/ship. Mark each ship/day evaluated even on miss; save/restore prevents replay. Unique event ID and bounded80encounter history, newest20 shown in report/voyage overlay, plus existing inbox and log ES+EN. All player ships checked before daily movement; ordinary upkeep/damage still applies. No battle screen.

New random pending pirate/storm choices excluded to avoid duplicate systems; old pending saves still resolve through old choice functions. Other pending events unchanged. Captains Defence/Weather are NOT advertised or added to roster in this stage; pure rules support bounded optional fields but no normal hire supplies them. Navigation remains active; Trade inactive.

Focused15tests pass. Initial test incorrectly expected undefined pending whereas newGame initializes null; corrected assertion, no game change for that. Actual day6 seed13 test save screenshot inspected: automatic day2 pirate raid with10hull loss,0cargo(no cargo aboard),1day delay, no forced choice. Test setup only, not a normal player save. Frequency/balance not proven; need fleet exposure simulation before tuning. No physical mobile validation yet.

BO correction before integration: applyEncounter now reduces both cost books: ship.basis proportional to remaining cargo (rounded as existing events), deleting at zero; global g.basis qty/cost removes lost share too. Added partial assertions on both and total loss deletion/global zero test. Earlier rules module on main had the ship.basis omission, but was not connected. This PR fixes it before activation.
