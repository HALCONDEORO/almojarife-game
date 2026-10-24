// Shipyard view helpers: build progress and a small silhouette per ship class.
// The illustrated slipway scene was removed (24 Oct 2026) per the owner's art direction:
// docked and built ships live in the 2D city canvas (web/city2d) as modules.
// Pure functions returning SVG strings; no DOM. Original art, drawn from simple shapes (CC BY 4.0 with the rest of the art).
import { SHIP_TYPES } from "../sim/trade.mjs";
import { HULL_SIDE } from "./shipvisual.mjs";

/** Build progress 0..1 of an order on a given day (the order only stores its ready day). */
export function orderProgress(order, day) {
  const bd = SHIP_TYPES[order.type]?.buildDays ?? 1;
  const left = Math.max(0, order.readyDay - day);
  return Math.min(1, Math.max(0, 1 - left / bd));
}

const HULL = HULL_SIDE; // side-view class dimensions, shared with the port scene

/** Ship silhouette for a class card. Size follows the class. */
export function shipIconSvg(type, w = 90, h = 50) {
  const [len, ht, masts] = HULL[type] ?? HULL.barca;
  const x0 = (w - len) / 2, y0 = h - 12;
  let s = `<svg class="shipicon" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${type}">`;
  s += `<path d="M${x0} ${y0 - ht * 0.5} L${x0 + len} ${y0 - ht * 0.7} L${x0 + len - 8} ${y0} L${x0 + 6} ${y0} Z" fill="#6b4a2a" stroke="#3a2a1a" stroke-width="1.5"/>`;
  for (let i = 0; i < masts; i++) {
    const mx = x0 + len * (masts === 1 ? 0.5 : 0.25 + (0.5 * i) / (masts - 1));
    const mh = 18 + ht + (i === 0 ? 4 : 0);
    s += `<path d="M${mx} ${y0 - ht * 0.6} V${y0 - ht * 0.6 - mh}" stroke="#3a2a1a" stroke-width="1.5"/>`;
    s += `<path d="M${mx} ${y0 - ht * 0.6 - mh + 2} q${type === "caravel" ? 10 : 8} ${mh * 0.35} 0 ${mh * 0.7}z" fill="#f4ead0" stroke="#3a2a1a" stroke-width="1"/>`;
  }
  return s + `</svg>`;
}
