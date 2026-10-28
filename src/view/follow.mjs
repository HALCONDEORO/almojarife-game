// "Follow ship" camera mode (pure, no DOM). View state only: it lives in a local variable of the
// web layer, keyed by ship id, and is never written into the game object or the save.
import { clampCamera, viewBox } from "./camera.mjs";

export const FOLLOW_HALF_LIFE_MS = 220; // the camera closes half the gap to the ship every 220 ms
export const newFollow = () => ({ ship: null });
export const isFollowing = (f, shipId) => f.ship !== null && f.ship === shipId;
/** Toggle following `shipId`: on for a new ship (switches from any other), off if already followed. Returns the new state. */
export function toggleFollow(f, shipId) { f.ship = isFollowing(f, shipId) ? null : shipId; return f.ship !== null; }
/** Turn following off. Returns true if it was on (so Esc can be consumed by it). */
export function stopFollow(f) { const was = f.ship !== null; f.ship = null; return was; }
/** Which user inputs end follow mode: a drag pan, a pinch or Esc. Wheel zoom keeps following. */
export const FOLLOW_BREAKERS = Object.freeze(["drag", "pinch", "escape", "dblclick", "pan", "center"]);
export function followAfterInput(f, input) { return FOLLOW_BREAKERS.includes(input) ? stopFollow(f) : false; }
/** Drop the follow if its ship no longer exists (sold, sunk, new game, loaded game). */
export function pruneFollow(f, ships) { if (f.ship !== null && !(ships ?? []).some((s) => s.id === f.ship)) f.ship = null; return f; }

/**
 * Move camera `c` a frame of `dtMs` toward centring map point (px, py), with exponential smoothing.
 * Never overshoots; snaps when the gap is under half a map unit or with reduced motion. The camera
 * stays clamped to the chart, so at the edges the ship is shown off-centre rather than the void.
 * Returns true while the camera is still moving.
 */
export function followStep(c, px, py, dtMs, { halfLifeMs = FOLLOW_HALF_LIFE_MS, reduceMotion = false } = {}) {
  const [, , w, h] = viewBox(c), tx = px - w / 2, ty = py - h / 2;
  const before = [c.x, c.y];
  // Aim at the clamped goal so a ship near the edge does not leave the camera chasing an unreachable point.
  const goal = clampCamera({ ...c, x: tx, y: ty });
  const a = reduceMotion ? 1 : 1 - Math.pow(2, -Math.max(0, dtMs) / halfLifeMs);
  c.x += (goal.x - c.x) * a; c.y += (goal.y - c.y) * a;
  if (Math.hypot(goal.x - c.x, goal.y - c.y) < 0.5) { c.x = goal.x; c.y = goal.y; }
  clampCamera(c);
  return c.x !== before[0] || c.y !== before[1];
}

const TXT = {
  es: { on: "Seguir", off: "Dejar de seguir", hint: "La cámara sigue al barco. Arrastra el mapa o pulsa Esc para soltarla." },
  en: { on: "Follow", off: "Stop following", hint: "The camera follows the ship. Drag the map or press Esc to release it." },
};
/** Toggle button for the ship window header. `following` = this ship is followed now. */
export function followButtonHtml(lang, following) {
  const t = TXT[lang] ?? TXT.es, label = following ? t.off : t.on;
  return `<button class="pwin-follow" data-swfollow="1" aria-pressed="${following}" title="${t.hint}">${label}</button>`;
}
export const followText = (lang) => TXT[lang] ?? TXT.es;
