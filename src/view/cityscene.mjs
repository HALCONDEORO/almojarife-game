// An illustrated port view for the market panel, drawn in code (own artwork, no external files).
// citySceneSvg is a pure function of its inputs: same city and state, same picture.
import { seasonOf } from "../sim/market.mjs";
// Small deterministic random numbers, so a port always looks the same.
export function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** How many houses to draw for a population: 5 for a village up to 18 for a great port. */
export const houseCount = (pop) => Math.max(5, Math.min(18, Math.round(Math.sqrt(pop) / 11)));
/** Light level 0 (night) to 1 (noon) from the fraction of the day; the game clock has no hours, so the view passes `tod`. */
export const daylight = (tod = 0.5) => Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin((tod - 0.25) * 2 * Math.PI)));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c.join(",")})`;
const SKY = { winter: [[170, 190, 205], [225, 230, 232]], spring: [[135, 185, 220], [230, 238, 230]], summer: [[110, 175, 230], [250, 240, 215]], autumn: [[165, 180, 200], [240, 215, 180]] };
const WALL = [[226, 205, 160], [214, 186, 140], [236, 222, 190], [201, 170, 125]], ROOF = [[160, 70, 45], [140, 60, 40], [175, 90, 55]];
/** Build the scene. opts: {id, name, pop, warehouse, shipyard, ships (docked count), day, tod} */
export function citySceneSvg({ id, pop, warehouse = false, shipyard = true, ships = 0, day = 0, tod = 0.5 }) {
  const r = seeded(id), W = 600, H = 190, light = daylight(tod), season = seasonOf(day);
  const [top, low] = SKY[season].map((c) => mix([20, 28, 60], c, 0.15 + 0.85 * light));
  let s = `<svg class="scene" viewBox="0 0 ${W} ${H}" role="img" aria-label="${id}"><defs><linearGradient id="sk-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rgb(top)}"/><stop offset="1" stop-color="${rgb(low)}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#sk-${id})"/>`;
  if (light < 0.4) for (let i = 0; i < 22; i++) s += `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * 70).toFixed(0)}" r="${(0.6 + r() * 0.8).toFixed(1)}" fill="#fff" opacity="${(0.8 - light).toFixed(2)}"/>`;
  s += `<path d="M0 118 Q80 ${92 + r() * 12} 160 112 T330 108 T500 114 T600 104 V140 H0Z" fill="${rgb(mix([96, 112, 92], [60, 70, 70], 1 - light))}" opacity=".8"/>`; // far hills
  const water = mix([48, 92, 128], [16, 30, 52], 1 - light);
  s += `<rect y="140" width="${W}" height="${H - 140}" fill="${rgb(water)}"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${(r() * 560).toFixed(0)} ${(150 + r() * 34).toFixed(0)} q8 -3 16 0 t16 0" stroke="#fff" stroke-opacity=".28" fill="none" stroke-width="1"/>`;
  s += `<rect y="132" width="${W}" height="12" fill="${rgb(mix([150, 128, 96], [60, 52, 44], 1 - light))}"/>`; // quay
  const n = houseCount(pop), step = 520 / n;
  for (let i = 0; i < n; i++) { // houses, back row higher
    const x = 30 + i * step + r() * 8, w = 28 + r() * 16, h = 24 + r() * 26 + (pop > 20000 ? 8 : 0), y = 132 - h - (i % 2 ? 0 : 6);
    const wall = mix(WALL[Math.floor(r() * WALL.length)], [30, 30, 50], 1 - light), roof = mix(ROOF[Math.floor(r() * ROOF.length)], [30, 20, 30], 1 - light);
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${rgb(wall)}" stroke="#4a3a24" stroke-width=".6"/>`;
    s += `<path d="M${(x - 3).toFixed(1)} ${y.toFixed(1)} L${(x + w / 2).toFixed(1)} ${(y - 12 - r() * 6).toFixed(1)} L${(x + w + 3).toFixed(1)} ${y.toFixed(1)}Z" fill="${rgb(roof)}" stroke="#3a2a1a" stroke-width=".6"/>`;
    const lit = light < 0.5 ? "#ffd27a" : "#5a4a38";
    s += `<rect x="${(x + w * 0.25).toFixed(1)}" y="${(y + h * 0.3).toFixed(1)}" width="5" height="7" fill="${lit}"/>` + (w > 34 ? `<rect x="${(x + w * 0.62).toFixed(1)}" y="${(y + h * 0.3).toFixed(1)}" width="5" height="7" fill="${lit}"/>` : "");
  }
  const cx = 30 + Math.floor(r() * (n - 1)) * step + step / 2; // church tower, always present
  s += `<rect x="${cx.toFixed(1)}" y="50" width="16" height="82" fill="${rgb(mix([222, 206, 170], [40, 40, 60], 1 - light))}" stroke="#4a3a24" stroke-width=".6"/><path d="M${(cx - 2).toFixed(1)} 50 L${(cx + 8).toFixed(1)} 28 L${(cx + 18).toFixed(1)} 50Z" fill="${rgb(mix([150, 60, 40], [30, 20, 30], 1 - light))}"/>`;
  if (pop > 15000) s += `<path d="M0 132 V108 h6 v-6 h6 v6 h6 v-6 h6 v6 h6 V132Z" fill="#8f836c" opacity=".9"/>`; // town wall stub for big ports
  if (warehouse) s += `<rect x="470" y="96" width="62" height="36" fill="#8a6a3f" stroke="#3a2a1a"/><path d="M466 96 L501 78 L536 96Z" fill="#6b4a2a" stroke="#3a2a1a"/><rect x="494" y="112" width="14" height="20" fill="#3a2a1a"/>`;
  if (shipyard) s += `<g stroke="#3a2a1a" stroke-width="2" fill="none"><path d="M560 132 V92 H585 M560 100 L585 92"/></g><rect x="548" y="124" width="44" height="8" fill="#6b4a2a"/>`;
  for (let i = 0; i < Math.min(3, ships); i++) { // docked ships
    const x = 90 + i * 150 + r() * 20;
    s += `<g transform="translate(${x.toFixed(0)} 150)"><path d="M0 0 L8 10 H70 L82 0Z" fill="#6a3a22" stroke="#2a1a10"/><rect x="38" y="-48" width="3" height="48" fill="#3a2a1a"/><path d="M41 -46 H72 V-14 H41Z" fill="#f2e8cc" stroke="#3a2a1a" stroke-width=".8"/><path d="M38 -44 H8 V-20 H38Z" fill="#eadfc0" stroke="#3a2a1a" stroke-width=".8"/></g>`;
  }
  return s + `</svg>`;
}
