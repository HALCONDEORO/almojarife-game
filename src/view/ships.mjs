// Ship drawing helpers. Own artwork, drawn in code: a top-down hull with sails, seen from above.
// Pure functions (no DOM) so they are testable; the page only inserts the strings.
/** Direction of travel in degrees on screen (0 = right, 90 = down). Null if the points coincide. */
export function headingDeg(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
  return Math.round(Math.atan2(dy, dx) * 180 / Math.PI * 10) / 10;
}
// One distinguishable silhouette per type: size, beam and sail plan carry the difference (data: SHIP_TYPES in src/sim/trade.mjs).
const HULL = {
  barca: "M-8 0 C-7.6 -2.4 -3 -3.6 2 -3 C5 -2.6 6.8 -1.4 8.5 0 C6.8 1.4 5 2.6 2 3 C-3 3.6 -7.6 2.4 -8 0 Z",
  cog: "M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z",
  caravel: "M-12 0 C-11.5 -2.8 -6 -4.4 0 -4.2 C6 -4 10 -2.2 14.5 0 C10 2.2 6 4 0 4.2 C-6 4.4 -11.5 2.8 -12 0 Z",
  nao: "M-14 0 C-13.5 -4.2 -7 -6.4 0 -6.2 C7 -6 11 -3.4 15 0 C11 3.4 7 6 0 6.2 C-7 6.4 -13.5 4.2 -14 0 Z",
};
// Castle blocks (cog: stern castle; nao: stern + fore castles), in the mid-wood deck tone.
const CASTLE = {
  caravel: ["M-11.3 -1.9 L-8.2 -2.7 L-8.2 2.7 L-11.3 1.9 Z"],
  cog: ["M-10.4 -2.6 L-6.4 -3.4 L-6.4 3.4 L-10.4 2.6 Z"],
  nao: ["M-13.6 -2.4 L-8.6 -4 L-8 0 L-8.6 4 L-13.6 2.4 Z", "M8.8 -3.2 L12.2 -1.4 L12.2 1.4 L8.8 3.2 Z"],
};
// Size ladder. Map markers are drawn at HULL_SIDE proportions (barca 28 : cog 44 : caravel 54 : nao 66 = 1 : 1.57 : 1.93 : 2.36),
// pivoting on the cog so its art is untouched. Each class art is scaled uniformly by CLASS_SCALE, giving hull lengths of about
// 15 / 23.5 / 28.6 / 34.2 units (1 : 1.57 : 1.9 : 2.3; inside the x1.7 marker wrapper 25 to 58 units): the nao clearly dwarfs the
// barca while the barca stays a legible 25-unit boat at fit zoom. The side art in shipside.mjs (L = 56 / 88 / 108 / 132) follows the same ladder.
const CLASS_SCALE = { barca: 0.9, cog: 1, caravel: 1.08, nao: 1.18 };
// Sails seen from above: [x of the yard, half span, belly depth, skew of the far yard end (lateen), reef seams].
const SAIL = {
  barca: [[-1, 4.5, 1.4, 1.2]],
  cog: [[-1, 7, 2.2, 0]],
  caravel: [[-6, 6, 1.4, 1.2], [2, 5, 1.3, 1]],
  nao: [[-8, 5.8, 1.2, 1.6], [-2.5, 7.5, 2, 0], [4, 5, 1.6, 0]],
};
const sailPath = ([x, hw, d, sk]) => `M${x} ${-hw} C${r1(x + 2.8 * d)} ${r1(-hw * 0.75)} ${r1(x + sk + 2.8 * d)} ${r1(hw * 0.75)} ${x + sk} ${hw} Z`; // flat at the yard, belly towards the bow
const sailBits = ([x, hw, d, sk], f) => { // yard line, seam lines and mast top for one sail
  let h = `<line x1="${x - 0.2}" y1="${-hw - 0.6}" x2="${x + sk + 0.2}" y2="${hw + 0.6}" stroke="#3a2a1a" stroke-width=".5" stroke-linecap="round"/>`;
  for (const k of [-0.5, 0, 0.5]) h += `<line x1="${r1(x + sk * (k + 1) / 2)}" y1="${r1(k * hw)}" x2="${r1(x + sk * (k + 1) / 2 + d * 2 * (1 - k * k) * 0.8)}" y2="${r1(k * hw)}" stroke="#3a2a1a" stroke-width=".18" opacity=".55"/>`;
  return h + `<circle cx="${r1(x + d * 0.55)}" cy="0" r=".7" fill="#3a2a1a" stroke="#2a1d10" stroke-width=".2"/>`;
};
const sailShade = ([x, hw, d, sk]) => { // leeward half of the sail in a soft shadow: de Casteljau split of the belly curve at t = .5
  const P = [[x, -hw], [x + 2.8 * d, -hw * 0.75], [x + sk + 2.8 * d, hw * 0.75], [x + sk, hw]], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const B = mid(P[1], P[2]), E = mid(B, mid(P[2], P[3])), M = mid(mid(mid(P[0], P[1]), B), E), C = mid(P[2], P[3]);
  return `<path d="M${r1(M[0])} ${r1(M[1])} C${r1(E[0])} ${r1(E[1])} ${r1(C[0])} ${r1(C[1])} ${x + sk} ${hw} L${x} 0 Z" fill="#2a1d10" opacity=".1"/>`;
};
// Sail wear: tan cloth patches and ragged tears (a patch is mended cloth, a tear is a hole: neither occurs on a sound sail).
const CLOTH = "#b7a273";
const sailWear = ([x, hw, d, sk], band, main) => {
  const px = r1(x + sk * 0.225 + 0.3), py = r1(-hw * 0.55), tx = r1(x + sk * 0.775 + 0.2), ty = r1(hw * 0.55);
  let h = `<path d="M${tx} ${ty} l1.3 .5 l-.4 .8 l1 .6" stroke="#2a1d10" stroke-width=".45" fill="none" stroke-linejoin="round"/>`; // slit
  if (main) h += `<path d="M${px} ${py} h1.9 v2.2 h-1.9 Z" fill="${CLOTH}" stroke="#3a2a1a" stroke-width=".3"/><path d="M${px} ${r1(py + 1.1)} h1.9" stroke="#3a2a1a" stroke-width=".18"/>`;
  if (band === 2) h += `<path d="M${r1(x + sk * 0.55 + 0.4)} ${r1(hw * 0.05)} l1.7 .3 l.5 1.2 l-.9 .6 l-1.1 -.7 Z" fill="#2a1d10" opacity=".8"/>`; // hole
  return h;
};
const r1 = (n) => Math.round(n * 100) / 100;
const RAIL_Y = { barca: 2.4, cog: 4.0, caravel: 3.0, nao: 4.6 }; // gunport distance from the centreline
const GUN_SPAN = { barca: 8, cog: 14, caravel: 16, nao: 20 }; // hull stretch the gunports occupy
const VIS_MAX_GUNS = { barca: 1, cog: 3, caravel: 4, nao: 8 }; // fallback cap; the caller passes the canonical MAX_CANNONS
const PATCH1 = "M-5.5 -2.4 h3.4 v3.2 h-3.4 Z"; // plank patch: hull damage (shape cue, filled wood tone)
const PATCH2 = "M2 -0.5 h3.4 v3.2 h-3.4 Z";
const BOW_X = { barca: 8.5, cog: 12.5, caravel: 14.5, nao: 15 };
const STERN_X = { barca: -8, cog: -11, caravel: -12, nao: -14 }; // hull stern tip per type
/** SVG markup for one ship, bow pointing along +x. `mine` colours it red, rivals grey.
 *  weapons/gun/hull come from the ship record (weaponCount / gunCond / hull); defaults draw the intact ship. */
export function shipSvg(type, { mine = false, heading = 0, weapons = 0, maxGuns, gun = 100, hull = 100 } = {}) {
  const hullP = HULL[type] ?? HULL.cog, fill = mine ? "#7a2a1c" : "#55493a", sailFill = mine ? "#f6ecd2" : "#d8cfba";
  const key = HULL[type] ? type : "cog", sails = SAIL[key];
  const band = hull < 30 ? 2 : hull < 70 ? 1 : 0; // 0 intact, 1 hull patch + torn sail + mast leaning, 2 two patches, battered stern, holed sails, list
  const sx0 = STERN_X[key], wrap = (t, c) => t ? `<g transform="${t}">${c}</g>` : c;
  const list = band === 2 ? "translate(0 .5) scale(1 .94)" : "", lean = band === 2 ? "rotate(3)" : band === 1 ? "rotate(1.2)" : ""; // hull rolls to one side, rig leans the other way
  let a = `<path d="${hullP}" fill="${fill}" stroke="#2a1d10" stroke-width=".9" stroke-linejoin="round"/>`;
  a += `<path d="M${sx0 + 1.6} 0 L${BOW_X[key] - 2.5} 0" stroke="#3a2a1a" stroke-width=".35" opacity=".6" fill="none"/>`; // deck centreline
  a += `<path d="${hullP}" transform="scale(.86)" fill="none" stroke="#8a6a44" stroke-width=".5"/>`; // inner rail
  a += `<path d="${hullP}" transform="scale(.94)" fill="none" stroke="#e9d9b0" stroke-width=".22" opacity=".4"/>`; // sheer highlight on the gunwale
  if (key === "barca") a += `<path d="M${sx0 + 1.2} 0.3 L${sx0 - 1.6} 1.7" stroke="#3a2a1a" stroke-width=".5" stroke-linecap="round"/>`; // steering oar
  for (const c of CASTLE[key] ?? []) a += `<path d="${c}" fill="#8a6a44" stroke="#2a1d10" stroke-width=".6" stroke-linejoin="round"/>`;
  const main = sails.reduce((m, sl, i) => sl[1] > sails[m][1] ? i : m, 0);
  const rig = sails.map((sl, i) => `<path d="${sailPath(sl)}" fill="${sailFill}" stroke="#2a1d10" stroke-width=".6" stroke-linejoin="round"/>${sailShade(sl)}${sailBits(sl)}${band && (band === 2 || i === main) ? sailWear(sl, band, i === main) : ""}`).join("");
  let f = `<line x1="${sx0 + 2.4}" y1="0" x2="${sx0 + 2.4}" y2="-2.6" stroke="#2a1d10" stroke-width=".35"/><path d="M${sx0 + 2.4} -2.6 L${sx0 + 0.3} -2.2 L${sx0 + 2.4} -1.5 Z" fill="${mine ? "#7a2a1c" : "#3a2a1a"}"/>`; // tiny stern flag
  let g = "";
  const cap = Math.max(0, Math.floor(maxGuns ?? VIS_MAX_GUNS[type] ?? 3)), n = Math.max(0, Math.min(Math.floor(weapons) || 0, cap));
  if (n > 0) { // gunports along both rails, one pair per mounted piece; worn pieces (gunCond < 50) render as half-width marks
    const ry = RAIL_Y[type] ?? 4.0, span = GUN_SPAN[type] ?? 14, worn = gun < 50;
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
      const w = worn ? 0.9 : 1.8; // size cue readable at map scale: a battered piece is a short dash
      for (const s of [1, -1]) g += `<rect x="${(x - w / 2).toFixed(2)}" y="${(s * ry - 0.55).toFixed(2)}" width="${w}" height="1.1" rx="0.2" fill="#2a1d10"/>`;
    }
  }
  if (band >= 1) g += `<path d="${PATCH1}" fill="#6b5136" stroke="#2a1d10" stroke-width=".5"/>`;
  if (band === 2) {
    const sx = STERN_X[type] ?? -11; // dark bite on the stern tip: severe damage readable at 1x
    g += `<path d="${PATCH2}" fill="#6b5136" stroke="#2a1d10" stroke-width=".5"/>`;
    g += `<path d="M${sx} 0 L${sx + 2.6} -2.2 L${sx + 2.6} 2.2 Z" fill="#2a1d10"/>`;
  }
  const k = CLASS_SCALE[key], h = wrap(list, a) + wrap(lean, rig) + f + wrap(list, g);
  return `<g class="ship" transform="rotate(${heading}) scale(1.7)">${wrap(k === 1 ? "" : `scale(${k})`, h)}</g>`;
}
/** Wake: a fading line of the last few positions (oldest first). */
export function wakeSvg(points) {
  if (points.length < 2) return "";
  let h = "";
  for (let i = 1; i < points.length; i++) {
    const o = (i / points.length * 0.55).toFixed(2);
    h += `<line x1="${points[i - 1].x.toFixed(1)}" y1="${points[i - 1].y.toFixed(1)}" x2="${points[i].x.toFixed(1)}" y2="${points[i].y.toFixed(1)}" stroke="#fff" stroke-opacity="${o}" stroke-width="${(1 + i / points.length * 1.5).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return h;
}
/** Keep the last n screen positions per ship id. */
export function pushTrail(trails, id, p, n = 14, minStep = 1.2, maxJump = 40) {
  const a = (trails[id] ??= []), last = a[a.length - 1];
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < minStep) return a;
  if (last && Math.hypot(p.x - last.x, p.y - last.y) > maxJump) a.length = 0; // the ship jumped (days skipped): no wake across the map
  a.push({ x: p.x, y: p.y }); if (a.length > n) a.shift();
  return a;
}
