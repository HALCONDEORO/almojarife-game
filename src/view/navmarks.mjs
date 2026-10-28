import {haversineKm} from "../../tools/geo.mjs";
// Navigation marks on the sea map (pure SVG strings, no DOM): short fading ship trail, heading
// arrow drawn under the ship icon, and route lines that tell an automatic trade route (ship.route)
// apart from a manual order. Colours are dark inks: white marks vanish on the pale parchment chart.
export const TRAIL_LEN = 6, TRAIL_STEP = 4; // six positions, at least 4 map units apart
const INK = "#3b2a17", ROUTE_RED = "#a8321f";
const f1 = (v) => (Math.round(v * 10) / 10).toString();
/** Fading trail of the last TRAIL_LEN positions (oldest first); the newest is under the ship and not drawn. `k` is markerScale(zoom). */
export function trailSvg(points, k = 1) {
  const pts = points.slice(-TRAIL_LEN);
  if (pts.length < 2) return "";
  let h = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const w = (i + 1) / pts.length; // 1/6 .. 5/6, older dots are fainter and smaller
    h += `<circle cx="${f1(pts[i].x)}" cy="${f1(pts[i].y)}" r="${f1((1 + 2 * w) * k)}" fill="${INK}" fill-opacity="${(0.15 + 0.5 * w).toFixed(2)}"/>`;
  }
  return `<g class="trail" pointer-events="none">${h}</g>`;
}
/** Heading arrow in marker space (0 deg = east, same convention as headingDeg). Placed before the
 *  ship icon in the marker group so it renders under the hull and only its tip shows ahead of the bow. */
export const headingArrowSvg = () =>
  `<g class="heading" pointer-events="none"><path d="M6 -3.5 L24 0 L6 3.5 Z" fill="${INK}" fill-opacity="0.75" stroke="#f4ead0" stroke-width="0.8"/></g>`;
/** "auto" for a ship sailing an automated trade route, "manual" for a player order or preview. */
export const routeKind = (ship) => (ship?.route ? "auto" : "manual");
export const ROUTE_STYLE = Object.freeze({
  manual: Object.freeze({ stroke: ROUTE_RED, width: 3, dash: "7 5", opacity: 1 }),
  auto: Object.freeze({ stroke: INK, width: 1.25, dash: "2 4", opacity: 0.85 }),
});
/** Polyline for `points` ([[x, y], ...]) in the given kind; empty for fewer than two points. */
export function routeLineSvg(points, kind = "manual") {
  if (!points || points.length < 2) return "";
  const s = ROUTE_STYLE[kind] ?? ROUTE_STYLE.manual;
  return `<polyline data-route="${kind}" points="${points.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ")}" fill="none" stroke="${s.stroke}" stroke-width="${s.width}" stroke-dasharray="${s.dash}" stroke-opacity="${s.opacity}" stroke-linecap="round" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
}

/** Remaining projected waypoints. Same distance-progress definition as shipPosition. */
export function remainingRoute(world, ship, tickFrac = 0) {
  const v=ship?.voyage;if(!v?.path?.length)return [];
  const nd=id=>v.pts?.[id]??world.nodes[id];
  const done=Math.min(1,Math.max(0,(v.totalTicks-v.ticksLeft+Math.min(1,Math.max(0,tickFrac)))/v.totalTicks));
  let want=v.km*done;
  for(let i=0;i+1<v.path.length;i++){
    const a=nd(v.path[i]),b=nd(v.path[i+1]);if(!a||!b)return [];
    const d=haversineKm(a,b);
    if(want<=d||i+2===v.path.length)return v.path.slice(i+1).map(nd);
    want-=d;
  }
  return [];
}
