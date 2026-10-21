// Town-crier proclamations (pregones), phase A2 of docs/design/town-hall-mayor-taxes.md:
// when you dock at a port whose market is critically short of a good, its concejo posts a
// notice in its alcalde's name. Flavor intel only — the scarcity is the market's real state
// (same ratio reputation uses) and the notice moves no money, no prices. No DOM.
import { post } from "./ledger.mjs";
import { scarcityOf } from "./reputation.mjs";
import { townCouncil } from "./townhall.mjs";
import { GOOD_ES } from "./news.mjs";
export const PREGON_CRIT = 2; // scarcity ratio (target/stock) that makes a good pregón-worthy, same as REP_CRIT_RATIO
export const PREGON_COOLDOWN = 20; // days between pregones of the same city
/** Maybe post one pregón on arrival at `at`. Returns { city, good, mayor } or null. */
export function arrivalPregon(g, at) {
  if (g.over) return null;
  const ent = g.market?.[at];
  if (!ent) return null;
  const last = g.hallPregon?.[at] ?? -1e9;
  if (g.day - last < PREGON_COOLDOWN) return null; // the concejo does not cry every day
  let good = null, best = PREGON_CRIT;
  for (const [k, e] of Object.entries(ent)) { const r = scarcityOf(e); if (r >= best) { best = r; good = k; } }
  if (!good) return null;
  (g.hallPregon ??= {})[at] = g.day;
  const cName = g.world.cities.find((c) => c.id === at)?.name ?? at;
  const mayor = townCouncil(g.world, at).mayor, gEs = GOOD_ES[good] ?? good;
  post(g, "pregon", { txt: {
    es: `Pregón en ${cName}: el concejo del alcalde ${mayor} pide ${gEs}; las bodegas están casi vacías y se paga bien.`,
    en: `Proclamation at ${cName}: the council of mayor ${mayor} calls for ${good}; the stores are nearly empty and it pays well.`,
  } });
  return { city: at, good, mayor };
}
