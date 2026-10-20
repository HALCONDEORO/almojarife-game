# Real city windows, stage 1

Real game panels now move into a floating window over the existing 3D city when the player enters the current 3D view. A building message from the actual same-origin scene iframe opens its real panel without destroying the city. Bottom controls offer market/shipyard/tavern/bank/warehouse and return to map. Window closes separately; map return restores the original panel DOM.

Pointer drag and arrow keys on the focused title handle share clamped bounds. Close returns focus to the market control. Buttons and labels use current ES/EN translations; added map-return and handle-help labels are bilingual. No new saves, material costs or NPC rules.

Verified in headless Chrome: real shipyard window over city, mobile 390x844 bank, keyboard move, window close preserves identical scene iframe, tab title updates, map return restores panel to original parent, reopening works. One pure bounds unit test. Screenshots inspected. Not tested on physical phones.

Limits intentionally retained for small reviewable steps: city is still entered through the 3D button (automatic city-first entry next); no new interior illustration; house/office rules remain unimplemented; bottom ships/reports controls not yet added; shortcuts inside the scene iframe and full focus handling need a follow-up. Existing main game continues in the background as before. Message handling now checks event.source as well as origin and known building ID.
