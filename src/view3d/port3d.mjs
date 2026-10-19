// Procedural 3D port scene. No external assets: everything is generated here (own work, MIT).
// `THREE` is passed in so this module loads in the browser and under Node tests alike.
import { seeded } from "../view/cityscene.mjs";

/** Pure layout: where houses stand for a port id and size. Same input, same layout. */
export function portLayout(id, pop = 8000) {
  const rnd = seeded("3d:" + id), n = Math.max(6, Math.min(40, Math.round(pop / 800))), houses = [];
  for (let i = 0; i < n; i++) {
    const row = i % 3, x = -14 + (i / n) * 28 + (rnd() - 0.5) * 1.2, z = -4 - row * 3.2 - rnd();
    houses.push({ x, z, w: 1.6 + rnd() * 1.2, d: 1.6 + rnd() * 1.0, h: 1.4 + rnd() * 2.2 + (row === 2 ? 1 : 0), hue: rnd() });
  }
  return { houses, tower: { x: houses[Math.floor(n / 2)].x, z: -11 }, quayZ: -2 };
}

export function buildPortScene(THREE, { id = "cadiz", pop = 8000, ships = 1 } = {}) {
  const scene = new THREE.Scene(), L = portLayout(id, pop);
  scene.background = new THREE.Color(0x9ec3d6); scene.fog = new THREE.Fog(0x9ec3d6, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x4a6b7a, 1.1));
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.2); sun.position.set(-10, 14, 8); scene.add(sun);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 60, 60), new THREE.MeshStandardMaterial({ color: 0x2f6f8f, roughness: 0.35, metalness: 0.1, flatShading: true }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.2; water.name = "water"; scene.add(water);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 24), new THREE.MeshStandardMaterial({ color: 0xb89b6a, roughness: 1 }));
  ground.position.set(0, -0.3, -14); scene.add(ground);
  const wall = new THREE.MeshStandardMaterial({ color: 0xe7d9b9, roughness: 0.9 }), roof = new THREE.MeshStandardMaterial({ color: 0x9b4a2b, roughness: 0.8 });
  for (const h of L.houses) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.d), wall); b.position.set(h.x, h.h / 2 + 0.2, h.z);
    const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.w, h.d) * 0.78, 1, 4), roof); r.rotation.y = Math.PI / 4; r.position.set(h.x, h.h + 0.7, h.z);
    scene.add(b, r);
  }
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 8, 8), wall); tw.position.set(L.tower.x, 4.2, L.tower.z); scene.add(tw);
  const tr = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2, 8), roof); tr.position.set(L.tower.x, 9.2, L.tower.z); scene.add(tr);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(60, 0.5, 2.2), new THREE.MeshStandardMaterial({ color: 0x6b5233, roughness: 1 })); quay.position.set(0, 0.1, L.quayZ); scene.add(quay);
  for (let i = 0; i < ships; i++) scene.add(makeShip(THREE, -6 + i * 7, 3 + (i % 2) * 2.5, i));
  return { scene, layout: L, water };
}

export function makeShip(THREE, x, z, k = 0) {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x6a4325, roughness: 0.8 }), sailM = new THREE.MeshStandardMaterial({ color: 0xf1e8cf, side: THREE.DoubleSide, roughness: 1 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 1.6), wood); hull.position.y = 0.2; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 4), wood); bow.rotation.z = -Math.PI / 2; bow.position.set(3.2, 0.2, 0); bow.scale.set(1, 1, 1); g.add(bow);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), wood); mast.position.set(0, 3, 0); g.add(mast);
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
