// Procedural 3D port scene. No external assets: everything is generated here (own work, MIT).
// `THREE` is passed in so this module loads in the browser and under Node tests alike.
import { seeded } from "../view/cityscene.mjs";

/** The clickable buildings of a port: `tab` is the game panel each one opens. Same spots in every port. */
export const BUILDINGS = [
  { id: "bank", tab: "bank", x: -13, z: -5.6, w: 2.6, d: 2.4, h: 3 },
  { id: "market", tab: "market", x: -8.5, z: -5.6, w: 4, d: 2.4, h: 2.2 },
  { id: "tavern", tab: "tavern", x: -3.5, z: -5.6, w: 3, d: 2.6, h: 3.2 },
  { id: "shipyard", tab: "yard", x: 2.5, z: -5.6, w: 5, d: 2.8, h: 3 },
];
/** Which game panel a building opens; null for anything else (houses, water, unknown ids). */
export const tabForBuilding = (id) => BUILDINGS.find((b) => b.id === id)?.tab ?? null;

/** Pure layout: where houses stand for a port id and size. Same input, same layout. */
export function portLayout(id, pop = 8000) {
  const rnd = seeded("3d:" + id), n = Math.max(6, Math.min(40, Math.round(pop / 800))), houses = [];
  for (let i = 0; i < n; i++) {
    const row = i % 3, x = -14 + (i / n) * 28 + (rnd() - 0.5) * 1.2, z = -4 - row * 3.2 - rnd();
    houses.push({ x, z, w: 1.6 + rnd() * 1.2, d: 1.6 + rnd() * 1.0, h: 1.4 + rnd() * 2.2 + (row === 2 ? 1 : 0), hue: rnd() });
  }
  const tower = { x: houses[Math.floor(n / 2)].x, z: -11 };
  const free = houses.filter((h) => !BUILDINGS.some((b) => Math.abs(h.x - b.x) < (b.w + h.w) / 2 + 0.4 && Math.abs(h.z - b.z) < (b.d + h.d) / 2 + 0.4)); // keep the building plots clear
  return { houses: free, tower, quayZ: -2 };
}

/** Sky, light and fog colours for a time of day t in 0..1 (0 dawn, .5 noon, 1 dusk). Pure, testable. */
export function skyFor(t) {
  const k = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI); // 0 at the edges, 1 at noon
  const mix = (a, b) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
  return { sky: mix([0xe0, 0x8a, 0x5e], [0x9e, 0xc3, 0xd6]), sun: mix([0xff, 0x9a, 0x50], [0xff, 0xe8, 0xc0]), sunPower: 1 + 1.4 * k, sunHeight: 4 + 12 * k };
}
const hex = ([r, g, b]) => (r << 16) | (g << 8) | b;

export function buildPortScene(THREE, { id = "cadiz", pop = 8000, ships = 1, warehouse = false, tod = 0.5 } = {}) {
  const scene = new THREE.Scene(), L = portLayout(id, pop);
  const sk = skyFor(tod); scene.background = new THREE.Color(hex(sk.sky)); scene.fog = new THREE.Fog(hex(sk.sky), 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x4a6b7a, 1.1));
  const sun = new THREE.DirectionalLight(hex(sk.sun), sk.sunPower); sun.position.set(-10, sk.sunHeight, 8); scene.add(sun);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 60, 60), new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.35, metalness: 0.1, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.2; water.name = "water"; scene.add(water);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 24), new THREE.MeshStandardMaterial({ color: 0xb89b6a, roughness: 1 }));
  ground.position.set(0, -0.3, -14); scene.add(ground);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 1 }), wood0 = new THREE.MeshStandardMaterial({ color: 0x6a4325, roughness: 0.8 });
  const wall = new THREE.MeshStandardMaterial({ color: 0xe7d9b9, roughness: 0.9 }), roof = new THREE.MeshStandardMaterial({ color: 0x9b4a2b, roughness: 0.8 });
  for (const h of L.houses) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.d), wall); b.position.set(h.x, h.h / 2 + 0.2, h.z);
    const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w, h.d) * 0.78, 1, 4), roof); r.rotation.y = Math.PI / 4; r.position.set(h.x, h.h + 0.7, h.z);
    scene.add(b, r);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.05), dark); win.position.set(h.x - h.w * 0.22, h.h * 0.6 + 0.2, h.z + h.d / 2 + 0.03); const w2 = win.clone(); w2.position.x = h.x + h.w * 0.22; scene.add(win, w2);
  }
  const awning = [0xb33a2a, 0xf1e8cf], bm = { bank: 0xcfc4a8, market: 0xd9c9a0, tavern: 0xc9a27a, shipyard: 0xa98a5c };
  for (const b of BUILDINGS) { // each building is a group named after it, so a click can be traced back to its id
    const g = new THREE.Group(); g.name = "building:" + b.id; g.userData.building = b.id; g.position.set(b.x, 0, b.z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), new THREE.MeshStandardMaterial({ color: bm[b.id], roughness: 0.9 })); body.position.y = b.h / 2 + 0.2;
    const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.78, 1.2, 4), roof); rf.rotation.y = Math.PI / 4; rf.position.y = b.h + 0.8; rf.scale.set(b.w >= b.d ? 1.15 : 1, 1, b.d > b.w ? 1.15 : 0.9);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.06), dark); door.position.set(0, 0.9, b.d / 2 + 0.03);
    g.add(body, rf, door);
    if (b.id === "market") for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(b.w / 4, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: awning[i % 2], roughness: 1 })); a.position.set(-b.w * 0.375 + i * (b.w / 4), 1.9, b.d / 2 + 0.6); a.rotation.x = 0.3; g.add(a); }
    if (b.id === "tavern") { const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x8a5a1e, roughness: 0.8 })); sign.position.set(b.w / 2 + 0.5, 2.4, b.d / 2 + 0.1); g.add(sign); }
    if (b.id === "shipyard") { const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 3.6), wood0); ramp.position.set(0, 0.28, b.d / 2 + 1.8); ramp.rotation.x = 0.1; g.add(ramp); }
    if (b.id === "bank") for (let i = -1; i <= 1; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, b.h, 8), wall); c.position.set(i * 0.8, b.h / 2 + 0.2, b.d / 2 + 0.25); g.add(c); }
    scene.add(g);
  }
  if (warehouse) { // the player's warehouse: a long timber-framed hall on the quay
    const hall = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xc9a66b, roughness: 0.9 })); hall.position.set(9, 1.3, -4.2); hall.name = "warehouse";
    const hr = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, 2.8), roof); hr.position.set(9, 2.6, -4.2); hr.rotation.z = 0.0; scene.add(hall, hr);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshStandardMaterial({ color: 0xb33a2a, side: THREE.DoubleSide })); flag.position.set(11.2, 3.6, -4.2); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 5), wood0); pole.position.set(10.75, 3.3, -4.2); scene.add(flag, pole);
  }
  const crane = new THREE.Group(); { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), wood0); m.position.y = 2; const a = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 0.25), wood0); a.position.set(1.2, 4, 0); crane.add(m, a); crane.position.set(-9, 0.4, -1.8); crane.name = "crane"; scene.add(crane); }
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 8, 8), wall); tw.position.set(L.tower.x, 4.2, L.tower.z); scene.add(tw);
  const tr = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2, 8), roof); tr.position.set(L.tower.x, 9.2, L.tower.z); scene.add(tr);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(60, 0.5, 2.2), new THREE.MeshStandardMaterial({ color: 0x6b5233, roughness: 1 })); quay.position.set(0, 0.1, L.quayZ); scene.add(quay);
  for (let i = 0; i < ships; i++) scene.add(makeShip(THREE, -6 + i * 7, 3 + (i % 2) * 2.5, i));
  return { scene, layout: L, water };
}

export function makeShip(THREE, x, z, k = 0) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6a4325, roughness: 0.8 }), sailM = new THREE.MeshStandardMaterial({ color: 0xf1e8cf, side: THREE.DoubleSide, roughness: 1 });
  const prof = new THREE.Shape(); prof.moveTo(-2.6, 0.9); prof.quadraticCurveTo(-2.4, -0.3, -1.2, -0.45); prof.lineTo(1.6, -0.45); prof.quadraticCurveTo(3.0, -0.2, 3.5, 1.0); prof.lineTo(-2.6, 0.9);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: 1.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 }), wood); hull.position.set(0, 0.2, -0.75); g.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 1.75), new THREE.MeshStandardMaterial({ color: 0xc9962a, roughness: 0.7 })); stripe.position.set(0.4, 1.0, 0); g.add(stripe);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), wood); mast.position.set(0, 3, 0); g.add(mast);
  const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 5), wood); yard.rotation.x = Math.PI / 2; yard.position.set(0, 4.5, 0); g.add(yard);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3), sailM); sail.position.set(0, 3.2, 0); sail.rotation.y = Math.PI / 2 + 0.15 * (k % 2 ? 1 : -1); g.add(sail);
  g.position.set(x, 0.3, z); g.name = "ship"; return g;
}

/** Animate the water; t in seconds. Pure geometry update, testable without a GPU. */
export function waveHeight(x, z, t) { return Math.sin(x * 0.5 + t * 1.2) * 0.08 + Math.cos(z * 0.4 + t * 0.9) * 0.06; }
export function animateWater(water, t) {
  const p = water.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, waveHeight(p.getX(i), p.getY(i), t));
  p.needsUpdate = true; water.geometry.computeVertexNormals();
}

/** Walk up from a hit object to the building group it belongs to; returns the building id or null. */
export function buildingOf(obj) { for (let o = obj; o; o = o.parent) if (o.userData?.building) return o.userData.building; return null; }
/** Which building is under the pointer? ndc in -1..1. Returns an id or null. */
export function pickBuilding(THREE, scene, camera, ndcX, ndcY) {
  const rc = new THREE.Raycaster(); rc.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = rc.intersectObjects(scene.children, true);
  return hits.length ? buildingOf(hits[0].object) : null;
}
