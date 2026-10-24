# Captain experience (backlog item 7)

Flag `g.captainXp` (default off). Off: `gainXp` returns at once, nothing is written on the captain, the simulation is identical.

## Rule
The three captain skills that already exist (navigation = manoeuvre, weather, defence) grow with use. Levels stay 0-3, so every reader (speed, storm losses, pirate fights, battle) is untouched.
- Experience: +1 navigation per voyage finished; +1 weather per storm, +2 for a severe one; +1 defence per pirate encounter survived, +2 if the pirates were repelled.
- Cumulative experience for level 1, 2, 3: 5, 15, 35 (our own first numbers, to be measured with the income tooling before any flag ON).
- A hired captain counts as already holding the experience of the hired level. Levels never fall.
- A level-up raises the daily wage to the new level-based wage (captainPrice), never above the stored bound of 10.

## Not done here
- A separate trade skill (price bonus) touches the market and needs its own measurement; the study text gives only a rough reference figure, which is not used.
- No text or screen shows experience; a later view can read `ship.captain.xp`.
