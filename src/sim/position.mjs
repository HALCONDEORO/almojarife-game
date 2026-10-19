// Where a ship is on the map (lat/lon). Pure function of sim state, so a view can call it
// as often as it likes without touching the simulation. `frac` is the part of the current
// day already elapsed (0 to 1); it is only for smooth drawing.
import { haversineKm } from "../../tools/geo.mjs";
import { route } from "./world.mjs";
import { SHIP_TYPES } from "./trade.mjs";

export function shipPosition(world, ship, frac = 0) {
  const v = ship.voyage;
  if (!v) return pointOf(world, ship.at);
  let path = v.path, total = v.km;
  if (!path) { // voyage made before routes were stored: rebuild it
    const r = route(world, v.from ?? ship.at, v.to);
    if (!r) return pointOf(world, ship.at);
    path = r.path; total = r.km;
  }
  // Old saves have no totalDays: rebuild the original duration from distance and ship speed
  // (the same formula sail() uses), so progress is right on every day of the voyage.
  const days = v.totalDays ?? Math.max(v.daysLeft, Math.max(1, Math.ceil(total / (SHIP_TYPES[ship.type]?.kmPerDay ?? 90))));
  const done = Math.min(1, Math.max(0, (days - v.daysLeft + Math.min(1, Math.max(0, frac))) / days));
  let want = total * done;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = pointOf(world, path[i]), b = pointOf(world, path[i + 1]);
    const d = haversineKm(a, b);
    if (want <= d || i + 2 === path.length) {
      const t = d === 0 ? 1 : Math.min(1, want / d);
      return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
    }
    want -= d;
  }
  return pointOf(world, v.to);
}
function pointOf(world, id) { const n = world.nodes[id]; return { lat: n.lat, lon: n.lon }; }
