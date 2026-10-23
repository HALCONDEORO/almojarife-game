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
  barca: "M-8 0 C-7 -3 -2 -3.6 3 -2.6 L8 0 L3 2.6 C-2 3.6 -7 3 -8 0 Z",
  cog: "M-11 0 C-10 -4.5 -2 -5.5 5 -4 L12 0 L5 4 C-2 5.5 -10 4.5 -11 0 Z",
  caravel: "M-12 0 C-11 -3.5 -2 -4.5 6 -3 L14 0 L6 3 C-2 4.5 -11 3.5 -12 0 Z",
  nao: "M-14 0 C-13 -5.5 -3 -6.5 6 -5 L14 0 L6 5 C-3 6.5 -13 5.5 -14 0 Z",
};
const CASTLE = { nao: "M-13.6 -2.2 L-9.5 -3.6 L-8.6 0 L-9.5 3.6 L-13.6 2.2 Z" }; // raised sterncastle, mid-wood tone
const SAIL = {
  barca: ["M-1 -4.5 L-1 4.5 L1.6 3 L1.6 -3 Z"],
  cog: ["M-1 -7 L-1 7 L2 5 L2 -5 Z"],
  caravel: ["M-6 -6 L-6 6 L-3 4.5 L-3 -4.5 Z", "M2 -5 L2 5 L5 3.5 L5 -3.5 Z"],
  nao: ["M-8 -6.5 L-8 6.5 L-5.5 5.5 L-5.5 -5.5 Z", "M-2.5 -7.5 L-2.5 7.5 L0.5 6 L0.5 -6 Z", "M4 -5 L4 5 L6.5 4 L6.5 -4 Z"],
};
const RAIL_Y = { barca: 2.4, cog: 4.0, caravel: 3.0, nao: 4.6 }; // gunport distance from the centreline
const GUN_SPAN = { barca: 8, cog: 14, caravel: 16, nao: 20 }; // hull stretch the gunports occupy
const VIS_MAX_GUNS = { barca: 1, cog: 3, caravel: 4, nao: 8 }; // fallback cap; the caller passes the canonical MAX_CANNONS
const PATCH1 = "M-5.5 -2.4 h3.4 v3.2 h-3.4 Z"; // plank patch: hull damage (shape cue, filled wood tone)
const PATCH2 = "M2 -0.5 h3.4 v3.2 h-3.4 Z";
const STERN_X = { barca: -8, cog: -11, caravel: -12, nao: -14 }; // hull stern tip per type
/** SVG markup for one ship, bow pointing along +x. `mine` colours it red, rivals grey.
 *  weapons/gun/hull come from the ship record (weaponCount / gunCond / hull); defaults draw the intact ship. */
export function shipSvg(type, { mine = false, heading = 0, weapons = 0, maxGuns, gun = 100, hull = 100 } = {}) {
  const hullP = HULL[type] ?? HULL.cog, fill = mine ? "#7a2a1c" : "#55493a", sailFill = mine ? "#f6ecd2" : "#d8cfba";
  const sails = SAIL[type] ?? SAIL.cog;
  const band = hull < 30 ? 2 : hull < 70 ? 1 : 0; // 0 intact, 1 one plank patch, 2 two patches + battered stern
  let h = `<path d="${hullP}" fill="${fill}" stroke="#2a1d10" stroke-width=".9"/>`;
  if (CASTLE[type]) h += `<path d="${CASTLE[type]}" fill="#6b5136" stroke="#2a1d10" stroke-width=".6"/>`;
  h += sails.map((p) => `<path d="${p}" fill="${sailFill}" stroke="#2a1d10" stroke-width=".6"/>`).join("");
  const cap = Math.max(0, Math.floor(maxGuns ?? VIS_MAX_GUNS[type] ?? 3)), n = Math.max(0, Math.min(Math.floor(weapons) || 0, cap));
  if (n > 0) { // gunports along both rails, one pair per mounted piece; worn pieces (gunCond < 50) render as half-width marks
    const ry = RAIL_Y[type] ?? 4.0, span = GUN_SPAN[type] ?? 14, worn = gun < 50;
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
      const w = worn ? 0.9 : 1.8; // size cue readable at map scale: a battered piece is a short dash
      for (const s of [1, -1]) h += `<rect x="${(x - w / 2).toFixed(2)}" y="${(s * ry - 0.55).toFixed(2)}" width="${w}" height="1.1" rx="0.2" fill="#2a1d10"/>`;
    }
  }
  if (band >= 1) h += `<path d="${PATCH1}" fill="#6b5136" stroke="#2a1d10" stroke-width=".5"/>`;
  if (band === 2) {
    const sx = STERN_X[type] ?? -11; // dark bite on the stern tip: severe damage readable at 1x
    h += `<path d="${PATCH2}" fill="#6b5136" stroke="#2a1d10" stroke-width=".5"/>`;
    h += `<path d="M${sx} 0 L${sx + 2.6} -2.2 L${sx + 2.6} 2.2 Z" fill="#2a1d10"/>`;
  }
  return `<g class="ship" transform="rotate(${heading}) scale(1.7)">${h}</g>`;
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
