// Pure pan/zoom camera for the map. No DOM: it only computes the visible rectangle (viewBox).
// World size W x H is the full map; the camera shows a w x h window of it.
export const MIN_ZOOM = 1, MAX_ZOOM = 8;
export const newCamera = (W, H) => ({ W, H, x: 0, y: 0, zoom: 1 });
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function clampCamera(c) {
  c.zoom = clamp(c.zoom, MIN_ZOOM, MAX_ZOOM);
  const w = c.W / c.zoom, h = c.H / c.zoom;
  c.x = clamp(c.x, 0, c.W - w); c.y = clamp(c.y, 0, c.H - h);
  return c;
}
export const viewBox = (c) => [c.x, c.y, c.W / c.zoom, c.H / c.zoom];
// Zoom by `factor` keeping the world point under (fx, fy) (fractions 0..1 of the view) fixed.
export function zoomAt(c, factor, fx = 0.5, fy = 0.5) {
  const [vx, vy, vw, vh] = viewBox(c), px = vx + fx * vw, py = vy + fy * vh;
  c.zoom = clamp(c.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const w = c.W / c.zoom, h = c.H / c.zoom;
  c.x = px - fx * w; c.y = py - fy * h;
  return clampCamera(c);
}
// Pan by a drag of (dx, dy) fractions of the view.
export function panBy(c, dfx, dfy) {
  const [, , vw, vh] = viewBox(c);
  c.x -= dfx * vw; c.y -= dfy * vh;
  return clampCamera(c);
}
// Marker scale: how big ports and ships are drawn so they stay readable at any zoom
// (almost constant on screen, slightly larger when zoomed in).
export const markerScale = (zoom) => 1 / Math.pow(zoom, 0.85);
// Scale of an svg viewport `rect` showing `vb` ([x,y,w,h]) under preserveAspectRatio="xMidYMid meet".
export const contentScale = (rect, vb) => Math.min(rect.width / vb[2], rect.height / vb[3]);
// Fractions (0..1) of the VIEWED CONTENT under client point (clientX, clientY), accounting for
// meet letterboxing: the content may be centered with margins inside a wider/shorter viewport.
// Points over the margins clamp to the nearest content edge.
export function contentFraction(rect, vb, clientX, clientY) {
  const s = contentScale(rect, vb);
  const ox = (rect.width - vb[2] * s) / 2, oy = (rect.height - vb[3] * s) / 2;
  const fx = (clientX - rect.left - ox) / (vb[2] * s), fy = (clientY - rect.top - oy) / (vb[3] * s);
  return [Math.min(1, Math.max(0, fx)), Math.min(1, Math.max(0, fy))];
}
