// Deterministic hash shared by game logic and views (see src/game/* importers).
// The illustrated port scene was removed (24 Oct 2026): docked ships are drawn as
// modules of the 2D city canvas instead (web/city2d), per the owner's art direction.
// Small deterministic random numbers, so a layout always comes out the same.
export function seeded(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
