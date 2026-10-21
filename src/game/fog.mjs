// Fog of war: the sea chart starts covered and is discovered by sailing.
// A port goes on the chart when the player has a ship or warehouse there, when one
// of their ships passes within DISCOVERY_KM of it, or when a tavern rumour names it.
// A new trader also knows the ports of his home coast (START_KNOWN_KM around home).
// Pure game logic, no DOM.
import { haversineKm } from "../../tools/geo.mjs";
import { isLive } from "./intel.mjs";
import { shipPosition } from "../sim/position.mjs";

/** How close a ship must pass to a port to put it on the chart. */
export const DISCOVERY_KM = 60;
/** A new trader knows the ports within this distance of his home town. */
export const START_KNOWN_KM = 150;

export const isDiscovered = (g, city) => (g.discovered ??= seedDiscovery(g))[city] !== undefined;

/** First chart for a game or save that predates the fog: every port the trader has
 * price data on, owns a warehouse in, has a ship moored at or runs a route through. */
function seedDiscovery(g) {
  const d = {};
  for (const c of Object.keys(g.intel ?? {})) d[c] = g.intel[c].day ?? g.day;
  for (const c of Object.keys(g.warehouses ?? {})) d[c] ??= g.day;
  for (const s of g.ships ?? []) {
    if (s.at) d[s.at] ??= g.day;
    if (s.route?.a) d[s.route.a] ??= g.day;
    if (s.route?.b) d[s.route.b] ??= g.day;
    for (const st of s.route?.stops ?? []) if (st?.city) d[st.city] ??= g.day;
  }
  return d;
}

/** Put a port on the chart. Returns true only the first time, so the caller can log the news. */
export function discover(g, city) {
  if (!g.world.nodes[city]) return false;
  const d = (g.discovered ??= seedDiscovery(g));
  if (d[city] !== undefined) return false;
  d[city] = g.day;
  return true;
}

/** The ports a brand-new trader knows: home and the ones within START_KNOWN_KM of it. */
export function startingChart(g, home) {
  const found = [];
  if (discover(g, home)) found.push(home);
  const h = g.world.nodes[home];
  for (const c of g.world.cities)
    if (c.id !== home && haversineKm(h, c) <= START_KNOWN_KM && discover(g, c.id)) found.push(c.id);
  return found;
}

/** Discover every port the player is present at or sails past. Runs every tick;
 * returns the newly discovered ports so the caller can log them. */
export function refreshDiscovery(g) {
  g.discovered ??= seedDiscovery(g);
  const found = [];
  for (const c of g.world.cities) {
    if (g.discovered[c.id] !== undefined) continue;
    let hit = isLive(g, c.id);
    if (!hit)
      for (const s of g.ships) {
        if (!s.voyage) continue;
        if (haversineKm(shipPosition(g.world, s), c) <= DISCOVERY_KM) { hit = true; break; }
      }
    if (hit) { g.discovered[c.id] = g.day; found.push(c.id); }
  }
  return found;
}
