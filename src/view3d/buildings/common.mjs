// Shared low-level builders for the per-building modules (own work, boxes/cones/extrusions only).
// Moved out of port3d.mjs so each building can live in its own file (Marco's buildings plan).
export const std = (THREE, color, o = {}) => { const { tex, perMetre, ...rest } = o; const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...rest }); if (tex) m.userData.texKind = tex + "@" + (perMetre ?? 0.4); return m; };
export const put = (THREE, parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
/** Gabled roof with tile texture, eaves overhanging the footprint. */
export const gable3 = (THREE, parent, w, d, x, y, z, color = 0x9b4a2b) => {
  const rise = (w / 2) * Math.tan((22 * Math.PI) / 180), sh = new THREE.Shape();
  sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(0, rise); sh.closePath();
  return put(THREE, parent, new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }), std(THREE, color, { tex: "tiles", perMetre: 0.35 }), x, y, z - d / 2 - 0.3);
};
/** A box with metre-scaled UVs when textured (shared with the quay trick). */
// Palette (from docs/design/port3d-art-guide.md): warm cream walls, terracotta roofs, timber, stone, dark openings.
export const PAL = { walls: [0xece3cf, 0xe3d6b8, 0xefe8d8], roof: 0x9b4a2b, roofDark: 0x7e3b22, timber: 0x6a4325, dark: 0x2b2118, stone: 0xcfc4a8, base: 0xb9ad90 };

/** Crow-step gable: the Hanseatic stepped gable end (Patrician signature), climbing both roof slopes.
 *  Decorative steps over the existing gable; z is the gable-face plane, w the gable width. */
export const steppedGable = (THREE, parent, w, x, y, z, color = 0xcfc4a8, steps = 4) => {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z);
  const rise = (w / 2) * Math.tan((22 * Math.PI) / 180);
  for (let i = 0; i < steps; i++) {
    const t = i / steps, sw = (w / 2) * (1 - t), sy = rise * t, sh = rise / steps;
    for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.55, sh + 0.1, 0.45), std(THREE, color, { tex: "stone", perMetre: 0.22 }), sx * Math.max(0.28, sw - 0.28), sy + sh / 2 + 0.05, 0);
  }
  put(THREE, g, new THREE.BoxGeometry(0.55, rise / steps + 0.18, 0.45), std(THREE, color, { tex: "stone", perMetre: 0.22 }), 0, rise + rise / steps / 2 + 0.05, 0); // top stone
  return g;
};
