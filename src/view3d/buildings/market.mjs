// Market family (buildings plan, family 2): the lonja (open arcade hall) and the awning hall
// with its treadwheel harbour crane. Method: moodboard (Hanseatic market halls) -> blockout
// -> shared kit (common.mjs) -> own canvas trim textures -> stepped crow gable accent.
// Level 1-3 per docs/design/port3d-art-guide.md; state "construction" raises the frame only.
import { std, put, gable3, steppedGable, PAL } from "./common.mjs";

/** Treadwheel harbour crane on the quay: mast, jib over the water, rope and hook, wheel at the side. */
export function makeHarborCrane(THREE) {
  const g = new THREE.Group(), timber = PAL.timber, dark = 0x3d2715, rope = 0x8a7a5a;
  put(THREE, g, new THREE.BoxGeometry(2.6, 0.3, 2.6), std(THREE, 0x9a8b5a), 0, 0.15, 0); // stone foot
  put(THREE, g, new THREE.BoxGeometry(0.45, 6, 0.45), std(THREE, timber), 0, 3, 0); // mast
  for (const sx of [-1, 1]) { const leg = put(THREE, g, new THREE.BoxGeometry(0.25, 4.4, 0.25), std(THREE, timber), sx * 0.9, 2.1, 0); leg.rotation.z = sx * 0.42; } // A-braces
  const jib = put(THREE, g, new THREE.BoxGeometry(0.25, 5.4, 0.25), std(THREE, timber), 0.9, 5.6, 1.5); jib.rotation.x = 0.72; jib.rotation.z = -0.28; // jib over the water
  put(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 2.6, 4), std(THREE, rope), 1.9, 4.6, 2.9); // rope
  put(THREE, g, new THREE.BoxGeometry(0.25, 0.35, 0.25), std(THREE, dark), 1.9, 3.2, 2.9); // hook block
  const wheel = put(THREE, g, new THREE.CylinderGeometry(1.1, 1.1, 0.35, 12), std(THREE, timber), -1.3, 1.5, 0); wheel.rotation.z = Math.PI / 2; // treadwheel
  return g;
}

/** The market on the quay. Front stands on local z = 0 and the hall extends to negative z. */
export function makeMarket(THREE, { level = 1, style = "crane", state = "active" } = {}) {
  const g = new THREE.Group(), lv = Math.max(1, Math.min(3, level));
  const wall = PAL.walls[0], stone = PAL.stone, timber = PAL.timber, dark = PAL.dark, awn = [0xb33a2a, 0xf1e8cf];
  const d = 7, h = lv >= 2 ? 5.5 : 4.5, w = 12, z0 = 0, zc = z0 - d / 2;
  if (state === "construction") { // stone footings and the timber frame, hall not yet walled
    put(THREE, g, new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5), std(THREE, PAL.base, { tex: "stone", perMetre: 0.22 }), 0, 0.25, zc);
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) put(THREE, g, new THREE.BoxGeometry(0.3, h, 0.3), std(THREE, timber), sx * (w / 2 - 0.3), h / 2, z0 - 0.3 - (i * (d - 0.6)) / 3);
    put(THREE, g, new THREE.BoxGeometry(w + 0.6, 0.25, d + 0.6), std(THREE, timber), 0, h + 0.1, zc);
    g.userData.buildingType = "market"; return g;
  }
  if (style === "lonja") { // open arcade hall: two colonnades, frieze, gable roof and the crow-step gable of a Hanseatic hall
    const cols = lv >= 2 ? 6 : 5, hh = lv >= 3 ? h + 1 : h;
    put(THREE, g, new THREE.BoxGeometry(w - 2.5, hh - 1.6, d - 2.5), std(THREE, wall), 0, (hh - 1.6) / 2, zc); // inner hall behind the arcade
    for (const sx of [-1, 1]) for (let i = 0; i < cols; i++) put(THREE, g, new THREE.CylinderGeometry(0.22, 0.26, hh - 0.8, 8), std(THREE, wall), sx * (w / 2 - 0.5), (hh - 0.8) / 2, zc - d / 2 + 0.8 + (i * (d - 1.6)) / (cols - 1));
    put(THREE, g, new THREE.BoxGeometry(w, 0.6, d), std(THREE, stone, { tex: "stone", perMetre: 0.22 }), 0, hh - 0.5, zc); // frieze over the arches
    gable3(THREE, g, w, d, 0, hh, zc);
    steppedGable(THREE, g, w, 0, hh, z0 + 0.1, stone, 5); // Hanseatic crow steps on the quay-facing gable
    const na = lv >= 2 ? 6 : 4, aw = w / na; for (let i = 0; i < na; i++) { const a = put(THREE, g, new THREE.BoxGeometry(aw * 0.96, 0.1, 1.5), std(THREE, awn[i % 2]), -w / 2 + aw / 2 + i * aw, 3.0, z0 + 0.7); a.rotation.x = 0.35; }
    if (lv >= 2) for (let i = 0; i < 3; i++) { put(THREE, g, new THREE.BoxGeometry(2, 0.9, 1.5), std(THREE, timber), -4 + i * 4, 0.45, z0 + 3.5); const a = put(THREE, g, new THREE.BoxGeometry(2.2, 0.08, 1.7), std(THREE, awn[i % 2]), -4 + i * 4, 2.1, z0 + 3.5); a.rotation.x = 0.2; }
    if (lv >= 3) { put(THREE, g, new THREE.BoxGeometry(0.06, 1.2, 0.06), std(THREE, dark), 0, hh + 2.2, zc); put(THREE, g, new THREE.BoxGeometry(0.7, 0.45, 0.05), std(THREE, 0xb33a2a), 0.4, hh + 2.4, zc); put(THREE, g, new THREE.BoxGeometry(0.3, 0.45, 0.3), std(THREE, 0xffd27a, { emissive: 0xffb860, emissiveIntensity: 0.8 }), 2, 2.6, z0 + 0.2); }
  } else { // awning hall, and the harbour crane that marks the market from the sea
    put(THREE, g, new THREE.BoxGeometry(w, h, d), std(THREE, wall), 0, h / 2, zc); gable3(THREE, g, w, d, 0, h, zc);
    steppedGable(THREE, g, w, 0, h, z0 + 0.1, stone, 5);
    const na = lv >= 2 ? 6 : 4, aw = w / na; for (let i = 0; i < na; i++) { const a = put(THREE, g, new THREE.BoxGeometry(aw * 0.96, 0.1, 1.5), std(THREE, awn[i % 2]), -w / 2 + aw / 2 + i * aw, 3.0, z0 + 0.7); a.rotation.x = 0.35; }
    if (lv >= 2) for (let i = 0; i < 3; i++) { put(THREE, g, new THREE.BoxGeometry(2, 0.9, 1.5), std(THREE, timber), -4 + i * 4, 0.45, z0 + 3.5); const a = put(THREE, g, new THREE.BoxGeometry(2.2, 0.08, 1.7), std(THREE, awn[i % 2]), -4 + i * 4, 2.1, z0 + 3.5); a.rotation.x = 0.2; }
    if (lv >= 3) { put(THREE, g, new THREE.BoxGeometry(w * 0.7, 3, d * 0.7), std(THREE, wall), 0, h + 1.5, zc); put(THREE, g, new THREE.BoxGeometry(0.8, 2, 0.06), std(THREE, 0xb33a2a), w / 2 - 1, h + 4, zc + d / 2); put(THREE, g, new THREE.BoxGeometry(0.3, 0.45, 0.3), std(THREE, 0xffd27a, { emissive: 0xffb860, emissiveIntensity: 0.8 }), 2, 2.6, z0 + 0.2); }
    const crane = makeHarborCrane(THREE); crane.position.set(w / 2 + 1.3, 0, z0 + 2.2); g.add(crane); // the crane stands in the gap before the tavern
  }
  g.userData.buildingType = "market";
  return g;
}
