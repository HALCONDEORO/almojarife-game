// Data checks for data/world.json. No dependencies, so it runs in Node and in the browser.
// Returns a list of plain-English problems; an empty list means the data is usable.
export function validateWorld(w) {
  const errs = [], num = (v) => typeof v === "number" && Number.isFinite(v);
  if (!w || typeof w !== "object") return ["world data is not an object"];
  for (const k of ["cities", "goods", "waypoints", "lanes"]) if (!w[k]) errs.push(`missing "${k}"`);
  if (errs.length) return errs;
  const goods = Object.keys(w.goods), ids = new Set();
  for (const [g, d] of Object.entries(w.goods)) if (!num(d.base) || d.base <= 0) errs.push(`good ${g}: base price must be a positive number`);
  for (const c of w.cities) {
    if (!c.id || typeof c.id !== "string") { errs.push("a city has no id"); continue; }
    if (ids.has(c.id)) errs.push(`duplicate id ${c.id}`); ids.add(c.id);
    if (!c.name) errs.push(`city ${c.id}: no name`);
    if (!num(c.lat) || c.lat < -90 || c.lat > 90) errs.push(`city ${c.id}: bad latitude`);
    if (!num(c.lon) || c.lon < -180 || c.lon > 180) errs.push(`city ${c.id}: bad longitude`);
    if (!num(c.pop) || c.pop <= 0) errs.push(`city ${c.id}: population must be positive`);
    for (const k of ["makes", "needs"]) {
      if (!Array.isArray(c[k])) { errs.push(`city ${c.id}: "${k}" must be a list`); continue; }
      for (const g of c[k]) if (!goods.includes(g)) errs.push(`city ${c.id}: ${k} unknown good "${g}"`);
    }
    if (Array.isArray(c.makes) && Array.isArray(c.needs)) for (const g of c.makes) if (c.needs.includes(g)) errs.push(`city ${c.id}: makes and needs the same good "${g}"`);
  }
  for (const [id, p] of Object.entries(w.waypoints)) {
    if (ids.has(id)) errs.push(`waypoint ${id} reuses a city id`);
    ids.add(id);
    if (!num(p.lat) || !num(p.lon)) errs.push(`waypoint ${id}: bad coordinates`);
  }
  for (const [i, l] of w.lanes.entries()) {
    if (!Array.isArray(l) || l.length !== 2) { errs.push(`lane ${i}: must be a pair`); continue; }
    for (const n of l) if (!ids.has(n)) errs.push(`lane ${i}: unknown node "${n}"`);
  }
  // Every city must be reachable from the first one over the lanes.
  if (!errs.length && w.cities.length) {
    const adj = {}; for (const [a, b] of w.lanes) (adj[a] ??= []).push(b), (adj[b] ??= []).push(a);
    const seen = new Set([w.cities[0].id]), q = [w.cities[0].id];
    while (q.length) for (const n of adj[q.pop()] ?? []) if (!seen.has(n)) { seen.add(n); q.push(n); }
    for (const c of w.cities) if (!seen.has(c.id)) errs.push(`city ${c.id}: no sea route from ${w.cities[0].id}`);
    for (const g of goods) if (!w.cities.some((c) => c.makes.includes(g))) errs.push(`good ${g}: no city makes it`);
  }
  return errs;
}
