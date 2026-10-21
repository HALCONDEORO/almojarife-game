// node:fs is loaded only under Node so these modules also run in the browser (M2).
const fs = typeof process !== "undefined" && process.versions?.node ? await import("node:fs") : null;
const readFileSync = (...a) => fs.readFileSync(...a);
import { haversineKm } from "../../tools/geo.mjs";
export function loadWorld(path = new URL("../../data/world.json", import.meta.url)) {
  return buildWorld(JSON.parse(readFileSync(path, "utf8")));
}
/** Build the world graph from parsed world.json (works in the browser too). */
export function buildWorld(w) {
  const nodes = {};
  for (const c of w.cities) nodes[c.id] = c;
  for (const [id, p] of Object.entries(w.waypoints)) nodes[id] = { id, ...p };
  const adj = {};
  for (const [a, b] of w.lanes) {
    const d = haversineKm(nodes[a], nodes[b]);
    (adj[a] ??= []).push({ to: b, km: d });
    (adj[b] ??= []).push({ to: a, km: d });
  }
  return { ...w, nodes, adj };
}
/** Dijkstra over the sea-lane graph. Returns {km, path} or null. */
// The lane graph never changes after buildWorld, so each source's search tree is
// cached per world. Same distances and paths as a fresh run: with non-negative
// weights a node's dist/prev are final once popped, and nodes on the path to `to`
// pop before `to`, so skipping the early break changes nothing.
const routeCache = new WeakMap(); // world -> Map(from -> {dist, prev})
function searchTree(world, from) {
  let byFrom = routeCache.get(world);
  if (!byFrom) routeCache.set(world, (byFrom = new Map()));
  let run = byFrom.get(from);
  if (!run) {
    const dist = { [from]: 0 }, prev = {}, todo = new Set([from]);
    while (todo.size) {
      let u = null;
      for (const n of todo) if (u === null || dist[n] < dist[u]) u = n;
      todo.delete(u);
      for (const { to: v, km } of world.adj[u] ?? []) {
        if (dist[v] === undefined || dist[u] + km < dist[v]) { dist[v] = dist[u] + km; prev[v] = u; todo.add(v); }
      }
    }
    byFrom.set(from, (run = { dist, prev }));
  }
  return run;
}
export function route(world, from, to) {
  const { dist, prev } = searchTree(world, from);
  if (dist[to] === undefined) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return { km: dist[to], path };
}
