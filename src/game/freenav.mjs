// Free navigation (flag g.freeNav, default off): a ship can be sent to any point of the sea, even mid-voyage.
// Safety rule: a ship only ever moves along the sea lanes of the world graph. A clicked point is snapped onto the nearest lane
// (refused if no lane is near), so no leg can cross land. Pure planning here; game.mjs starts the voyage.
import { route } from "../sim/world.mjs";
import { haversineKm } from "../../tools/geo.mjs";
export const FREE_MAX_KM = 90;   // a click farther than this from every lane is not navigable water
export const PORT_SNAP_KM = 12;  // a click this close to a port, on its lane, means the port itself
export const isFreeId = (id) => typeof id === "string" && id.startsWith("pt:");
export const freeId = (lat, lon) => `pt:${lat.toFixed(3)},${lon.toFixed(3)}`;
const isPort = (world, id) => !!world.cities?.some((c) => c.id === id);
/** Nearest point on any lane to (lat, lon): {km, lat, lon, a, b} or null. */
export function snapToLane(world, lat, lon, maxKm = FREE_MAX_KM) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const c = Math.cos(lat * Math.PI / 180); let best = null;
  for (const [a, b] of world.lanes ?? []) {
    const A = world.nodes[a], B = world.nodes[b]; if (!A || !B) continue;
    const dx = (B.lon - A.lon) * c, dy = B.lat - A.lat, l2 = dx * dx + dy * dy;
    let t = l2 ? (((lon - A.lon) * c) * dx + (lat - A.lat) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const q = { lat: A.lat + (B.lat - A.lat) * t, lon: A.lon + (B.lon - A.lon) * t }, km = haversineKm({ lat, lon }, q);
    if (!best || km < best.km) best = { km, lat: q.lat, lon: q.lon, a, b };
  }
  return best && best.km <= maxKm ? best : null;
}
const coord = (world, pts, id) => pts?.[id] ?? world.nodes[id];
/** A place in the plan: a world node (port or waypoint) or a free point {lat, lon, a, b} lying on lane a-b. */
function attach(world, loc) {
  if (loc.id) return [{ node: loc.id, km: 0 }];
  const P = { lat: loc.lat, lon: loc.lon };
  return [{ node: loc.a, km: haversineKm(P, world.nodes[loc.a]) }, { node: loc.b, km: haversineKm(P, world.nodes[loc.b]) }];
}
const sameLane = (p, q) => p.a && q.a && ((p.a === q.a && p.b === q.b) || (p.a === q.b && p.b === q.a));
/** Cheapest lane route between two places: {km, path (ids), pts (free points used)} or null. */
export function planRoute(world, from, to) {
  const fid = from.id ?? freeId(from.lat, from.lon), tid = to.id ?? freeId(to.lat, to.lon);
  let best = null;
  if (!from.id && !to.id && sameLane(from, to)) best = { km: haversineKm(from, to), ids: [fid, tid] };
  for (const sa of attach(world, from)) for (const ta of attach(world, to)) {
    const r = route(world, sa.node, ta.node); if (!r) continue;
    const km = sa.km + r.km + ta.km;
    if (!best || km < best.km) best = { km, ids: [fid, ...r.path, tid] };
  }
  if (!best) return null;
  const path = best.ids.filter((id, i, a) => id !== a[i - 1]), pts = {};
  for (const [loc, id] of [[from, fid], [to, tid]]) if (!loc.id) pts[id] = { lat: loc.lat, lon: loc.lon, a: loc.a, b: loc.b };
  return { km: best.km, path, pts };
}
/** Where a ship is, as a place: a docked ship is its port node; a ship at sea is a point on the lane of the leg it sails. */
export function locate(world, ship, tickFrac = 0) {
  const v = ship.voyage;
  if (!v) return isPort(world, ship.at) ? { id: ship.at } : null;
  const path = v.path ?? [], pts = v.pts ?? {};
  const done = v.anchored ? 1 : Math.min(1, Math.max(0, (v.totalTicks - v.ticksLeft + tickFrac) / v.totalTicks));
  let want = v.km * done;
  for (let i = 0; i + 1 < path.length; i++) {
    const A = coord(world, pts, path[i]), B = coord(world, pts, path[i + 1]); if (!A || !B) return null;
    const d = haversineKm(A, B);
    if (want <= d || i + 2 === path.length) {
      const t = d === 0 ? 1 : Math.min(1, want / d), lat = A.lat + (B.lat - A.lat) * t, lon = A.lon + (B.lon - A.lon) * t;
      const free = [path[i], path[i + 1]].find(isFreeId), lane = free ? pts[free] : { a: path[i], b: path[i + 1] };
      if (!lane?.a || !lane?.b) return null;
      if (t <= 0 && !isFreeId(path[i])) return { id: path[i] };
      if (t >= 1 && !isFreeId(path[i + 1])) return { id: path[i + 1] };
      return { lat, lon, a: lane.a, b: lane.b };
    }
    want -= d;
  }
  return null;
}
/** Plan a trip from where the ship is to (lat, lon). Returns {ok, path, pts, km, to, toPort} or {ok:false, reason}. */
export function planTrip(world, ship, lat, lon, tickFrac = 0) {
  const snap = snapToLane(world, lat, lon); if (!snap) return { ok: false, reason: "no sea there" };
  const start = locate(world, ship, tickFrac); if (!start) return { ok: false, reason: "no position" };
  // a click on the lane next to a port means the port; a waypoint is just a point of the sea
  let target = { lat: snap.lat, lon: snap.lon, a: snap.a, b: snap.b };
  for (const end of [snap.a, snap.b]) if (isPort(world, end) && haversineKm(snap, world.nodes[end]) <= PORT_SNAP_KM) target = { id: end };
  const r = planRoute(world, start, target); if (!r) return { ok: false, reason: "no route" };
  if (r.km < 0.5) return { ok: false, reason: "already there" };
  return { ok: true, path: r.path, pts: r.pts, km: r.km, to: r.path[r.path.length - 1], toPort: !!target.id };
}
