// Optional goods: data that joins the world when a game starts with the matching flag (on by default; pass false/1 to disable).
// With the flag OFF nothing here runs, so the world, the markets and every simulation are exactly as without this file.
/** Pottery: a processor good (2 timber -> 2 pottery, study 5 pottery A, base 40 so margin +54% at base prices). Makers: Valencia (Manises) and Sevilla (Triana),
 *  sourced in docs/design/production-chains-study.md section 8 (Manises: doi 10.26882/histagrar.090e03f, revistas.um.es/medievalismo/article/view/210581;
 *  Triana: doi 10.33349/2014.85.3440). Porto is not listed: no source. Consumers: the study section 4.4 proposal plus barcelona, bilbao, tanger, cartagena, alicante (added after the 4-seed kiln measurement V1; no historical source yet). The kiln building exists only with this good. */
export const POTTERY = Object.freeze({ good: "pottery", base: 40, makers: Object.freeze(["valencia", "sevilla"]), consumers: Object.freeze(["lisboa", "cadiz", "palma", "malaga", "argel", "oran", "barcelona", "bilbao", "tanger", "cartagena", "alicante"]) });
export function withPottery(world) {
  const w = structuredClone(world);
  w.goods[POTTERY.good] = { base: POTTERY.base }; // NPC traders deal pottery like any good, same rule as saffron. This supersedes the earlier measurement that had made pottery player-only (probe6: -165k NPC cash in silk/pepper holds at 1y; A-scenario 102k vs 461k at 10y).
  for (const c of w.cities) {
    if (POTTERY.makers.includes(c.id) && !c.makes.includes(POTTERY.good)) c.makes.push(POTTERY.good);
    if (POTTERY.consumers.includes(c.id) && !c.needs.includes(POTTERY.good)) c.needs.push(POTTERY.good);
  }
  return w;
}

/** Legumes (chickpeas and broad beans): the poor's second staple. Sources: González-Mariscal, Revista de Historia Económica 2015 (Seville 1521-1540:
 *  a labourer ate 148 g/day against 450 g of bread; chickpea 5.2 mrs/kg against bread 6.6, so base 20 against grain 22);
 *  the best white chickpeas came from Coria del Río and Puebla del Río beside Seville (historiacocina.com/es/sevilla-legumbres, on Pedro Barroso),
 *  so Sevilla is the only producer. Consumers: the big ports and Cádiz beside the producer. */
export const LEGUMES = Object.freeze({ good: "legumes", base: 20, makers: Object.freeze(["sevilla"]), consumers: Object.freeze(["lisboa", "valencia", "barcelona", "cadiz"]) });
export function withLegumes(world) {
  const w = structuredClone(world);
  w.goods[LEGUMES.good] = { base: LEGUMES.base };
  for (const c of w.cities) {
    if (LEGUMES.makers.includes(c.id) && !c.makes.includes(LEGUMES.good)) c.makes.push(LEGUMES.good);
    if (LEGUMES.consumers.includes(c.id) && !c.needs.includes(LEGUMES.good)) c.needs.push(LEGUMES.good);
  }
  return w;
}
