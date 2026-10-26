// Mood layers drawn over the map: a seasonal colour wash and drifting clouds, storms, fog and wind drawn as ink on the chart. Own artwork, in code.
import { seasonOf } from "../sim/market.mjs";
const TINT = { winter: ["#8fb0d8", 0.14], spring: ["#9fd09a", 0.07], summer: ["#ffd98a", 0.10], autumn: ["#d98a3a", 0.12] };
/** Colour wash for a game day: {season, color, opacity}. */
export function seasonTint(day) { const s = seasonOf(day), [color, opacity] = TINT[s]; return { season: s, color, opacity }; }
const INK = "#6b4a22";
const rnd = (seed) => { let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }; // deterministic 0..1 from a number
/** Scalloped cloud outline: overlapping puffs, outline first, fill on top, so only the outer edge shows. */
function cloud(cx, cy, w, seed, kind) {
  const storm = kind === "storm", n = 6 + Math.floor(rnd(seed) * 3), puffs = [];
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 0.5 : k / (n - 1), x = cx + (t - 0.5) * w, bump = Math.sin(t * Math.PI), r = w * (0.10 + 0.10 * bump + 0.04 * rnd(seed + k * 3.1));
    puffs.push([x, cy - bump * w * 0.07 + (rnd(seed + k) - 0.5) * 6, r]);
  }
  const fill = storm ? "#5d626e" : "#fbf4e2", stroke = storm ? "#2f323a" : INK, op = storm ? 0.34 : 0.42;
  const circ = (p, st) => `<circle cx="${p[0].toFixed(0)}" cy="${p[1].toFixed(0)}" r="${p[2].toFixed(0)}" ${st}/>`;
  let g = `<g class="cloud ${kind}" opacity="${op}">` + puffs.map((p) => circ(p, `fill="${fill}" stroke="${stroke}" stroke-width="2"`)).join("") + puffs.map((p) => circ(p, `fill="${fill}"`)).join("");
  g += `<path d="M${(cx - w * 0.42).toFixed(0)} ${(cy + w * 0.08).toFixed(0)} q${(w * 0.3).toFixed(0)} 6 ${(w * 0.84).toFixed(0)} 0" fill="none" stroke="${stroke}" stroke-width="1.2" opacity=".5"/>`; // flat base line, like a chart engraving
  if (storm) for (let k = 0; k < 5; k++) { const x = cx - w * 0.3 + k * w * 0.15, y = cy + w * 0.14; g += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-6 16 M${(x + 7).toFixed(0)} ${(y + 4).toFixed(0)} l-6 16" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`; }
  return g + `</g>`;
}
/** Low mist: a few long wavy bands in pale ink wash. */
function fog(cx, cy, w, seed) {
  let g = `<g class="fog" opacity=".26" fill="none" stroke="#fbf4e2" stroke-linecap="round">`;
  for (let k = 0; k < 3; k++) { const y = cy + k * 13, x0 = cx - w / 2 + rnd(seed + k) * 30; g += `<path d="M${x0.toFixed(0)} ${y.toFixed(0)} q${(w * 0.17).toFixed(0)} -9 ${(w * 0.33).toFixed(0)} 0 t${(w * 0.33).toFixed(0)} 0 t${(w * 0.3).toFixed(0)} 0" stroke-width="${9 - k * 2}"/>`; }
  return g + `</g>`;
}
/** Wind: three streaks that curl at the end, in ink. */
function wind(cx, cy, w) {
  let g = `<g class="wind" opacity=".4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round">`;
  for (let k = 0; k < 3; k++) { const y = cy + k * 11, l = w * (1 - k * 0.2); g += `<path d="M${(cx - l / 2).toFixed(0)} ${y.toFixed(0)} h${(l * 0.8).toFixed(0)} a5 5 0 1 0 -5 -5"/>`; }
  return g + `</g>`;
}
/** How far a storm at (x, y) of width w is from the nearest port: below 1 means it covers one, 1 or more means clear (rain falls below the cloud, hence the taller reach). */
export function portClearance(x, y, w, avoid) {
  let m = Infinity;
  for (const p of avoid) m = Math.min(m, Math.hypot((p.x - x) / (w * 0.7 + 30), (p.y - (y + w * 0.05)) / (w * 0.4 + 50)));
  return m;
}
/** Nearest spot to the wanted one (searching a grid, closest first) where the storm covers no port; if none is fully clear, the least covered one. Same inputs give the same spot. */
export function clearSpot(cx, cy, w, W, H, avoid) {
  const cand = [];
  for (let x = w * 0.5; x <= W - w * 0.5; x += 20) for (let y = 50; y <= H * 0.95 - 40; y += 20) cand.push([x, y, Math.hypot(x - cx, y - cy)]);
  cand.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  let best = [cx, cy], bestScore = portClearance(cx, cy, w, avoid);
  if (bestScore >= 1) return best;
  for (const [x, y] of cand) { const sc = portClearance(x, y, w, avoid); if (sc >= 1) return [x, y]; if (sc > bestScore) { best = [x, y]; bestScore = sc; } }
  return best;
}
/**
 * SVG layer for a W x H map. `motion` false (reduced motion) draws everything still.
 * Which weather appears depends on the season, and positions come from the day, so a saved game looks the same on reload.
 * Summer: a few light clouds. Spring: light clouds. Autumn: clouds, fog and wind. Winter: clouds, storms and wind.
 */
export function atmosphereSvg(W, H, day, motion = true, avoid = [], storms = null) {
  const t = seasonTint(day), season = t.season;
  // `storms` (optional) are the real cells of the weather field, projected to chart pixels as
  // {x, y, w}; when given, they replace the decorative storms of the seasonal plan, so the chart
  // and the sea encounters show the same weather. An empty array means a calm day.
  const plan0 = { summer: ["cloud", "cloud"], spring: ["cloud", "cloud", "cloud"], autumn: ["cloud", "cloud", "fog", "wind"], winter: ["cloud", "storm", "storm", "wind", "cloud"] }[season];
  const plan = storms ? plan0.filter((k) => k !== "storm") : plan0;
  let s = `<g id="atmo" pointer-events="none"><clipPath id="atmo-clip"><rect width="${W}" height="${H}"/></clipPath><rect width="${W}" height="${H}" fill="${t.color}" opacity="${t.opacity}"/><g clip-path="url(#atmo-clip)">`;
  plan.forEach((kind, i) => {
    let cy = ((i * 0.37 + day * 0.013) % 1) * H * 0.85 + 40, cx = ((i * 0.61 + day * 0.007) % 1) * W; const w = 130 + (i * 23) % 60;
    if (kind === "storm" && avoid.length) [cx, cy] = clearSpot(cx, cy, w, W, H, avoid);
    const body = kind === "fog" ? fog(cx, cy, w * 2, day + i) : kind === "wind" ? wind(cx, cy, w * 0.8) : cloud(cx, cy, w, day * 1.7 + i * 5.3, kind);
    s += motion ? `<g>${body}<animateTransform attributeName="transform" type="translate" values="-24 0;24 0;-24 0" dur="${90 + i * 17}s" repeatCount="indefinite"/></g>` : body;
  });
  (storms ?? []).forEach((c, i) => {
    const [cx, cy] = avoid.length ? clearSpot(c.x, c.y, c.w, W, H, avoid) : [c.x, c.y];
    const body = cloud(cx, cy, c.w, day * 1.7 + 90 + i * 5.3, "storm");
    s += motion ? `<g>${body}<animateTransform attributeName="transform" type="translate" values="-24 0;24 0;-24 0" dur="97s" repeatCount="indefinite"/></g>` : body;
  });
  return s + `</g></g>`;
}
