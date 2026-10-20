# City-first window proposal

Design-only route: web/mock/city.html. Not linked from the game. No save mutation or transactions. The Spanish mock is for visual review; production must use the game's ES/EN translation system.

The city stays visible behind draggable, closable building windows. Seven original SVG sketches distinguish the market, shipyard, tavern, bank, warehouse, home house and visiting office. Sketches are placeholders, not final art. Current 3D scene is reused. No third-party game assets.

Home house appears conceptually in the chosen initial city (Cadiz example); a visiting office appears in Lisboa. These are review controls showing both cases, not permission to place a house in a second city. Costs and capacities remain uncalibrated. No spending buttons execute anything.

Bottom controls propose city buildings plus map, ships and reports. The last three display a placeholder explanation. Current 3D building clicks open corresponding mock windows; house and office are accessed from review controls because their scene hit targets are not built yet.

Checked: desktop 1440x900 screenshots of market, home and office; simulated dragging of shipyard to the left; 390x844 mobile screenshot with scrollable window and reachable bottom controls. Not tested on physical phones. No full accessibility or keyboard-drag support yet. Scene animation is existing code, not a new living-city implementation.

Before production: user review, ES/EN content, real panel integration with save-safe state, proper home/office gating and costs, keyboard/focus management, touch drag, reduced motion, performance and click-through tests. Campaign and start screen proposal are separate work.
