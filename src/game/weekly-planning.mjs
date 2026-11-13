import { cityDemand } from '../sim/market.mjs';
import { PER_1000, OPTIONAL_PER_1000 } from '../sim/classes.mjs';
import { effectivePop } from './citylife.mjs';
import { houseClassPop } from './buildings.mjs';
import { plaguePopMul } from './plague.mjs';
import { festivalDemandMul } from './festivals.mjs';
import { growthMul } from './growth.mjs';
import { calamityDemandMul } from './calamities.mjs';

export const PLANNING_DAYS = 7;
export const weeklyPlanningEnabled = search => new URLSearchParams(search).get('weeklyplanning') === '1';

/** Own-design reference: seven identical baseline periods, never a market simulation.
 * Rebuild current population inputs as marketTick does, without changing market cells.
 * Freeze today's modifiers, use base-price affordability and omit stock/purse constraints.
 */
export function weeklyPlanning(g, cityId) {
  if (!g?.world?.cities?.some(c => c.id === cityId) || !g.market?.[cityId]) return null;
  const population = effectivePop(g, cityId), classes = houseClassPop(g, cityId);
  const day = g.day, rows = [];
  for (const good of Object.keys(g.world.goods)) {
    const entry = g.market[cityId][good];
    if (!entry || !(Object.hasOwn(PER_1000, good) || Object.hasOwn(OPTIONAL_PER_1000, good))) {
      rows.push({ good, daily: null, weekly: null });
      continue;
    }
    const mul = plaguePopMul(g, cityId) * festivalDemandMul(g, cityId, good, day) * growthMul(g, cityId) * calamityDemandMul(g, cityId, good);
    const daily = cityDemand({ pop: Math.round(population * mul), classExtra: Object.fromEntries(Object.entries(classes).map(([c, n]) => [c, n * mul])), needs: entry.needs, makes: entry.makes, target: 1, stock: 1 }, good, g.world.goods[good].base);
    rows.push({ good, daily, weekly: daily * PLANNING_DAYS });
  }
  return { cityId, population, day, periods: PLANNING_DAYS, rows };
}
