// Where a ship is on the map (lat/lon). Pure function of sim state, so a view can call it
// as often as it likes without touching the simulation. `tickFrac` is the part of the current
// tick already elapsed (0 to 1); it is only for smooth drawing.
import { haversineKm } from "../../tools/geo.mjs";

export function shipPosition(world, ship, tickFrac = 0) {
  const v = ship.voyage;
  if (!v) return pointOf(world, ship.at);
  const path = v.path, total = v.km;
  // totalTicks is the full duration written by sail(), so progress is right on every tick of the voyage.
  const done = Math.min(1, Math.max(0, (v.totalTicks - v.ticksLeft + Math.min(1, Math.max(0, tickFrac))) / v.totalTicks));
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
