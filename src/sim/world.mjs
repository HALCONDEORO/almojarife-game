import { readFileSync } from "node:fs";
import { haversineKm } from "../../tools/geo.mjs";
export function loadWorld(path = new URL("../../data/world.json", import.meta.url)) {
  const w = JSON.parse(readFileSync(path, "utf8"));
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
export function route(world, from, to) {
  const dist = { [from]: 0 }, prev = {}, todo = new Set([from]);
  while (todo.size) {
    let u = null;
    for (const n of todo) if (u === null || dist[n] < dist[u]) u = n;
    todo.delete(u);
    if (u === to) break;
    for (const { to: v, km } of world.adj[u] ?? []) {
      if (dist[v] === undefined || dist[u] + km < dist[v]) { dist[v] = dist[u] + km; prev[v] = u; todo.add(v); }
    }
  }
  if (dist[to] === undefined) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return { km: dist[to], path };
}
