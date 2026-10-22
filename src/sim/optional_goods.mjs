// Optional goods: data that joins the world only when a game is started with the matching flag (default OFF).
// With the flag OFF nothing here runs, so the world, the markets and every simulation are exactly as without this file.
/** Kid meat (cabrito): a luxury meat. Source: Estudio's meat dossier (22/10): in Barcelona kid was a luxury meat and mutton the common one;
 *  breeding zones Sevilla/Jerez and Menorca (Menorca and Jerez are not ports of this map, so Sevilla is the only producer);
 *  González Arce, HID 49 (2022): Seville had meat in plenty, the cuts priced 1 to 1.7 apart, so base 40 against common meat 25. */
export const KID_MEAT = Object.freeze({ good: "kid_meat", base: 40, makers: Object.freeze(["sevilla"]), consumers: Object.freeze(["lisboa", "valencia", "barcelona"]) });
/** Return a copy of the world with kid meat added (the loaded world is never mutated). */
export function withKidMeat(world) {
  const w = structuredClone(world);
  w.goods[KID_MEAT.good] = { base: KID_MEAT.base };
  for (const c of w.cities) {
    if (KID_MEAT.makers.includes(c.id) && !c.makes.includes(KID_MEAT.good)) c.makes.push(KID_MEAT.good);
    if (KID_MEAT.consumers.includes(c.id) && !c.needs.includes(KID_MEAT.good)) c.needs.push(KID_MEAT.good);
  }
  return w;
}
