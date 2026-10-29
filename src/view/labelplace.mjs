// Deterministic map-label placement (pure, no DOM). Each label tries its candidates in a fixed
// order and takes the first one that stays inside the chart, overlaps no placed label and covers
// no other port's click target; a label with no free candidate is hidden. Labels are placed by
// importance (KEY_LABELS first, then population, then id), so the least important one hides.
// Box model mirrors the DOM and test/maplabels.test.mjs: offsets in marker units scaled by
// markerScale(zoom), font labelFontSize(zoom), 0.571*fs per char, 1.214*fs line height.
import { markerScale, labelFontSize } from "./camera.mjs";

/** The eight candidate positions around a marker, in try order. */
export const CANDIDATES = Object.freeze([
  { pos: "E", x: 14, y: 4, anchor: "start" },
  { pos: "NE", x: 12, y: -10, anchor: "start" },
  { pos: "N", x: 0, y: -14, anchor: "middle" },
  { pos: "NW", x: -12, y: -10, anchor: "end" },
  { pos: "W", x: -14, y: 4, anchor: "end" },
  { pos: "SW", x: -12, y: 20, anchor: "end" },
  { pos: "S", x: 0, y: 24, anchor: "middle" },
  { pos: "SE", x: 12, y: 20, anchor: "start" },
].map(Object.freeze));
const BY_POS = Object.fromEntries(CANDIDATES.map((c) => [c.pos, c]));
/** Geographic names without a port marker. Gibraltar is a landmark, not a simulated port.
 * Coordinates: https://geniza.princeton.edu/en/places/gibraltar/ (36°8′26″N, 5°21′12″W). */
export const LANDMARKS = Object.freeze([Object.freeze({ id: "gibraltar", name: "Gibraltar", lat: 36.14, lon: -5.35 })]);
export const LANDMARK_FONT = 0.75; // landmark names are drawn smaller than port names
/** Labels that must show on the full chart (zoom 1), in placement order. */
export const KEY_LABELS = Object.freeze(["cadiz", "gibraltar", "tanger", "ceuta"]);
// First choice for the Strait cluster: Cádiz on its Atlantic side, Gibraltar north-east of the
// Rock, Ceuta east of its dot. This is what lets all four fit at zoom 1 (see labelplace.test).
const HINT = Object.freeze({ cadiz: "W", gibraltar: "NE", ceuta: "E" });

/** Candidate list for one item: previous choice, hint, then the eight positions (exactly eight distinct slots). */
export function candidatesFor(item, prev) {
  const out = [], seen = new Set(), add = (c) => { if (c && !seen.has(c.pos)) { seen.add(c.pos); out.push(c); } };
  if (prev) add(BY_POS[prev.pos]);
  add(BY_POS[HINT[item.id]]);
  CANDIDATES.forEach(add);
  return out;
}

/** Map-unit box of `item` ({x, y, name, kind}) placed at candidate `c` for `zoom`. */
export function labelBox(item, c, zoom) {
  const k = markerScale(zoom), fs = labelFontSize(zoom) * (item.kind === "landmark" ? LANDMARK_FONT : 1);
  const w = item.name.length * fs * 0.571 * k, h = 1.214 * fs * k, tx = item.x + k * c.x, ty = item.y + k * c.y;
  return { x: tx - (c.anchor === "end" ? w : c.anchor === "middle" ? w / 2 : 0), y: ty - 13 * (fs / 14) * k, w, h };
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const coversCircle = (b, cx, cy, r) => Math.hypot(cx - Math.max(b.x, Math.min(cx, b.x + b.w)), cy - Math.max(b.y, Math.min(cy, b.y + b.h))) < r;
const rank = (it) => { const i = KEY_LABELS.indexOf(it.id); return i < 0 ? KEY_LABELS.length : i; };
export const byImportance = (a, b) => rank(a) - rank(b) || (b.pop ?? 0) - (a.pop ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Place labels for `items` [{id, name, x, y, pop?, kind: "port"|"landmark"}] (x, y in map units).
 * opts: zoom, hitR(id) unscaled click radius of a port, bounds {width, height},
 * prev Map(id -> previous result) to keep earlier choices when they still fit.
 * Returns one entry per item, in input order: {id, pos, x, y, anchor, fontSize, box, hidden}
 * where x/y/anchor are the text offsets inside the marker group (scaled by markerScale).
 */
export function placeLabels(items, { zoom = 1, hitR = () => 14, bounds = { width: 800, height: 850 }, prev = null } = {}) {
  const k = markerScale(zoom), ports = items.filter((it) => it.kind !== "landmark");
  const fits = (it, b, placed) =>
    b.x >= 0 && b.y >= 0 && b.x + b.w <= bounds.width && b.y + b.h <= bounds.height &&
    !placed.some((p) => overlaps(b, p.box)) &&
    !ports.some((p) => p.id !== it.id && coversCircle(b, p.x, p.y, hitR(p.id) * k));
  const options = (it, placed) => candidatesFor(it, prev?.get(it.id)).map((c) => ({ c, box: labelBox(it, c, zoom) })).filter((o) => fits(it, o.box, placed));
  const order = [...items].sort(byImportance), keys = order.filter((it) => rank(it) < KEY_LABELS.length), rest = order.slice(keys.length);
  // Key labels: depth-first over their candidates, first complete assignment wins (deterministic).
  const solve = (i, placed) => {
    if (i === keys.length) return placed;
    for (const o of options(keys[i], placed)) { const r = solve(i + 1, [...placed, { it: keys[i], ...o }]); if (r) return r; }
    return null;
  };
  let placed = solve(0, []);
  if (!placed) { placed = []; for (const it of keys) { const o = options(it, placed)[0]; if (o) placed.push({ it, ...o }); } }
  for (const it of rest) { const o = options(it, placed)[0]; if (o) placed.push({ it, ...o }); }
  const got = new Map(placed.map((p) => [p.it.id, p]));
  const out = items.map((it) => {
    const p = got.get(it.id);
    if (!p) return { id: it.id, hidden: true };
    const fontSize = labelFontSize(zoom) * (it.kind === "landmark" ? LANDMARK_FONT : 1);
    return { id: it.id, pos: p.c.pos, x: p.c.x, y: p.c.y, anchor: p.c.anchor, fontSize, box: p.box, hidden: false };
  });
  return out;
}
