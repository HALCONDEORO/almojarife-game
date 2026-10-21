// Procedural 3D port scene, v2 (follows docs/design/port3d-art-guide.md, Opus review). No external assets: own work, MIT.
// Scale is stylised: buildings 1:1, ships 0.75. Units are metres. Water is y = 0, the quay top is y = 1.2.
// `THREE` is passed in so this module loads in the browser and under Node tests alike.
import { seeded } from "../view/cityscene.mjs";
import { makeTexture } from "./textures.mjs";

export const QUAY_TOP = 1.2, QUAY_EDGE_Z = -2, FRONT_Z = -9; // 7 m of quay between the edge and the building fronts
/** Slope behind the quay: it rises 1 m for every 4 m towards negative z. */
export const slopeY = (z) => QUAY_TOP + Math.max(0, FRONT_Z - z) / 4;

/** Fixed plots, sized for level 3 so a bigger building never bumps into a neighbour (2 m minimum gap). `w` is the widest level. */
export const BUILDINGS = [
  { id: "shipyard", tab: "yard", x: -22, w: 12, d: 22 },
  { id: "market", tab: "market", x: -7, w: 12, d: 7 },
  { id: "tavern", tab: "tavern", x: 6, w: 8, d: 11 },
  { id: "bank", tab: "bank", x: 17, w: 10, d: 6 },
];
/** Building level 1..3: the higher of the city size level and the upgrade level. Never goes down. Pure. */
export function buildingLevel(id, pop = 8000, upgrades = {}) {
  const bySize = pop >= 25000 ? 3 : pop >= 10000 ? 2 : 1, up = Number.isInteger(upgrades?.[id]) ? upgrades[id] : 1;
  return Math.max(1, Math.min(3, Math.max(bySize, up)));
}
/** The market's look: marked by the harbour crane or rebuilt as an exchange hall (lonja). Estudio picks once here. */
export const MARKET_STYLES = ["crane", "lonja"], MARKET_STYLE = "crane";
/** Which game panel a building opens; the warehouse opens the store. null for anything else (houses, water, unknown ids). */
export const tabForBuilding = (id) => (id === "warehouse" ? "store" : BUILDINGS.find((b) => b.id === id)?.tab ?? null);

/** Pure layout: houses climb the hillside behind the building row, the bell tower stands far back. Same input, same layout. */
export function portLayout(id, pop = 8000) {
  const rnd = seeded("3d:" + id), n = Math.max(8, Math.min(48, Math.round(pop / 600))), houses = [];
  for (let i = 0; i < n; i++) {
    const row = i % 4, z = -19 - row * 5.5 - rnd() * 1.5, w = 4 + rnd() * 2.5, d = 4 + rnd() * 2, x = -34 + ((i + 0.5) / n) * 68 + (rnd() - 0.5) * 2;
    houses.push({ x, z, w, d, h: 3 + rnd() * 1.6, y: slopeY(z), tint: rnd(), row, type: "house" });
  }
  const free = houses.filter((h) => !BUILDINGS.some((b) => Math.abs(h.x - b.x) < (b.w + h.w) / 2 + 1 && h.z + h.d / 2 > FRONT_Z - b.d - 1)); // keep the plots clear
  // Typed buildings by district: the artisan quarter sits on the quay rows, the chapel stands on the top row. Bigger towns keep more of them.
  for (const [type, row, min] of [["inn", 0, 8], ["smithy", 1, 12], ["chapel", 3, 16]]) { const h = free.length >= min ? free.find((x) => x.row === row && x.type === "house") : null; if (h) h.type = type; }
  return { houses: free, tower: { x: 12, z: -45, h: 18 }, quayZ: QUAY_EDGE_Z };
}

/** Sky, light and fog colours for a time of day t in 0..1 (0 dawn, .5 noon, 1 dusk). Pure, testable. */
export function skyFor(t) {
  const k = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI); // 0 at the edges, 1 at noon
  const mix = (a, b) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
  return { sky: mix([0xe0, 0x8a, 0x5e], [0x9c, 0xc3, 0xd6]), sun: mix([0xff, 0x9a, 0x50], [0xff, 0xd2, 0x9a]), sunPower: 1 + 1.2 * k, sunHeight: 18 + 22 * k };
}
/** Environment gradient stops for a time-of-day sky: zenith, horizon and ground bounce.
 *  Pure colours, testable; the browser turns them into an equirect canvas + PMREM (needs WebGL). */
export function envStops(sk) {
  const dim = (a, f) => a.map((v) => Math.round(v * f));
  return { zenith: dim(sk.sky, 0.7), horizon: sk.sky, ground: [0x35, 0x47, 0x3c], deep: [0x1b, 0x26, 0x22] };
}
const hex = ([r, g, b]) => (r << 16) | (g << 8) | b;

/** Camera set-up from the art guide: FOV 35, at (0,22,42) looking at (0,4,-9); zoom 0.7..1.3, yaw within +-20 degrees. */
export const CAMERA = { fov: 35, fovPortrait: 50, pos: [0, 22, 42], look: [0, 4, -9], zoom: [0.7, 1.3], yawMax: (20 * Math.PI) / 180 };
export function cameraPose(zoom = 1, yaw = 0) {
  const z = Math.max(CAMERA.zoom[0], Math.min(CAMERA.zoom[1], zoom)), y = Math.max(-CAMERA.yawMax, Math.min(CAMERA.yawMax, yaw)), [px, py, pz] = CAMERA.pos, [lx, ly, lz] = CAMERA.look;
  const dx = px - lx, dy = py - ly, dz = pz - lz, c = Math.cos(y), s = Math.sin(y);
  return { x: lx + (dx * c + dz * s) * z, y: ly + dy * z, z: lz + (-dx * s + dz * c) * z, look: CAMERA.look };
}

/** Shared runtime texture cache (null in Node: materials stay flat). */
const texCache = new Map();
function textureFor(THREE, kind, perMetre) {
  const k = kind + "@" + perMetre;
  if (!texCache.has(k)) texCache.set(k, makeTexture(THREE, kind, perMetre));
  return texCache.get(k);
}
/** BoxGeometry UVs come 0..1 per face; scale them to metres so world-space textures tile evenly. */
export function boxUVmetres(geo, w, h, d) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; if (i < uv.count) uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  uv.needsUpdate = true; return geo;
}

/**
 * Fuse the plain meshes under `root` into ONE mesh with per-vertex colours (one draw call). Meshes with emissive light stay apart so they keep glowing.
 * Pure geometry work, no GPU needed. Returns the number of meshes that were fused.
 */
export function fuseStatic(THREE, root, { castShadow = true, receiveShadow = true } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), dead = [], c = new THREE.Color();
  const bucketOf = (kind) => { if (!buckets.has(kind)) buckets.set(kind, { pos: [], nor: [], col: [], uv: [], kind }); return buckets.get(kind); };
  root.traverse((o) => {
    if (!o.isMesh || o.userData.keep || (o.material.emissiveIntensity > 0 && o.material.emissive?.getHex() > 0)) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    c.copy(o.material.color);
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv, B = bucketOf(o.material.userData.texKind ?? "plain");
    for (let i = 0; i < p.count; i++) { B.pos.push(p.getX(i), p.getY(i), p.getZ(i)); B.nor.push(n.getX(i), n.getY(i), n.getZ(i)); B.col.push(c.r, c.g, c.b); B.uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
    dead.push(o); g.dispose();
  });
  if (!dead.length) return 0;
  for (const B of buckets.values()) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(B.nor, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(B.col, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    if (B.kind !== "plain") { const [kind, pm] = B.kind.split("@"); const tex = textureFor(THREE, kind, +pm); if (tex) mat.map = tex; }
    const fused = new THREE.Mesh(geo, mat); fused.castShadow = castShadow; fused.receiveShadow = receiveShadow; fused.name = B.kind === "plain" ? "fused" : "fused:" + B.kind; root.add(fused);
  }
  for (const o of dead) o.parent.remove(o); return dead.length;
}

/** A typed town building (inn, smithy, chapel): each type keeps its own silhouette in the same materials family as the houses. */
export function makeTownBuilding(THREE, type, { w = 4, d = 4, h = 3.6, tint = 0 } = {}) {
  const g = new THREE.Group(), wall = [0xece3cf, 0xe3d6b8, 0xefe8d8][Math.floor(tint * 3) % 3], timber = 0x6a4325, dark = 0x2b2118, stone = 0xcfc4a8;
  if (type === "inn") { // two floors, timber gallery and a hanging sign
    const hh = h + 1.8;
    put(THREE, g, new THREE.BoxGeometry(w + 1, hh, d + 0.5), std(THREE, wall), 0, hh / 2, 0);
    gable3(THREE, g, w + 1, d + 0.5, 0, hh, 0);
    put(THREE, g, new THREE.BoxGeometry(w * 0.8, 0.15, 0.9), std(THREE, timber), 0, 2.6, d / 2 + 0.6);
    for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.15, 2.6, 0.15), std(THREE, timber), sx * w * 0.32, 1.3, d / 2 + 0.9);
    put(THREE, g, new THREE.BoxGeometry(0.08, 0.8, 0.08), std(THREE, timber), w / 2 + 0.6, 2.4, d / 2 + 0.3);
    put(THREE, g, new THREE.BoxGeometry(0.7, 0.5, 0.06), std(THREE, 0x8a5a1e), w / 2 + 0.6, 1.9, d / 2 + 0.3);
    put(THREE, g, new THREE.BoxGeometry(0.8, 1.3, 0.08), std(THREE, dark), 0, 0.75, (d + 0.5) / 2 + 0.04);
  } else if (type === "smithy") { // soot-stained, stone chimney, the forge window keeps its glow (never fused)
    const hh = Math.max(2.6, h - 0.4);
    put(THREE, g, new THREE.BoxGeometry(w, hh, d), std(THREE, 0x9c8a70), 0, hh / 2, 0);
    gable3(THREE, g, w, d, 0, hh, 0, 0x5a4632);
    put(THREE, g, new THREE.BoxGeometry(0.7, hh + 1.6, 0.7), std(THREE, stone), w / 2 - 0.5, (hh + 1.6) / 2, -d / 2 + 0.6);
    put(THREE, g, new THREE.BoxGeometry(0.9, 0.7, 0.08), std(THREE, 0xffb860, { emissive: 0xff9540, emissiveIntensity: 0.8 }), -w / 4, 0.9, d / 2 + 0.04);
    put(THREE, g, new THREE.BoxGeometry(0.8, 1.2, 0.08), std(THREE, dark), w / 4, 0.7, d / 2 + 0.04);
  } else if (type === "chapel") { // tall pale nave with a bell-cote over the door
    const hh = h + 2.6;
    put(THREE, g, new THREE.BoxGeometry(w * 0.8, hh, d * 0.9), std(THREE, 0xf3ead6), 0, hh / 2, 0);
    gable3(THREE, g, w * 0.8, d * 0.9, 0, hh, 0, 0x7e3b22);
    for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.2, 1.1, 0.2), std(THREE, 0xf3ead6), sx * 0.5, hh + 0.9, d * 0.45 - 0.1);
    put(THREE, g, new THREE.BoxGeometry(1.2, 0.25, 0.25), std(THREE, 0xf3ead6), 0, hh + 1.5, d * 0.45 - 0.1);
    put(THREE, g, new THREE.BoxGeometry(0.35, 0.4, 0.12), std(THREE, 0x8a6a3a), 0, hh + 0.65, d * 0.45 - 0.1);
    put(THREE, g, new THREE.BoxGeometry(0.9, 1.5, 0.08), std(THREE, dark), 0, 0.85, d * 0.45 + 0.04);
  } else { // house: whitewashed walls, low terracotta roof
    put(THREE, g, new THREE.BoxGeometry(w, h, d), std(THREE, wall), 0, h / 2, 0);
    gable3(THREE, g, w, d, 0, h, 0);
    put(THREE, g, new THREE.BoxGeometry(0.7, 1.2, 0.08), std(THREE, dark), 0, 0.7, d / 2 + 0.04);
  }
  g.userData.buildingType = type;
  return g;
}

/** Treadwheel harbour crane on the quay: mast, jib over the water, rope and hook, wheel at the side. */
export function makeHarborCrane(THREE) {
  const g = new THREE.Group(), timber = 0x6a4325, dark = 0x3d2715, rope = 0x8a7a5a;
  put(THREE, g, new THREE.BoxGeometry(2.6, 0.3, 2.6), std(THREE, 0x9a8b5a), 0, 0.15, 0); // stone foot
  put(THREE, g, new THREE.BoxGeometry(0.45, 6, 0.45), std(THREE, timber), 0, 3, 0); // mast
  for (const sx of [-1, 1]) { const leg = put(THREE, g, new THREE.BoxGeometry(0.25, 4.4, 0.25), std(THREE, timber), sx * 0.9, 2.1, 0); leg.rotation.z = sx * 0.42; } // A-braces
  const jib = put(THREE, g, new THREE.BoxGeometry(0.25, 5.4, 0.25), std(THREE, timber), 0.9, 5.6, 1.5); jib.rotation.x = 0.72; jib.rotation.z = -0.28; // jib over the water
  put(THREE, g, new THREE.CylinderGeometry(0.03, 0.03, 3.4, 4), std(THREE, rope), 1.75, 4.4, 3.4); // rope down from the jib tip
  put(THREE, g, new THREE.BoxGeometry(0.35, 0.4, 0.35), std(THREE, dark), 1.75, 2.6, 3.4); // hook block
  const wheel = put(THREE, g, new THREE.CylinderGeometry(1.15, 1.15, 0.3, 14), std(THREE, timber), -1.15, 1.5, 0.2); wheel.rotation.z = Math.PI / 2; // treadwheel
  return g;
}
/** GPU waves: the vertex shader displaces the water plane with the same two sines as waveHeight.
 *  The material keeps flatShading, whose per-face normals come from screen-space derivatives,
 *  so displaced waves shade correctly with no CPU vertex or normals work per frame.
 *  The time uniform lives on water.userData.time for the render loop to advance. */
export function gpuWaves(water, { quayEdgeZ = QUAY_EDGE_Z } = {}) {
  const time = { value: 0 };
  water.material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = "uniform float uTime;\nvarying vec3 vWorldPos;\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed.z += sin((position.x * 6.2831853) / 7.0 + uTime * 1.2) * 0.09 + cos((position.y * 6.2831853) / 11.0 + uTime * 0.9) * 0.06;\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
    );
    // Shore work in the fragment shader: a breathing foam band at the quay edge and
    // slightly darker water right by the pier (art guide), both analytic - no depth texture.
    shader.fragmentShader = ("uniform float uTime;\nvarying vec3 vWorldPos;\nconst float QUAY_EDGE_Z = " + quayEdgeZ.toFixed(1) + ";\n") + shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      { float dQ = vWorldPos.z - QUAY_EDGE_Z;
        float band = (1.0 - smoothstep(0.0, 2.4, dQ)) * (1.0 - smoothstep(28.0, 33.0, abs(vWorldPos.x))); // smoothstep with edge0 < edge1 only: reversed edges are undefined in GLSL
        float pulse = 0.5 + 0.5 * sin(uTime * 1.6 + vWorldPos.x * 0.35 + vWorldPos.z * 1.1);
        float foam = band * band * smoothstep(0.74, 0.98, pulse) * 0.55;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.8, band * 0.35);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.94), foam); }`
    );
  };
  water.material.needsUpdate = true;
  water.userData.time = time;
  return water;
}

export function buildPortScene(THREE, { id = "cadiz", pop = 8000, ships = 1, warehouse = false, tod = 0.5, upgrades = {}, plots3d = [], marketStyle = MARKET_STYLE } = {}) {
  const scene = new THREE.Scene(), L0 = portLayout(id, pop), L = plots3d.length ? { ...L0, houses: housesClearOf(L0.houses, plots3d.map((p) => p?.rect).filter(Boolean)) } : L0, sk = skyFor(tod);
  const mats = new Map(), M = (color, o = {}) => { const k = color + JSON.stringify(o); if (!mats.has(k)) { const { tex, perMetre, ...rest } = o; const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...rest }); if (tex) m.userData.texKind = tex + "@" + (perMetre ?? 0.4); mats.set(k, m); } return mats.get(k); };
  const add = (parent, geo, mat, x, y, z, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
  const box = (p, w, h, d, c, x, y, z, o) => add(p, o?.tex ? boxUVmetres(new THREE.BoxGeometry(w, h, d), w, h, d) : new THREE.BoxGeometry(w, h, d), M(c, o), x, y, z);
  /** Low Arab-tile gable roof (about 22 degrees): a triangular prism along the depth. */
  const gable = (p, w, d, x, y, z, color = 0x9b4a2b) => { const rise = (w / 2) * Math.tan((22 * Math.PI) / 180), sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(0, rise); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); return add(p, g, M(color, { tex: "tiles", perMetre: 0.35 }), x, y, z - d / 2 - 0.3); };
  const hip = (p, w, d, h, x, y, z, color = 0x7e3b22) => { const m = add(p, new THREE.ConeGeometry(1, 1, 4), M(color), x, y + h / 2, z); m.rotation.y = Math.PI / 4; m.scale.set((w / 2) * 1.42, h, (d / 2) * 1.42); return m; };
  scene.background = new THREE.Color(hex(sk.sky)); scene.fog = new THREE.Fog(0xe6d8bc, 60, 180); scene.add(makeSkyDome(THREE, sk));
  scene.add(new THREE.HemisphereLight(0xffe9c4, 0x56625c, 0.4)); // lower: the environment map carries ambient now
  const sun = new THREE.DirectionalLight(hex(sk.sun), sk.sunPower); sun.position.set(-40, sk.sunHeight, 55); sun.castShadow = true; sun.name = "sun";
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 22.5, bottom: -22.5, near: 1, far: 160 }); sun.shadow.normalBias = 0.02; scene.add(sun);
  const disc = makeSunDisc(THREE, sk); if (disc) scene.add(disc);
  // sea
  const water = new THREE.Mesh(new THREE.PlaneGeometry(240, 240, 96, 96), new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.35, metalness: 0.1, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.name = "water"; water.receiveShadow = true; gpuWaves(water); scene.add(water);
  // quay: stone top and darker face, 7 m deep, 60 m long
  box(scene, 60, QUAY_TOP, 7, 0xb9ad90, 0, QUAY_TOP / 2, -5.5, { tex: "stone", perMetre: 0.22 }); box(scene, 60, QUAY_TOP - 0.1, 0.12, 0x968b74, 0, (QUAY_TOP - 0.1) / 2, QUAY_EDGE_Z + 0.06, { tex: "stone", perMetre: 0.22 });
  // hillside: one sloped quad rising 1 m per 4 m
  { const far = -45, y1 = slopeY(far), g = new THREE.BufferGeometry(), v = [-60, QUAY_TOP, FRONT_Z, 60, QUAY_TOP, FRONT_Z, 60, y1, far, -60, y1, far];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); const hill = new THREE.Mesh(g, M(0x9a8b5a, { side: THREE.DoubleSide })); hill.receiveShadow = true; scene.add(hill); }
  // houses: whitewashed walls, low terracotta roofs
  const walls = [0xece3cf, 0xe3d6b8, 0xefe8d8];
  for (const h of L.houses) {
    if (h.type !== "house") { const g = makeTownBuilding(THREE, h.type, h); g.name = "town:" + h.type; g.userData.building = "town:" + h.type; g.position.set(h.x, h.y, h.z); scene.add(g); continue; } // typed town buildings stay clickable
    const g = new THREE.Group(); g.position.set(h.x, h.y, h.z); box(g, h.w, h.h, h.d, walls[Math.floor(h.tint * 3) % 3], 0, h.h / 2, 0); gable(g, h.w, h.d, 0, h.h, 0); box(g, 0.7, 1.2, 0.08, 0x2b2118, 0, 0.7, h.d / 2 + 0.04); scene.add(g);
  }
  // bell tower far back
  { const t = L.tower, g = new THREE.Group(); g.position.set(t.x, slopeY(t.z), t.z); box(g, 3.2, t.h - 3, 3.2, 0xece3cf, 0, (t.h - 3) / 2, 0); hip(g, 3.6, 3.6, 3, 0, t.h - 3, 0, 0x9b4a2b); box(g, 1.2, 1.6, 0.3, 0x2b2118, 0, t.h - 4.5, 1.6); box(g, 0.12, 1.8, 0.12, 0x6a4325, 0, t.h + 0.7, 0); const bf = makeFlag(THREE, { color: 0xb33a2a, len: 1.6, h: 0.42 }); bf.position.set(0.06, t.h + 1.35, 0); g.add(bf); scene.add(g); }
  // clickable buildings
  const stone = 0xcfc4a8, wall = 0xece3cf, awn = [0xb33a2a, 0xf1e8cf], dark = 0x2b2118, timber = 0x6a4325;
  for (const b of BUILDINGS) {
    const lv = buildingLevel(b.id, pop, upgrades), g = new THREE.Group(); g.name = "building:" + b.id; g.userData.building = b.id; g.userData.level = lv; g.position.set(b.x, QUAY_TOP, 0);
    const z0 = FRONT_Z; // fronts stand on this line; depth goes to negative z
    if (b.id === "bank") {
      const w = lv >= 2 ? 10 : 7, d = 6, h = 5, zc = z0 - d / 2; box(g, w, h, d, stone, 0, h / 2, zc); hip(g, w, d, 1.8, 0, h, zc, lv >= 3 ? 0x8a6a3a : 0x7e3b22);
      const n = lv >= 2 ? 5 : 3; for (let i = 0; i < n; i++) { const px = -((n - 1) / 2) * 1.6 + i * 1.6; add(g, new THREE.CylinderGeometry(0.25, 0.25, h - 0.6, 10), M(wall), px, (h - 0.6) / 2, z0 + 1.2); }
      box(g, n * 1.6, 0.4, 2, stone, 0, h - 0.4, z0 + 1.0); if (lv >= 2) box(g, 1.2, 1.2, 0.2, 0xb33a2a, 0, h - 1.4, z0 + 0.05);
      if (lv >= 3) { for (let i = 0; i < 3; i++) box(g, w * 0.5, 0.2, 0.35, stone, 0, 0.1 + i * 0.2, z0 + 2.2 - i * 0.35); box(g, w * 0.8, 0.14, 0.14, 0xc9962a, 0, h + 1.8, zc, { emissive: 0xc9962a, emissiveIntensity: 0.15 }); for (const sx of [-1, 1]) add(g, new THREE.ConeGeometry(0.3, 1, 6), M(0xc9962a, { emissive: 0xc9962a, emissiveIntensity: 0.15 }), sx * (w / 2 - 0.4), h + 0.5, zc); }
    } else if (b.id === "market") {
      const d = 7, h = lv >= 2 ? 5.5 : 4.5, w = 12, zc = z0 - d / 2;
      if (marketStyle === "lonja") { // open arcade hall: two colonnades, frieze and gable roof; unmistakable on the quay
        const cols = lv >= 2 ? 6 : 5, hh = lv >= 3 ? h + 1 : h;
        box(g, w - 2.5, hh - 1.6, d - 2.5, wall, 0, (hh - 1.6) / 2, zc); // inner hall behind the arcade
        for (const sx of [-1, 1]) for (let i = 0; i < cols; i++) add(g, new THREE.CylinderGeometry(0.22, 0.26, hh - 0.8, 8), M(wall), sx * (w / 2 - 0.5), (hh - 0.8) / 2, zc - d / 2 + 0.8 + (i * (d - 1.6)) / (cols - 1));
        box(g, w, 0.6, d, stone, 0, hh - 0.5, zc); // frieze over the arches
        gable(g, w, d, 0, hh, zc);
        const na = lv >= 2 ? 6 : 4, aw = w / na; for (let i = 0; i < na; i++) { const a = box(g, aw * 0.96, 0.1, 1.5, awn[i % 2], -w / 2 + aw / 2 + i * aw, 3.0, z0 + 0.7); a.rotation.x = 0.35; }
        if (lv >= 2) for (let i = 0; i < 3; i++) { box(g, 2, 0.9, 1.5, timber, -4 + i * 4, 0.45, z0 + 3.5); const a = box(g, 2.2, 0.08, 1.7, awn[i % 2], -4 + i * 4, 2.1, z0 + 3.5); a.rotation.x = 0.2; }
        if (lv >= 3) { box(g, 0.06, 1.2, 0.06, dark, 0, hh + 2.2, zc); box(g, 0.7, 0.45, 0.05, 0xb33a2a, 0.4, hh + 2.4, zc); box(g, 0.3, 0.45, 0.3, 0xffd27a, 2, 2.6, z0 + 0.2, { emissive: 0xffb860, emissiveIntensity: 0.8 }); }
      } else { // awning hall, and the harbour crane that marks the market from the sea
        box(g, w, h, d, wall, 0, h / 2, zc); gable(g, w, d, 0, h, zc);
        const na = lv >= 2 ? 6 : 4, aw = w / na; for (let i = 0; i < na; i++) { const a = box(g, aw * 0.96, 0.1, 1.5, awn[i % 2], -w / 2 + aw / 2 + i * aw, 3.0, z0 + 0.7); a.rotation.x = 0.35; }
        if (lv >= 2) for (let i = 0; i < 3; i++) { box(g, 2, 0.9, 1.5, timber, -4 + i * 4, 0.45, z0 + 3.5); const a = box(g, 2.2, 0.08, 1.7, awn[i % 2], -4 + i * 4, 2.1, z0 + 3.5); a.rotation.x = 0.2; }
        if (lv >= 3) { box(g, w * 0.7, 3, d * 0.7, wall, 0, h + 1.5, zc); box(g, 0.8, 2, 0.06, 0xb33a2a, w / 2 - 1, h + 4, zc + d / 2); box(g, 0.3, 0.45, 0.3, 0xffd27a, 2, 2.6, z0 + 0.2, { emissive: 0xffb860, emissiveIntensity: 0.8 }); }
        const crane = makeHarborCrane(THREE); crane.position.set(w / 2 + 1.3, 0, z0 + 2.2); g.add(crane); // the crane stands in the gap before the tavern
      }
    } else if (b.id === "tavern") {
      const w = 8, d = 6, h = lv >= 3 ? 7 : 4, zc = z0 - d / 2; box(g, w, h, d, wall, 0, h / 2, zc); gable(g, w, d, 0, h, zc);
      box(g, w * 0.6, 0.15, 1.2, timber, 0, 2.8, z0 + 0.6); box(g, 0.08, 0.08, 1.2, timber, w / 2 + 0.4, 3.0, z0 + 0.1); box(g, 0.9, 0.6, 0.08, 0x8a5a1e, w / 2 + 1.0, 2.7, z0 + 0.1);
      if (lv >= 2) { box(g, 5, 3.2, 5, wall, 0, 1.6, z0 - d - 2.5); gable(g, 5, 5, 0, 3.2, z0 - d - 2.5); }
      if (lv >= 3) { box(g, 0.8, 2, 0.8, stone, -w / 2 + 1, h + 1.2, zc); box(g, 0.9, 0.6, 0.08, 0x8a5a1e, -w / 2 - 1.0, 2.7, z0 + 0.1); for (const sx of [-2, 2]) box(g, 0.8, 1.0, 0.06, 0xffb860, sx, 5.2, z0 + 0.04, { emissive: 0xffb860, emissiveIntensity: 0.6 }); }
    } else { // shipyard: open shed and a slipway running into the sea
      const w = lv >= 3 ? 12 : 10, d = lv >= 3 ? 22 : 8, zc = z0 - d / 2, ph = 4;
      for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) box(g, 0.3, ph, 0.3, timber, sx * (w / 2 - 0.3), ph / 2, z0 - 0.3 - (i * (d - 0.6)) / 3);
      box(g, w + 0.6, 0.25, d + 0.6, timber, 0, ph + 0.1, zc); gable(g, w, d, 0, ph + 0.2, zc);
      const len = lv >= 2 ? 20 : 14, sl = box(g, 4, 0.2, len, timber, 0, 0.3, z0 + len / 2 - 4); sl.rotation.x = -0.105;
      if (lv >= 2) for (const sx of [-1, 1]) { const arm = box(g, 0.25, 9, 0.25, timber, sx * 2.8, 4.5, z0 + 4); arm.rotation.z = sx * 0.2; }
      if (lv >= 3) { for (let i = 0; i < 8; i++) box(g, 3, 0.15, 0.15, 0x5a3a22, 0, 0.9 + (i % 2) * 0.1, z0 + 2 + i * 1.4); box(g, 0.2, 0.3, 11, 0x3d2715, 0, 0.6, z0 + 5); box(g, 0.8, 2, 0.06, 0xb33a2a, w / 2 - 1, ph + 2.5, zc); }
    }
    scene.add(g);
  }
  // player plots on the hillside: active building, scaffold while under construction, slab for a bare owned plot
  for (const p of plots3d) {
    if (!p?.rect || !p.id) continue;
    const g = p.state === "construction" ? makeScaffold(THREE, p.rect.w, p.rect.d, p.progress ?? 0.5)
      : p.type ? makePlayerBuilding(THREE, p.type, p.level ?? 1, p.rect.w, p.rect.d)
      : makePlotSlab(THREE, p.rect.w, p.rect.d);
    g.name = "plot:" + p.id; g.userData.plot = p.id; g.position.set(p.rect.x, p.rect.y, p.rect.z);
    scene.add(g);
  }
  if (warehouse) { const g = new THREE.Group(); g.name = "warehouse"; g.userData.building = "warehouse"; g.position.set(28, QUAY_TOP, -5.5); box(g, 3.4, 2.4, 3, 0xc9a66b, 0, 1.2, 0); gable(g, 3.4, 3, 0, 2.4, 1.5); scene.add(g); } // the owned warehouse is named and clickable like the quay buildings
  // quay props: bollards every 3 m at 0.5 m from the edge, barrels and crates
  for (let x = -27; x <= 27; x += 3) add(scene, new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8), M(dark), x, QUAY_TOP + 0.25, QUAY_EDGE_Z - 0.5, false);
  for (let i = 0; i < 6; i++) { add(scene, new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8), M(timber), 1 + i * 0.7, QUAY_TOP + 0.4, -3.2, false); box(scene, 0.8, 0.8, 0.8, 0x9a7a4a, -14 - (i % 3) * 0.9, QUAY_TOP + 0.4 + Math.floor(i / 3) * 0.8, -3.4); }
  for (let i = 0; i < Math.min(3, ships); i++) scene.add(makeShip(THREE, -4 + i * 14, 2.5, i));
  // performance: the town (houses, tower, quay props), each building and each ship become one mesh each
  const town = new THREE.Group(); town.name = "town";
  for (const o of [...scene.children]) if (!o.userData.building && !o.userData.plot && o.name !== "ship" && o.name !== "water" && o.name !== "sun" && o.name !== "sky" && o.name !== "sun-disc" && !o.isLight && o !== water) { if (o.isGroup || o.isMesh) { town.add(o); } }
  scene.add(town); fuseStatic(THREE, town);
  for (const o of scene.children) if (o.userData.building || o.userData.plot || o.name === "ship") fuseStatic(THREE, o);
  return { scene, layout: L, water, mats };
}

/** Docked ship: parallel to the quay, sails furled, scale 0.75. `k` picks the type (0 cog, 1 caravel, 2 carrack). */
/** Waving pennant: a plane that ripples in the wind on the GPU. userData.time drives it (same contract as the water) and userData.keep keeps it out of the static fusing (it animates). */
export function makeFlag(THREE, { color = 0xb33a2a, len = 1.1, h = 0.3 } = {}) {
  const geo = new THREE.PlaneGeometry(len, h, 10, 1); geo.translate(len / 2, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide });
  const time = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = "uniform float uTime;\nconst float FLAG_LEN = " + len.toFixed(2) + ";\n" + shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nfloat fl = position.x / FLAG_LEN;\ntransformed.z += sin(position.x * 7.0 + uTime * 5.2) * 0.09 * fl;\ntransformed.y += sin(position.x * 4.5 + uTime * 3.4) * 0.03 * fl;"
    );
  };
  mat.needsUpdate = true;
  const m = new THREE.Mesh(geo, mat); m.name = "flag"; m.userData.time = time; m.userData.keep = true; return m;
}
/** Advance every GPU-time uniform under root (water, flags, ...): one call from the render loop. */
export function advanceTime(root, t) { root.traverse((o) => { if (o.userData?.time) o.userData.time.value = t; }); }

export function makeShip(THREE, x, z, k = 0) {
  const T = [{ len: 15, wid: 5, mast: [13], castle: 1 }, { len: 17, wid: 5, mast: [15, 13], castle: 0 }, { len: 24, wid: 7, mast: [16, 18, 14], castle: 2 }][k % 3];
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: 0x3d2715, roughness: 0.8 }), sailM = new THREE.MeshStandardMaterial({ color: 0xf1e8cf, roughness: 1 });
  const half = T.len / 2, prof = new THREE.Shape(); prof.moveTo(-half, 1.8); prof.quadraticCurveTo(-half + 0.5, -0.9, -half * 0.5, -1.1); prof.lineTo(half * 0.45, -1.1); prof.quadraticCurveTo(half - 0.4, -0.6, half, 2.0); prof.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: T.wid * 0.8, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2 }), wood); hull.position.z = -T.wid * 0.4; hull.castShadow = true; g.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(T.len * 0.95, 0.25, T.wid * 0.92), band); stripe.position.set(0, 1.4, 0); g.add(stripe);
  T.mast.forEach((mh, i) => { const mx = (i - (T.mast.length - 1) / 2) * (T.len * 0.28), m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, mh, 6), wood); m.position.set(mx, 1.8 + mh / 2, 0); m.castShadow = true; g.add(m);
    const yd = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, T.wid * 0.9, 5), wood); yd.rotation.x = Math.PI / 2; yd.position.set(mx, 1.8 + mh * 0.85, 0); g.add(yd);
    const furl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, T.wid * 0.85, 8), sailM); furl.rotation.x = Math.PI / 2; furl.position.set(mx, 1.8 + mh * 0.85 - 0.3, 0); g.add(furl);
    const pen = makeFlag(THREE, { color: i === 0 ? 0xb33a2a : 0xd9a441, len: 1.2, h: 0.26 }); pen.position.set(mx, 1.8 + mh - 0.2, 0); g.add(pen); }); // sails furled: a bundle under the yard; a pennant flies from each mast top
  for (let c = 0; c < T.castle; c++) { const cs = new THREE.Mesh(new THREE.BoxGeometry(T.len * 0.2, 1.6, T.wid * 0.85), wood); cs.position.set(c ? half * 0.75 : -half * 0.72, 2.6, 0); cs.castShadow = true; g.add(cs); }
  g.scale.setScalar(0.75); g.position.set(x, 0.2, z); g.name = "ship"; g.userData.baseY = 0.2; return g;
}

/** Sky colour at a height: horizon near the water line, zenith overhead, deep below. Pure maths, testable without a GPU. */
export function skyGradient(st, t) {
  const mix3 = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  if (t <= 0) return mix3(st.deep, st.horizon, Math.max(0, 1 + t * 3));
  return mix3(st.horizon, st.zenith, Math.min(1, t * 2.2));
}
/** Gradient sky dome: a big inside-out sphere vertex-coloured with the same stops the environment map uses. Works in Node (no DOM). */
export function makeSkyDome(THREE, sk, radius = 300) {
  const st = envStops(sk), geo = new THREE.SphereGeometry(radius, 32, 16), pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const [r, g, b] = skyGradient(st, pos.getY(i) / radius); col.push(r / 255, g / 255, b / 255); }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.name = "sky"; m.userData.keep = true; m.renderOrder = -1; return m;
}

/** Where the visible sun disc sits: far along the directional light direction. Pure maths, testable without a GPU. */
export function sunPose(sk) { const d = [-40, sk.sunHeight, 55], n = Math.hypot(...d); return d.map((v) => (v / n) * 350); }
/** Visible sun: a soft additive disc drawn on a canvas (own work, no assets). Returns null in Node (no DOM). */
export function makeSunDisc(THREE, sk) {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas"); cv.width = cv.height = 128;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,244,220,1)"); g.addColorStop(0.25, "rgba(255,225,170,0.9)"); g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.name = "sun-disc"; sp.userData.keep = true;
  const [x, y, z] = sunPose(sk); sp.position.set(x, y, z); sp.scale.setScalar(90 + sk.sunPower * 10);
  return sp;
}

/** Waves: two sines, 0.15 m in total, wavelengths about 7 and 11 m. Pure geometry maths, testable without a GPU. */
export function waveHeight(x, z, t) { return Math.sin((x * 2 * Math.PI) / 7 + t * 1.2) * 0.09 + Math.cos((z * 2 * Math.PI) / 11 + t * 0.9) * 0.06; }
/** CPU reference path: same maths as the GPU wave shader, kept for tests and reduced embeds. The 3D view uses gpuWaves instead. */
export function animateWater(water, t) {
  const p = water.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, waveHeight(p.getX(i), p.getY(i), t));
  p.needsUpdate = true; water.geometry.computeVertexNormals();
}
/** Hover and focus look: a little glow on the whole building. */
export function setHover(group, on) {
  group.traverse((o) => { if (!o.isMesh || !o.material) return; if (on) { o.userData.emis ??= o.material.emissive?.getHex(); o.material = o.material.clone(); o.material.emissive?.setHex(0xf1e8cf); o.material.emissiveIntensity = 0.12; } });
}
/** Walk up from a hit object to the building group it belongs to; returns the building id or null. */
export function buildingOf(obj) { for (let o = obj; o; o = o.parent) { if (o.userData?.building) return o.userData.building; if (o.userData?.plot) return "plot:" + o.userData.plot; } return null; }
/** Which building is under the pointer? ndc in -1..1. Returns an id or null. */
export function pickBuilding(THREE, scene, camera, ndcX, ndcY) {
  const rc = new THREE.Raycaster(); rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = rc.intersectObjects(scene.children, true);
  return hits.length ? buildingOf(hits[0].object) : null;
}

/** Where a gen-city plot (x, y, w, d in the 0..size layout grid) sits in the port scene:
 *  on the hillside behind the building row. Deterministic, pure. */
export function plotSceneRect(plot, size) {
  if (!plot || !Number.isFinite(plot.x) || !Number.isFinite(plot.y) || !Number.isFinite(size) || size <= 0) return null;
  const w = Math.max(2, Math.min(8, plot.w * 0.9)), d = Math.max(2, Math.min(8, (plot.d ?? plot.w) * 0.9));
  const x = (plot.x / size - 0.5) * 56, z = -12 - (plot.y / size) * 30;
  return { x, z, y: slopeY(z), w, d };
}
/** Decorative houses that overlap any plot rectangle come out (same rule as the fixed buildings in portLayout). */
export function housesClearOf(houses, rects) {
  return houses.filter((h) => !rects.some((r) => Math.abs(h.x - r.x) < (r.w + h.w) / 2 + 0.6 && Math.abs(h.z - r.z) < (r.d + h.d) / 2 + 0.6));
}

const std = (THREE, color, o = {}) => { const { tex, perMetre, ...rest } = o; const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...rest }); if (tex) m.userData.texKind = tex + "@" + (perMetre ?? 0.4); return m; };
const put = (THREE, parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
const gable3 = (THREE, parent, w, d, x, y, z, color = 0x9b4a2b) => {
  const rise = (w / 2) * Math.tan((22 * Math.PI) / 180), sh = new THREE.Shape();
  sh.moveTo(-w / 2 - 0.3, 0); sh.lineTo(w / 2 + 0.3, 0); sh.lineTo(0, rise); sh.closePath();
  return put(THREE, parent, new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }), std(THREE, color, { tex: "tiles", perMetre: 0.35 }), x, y, z - d / 2 - 0.3);
};

/** A player's building on its plot: house (whitewashed), workshop (timber shed with chimney),
 *  warehouse (long shed, wide door). Level 1-3 grows it; the plot footprint caps the size. */
export function makePlayerBuilding(THREE, type, level = 1, w = 4, d = 4) {
  const g = new THREE.Group(), lv = Math.max(1, Math.min(3, level)), bw = w * (0.7 + lv * 0.1), bd = d * (0.7 + lv * 0.1);
  const wall = 0xece3cf, timber = 0x6a4325, dark = 0x2b2118;
  put(THREE, g, new THREE.BoxGeometry(bw + 0.5, 2.4, bd + 0.5), std(THREE, 0xb9ad90), 0, -1.05, 0); // stone footing: absorbs the hillside slope (up to ~1 m of grade change across the plot)
  if (type === "house") {
    const h = 2.6 + lv * 0.9;
    put(THREE, g, new THREE.BoxGeometry(bw, h, bd), std(THREE, wall), 0, h / 2, 0);
    gable3(THREE, g, bw, bd, 0, h, 0);
    put(THREE, g, new THREE.BoxGeometry(0.7, 1.2, 0.08), std(THREE, dark), 0, 0.6, bd / 2 + 0.04);
    if (lv >= 2) put(THREE, g, new THREE.BoxGeometry(bw * 0.5, 1.4, bd * 0.55), std(THREE, 0xe3d6b8), bw * 0.55, 0.7, -bd * 0.1); // side annex
    if (lv >= 3) put(THREE, g, new THREE.BoxGeometry(0.5, 1.4, 0.5), std(THREE, 0xcfc4a8), -bw / 2 + 0.5, h + 0.6, -bd / 2 + 0.5); // chimney
  } else if (type === "warehouse") {
    const h = 2.4 + lv * 0.5;
    put(THREE, g, new THREE.BoxGeometry(bw * 1.25, h, bd), std(THREE, 0xc9a66b), 0, h / 2, 0);
    gable3(THREE, g, bw * 1.25, bd, 0, h, 0, 0x6b4a2a);
    put(THREE, g, new THREE.BoxGeometry(bw * 0.5, h * 0.75, 0.1), std(THREE, dark), 0, h * 0.375, bd / 2 + 0.05); // wide door
    if (lv >= 2) put(THREE, g, new THREE.BoxGeometry(bw * 0.4, h * 0.8, bd * 0.6), std(THREE, 0xc9a66b), -bw * 0.8, h * 0.4, 0); // second nave
    if (lv >= 3) put(THREE, g, new THREE.BoxGeometry(1.2, 1.6, 1.2), std(THREE, timber), bw * 0.75, 0.8, bd / 2 + 0.8); // hoist tower
  } else { // workshop: shed, loom frame and a tall chimney for the dye vats
    const h = 2.4 + lv * 0.6;
    put(THREE, g, new THREE.BoxGeometry(bw, h, bd), std(THREE, 0xdcc9a8), 0, h / 2, 0);
    gable3(THREE, g, bw, bd, 0, h, 0, 0x7e3b22);
    for (const sx of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, h, 0.18), std(THREE, timber), sx * (bw / 2 - 0.1), h / 2, bd / 2 + 0.02); // timber frame
    put(THREE, g, new THREE.BoxGeometry(0.7, 1.2, 0.08), std(THREE, dark), -bw / 4, 0.6, bd / 2 + 0.04);
    put(THREE, g, new THREE.BoxGeometry(0.6, h + 1.6, 0.6), std(THREE, 0x8a6a4a), bw / 2 - 0.6, (h + 1.6) / 2, -bd / 2 + 0.6); // chimney
    if (lv >= 2) put(THREE, g, new THREE.BoxGeometry(bw * 0.7, 0.14, 1.4), std(THREE, timber), 0, 2.0, bd / 2 + 0.8); // loom canopy
    if (lv >= 3) for (const sx of [-0.8, 0, 0.8]) put(THREE, g, new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8), std(THREE, 0x5a6a8a), sx, 0.4, bd / 2 + 1.0); // dye vats
  }
  g.userData.buildingType = type; g.userData.level = lv;
  return g;
}

/** Scaffolding while a building is under construction: corner poles, cross planks and a wall stub. */
export function makeScaffold(THREE, w = 4, d = 4, progress = 0.5) {
  const g = new THREE.Group(), timber = std(THREE, 0x8a6a4a), h = 3.2;
  put(THREE, g, new THREE.BoxGeometry(w + 0.5, 2.4, d + 0.5), std(THREE, 0xb9ad90), 0, -1.05, 0); // footing against the slope, as in makePlayerBuilding
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.18, h, 0.18), timber, sx * w / 2, h / 2, sz * d / 2);
  for (const yy of [1.1, 2.2]) { put(THREE, g, new THREE.BoxGeometry(w + 0.3, 0.12, 0.12), timber, 0, yy, d / 2); put(THREE, g, new THREE.BoxGeometry(w + 0.3, 0.12, 0.12), timber, 0, yy, -d / 2); }
  const stub = Math.max(0.4, 2.6 * Math.min(1, Math.max(0, progress)));
  put(THREE, g, new THREE.BoxGeometry(w * 0.8, stub, d * 0.8), std(THREE, 0xe3d6b8), 0, stub / 2, 0); // walls rise with the works
  return g;
}

/** An owned but empty plot in the 3D scene: a low stone slab with corner posts, ready to build on. */
export function makePlotSlab(THREE, w = 4, d = 4) {
  const g = new THREE.Group(), stone = std(THREE, 0xb9ad90), post = std(THREE, 0xd9b45a); // gold posts: owned and ready to build
  put(THREE, g, new THREE.BoxGeometry(w + 0.5, 2.4, d + 0.5), stone, 0, -1.05, 0); // footing against the slope
  put(THREE, g, new THREE.BoxGeometry(w, 0.15, d), stone, 0, 0.075, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(THREE, g, new THREE.BoxGeometry(0.16, 0.5, 0.16), post, sx * (w / 2 - 0.1), 0.25, sz * (d / 2 - 0.1));
  return g;
}
