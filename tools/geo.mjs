// Geometry helpers: point in land polygon (Natural Earth 50m land, public domain), haversine distance.
// node:fs is loaded only under Node so these modules also run in the browser (M2).
const fs = typeof process !== "undefined" && process.versions?.node ? await import("node:fs") : null;
const readFileSync = (...a) => fs.readFileSync(...a);
export function loadLand(path = new URL("../data/ne_50m_land.geojson", import.meta.url)) {
  const gj = JSON.parse(readFileSync(path, "utf8"));
  const polys = [];
  for (const f of gj.features) {
    const g = f.geometry;
    if (g.type === "Polygon") polys.push(g.coordinates);
    else if (g.type === "MultiPolygon") for (const p of g.coordinates) polys.push(p);
  }
  return polys.map((rings) => ({ rings, bbox: bbox(rings[0]) }));
}
function bbox(ring) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of ring) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
function inRing(x, y, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** true when (lon, lat) is on land. Holes (lakes) count as water. */
export function isLand(land, lon, lat) {
  for (const p of land) {
    const [x0, y0, x1, y1] = p.bbox;
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    if (!inRing(lon, lat, p.rings[0])) continue;
    let hole = false;
    for (let k = 1; k < p.rings.length; k++) if (inRing(lon, lat, p.rings[k])) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}
export function haversineKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** samples along the straight lon/lat segment; returns the first land sample or null. */
export function segmentLandHit(land, a, b, stepKm = 5) {
  const n = Math.max(2, Math.ceil(haversineKm(a, b) / stepKm));
  for (let i = 0; i <= n; i++) {
    const t = i / n, lon = a.lon + (b.lon - a.lon) * t, lat = a.lat + (b.lat - a.lat) * t;
    if (isLand(land, lon, lat)) return { lon, lat };
  }
  return null;
}
