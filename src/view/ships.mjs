// Ship drawing helpers. Own artwork, drawn in code: a top-down hull with a sail, seen from above.
// Pure functions (no DOM) so they are testable; the page only inserts the strings.
/** Direction of travel in degrees on screen (0 = right, 90 = down). Null if the points coincide. */
export function headingDeg(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
  return Math.round(Math.atan2(dy, dx) * 180 / Math.PI * 10) / 10;
}
const HULL = { cog: "M-11 0 C-10 -4.5 -2 -5.5 5 -4 L12 0 L5 4 C-2 5.5 -10 4.5 -11 0 Z", caravel: "M-12 0 C-11 -3.5 -2 -4.5 6 -3 L14 0 L6 3 C-2 4.5 -11 3.5 -12 0 Z" };
const SAIL = { cog: "M-1 -7 L-1 7 L2 5 L2 -5 Z", caravel: "M-6 -6 L-6 6 L-3 4.5 L-3 -4.5 Z M2 -5 L2 5 L5 3.5 L5 -3.5 Z" };
/** SVG markup for one ship, bow pointing along +x. `mine` colours it red, rivals grey. */
export function shipSvg(type, { mine = false, heading = 0 } = {}) {
  const hull = HULL[type] ?? HULL.cog, sail = SAIL[type] ?? SAIL.cog;
  const fill = mine ? "#7a2a1c" : "#55493a", sailFill = mine ? "#f6ecd2" : "#d8cfba";
  return `<g class="ship" transform="rotate(${heading}) scale(1.7)"><path d="${hull}" fill="${fill}" stroke="#2a1d10" stroke-width=".9"/><path d="${sail}" fill="${sailFill}" stroke="#2a1d10" stroke-width=".6"/></g>`;
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
