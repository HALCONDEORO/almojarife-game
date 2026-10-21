// Navigation/city flow rules, Patrician-3 style: the sea map is only a map; the city is a
// separate view you enter through your own docked ship. Pure decisions so the DOM layer stays thin.
/** Click on your own ship marker: docked ships open the city view; ships at sea open their floating card. */
export function shipClickAction(g, i) {
  const sh = g?.ships?.[i];
  if (!sh) return { kind: "none" };
  return sh.voyage ? { kind: "card", ship: i } : { kind: "city", ship: i };
}
/** Click on a port: with one of your ships docked there you enter the city; without presence you
 *  only mark it as destination (same rule as P3: no office or ship, information only). */
export function portClickAction(g, cityId) {
  const i = (g?.ships ?? []).findIndex((sh) => !sh.voyage && sh.at === cityId);
  return i >= 0 ? { kind: "city", ship: i } : { kind: "target", city: cityId };
}
