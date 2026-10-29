// Small, one-time connections between a founder's background and existing systems.
// Opt-in at new-game creation only. Loading an old save never calls this module.
import { addRespect, REP_PER_COINS } from './rank.mjs';
import { discover } from './fog.mjs';
import { routeRumorTarget } from './charts.mjs';
import { seeded } from '../view/cityscene.mjs';
import { haversineKm } from '../../tools/geo.mjs';
import { RUMOR_ERROR } from './intel.mjs';

export const ORIGIN_RESPECT = 5;
export const ORIGIN_IDS = Object.freeze(['merchant', 'seafarer', 'scholar']);

/** A scholar's old correspondence covers the closest already-charted port, not the home market. */
export function correspondencePort(g, home) {
  const here = g.world.nodes[home];
  if (!here) return null;
  return g.world.cities.filter(c => c.id !== home && g.discovered?.[c.id] !== undefined)
    .sort((a, b) => haversineKm(here, a) - haversineKm(here, b) || a.id.localeCompare(b.id))[0]?.id ?? null;
}

/** Apply once, after the ordinary starting chart and live home-market snapshot exist.
 * The receipt records what actually happened, so later UI need not invent old-save benefits. */
export function initOrigin(g) {
  if (g.originStart) return false;
  const origin = g.profile?.background, home = g.profile?.home;
  if (!ORIGIN_IDS.includes(origin) || !g.world.cities.some(c => c.id === home)) return false;
  const receipt = { v: 1, origin, home };
  if (origin === 'merchant') {
    addRespect(g, home, ORIGIN_RESPECT * REP_PER_COINS);
    receipt.respect = ORIGIN_RESPECT;
  } else if (origin === 'seafarer') {
    const city = routeRumorTarget(g, home);
    if (city && discover(g, city)) receipt.city = city;
  } else {
    const city = correspondencePort(g, home);
    if (city && g.market[city] && !g.intel?.[city]) {
      const rnd = seeded(`origin:${city}:${g.seed}`), cells = {};
      for (const [good, entry] of Object.entries(g.market[city])) cells[good] = {
        ...entry, stock: Math.max(0, Math.round(entry.stock * (1 + (rnd() * 2 - 1) * RUMOR_ERROR))),
      };
      (g.intel ??= {})[city] = { day: g.day, exact: false, cells };
      receipt.city = city;
    }
  }
  g.originStart = receipt;
  return true;
}
