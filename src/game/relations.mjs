// City relations (living cities 6/8): old friendships and rivalries between ports, stable
// forever (drawn from the pair of names, so every game agrees). The Ayuntamiento tab says
// who the city stands with and against, in words. One small perk, own tuning: selling a
// city something its rival makes earns a nod of respect. Pure flavor otherwise: no prices,
// no money moved. Off unless g.cityRelations === true (no keys at all in an off game).
import { seeded } from "../view/cityscene.mjs";
import { ensureRep, REP_PER_COINS } from "./rank.mjs";

export const RELATION_RIVAL_RESPECT = 1; // respect points per qualifying sale (own tuning, inference)

const pairKey = (a, b) => [a, b].sort().join(":");
/** -1 rivals, 0 neutral, +1 friends; symmetric and stable across games. */
export function relationOf(world, a, b) {
  if (a === b) return 0;
  const r = seeded(`relation:${pairKey(a, b)}`)();
  return r < 0.25 ? -1 : r > 0.75 ? 1 : 0;
}
const nameOf = (world, id) => world.nodes[id]?.name ?? world.cities.find((c) => c.id === id)?.name ?? id;
const pick = (world, cityId, want) => { // the strongest of that kind, deterministic among ties
  let best = null, bestR = -1;
  for (const c of world.cities) {
    if (c.id === cityId || relationOf(world, cityId, c.id) !== want) continue;
    const r = seeded(`relpick:${pairKey(cityId, c.id)}`)();
    if (r > bestR) { best = c.id; bestR = r; }
  }
  return best;
};
/** The city's oldest enemy (or null). */
export const rivalOf = (world, cityId) => pick(world, cityId, -1);
/** The city's closest friend (or null). */
export const friendOf = (world, cityId) => pick(world, cityId, 1);
/** Respect nod for selling a city what its rival makes. Flag off: 0. */
export function relationsOnSale(g, cityId, good) {
  if (g?.cityRelations !== true) return 0;
  const rival = rivalOf(g.world, cityId);
  if (!rival || !g.market[rival]?.[good]?.makes) return 0;
  ensureRep(g)[cityId] = (ensureRep(g)[cityId] ?? 0) + RELATION_RIVAL_RESPECT * REP_PER_COINS;
  return RELATION_RIVAL_RESPECT;
}
/** One line for the Ayuntamiento tab: who the city stands with and against. Flag off: null. */
export function relationsLine(g, cityId) {
  if (g?.cityRelations !== true) return null;
  const rival = rivalOf(g.world, cityId), friend = friendOf(g.world, cityId);
  if (!rival && !friend) return null;
  const rn = rival && nameOf(g.world, rival), fn = friend && nameOf(g.world, friend);
  return { rival, friend, txt: {
    es: [rn && `Con ${rn}, a malas`, fn && `con ${fn}, buen trato`].filter(Boolean).join("; ") + ".",
    en: [rn && `At odds with ${rn}`, fn && `on good terms with ${fn}`].filter(Boolean).join("; ") + ".",
  } };
}
