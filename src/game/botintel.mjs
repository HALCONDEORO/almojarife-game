// Private navigation and market knowledge for one rival house. The game coordinator calls
// refreshBotKnowledge before planning, then passes botIntelHooks to aiStep. Actual trades
// still execute against the shared market. No human intel, ships or warehouse may leak in.
import { startingChart, refreshDiscovery, isDiscovered, discover } from './fog.mjs';
import { refreshIntel, knownMarket, buyRumor } from './intel.mjs';
import { buyRouteRumor } from './charts.mjs';

/** Explicit state boundary, usable during warmup as well as the live game. Persist all
 * private collections on the bot. A later multi-ship bot can supply bot.ships directly. */
export function botIntelView(g, bot) {
  bot.intel ??= {};
  bot.warehouses ??= {};
  const view = {
    world: g.world, market: g.market, day: g.day, tick: g.tick,
    seed: g.seed, nextId: bot.ship.id, over: g.over,
    ships: bot.ships ?? [bot.ship], warehouses: bot.warehouses, intel: bot.intel,
    get cash() { return bot.cash; }, set cash(n) { bot.cash = n; },
    get discovered() { return bot.discovered; }, set discovered(d) { bot.discovered = d; },
  };
  if (!bot.discovered) startingChart(view, bot.home ?? bot.ship.at);
  return view;
}

/** Exact snapshots only where this house is present; discoveries use the same sailing
 * radius as the player. Call on ticks for discovery, and before decisions for fresh prices. */
export function refreshBotKnowledge(g, bot) {
  const view = botIntelView(g, bot);
  refreshDiscovery(view);
  refreshIntel(view);
  return view;
}

/** Planning hooks compose with reputation/fee hooks without exposing the live remote book. */
export function botIntelHooks(g, bot) {
  const view = botIntelView(g, bot);
  return { planningMarket: () => knownMarket(view).market,
    canVisit: (city) => isDiscovered(view, city) };
}

/** An idle merchant may buy one report, choosing by age and city id, never by hidden price.
 * New destinations use the normal paid route rumour, including its discovery and error.
 * The caller chooses when information is worth its real in-game cost. */
export function buyBotReport(g, bot) {
  const view = botIntelView(g, bot), at = bot.ship.at;
  if (bot.ship.voyage) return { ok: false, reason: 'at sea' };
  const candidates = g.world.cities.filter((c) => c.id !== at && isDiscovered(view, c.id));
  candidates.sort((a, b) => (view.intel[a.id]?.day ?? -Infinity) - (view.intel[b.id]?.day ?? -Infinity) || a.id.localeCompare(b.id));
  const target = candidates.find((c) => !view.intel[c.id] || view.intel[c.id].day < view.day);
  if (target) {
    const result = buyRumor(view, target.id, at);
    if (result.ok) discover(view, target.id);
    return { ...result, city: target.id };
  }
  return buyRouteRumor(view, at);
}
