// Town house family (buildings plan, family 1): one module, own procedural work.
// Each house: stone plinth, whitewashed walls, timber corner posts and mid beam (Iberian
// timber-framing accent), door and shuttered windows, tiled gable roof; some get a chimney.
// state: "construction" (plinth + timber skeleton, no walls) or "active". level 1-3 raises it a storey.
import { std, put, gable3, PAL } from "./common.mjs";

export function makeHouse(THREE, { w = 4, d = 4, h = 3.6, tint = 0, level = 1, state = "active", lit = [] } = {}) {
  const g = new THREE.Group(), wall = PAL.walls[Math.floor(tint * 3) % 3], lv = Math.max(1, Math.min(3, level)), hh = h + (lv - 1) * 2.2;
  put(THREE, g, new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), std(THREE, PAL.base, { tex: "stone", perMetre: 0.22 }), 0, 0.25, 0); // stone plinth
  if (state === "construction") { // timber skeleton up, walls not yet
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, hh, 0.18), std(THREE, PAL.timber), sx * (w / 2 - 0.1), 0.5 + hh / 2, sz * (d / 2 - 0.1));
    for (const fy of [1.6, Math.min(hh, 3.4)]) put(THREE, g, new THREE.BoxGeometry(w, 0.16, d), std(THREE, PAL.timber), 0, 0.5 + fy, 0);
    put(THREE, g, new THREE.BoxGeometry(0.14, hh * 0.9, 0.14), std(THREE, PAL.timber), 0, 0.5 + hh * 0.45, 0).rotation.z = 0.5; // diagonal brace
    g.userData.buildingType = "house"; return g;
  }
  put(THREE, g, new THREE.BoxGeometry(w, hh, d), std(THREE, wall), 0, 0.5 + hh / 2, 0);
  gable3(THREE, g, w, d, 0, 0.5 + hh, 0);
  for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.14, hh, 0.14), std(THREE, PAL.timber), sx * (w / 2 - 0.07), 0.5 + hh / 2, d / 2 + 0.02); // corner posts on the front
  put(THREE, g, new THREE.BoxGeometry(w, 0.14, 0.1), std(THREE, PAL.timber), 0, 0.5 + hh * 0.55, d / 2 + 0.03); // mid beam
  put(THREE, g, new THREE.BoxGeometry(0.8, 1.3, 0.08), std(THREE, PAL.dark), 0, 0.5 + 0.65, d / 2 + 0.04); // door
  const winY = 0.5 + hh * 0.72, nw = w > 4.6 ? 2 : 1;
  for (let i = 0; i < nw; i++) { const wx = nw === 1 ? w * 0.28 : -w * 0.25 + i * w * 0.5;
    put(THREE, g, new THREE.BoxGeometry(0.55, 0.6, 0.06), lit[i] ? std(THREE, 0xffd27a, { emissive: 0xffb860, emissiveIntensity: 0.55 }) : std(THREE, PAL.dark), wx, winY, d / 2 + 0.03).userData.win = true; // window: warm-lit at dusk when lit
    for (const so of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, 0.6, 0.05), std(THREE, PAL.timber), wx + so * 0.37, winY, d / 2 + 0.03); } // shutters
  if (tint > 0.45) { put(THREE, g, new THREE.BoxGeometry(0.5, hh * 0.7, 0.5), std(THREE, PAL.stone, { tex: "stone", perMetre: 0.22 }), w * 0.3, 0.5 + hh + 0.6, -d * 0.2); put(THREE, g, new THREE.BoxGeometry(0.7, 0.18, 0.7), std(THREE, PAL.base), w * 0.3, 0.5 + hh + hh * 0.35 + 0.25, -d * 0.2); } // chimney with cap
  g.userData.buildingType = "house";
  return g;
}
