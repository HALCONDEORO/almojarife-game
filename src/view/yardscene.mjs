// Illustrated shipyard: slipway scene with hulls in construction, and a small silhouette per ship class.
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

/** Slipway scene: one cradle per order, the hull grows with progress. orders: [{type, readyDay}] */
export function yardSceneSvg({ orders = [], day = 0, tod = 0.4, emptyLabel = "" }) {
  const W = 600, H = 210, n = Math.max(1, Math.min(orders.length, 4));
  const sky = tod < 0.25 || tod > 0.75 ? "#2c3a5c" : "#bfe0ee";
  let s = `<svg class="scene yard" viewBox="0 0 ${W} ${H}" role="img" aria-label="shipyard"><rect width="${W}" height="${H}" fill="${sky}"/>`;
  s += `<rect y="${H - 38}" width="${W}" height="38" fill="#3c7ea0"/><path d="M0 ${H - 38} q40 -6 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="#a8d4e6" stroke-width="2"/>`;
  s += `<rect y="${H - 50}" width="${W}" height="14" fill="#9a7b4a"/>`;
  const shown = orders.slice(0, n);
  const slot = W / n;
  shown.forEach((o, i) => {
    const p = orderProgress(o, day), cx = slot * i + slot / 2, base = H - 50;
    const [clen, cht, cmasts] = HULL[o.type] ?? HULL.barca, k = 2.6; // class hull at scene scale
    const L = (20 + clen * k) * (0.35 + 0.65 * p), Ht = (8 + cht * k) * (0.35 + 0.65 * p);
    for (const dx of [-80, -55, -30, 0, 30, 55, 80]) s += `<path d="M${cx + dx} ${base + 8} V${base - 40 - 20 * p}" stroke="#8a6a3a" stroke-width="2"/>`;
    s += `<path d="M${cx - 85} ${base} L${cx + 85} ${base + 8} M${cx - 85} ${base + 8} L${cx + 85} ${base + 8}" stroke="#4a3414" stroke-width="3"/>`;
    s += `<path d="M${cx - L / 2} ${base - Ht * 0.3} L${cx + L / 2} ${base - Ht * 0.5} L${cx + L / 2 - 8} ${base} L${cx - L / 2 + 6} ${base} Z" fill="#7a5a2a" stroke="#3a2a1a" stroke-width="1.5"/>`;
    if (p >= 1 / 3) for (let r = 1; r < Math.floor(p * 6); r++) s += `<path d="M${cx - L / 2 + 6} ${base - r * 4} H${cx + L / 2 - 8}" stroke="#4a3414" stroke-width="1"/>`; // planking phase
    if (p >= 2 / 3) for (let m = 0; m < cmasts; m++) { // rigging phase: the class's masts go up
      const mx = cx + (cmasts === 1 ? 0 : (m / (cmasts - 1) - 0.5) * L * 0.5);
      s += `<path d="M${mx} ${base - Ht} V${base - Ht - 40 * p}" stroke="#3a2a1a" stroke-width="2"/>`;
    }
    s += `<rect x="${cx - 40}" y="${base - 60}" width="80" height="5" fill="#d8c79a" stroke="#3a2a1a"/><rect x="${cx - 40}" y="${base - 60}" width="${80 * p}" height="5" fill="#5a8a3a"/>`;
  });
  s += `<path d="M${W - 40} ${H - 50} V30 H${W - 110} M${W - 40} 60 L${W - 110} 30" stroke="#4a3414" stroke-width="4" fill="none"/><path d="M${W - 105} 30 V70" stroke="#4a3414" stroke-width="1.5"/><rect x="${W - 112}" y="70" width="14" height="10" fill="#8a6a3a" stroke="#3a2a1a"/>`;
  s += `<path d="M60 40 q6 -6 12 0 q6 -6 12 0 M130 24 q5 -5 10 0 q5 -5 10 0" stroke="#3a2a1a" fill="none" stroke-width="1.3"/>`;
  if (!orders.length) s += `<text x="${W / 2}" y="${H - 14}" text-anchor="middle" font-size="13" fill="#f4ead0" font-family="serif">${emptyLabel}</text>`;
  return s + `</svg>`;
}
