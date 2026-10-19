// Renders land + lanes + cities to SVG (equirectangular crop of the Baltic/North Sea).
import { readFileSync, writeFileSync } from "node:fs";
import { loadWorld } from "../src/sim/world.mjs";
const world = loadWorld();
const gj = JSON.parse(readFileSync(new URL("../data/ne_50m_land.geojson", import.meta.url), "utf8"));
const [x0, x1, y0, y1] = [-4, 28, 49.5, 62], W = 1200, k = W / (x1 - x0);
const sx = (lon) => ((lon - x0) * k).toFixed(1), sy = (lat) => ((y1 - lat) * k * 1.75).toFixed(1);
let d = "";
const ring = (r) => "M" + r.map(([lo, la]) => sx(lo) + "," + sy(la)).join("L") + "Z";
for (const f of gj.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) { const b = p[0]; if (b.every(([lo, la]) => lo < x0 - 5 || lo > x1 + 5 || la < y0 - 5 || la > y1 + 5)) continue; d += p.map(ring).join(""); }
}
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Math.round((y1 - y0) * k * 1.75)}"><rect width="100%" height="100%" fill="#9ec5e0"/><path d="${d}" fill="#e8e0c8" stroke="#8a8468" stroke-width=".6" fill-rule="evenodd"/>`;
for (const [a, b] of world.lanes) s += `<line x1="${sx(world.nodes[a].lon)}" y1="${sy(world.nodes[a].lat)}" x2="${sx(world.nodes[b].lon)}" y2="${sy(world.nodes[b].lat)}" stroke="#1d4e89" stroke-width="1.5" stroke-dasharray="5,3"/>`;
for (const c of world.cities) s += `<circle cx="${sx(c.lon)}" cy="${sy(c.lat)}" r="6" fill="#b3261e"/><text x="${+sx(c.lon) + 9}" y="${+sy(c.lat) + 4}" font-size="15" font-family="sans-serif">${c.name}</text>`;
writeFileSync(new URL("../docs/map.svg", import.meta.url), s + "</svg>");
