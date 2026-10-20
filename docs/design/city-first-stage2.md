# City-first entry, stage 2

Starting a new game, continuing a save or importing a save opens the real 3D city automatically when the selected ship is docked. An at-sea save remains on the map. Return to map is always available. No save format or economics change.

Bottom Ships opens existing selected-ship controls and its Route tab, not a new fleet dashboard. Reports opens the real report/voyage overlay above the city. Menu opens the real pause/save/menu overlay. Closing these preserves the city. Quitting returns the panel to its map parent before the title screen.

Keyboard priority respects title/report/menu overlays before processing city Escape. Added labels are ES/EN. Current city is still the city of the selected ship at entry; changing selected ships across ports does not rebuild the scene in this stage. No house/office gating, new interior art or city life in this PR.

Headless Chrome interaction checks: new-game entry has city without clicking 3D, Reports opens above city, report close preserves city, Menu/resume works, Ships opens real route controls. Desktop screenshot inspected. Further checks before merge: mobile and English rendering. Physical phones unverified.
