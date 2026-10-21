// Tavern family (buildings plan, family 3): the quayside tavern and its town sibling, the inn.
// Shared language: timber-framed upper floor with a slight overhang (jetty), hanging sign,
// shuttered windows, a barrel by the door; level 1-3 per the art guide, construction = frame only.
import { std, put, gable3, PAL } from "./common.mjs";

const sign = (THREE, g, x, y, z, plate = 0x8a5a1e) => {
  put(THREE, g, new THREE.BoxGeometry(0.08, 0.8, 0.08), std(THREE, PAL.timber), x, y + 0.4, z);
  put(THREE, g, new THREE.BoxGeometry(0.7, 0.5, 0.06), std(THREE, plate), x, y, z);
};
const window_ = (THREE, g, x, y, z) => {
  put(THREE, g, new THREE.BoxGeometry(0.55, 0.6, 0.06), std(THREE, PAL.dark), x, y, z);
  for (const so of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, 0.6, 0.05), std(THREE, PAL.timber), x + so * 0.37, y, z);
};

/** Quayside tavern. Front on local z = 0, depth to negative z. */
export function makeTavern(THREE, { level = 1, state = "active" } = {}) {
  const g = new THREE.Group(), lv = Math.max(1, Math.min(3, level)), wall = PAL.walls[0];
  const w = 8, d = 6, h = lv >= 3 ? 7 : 4, z0 = 0, zc = z0 - d / 2;
  if (state === "construction") {
    put(THREE, g, new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5), std(THREE, PAL.base, { tex: "stone", perMetre: 0.22 }), 0, 0.25, zc);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.25, h, 0.25), std(THREE, PAL.timber), sx * (w / 2 - 0.3), h / 2, zc + sz * (d / 2 - 0.3));
    put(THREE, g, new THREE.BoxGeometry(w + 0.5, 0.2, d + 0.5), std(THREE, PAL.timber), 0, h + 0.1, zc);
    g.userData.buildingType = "tavern"; return g;
  }
  put(THREE, g, new THREE.BoxGeometry(w, h, d), std(THREE, wall), 0, h / 2, zc);
  gable3(THREE, g, w, d, 0, h, zc);
  if (lv >= 2) { // timber-framed upper floor with a jetty overhang, the Patrician tavern silhouette
    put(THREE, g, new THREE.BoxGeometry(w + 0.6, 2.6, d + 0.6), std(THREE, wall), 0, h + 1.0, zc);
    for (let i = 0; i < 5; i++) put(THREE, g, new THREE.BoxGeometry(0.14, 2.6, 0.14), std(THREE, PAL.timber), -w / 2 + 0.4 + i * (w - 0.8) / 4, h + 1.0, zc + (d + 0.6) / 2 + 0.02);
    put(THREE, g, new THREE.BoxGeometry(w + 0.6, 0.16, 0.12), std(THREE, PAL.timber), 0, h - 0.3, zc + (d + 0.6) / 2 + 0.02);
    gable3(THREE, g, w + 0.6, d + 0.6, 0, h + 2.3, zc);
    window_(THREE, g, -w * 0.25, h + 1.2, zc + (d + 0.6) / 2 + 0.04); window_(THREE, g, w * 0.25, h + 1.2, zc + (d + 0.6) / 2 + 0.04);
  } else { put(THREE, g, new THREE.BoxGeometry(w * 0.6, 0.15, 1.2), std(THREE, PAL.timber), 0, 2.8, z0 + 0.6); } // ground-floor pergola at level 1
  sign(THREE, g, w / 2 + 1.0, 2.7, z0 + 0.1);
  put(THREE, g, new THREE.BoxGeometry(0.6, 0.8, 0.6), std(THREE, 0x9a7a4a), -w / 2 + 0.8, 0.4, z0 + 0.7); // the barrel by the door
  put(THREE, g, new THREE.BoxGeometry(0.8, 1.3, 0.08), std(THREE, PAL.dark), 0, 0.65, z0 + 0.04); // door
  window_(THREE, g, -w * 0.28, 2.2, z0 + 0.04); window_(THREE, g, w * 0.28, 2.2, z0 + 0.04);
  if (lv >= 3) { // stone chimney with smoke cap, second hanging sign, warm windows at night
    put(THREE, g, new THREE.BoxGeometry(0.8, 2, 0.8), std(THREE, PAL.stone, { tex: "stone", perMetre: 0.22 }), -w / 2 + 1, h + 3.4, zc);
    sign(THREE, g, -w / 2 - 1.0, 2.7, z0 + 0.1);
    for (const sx of [-2, 2]) put(THREE, g, new THREE.BoxGeometry(0.8, 1.0, 0.06), std(THREE, 0xffb860, { emissive: 0xffb860, emissiveIntensity: 0.6 }), sx, 5.2, z0 + 0.04);
  }
  g.userData.buildingType = "tavern";
  return g;
}

/** Town inn: two floors, timber gallery and a hanging sign. */
export function makeInn(THREE, { w = 4, d = 4, h = 3.6, tint = 0, state = "active" } = {}) {
  const g = new THREE.Group(), wall = PAL.walls[Math.floor(tint * 3) % 3], hh = h + 1.8;
  if (state === "construction") {
    put(THREE, g, new THREE.BoxGeometry(w + 1.2, 0.5, d + 0.7), std(THREE, PAL.base, { tex: "stone", perMetre: 0.22 }), 0, 0.25, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, hh, 0.18), std(THREE, PAL.timber), sx * (w / 2), 0.5 + hh / 2, sz * (d / 2));
    g.userData.buildingType = "inn"; return g;
  }
  put(THREE, g, new THREE.BoxGeometry(w + 1, hh, d + 0.5), std(THREE, wall), 0, 0.5 + hh / 2, 0);
  put(THREE, g, new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.2), std(THREE, PAL.base, { tex: "stone", perMetre: 0.22 }), 0, 0.25, 0); // plinth
  gable3(THREE, g, w + 1, d + 0.5, 0, 0.5 + hh, 0);
  put(THREE, g, new THREE.BoxGeometry(w * 0.8, 0.15, 0.9), std(THREE, PAL.timber), 0, 2.6, d / 2 + 0.6);
  for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.15, 2.6, 0.15), std(THREE, PAL.timber), sx * w * 0.32, 1.3, d / 2 + 0.9);
  sign(THREE, g, w / 2 + 0.6, 1.9, d / 2 + 0.3);
  put(THREE, g, new THREE.BoxGeometry(0.8, 1.3, 0.08), std(THREE, PAL.dark), 0, 0.5 + 0.75, (d + 0.5) / 2 + 0.04);
  window_(THREE, g, -w * 0.28, 0.5 + hh * 0.7, (d + 0.5) / 2 + 0.04); window_(THREE, g, w * 0.28, 0.5 + hh * 0.7, (d + 0.5) / 2 + 0.04);
  g.userData.buildingType = "inn";
  return g;
}
