/** The town's real industry roster on the 2D city plan (townIndustry flag).
 *  Deterministic placement: same inputs, same spots. Extractive works stand in
 *  the outskirts where the fields and hills are drawn, salt pans on the south
 *  beach, dockside trades hug the quay, and processors slot into gaps in the
 *  urban fabric. An establishment is NEVER dropped: if no urban gap accepts a
 *  processor it falls back to the outskirts ring, so the plan can never claim
 *  a city has less industry than the roster. Pure; drawing lives in
 *  web/city2d/scene.mjs and the roster itself in src/game/townindustry.mjs. */
import { hash01 } from "./ground.mjs";
import { harbourLayout } from "./city2d.mjs";

/** Works that belong outside the city fabric, in the country ring. */
const OUTSKIRTS = new Set(["farm", "pasture", "vineyard", "esparto_field", "ranch", "mine", "molino", "sawmill", "orchard"]);
/** Works that belong on the south sand, away from the stone quay. */
const SALT_COAST = new Set(["saltworks"]);
/** Works that belong a step inland from the quay apron. */
const QUAYSIDE = new Set(["fishery", "trading_post", "dock"]);

/** Footprint edge in world units; a little larger per level, like the art. */
const foot = (e) => 2.1 + 0.3 * (e.level || 1);

/** Rects overlap, with padding. b uses {x,y,w,d}; a too. */
const hit = (a, b, pad) =>
  a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.d && a.y + a.d + pad > b.y;

/** Distance from a point to a path segment. */
function segDist(x, y, s) {
  const dx = s.end.x - s.beg.x, dy = s.end.y - s.beg.y;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - s.beg.x) * dx + (y - s.beg.y) * dy) / len2));
  return Math.hypot(x - (s.beg.x + t * dx), y - (s.beg.y + t * dy));
}

/** Deterministic candidate boxes for one establishment, in preference order. */
function* candidates(e, i, bounds, edge) {
  const { minX, minY, maxX, maxY } = bounds;
  const w = foot(e), d = w * 0.85;
  for (let k = 0; k < 90; k++) {
    const rx = hash01(i * 131 + k, 17), ry = hash01(i * 131 + k, 29);
    if (SALT_COAST.has(e.type)) {
      // South beach: the sand band south of the city, clear of the quay corner.
      yield { x: minX + 6 + rx * Math.max(1, maxX - minX - 14 - w), y: maxY + 1.6 + ry * 2.6, w, d };
    } else if (QUAYSIDE.has(e.type)) {
      // Just inland of the quay apron (the apron is the edge-2..edge strip).
      yield { x: edge - 6.5 + rx * 4.2, y: minY + 4 + ry * Math.max(1, maxY - minY - 10 - d), w, d };
    } else if (OUTSKIRTS.has(e.type)) {
      // Country ring north of the walls, where fields and hills are drawn.
      yield { x: minX - 6 + rx * Math.max(1, maxX - minX + 6 - w), y: minY - 20 + ry * 16, w, d };
    } else {
      // Urban fabric: any gap inside the city bounds.
      yield { x: minX + 1.5 + rx * Math.max(1, maxX - minX - 3 - w), y: minY + 1.5 + ry * Math.max(1, maxY - minY - 3 - d), w, d };
    }
  }
  // Last-resort ring north-west of the city: always room, never dropped.
  for (let k = 0; ; k++) yield { x: minX - 18 - k * (w + 2.5), y: minY - 10 - (k % 3) * (w + 3), w, d, _fb: true };
}

/**
 * Place every roster establishment on the plan.
 * @param {{minX:number,minY:number,maxX:number,maxY:number}} bounds visual bounds
 * @param {{plots?:Array,residential?:Array,plaza?:object,paths?:Array}} layout urban layout
 * @param {Array<{id:string,type:string,level:number}>} establishments roster entries
 * @returns {Array<object>} the same entries, each with x/y/w/d added, roster order kept
 */
export function industrySpots(bounds, layout, establishments) {
  if (!bounds || !layout || !Array.isArray(establishments)) return [];
  const { minX, minY, maxX, maxY } = bounds;
  const edge = harbourLayout(bounds).edge;
  const solid = [...(layout.plots || []), ...(layout.residential || [])];
  const paths = layout.paths || [], plaza = layout.plaza;
  const taken = [];
  const out = [];
  for (let i = 0; i < establishments.length; i++) {
    const e = establishments[i];
    const rural = OUTSKIRTS.has(e.type) || SALT_COAST.has(e.type); // bands outside the fabric
    let spot = null;
    for (const r of candidates(e, i, bounds, edge)) {
      if (taken.some((p) => hit(r, p, 0.8))) continue;
      if (rural || r._fb) { spot = r; break; } // country/beach bands and the fallback ring clear the city by construction
      // Urban and quayside boxes sit in the fabric: full collision checks.
      if (r.x < minX || r.x + r.w > maxX || r.y < minY || r.y + r.d > maxY) continue;
      if (r.x + r.w > edge - 2.2) continue; // keep clear of the quay apron and piers
      if (solid.some((p) => hit(r, p, 1.1))) continue;
      if (plaza && hit(r, plaza, 1.6)) continue;
      if (paths.some((s) => segDist(r.x + r.w / 2, r.y + r.d / 2, s) < 3.2)) continue;
      spot = r;
      break;
    }
    taken.push(spot);
    out.push({ ...e, x: spot.x, y: spot.y, w: spot.w, d: spot.d });
  }
  return out;
}
