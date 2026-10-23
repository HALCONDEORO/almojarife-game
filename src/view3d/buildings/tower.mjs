// Bell tower family (buildings plan, family 4): stone base, pale shaft, an open belfry
// stage with four dark arches, a tiled hip cap, pole and pennant. Own procedural work.
import { std, put, PAL } from "./common.mjs";

/** The far bell tower over the town crest. h is the total height in metres (pole excluded). */
export function makeBellTower(THREE, { h = 18, color = 0xece3cf, roof = 0x9b4a2b } = {}) {
  const g = new THREE.Group(), stone = std(THREE, PAL.stone, { tex: "stone", perMetre: 0.22 }), dark = std(THREE, PAL.dark);
  const baseH = Math.max(1.6, h * 0.14), shaftH = h * 0.52, belH = h * 0.18, capH = h - baseH - shaftH - belH;
  let y = 0;
  put(THREE, g, new THREE.BoxGeometry(4.4, baseH, 4.4), stone, 0, y + baseH / 2, 0); y += baseH; // stone footing, wider than the shaft
  put(THREE, g, new THREE.BoxGeometry(3.2, shaftH, 3.2), std(THREE, color), 0, y + shaftH / 2, 0); y += shaftH; // pale shaft
  put(THREE, g, new THREE.BoxGeometry(4.0, 0.35, 4.0), stone, 0, y + 0.175, 0); // string course under the belfry
  put(THREE, g, new THREE.BoxGeometry(4.0, belH, 4.0), std(THREE, color), 0, y + belH / 2, 0);
  for (const [ax, az, w, dd] of [[0, 2.01, 1.1, 0.14], [0, -2.01, 1.1, 0.14], [2.01, 0, 0.14, 1.1], [-2.01, 0, 0.14, 1.1]]) // four belfry arches (front/back/sides)
    put(THREE, g, new THREE.BoxGeometry(w, belH * 0.62, dd), dark, ax, y + belH * 0.5, az).userData.belfry = true;
  put(THREE, g, new THREE.BoxGeometry(0.5, 0.55, 0.5), std(THREE, 0x8a6a3a), 0, y + belH * 0.42, 0); // the bell
  y += belH;
  const cap = put(THREE, g, new THREE.ConeGeometry(1, 1, 4), std(THREE, roof), 0, y + capH / 2, 0); cap.rotation.y = Math.PI / 4; cap.scale.set(2.55, capH, 2.55); // tiled hip cap
  put(THREE, g, new THREE.BoxGeometry(0.12, 1.8, 0.12), std(THREE, PAL.timber), 0, h + 0.9, 0); // pole for the pennant
  g.userData.buildingType = "tower";
  return g;
}
