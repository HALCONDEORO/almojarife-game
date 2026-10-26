// Navigation charts (fog follow-up): the tavern sells charts that put a whole coast on the map
// (fog.discover, same as sailing there) without giving away prices, plus a cheap route rumour that
// reveals the nearest unknown port with an inexact snapshot. Deterministic; no new randomness.
import { discover, isDiscovered } from "./fog.mjs";
import { post } from "./ledger.mjs";
import { haversineKm } from "../../tools/geo.mjs";
import { seeded } from "../view/cityscene.mjs";

export const CHART_BASE = 120, CHART_PER_PORT = 70, ROUTE_RUMOR_PRICE = 60;
/** The coasts a chart can cover: every city exactly once (test-enforced). */
export const COASTS = Object.freeze({
  luz: Object.freeze({ ports: Object.freeze(["cadiz", "huelva", "sevilla", "malaga", "almeria"]) }),
  portugal: Object.freeze({ ports: Object.freeze(["lisboa", "setubal", "faro", "porto"]) }),
  cantabrico: Object.freeze({ ports: Object.freeze(["vigo", "coruna", "santander", "bilbao", "sansebastian"]) }),
  levante: Object.freeze({ ports: Object.freeze(["cartagena", "alicante", "valencia", "tarragona", "barcelona"]) }),
  baleares: Object.freeze({ ports: Object.freeze(["palma", "ibiza"]) }),
  rif: Object.freeze({ ports: Object.freeze(["tanger", "ceuta", "tetuan", "arcila", "larache"]) }),
  marruecos: Object.freeze({ ports: Object.freeze(["rabat", "casablanca", "mazagan"]) }),
  berberia: Object.freeze({ ports: Object.freeze(["melilla", "oran", "mostaganem", "argel"]) }),
});
export const coastOf = (city) => Object.keys(COASTS).find((k) => COASTS[k].ports.includes(city)) ?? null;
export const chartPrice = (coast) => CHART_BASE + CHART_PER_PORT * COASTS[coast].ports.length;
/** Charts a port's tavern will sell: every coast but its own that still hides an unknown port. */
export function chartOffers(g, at) {
  const own = coastOf(at);
  return Object.keys(COASTS).filter((k) => k !== own && COASTS[k].ports.some((c) => !isDiscovered(g, c)));
}
/** Buy a chart: every port of the coast goes on the map. No prices are revealed. */
export function buyChart(g, coast, at) {
  if (g.over) return { ok: false, reason: "game over" };
  if (!COASTS[coast]) return { ok: false, reason: "unknown chart" };
  if (at !== undefined && !g.ships.some((x) => !x.voyage && x.at === at)) return { ok: false, reason: "no ship here" };
  if (!COASTS[coast].ports.some((c) => !isDiscovered(g, c))) return { ok: false, reason: "already charted" };
  const price = chartPrice(coast);
  if (g.cash < price) return { ok: false, reason: "no cash", cost: price };
  g.cash -= price;
  const found = [];
  for (const c of COASTS[coast].ports) if (discover(g, c)) found.push(c);
  return { ok: true, cost: price, found };
}
/** Nearest port not on the chart yet, or null when the map is complete. */
export function routeRumorTarget(g, at) {
  const here = g.world.nodes[at];
  if (!here) return null;
  let best = null, bd = Infinity;
  for (const c of g.world.cities) {
    if (isDiscovered(g, c.id)) continue;
    const d = haversineKm(here, g.world.nodes[c.id]);
    if (d < bd) { bd = d; best = c.id; }
  }
  return best;
}
/** A route rumour: the nearest unknown port goes on the map, with an inexact snapshot of its market. */
export function buyRouteRumor(g, at) {
  if (g.over) return { ok: false, reason: "game over" };
  if (at !== undefined && !g.ships.some((x) => !x.voyage && x.at === at)) return { ok: false, reason: "no ship here" };
  const target = routeRumorTarget(g, at);
  if (!target) return { ok: false, reason: "nothing to discover" };
  if (g.cash < ROUTE_RUMOR_PRICE) return { ok: false, reason: "no cash", cost: ROUTE_RUMOR_PRICE };
  g.cash -= ROUTE_RUMOR_PRICE;
  discover(g, target);
  const rnd = seeded(`route:${target}:${g.day}`), cells = {};
  for (const [k, e] of Object.entries(g.market[target])) cells[k] = { ...e, stock: Math.max(0, Math.round(e.stock * (1 + (rnd() * 2 - 1) * 0.25))) };
  (g.intel ??= {})[target] = { day: g.day, exact: false, cells };
  const nm = g.world.nodes[target]?.name ?? target;
  post(g, "info", { city: target, txt: { es: `Un rumor de ruta te descubre ${nm}: ya está en la carta (mercado aproximado). Coste ${ROUTE_RUMOR_PRICE}.`, en: `A route rumour reveals ${nm}: it is on your chart now (approximate market). Cost ${ROUTE_RUMOR_PRICE}.` } });
  return { ok: true, cost: ROUTE_RUMOR_PRICE, city: target };
}
