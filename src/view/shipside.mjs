// Side-view ship art for the port scene, the shipyard cards and the ship window. Own artwork, drawn in code (CC BY 4.0).
// Pure functions (no DOM, no ids, no scripts, no fonts): the same input always gives the same bytes.
// Bow points right, sails are furled (the ship is docked). State cues mirror the map markers in ships.mjs.
import { HULL_SIDE } from "./shipvisual.mjs";

const INK = "#2a1d10", INK2 = "#3a2a1a", HULL = "#6b4a2a", WOOD = "#8a6a44", PATCH = "#6b5136", RED = "#7a2a1c", SAIL = "#f4ead0";
const r = (n) => Math.round(n * 10) / 10;

// Per class (hull space: stern at x=0, waterline y=0, up is negative). `hull` is the closed outline; `sheer` is its top edge
// as a quadratic [stern, control, bow] that wales, planks and gunports follow. W/H/oy: native canvas and waterline row.
const SPEC = {
  barca: {
    W: 80, H: 76, oy: 68, L: 56,
    hull: "M0 -14 Q3 -3 15 -1 L44 -1 Q52 -5 59 -18 Q30 -10 0 -14 Z", sheer: [[0, -14], [30, -10], [59, -18]],
    stripe: 2.4, wales: [8.6], planks: [12], port: { dy: 4, size: 3, cap: 1 },
    castles: [], masts: [{ x: 27, top: -60, lat: [50, -22, 2, -58] }], flag: [27, -60],
    stays: [[27, -58, 58, -18], [27, -58, 1, -14]], bowsprit: null, patchY: -9,
  },
  cog: {
    W: 112, H: 104, oy: 96, L: 88,
    hull: "M2 -26 Q4 -6 20 -1 L68 -1 Q82 -6 94 -32 Q48 -22 2 -26 Z", sheer: [[2, -26], [48, -22], [94, -32]],
    stripe: 3, wales: [14], planks: [6, 10, 18, 22], port: { dy: 6.5, size: 4, cap: 3 },
    posts: [[82, -6, 96, -40], [5, -5, 1, -40]],
    castles: ["M1 -27 L-1 -40 L27 -40 L27 -24 Z"], masts: [{ x: 46, top: -90, sq: [28, 64, -78], nest: true }], flag: [1, -40],
    stays: [[46, -88, 96, -40], [46, -88, 1, -40]], bowsprit: null, patchY: -16,
  },
  caravel: {
    W: 134, H: 110, oy: 102, L: 108,
    hull: "M0 -22 Q4 -4 20 -1 L84 -1 Q100 -6 112 -20 Q58 -14 0 -22 Z", sheer: [[0, -22], [58, -14], [112, -20]],
    stripe: 2.6, wales: [11], planks: [15], port: { dy: 5, size: 4, cap: 4 },
    castles: ["M0 -22 L-1 -31 L25 -31 L28 -18 Z"],
    masts: [{ x: 44, top: -88, lat: [66, -24, 10, -88] }, { x: 84, top: -78, lat: [104, -22, 58, -76] }], flag: [44, -88],
    stays: [[44, -86, 112, -20], [44, -86, 0, -30], [84, -76, 112, -20], [44, -86, 84, -76]], bowsprit: [108, -20, 124, -28], patchY: -12,
  },
  nao: {
    W: 170, H: 150, oy: 142, L: 132,
    hull: "M0 -34 Q6 -6 26 -1 L100 -1 Q120 -8 138 -32 Q70 -24 0 -34 Z", sheer: [[0, -34], [70, -24], [138, -32]],
    stripe: 3.4, wales: [15, 23], planks: [8, 19], port: { dy: 7, size: 5, cap: 8 },
    castles: ["M0 -34 L-4 -52 L-1 -62 L40 -62 L42 -33 Z", "M101 -30 L101 -46 L126 -46 L136 -31 Z"],
    masts: [{ x: 24, top: -102, lat: [44, -64, -3, -104], base: -62 }, { x: 66, top: -128, sq: [44, 88, -96], sq2: [54, 78, -116] }, { x: 106, top: -106, sq: [90, 122, -82] }],
    flag: [66, -128], lantern: [-4, -64], stays: [[66, -126, 134, -34], [66, -126, 0, -62], [106, -104, 138, -34], [24, -100, 66, -126], [66, -126, 106, -104]],
    bowsprit: [132, -34, 160, -50], patchY: -20, rich: true,
  },
};

const quad = (h, t) => { const [s, c, b] = h, u = 1 - t; return [u * u * s[0] + 2 * u * t * c[0] + t * t * b[0], u * u * s[1] + 2 * u * t * c[1] + t * t * b[1]]; };
// Sub-curve of the sheer between parameters a..b, dropped dy below it (a wale, stripe or plank line).
function along(h, a, b, dy) {
  const [s, c, e] = h, p = quad(h, a), q = quad(h, b), u = 1 - a;
  const cx = p[0] + (b - a) * (u * (c[0] - s[0]) + a * (e[0] - c[0])), cy = p[1] + (b - a) * (u * (c[1] - s[1]) + a * (e[1] - c[1]));
  return `M${r(p[0])} ${r(p[1] + dy)} Q${r(cx)} ${r(cy + dy)} ${r(q[0])} ${r(q[1] + dy)}`;
}
const line = (x1, y1, x2, y2, w = 0.8, col = INK2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
const furl = (x1, y1, x2, y2, sag = 0) => { // a furled sail: cream bundle lashed along its yard
  const d = `M${x1} ${y1} Q${r((x1 + x2) / 2)} ${r((y1 + y2) / 2 + sag)} ${x2} ${y2}`;
  let s = `<path d="${d}" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${SAIL}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i < 6; i++) { const t = i / 6, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t + sag * 2 * t * (1 - t); s += line(r(x), r(y - 2.2), r(x), r(y + 2.2), 0.7, INK); }
  return s + `<path d="${d}" stroke="${INK2}" stroke-width="1.2" fill="none" transform="translate(0 -3)" stroke-linecap="round"/>`;
};

/** Inline <svg> for one docked ship. Without {w,h} the native size of the class is used; with them the art is fitted
 *  into the box (smaller classes stay smaller). `cls` adds a class attribute. */
export function shipSideSvg(type, { hull = 100, weapons = 0, maxGuns, gun = 100 } = {}, { w, h, cls } = {}) {
  const key = SPEC[type] ? type : "cog", sp = SPEC[key], [len] = HULL_SIDE[key];
  const vw = Number.isFinite(w) && w > 0 ? w : sp.W, vh = Number.isFinite(h) && h > 0 ? h : sp.H;
  const fit = w || h ? Math.min(vw / sp.W, vh / sp.H) * (0.62 + 0.38 * len / HULL_SIDE.nao[0]) : 1;
  const tx = r((vw - sp.W * fit) / 2), ty = r(vh - sp.H * fit);
  const sh = sp.sheer, L = sp.L, midY = quad(sh, 0.5)[1];
  let s = `<ellipse cx="${r(L / 2 + 2)}" cy="2" rx="${r(L * 0.56)}" ry="3.2" fill="${INK}" opacity=".22"/>`;
  // rigging behind the hull: masts, stays, furled sails
  for (const m of sp.masts) {
    const base = m.base ?? quad(sh, (m.x - sh[0][0]) / (sh[2][0] - sh[0][0]))[1];
    s += line(m.x, base, m.x, m.top, 2.6);
    if (m.nest) s += `<path d="M${m.x - 4.5} ${m.top + 1} L${m.x + 4.5} ${m.top + 1} L${m.x + 3} ${m.top + 7} L${m.x - 3} ${m.top + 7} Z" fill="${WOOD}" stroke="${INK}" stroke-width="1"/>`;
    if (m.lat) { s += line(m.lat[0], m.lat[1], m.lat[2], m.lat[3], 1.4, INK); s += furl(m.lat[0], m.lat[1], m.lat[2], m.lat[3], 0); }
    if (m.sq) { s += line(m.sq[0] - 2, m.sq[2], m.sq[1] + 2, m.sq[2], 1.6, INK); s += furl(m.sq[0], m.sq[2] + 2, m.sq[1], m.sq[2] + 2, 3); }
    if (m.sq2) s += furl(m.sq2[0], m.sq2[2] + 1, m.sq2[1], m.sq2[2] + 1, 2);
    const sx = m.sq ? 8 : 10;
    s += line(m.x, m.top + 14, r(m.x - sx), base, 0.7) + line(m.x, m.top + 14, r(m.x + sx), base, 0.7);
    if (sp.rich || key === "cog") for (let k = 1; k <= 3; k++) { const f = k / 4, y = r(m.top + 14 + (base - m.top - 14) * f), d = sx * f; s += line(r(m.x - d), y, r(m.x + d), y, 0.5); }
  }
  for (const [a, b, c, d] of sp.stays) s += line(a, b, c, d, 0.7);
  if (sp.bowsprit) s += line(...sp.bowsprit, 3, INK2);
  if (sp.posts) for (const p of sp.posts) s += line(...p, 3.6, INK2);
  // hull, wales, planking, accent stripe, rudder
  s += `<path d="M${r(sh[0][0] - 1)} ${r(sh[0][1] + 8)} L-5.5 ${r(sh[0][1] + 10)} L-5.5 3 L3 1 Z" fill="${INK2}" stroke="${INK}" stroke-width="1"/>`;
  s += `<path d="${sp.hull}" fill="${HULL}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  for (const dy of sp.planks) s += `<path d="${along(sh, 0.05 + dy * 0.004, 0.93 - dy * 0.006, dy)}" stroke="${INK2}" stroke-width="0.6" opacity=".6" fill="none"/>`;
  s += `<path d="${along(sh, 0.03, 0.97, sp.stripe)}" stroke="${RED}" stroke-width="1.8" fill="none"/>`;
  for (const dy of sp.wales) s += `<path d="${along(sh, 0.04, 0.9, dy)}" stroke="${WOOD}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${along(sh, 0.04, 0.9, dy + 1.5)}" stroke="${INK}" stroke-width="0.7" fill="none"/>`;
  s += `<path d="${along(sh, 0, 1, 0)}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  // castles
  sp.castles.forEach((c, i) => {
    s += `<path d="${c}" fill="${WOOD}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    const nums = c.match(/-?\d+/g).map(Number), xs = nums.filter((_, j) => j % 2 === 0), ys = nums.filter((_, j) => j % 2 === 1);
    const x0 = Math.min(...xs) + 3, x1 = Math.max(...xs) - 3, top = Math.min(...ys);
    for (let x = x0; x <= x1; x += 5) s += line(r(x), top + 2, r(x), top + 9, 0.5, INK2);
    if (sp.rich && i === 0) for (const wx of [8, 17, 26]) s += `<path d="M${wx - 2} -40 v-4 a2 2 0 0 1 4 0 v4 Z" fill="${INK}"/>`;
  });
  if (sp.lantern) { const [lx, ly] = sp.lantern; s += line(lx, ly, lx, ly - 8, 1.2, INK) + `<path d="M${lx - 3} ${ly - 8} L${lx + 3} ${ly - 8} L${lx + 2.2} ${ly - 15} L${lx - 2.2} ${ly - 15} Z" fill="#d9a441" stroke="${INK}" stroke-width="1"/><path d="M${lx - 3.4} ${ly - 15} h6.8 l-3.4 -3 Z" fill="${INK}"/>`; }
  // ensign
  const [fx, fy] = sp.flag;
  s += line(fx, fy, fx, fy - 9, 1, INK) + `<path d="M${fx} ${fy - 9} l-11 1.6 l3 2.4 l-3 2.4 l11 1.6 Z" fill="${RED}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>`;
  // gunports: one dark square per mounted piece, worn pieces half-size
  const cap = Math.max(0, Math.floor(maxGuns ?? sp.port.cap)), n = Math.max(0, Math.min(Math.floor(weapons) || 0, cap));
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? L * 0.5 : L * 0.3 + (L * 0.4 * i) / (n - 1), z = gun < 50 ? sp.port.size / 2 : sp.port.size, c = sp.port.size / 2;
    s += `<rect class="gunport" x="${r(x - z / 2)}" y="${r(midY + sp.port.dy + c - z / 2)}" width="${r(z)}" height="${r(z)}" fill="${INK}"/>`;
  }
  // damage: one plank patch under 70 hull, two plus a battered stern under 30
  const hp = Number.isFinite(hull) ? hull : 100, pw = r(L * 0.11);
  if (hp < 70) s += `<path d="M${r(L * 0.38)} ${sp.patchY} h${pw} v7 h-${pw} Z" fill="${PATCH}" stroke="${INK}" stroke-width=".8"/>`;
  if (hp < 30) {
    s += `<path d="M${r(L * 0.66)} ${sp.patchY + 3} h${pw} v7 h-${pw} Z" fill="${PATCH}" stroke="${INK}" stroke-width=".8"/>`;
    s += `<path d="M${sh[0][0]} ${r(sh[0][1] + 1)} L${sh[0][0] + 13} ${r(sh[0][1] + 8)} L${sh[0][0] + 5} ${r(sh[0][1] + 23)} L${sh[0][0] + 1} ${r(sh[0][1] + 20)} Z" fill="${INK}"/>`;
  }
  const label = String(type).replace(/[^\w -]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg"${cls ? ` class="${String(cls).replace(/[^\w -]/g, "")}"` : ""} viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}" role="img" aria-label="${label}"><g transform="translate(${tx} ${ty}) scale(${r(fit * 1000) / 1000}) translate(12 ${sp.oy})">${s}</g></svg>`;
}
