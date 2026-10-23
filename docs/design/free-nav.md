# Free navigation (right click sends the selected ship)

Flag `g.freeNav` (default off). Off: `doGoTo` refuses, the right click on a port keeps opening the port menu, nothing new is saved, the simulation is identical.

## Rule
- With the flag on, a right click on the map sends the selected ship there at once, with no Sail button: on a port, or on a point of the open sea. It works for a docked ship and for a ship already sailing. Other ships are never touched.
- A ship only moves along the sea lanes of the world graph, so no leg crosses land. The clicked point is snapped to the nearest lane; a click farther than 90 km from every lane is refused ("No navigable sea there."). A click within 12 km of a port on its lane means the port.
- From a ship at sea the new route starts where the ship is: it goes on to one end of the lane it is sailing and from there by the cheapest lane route (never through land, never a teleport).
- A free point is stored in the voyage (`pts`, with its lane), so save, load and the position at sea work. On arrival at a free point the ship stays there, "holding position" (`voyage.anchored`): it cannot trade, has no sea wear and meets no random encounter. A new order moves it again.
- Ships in a convoy are not ordered one by one (the convoy sails together to a port). Crew minimum, held ships and the usual speed factors (crew, captain, wind) apply as in an ordinary sailing.
- The sailing log (voyage profit table) opens a line only for a port to port departure. The player never sees an internal point id: a free point is called "open sea".

## Not done here
- The right-click contract on map labels: the label capture fix (pointer-events none on the text) comes from the map patch; this code reads the clicked port from the circle.
- Bots do not use free navigation.
