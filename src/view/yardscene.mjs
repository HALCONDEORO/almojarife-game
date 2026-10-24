// Shipyard view helpers: build progress and a side-view picture per ship class.
// The illustrated slipway scene was removed (24 Oct 2026) per the owner's art direction:
// docked and built ships live in the 2D city canvas (web/city2d) as modules.
// Pure functions returning SVG strings; no DOM. Original art, drawn from simple shapes (CC BY 4.0 with the rest of the art).
import { SHIP_TYPES } from "../sim/trade.mjs";
import { shipSideSvg } from "./shipside.mjs";

/** Build progress 0..1 of an order on a given day (the order only stores its ready day). */
export function orderProgress(order, day) {
  const bd = SHIP_TYPES[order.type]?.buildDays ?? 1;
  const left = Math.max(0, order.readyDay - day);
  return Math.min(1, Math.max(0, 1 - left / bd));
}

/** Ship picture for a class card: the side-view art, fitted into w x h (smaller classes stay smaller). */
export function shipIconSvg(type, w = 90, h = 50) {
  return shipSideSvg(type, {}, { w, h, cls: "shipicon" });
}
