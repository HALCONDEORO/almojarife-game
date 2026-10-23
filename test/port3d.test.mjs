import test from "node:test";
import assert from "node:assert/strict";
import { portLayout, waveHeight, skyFor } from "../src/view3d/port3d.mjs";
test("the port layout is deterministic per port and grows with population", () => {
  assert.deepEqual(portLayout("cadiz", 8000), portLayout("cadiz", 8000));
  assert.notDeepEqual(portLayout("cadiz", 8000).houses, portLayout("lisboa", 8000).houses);
  assert.ok(portLayout("cadiz", 30000).houses.length > portLayout("cadiz", 5000).houses.length);
});
test("bigger towns get typed buildings by district; small ones stay plain houses", () => {
  const typesOf = (L) => L.houses.filter((h) => h.type !== "house").map((h) => [h.type, h.row]);
  const big = typesOf(portLayout("cadiz", 30000)), small = typesOf(portLayout("cadiz", 3000));
  assert.deepEqual(big.map((x) => x[0]).sort(), ["chapel", "inn", "smithy"]);
  assert.deepEqual(Object.fromEntries(big), { chapel: 3, inn: 0, smithy: 1 }); // artisan quarter by the quay, chapel on the top row
  assert.equal(small.length, 0);
  assert.deepEqual(typesOf(portLayout("cadiz", 30000)), big); // same city, same layout
});
test("houses stand on the hillside behind the building row, with sane sizes", () => {
  const L = portLayout("sevilla", 20000);
  for (const h of L.houses) { assert.ok(h.z < FRONT_Z - 5); assert.ok(h.w >= 4 && h.h >= 3 && h.h < 5); assert.ok(Math.abs(h.x) < 36); assert.equal(h.y, slopeY(h.z)); }
  assert.ok(slopeY(-45) > slopeY(-19) && slopeY(-9) === QUAY_TOP);
});
test("waves are small and move with time", () => {
  assert.ok(Math.abs(waveHeight(3, 4, 0)) <= 0.15);
  assert.notEqual(waveHeight(3, 4, 0), waveHeight(3, 4, 1));
});
test("sky is darker and redder at the edges of the day than at noon, and always valid colours", () => {
  const dawn = skyFor(0), noon = skyFor(0.5), dusk = skyFor(1);
  assert.ok(noon.sunPower > dawn.sunPower && noon.sunHeight > dusk.sunHeight);
  assert.ok(dawn.sky[0] > dawn.sky[2] && noon.sky[2] > noon.sky[0]);
  for (const t of [-1, 0, 0.3, 0.5, 1, 5]) for (const c of [...skyFor(t).sky, ...skyFor(t).sun]) assert.ok(Number.isInteger(c) && c >= 0 && c <= 255);
});
import { BUILDINGS, tabForBuilding, buildingOf, portLayout as pl, FRONT_Z, slopeY, QUAY_TOP, cameraPose, CAMERA } from "../src/view3d/port3d.mjs";
test("every building opens a real game panel and unknown ids open nothing", () => {
  assert.deepEqual(BUILDINGS.map((b) => b.tab).sort(), ["bank", "market", "tavern", "yard"]);
  assert.equal(tabForBuilding("shipyard"), "yard"); assert.equal(tabForBuilding("market"), "market");
  assert.equal(tabForBuilding("warehouse"), "store"); // the owned warehouse opens the store panel
  for (const bad of ["", "house", "__proto__", "constructor", undefined, null]) assert.equal(tabForBuilding(bad), null);
});
test("a hit part resolves to its building by walking up the parents", () => {
  const g = { userData: { building: "tavern" } }, part = { userData: {}, parent: { userData: {}, parent: g } };
  assert.equal(buildingOf(part), "tavern"); assert.equal(buildingOf({ userData: {}, parent: null }), null);
});
test("building plots are 2 m apart even at level 3 and never overlap houses", () => {
  const sorted = [...BUILDINGS].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].x - sorted[i].w / 2 - (sorted[i - 1].x + sorted[i - 1].w / 2) >= 2, sorted[i].id);
  for (const id of ["cadiz", "lisboa", "sevilla"]) for (const pop of [3000, 12000, 40000]) for (const h of pl(id, pop).houses) for (const b of BUILDINGS) assert.ok(!(Math.abs(h.x - b.x) < (b.w + h.w) / 2 && h.z > FRONT_Z - b.d - h.d / 2), `${id} ${pop} ${b.id}`);
});
test("camera pose follows the guide: FOV 42, zoom and yaw are clamped", () => {
  assert.equal(CAMERA.fov, 42);
  const a = cameraPose(1, 0); assert.deepEqual([a.x, a.y, a.z], [0, 22, 42]);
  const far = cameraPose(5, 0), near = cameraPose(0.01, 0); assert.ok(far.y <= 9 + 13 * 1.3 + 1e-9 && near.y >= 9 + 13 * 0.7 - 1e-9);
  const y1 = cameraPose(1, 9), y2 = cameraPose(1, CAMERA.yawMax); assert.ok(Math.abs(y1.x - y2.x) < 1e-9);
});
test("a ray at a building picks it, a ray at the sky picks nothing", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene, pickBuilding } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 12000, ships: 0 });
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200); cam.position.set(-22, 12, 25); cam.lookAt(-22, 4.5, -14); cam.updateMatrixWorld(); scene.updateMatrixWorld(true);
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0), "shipyard");
  assert.equal(pickBuilding(THREE, scene, cam, 0, 0.95), null);
});
import { buildingLevel } from "../src/view3d/port3d.mjs";
test("building level grows with city size, keeps upgrades and stays in 1..3", () => {
  assert.deepEqual([3000, 12000, 40000].map((p) => buildingLevel("market", p)), [1, 2, 3]);
  assert.equal(buildingLevel("market", 3000, { market: 3 }), 3); assert.equal(buildingLevel("market", 40000, { market: 1 }), 3);
  for (const bad of [{ market: 99 }, { market: -2 }, { market: "x" }, null, undefined]) assert.ok(buildingLevel("market", 3000, bad) >= 1 && buildingLevel("market", 3000, bad) <= 3);
});
test("every level builds a clickable building", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene } = await import("../src/view3d/port3d.mjs");
  for (const pop of [3000, 12000, 40000]) { const { scene } = buildPortScene(THREE, { id: "cadiz", pop, ships: 0 }); const bs = scene.children.filter((c) => c.userData.building && !String(c.userData.building).startsWith("town:")); assert.equal(bs.length, 4); for (const b of bs) assert.equal(b.userData.level, buildingLevel(b.userData.building, pop)); }
});
test("the largest port stays far inside the draw-call budget (150, shadows included)", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "lisboa", pop: 50000, ships: 3, warehouse: true, upgrades: { market: 3, tavern: 3, bank: 3, shipyard: 3 } });
  assert.equal(scene.getObjectByName("warehouse")?.userData.building, "warehouse"); // named and clickable like the quay buildings
  let meshes = 0, tris = 0; scene.traverse((o) => { if (o.isMesh) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  assert.ok(meshes * 2 <= 150, "meshes " + meshes); assert.ok(tris < 150000, "triangles " + tris);
});
test("the market is unmistakable in both styles and keeps opening the market panel", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene, makeHarborCrane } = await import("../src/view3d/port3d.mjs");
  assert.equal(tabForBuilding("market"), "market");
  const boxOf = (g) => { const b = new THREE.Box3().setFromObject(g); return { h: b.max.y - b.min.y }; };
  const crane = buildPortScene(THREE, { id: "cadiz", pop: 30000, ships: 0, marketStyle: "crane" }).scene.getObjectByName("building:market");
  assert.ok(boxOf(crane).h > 7, "crane marks the market from the sea"); // mast plus jib over the awning hall
  const lonja = buildPortScene(THREE, { id: "cadiz", pop: 30000, ships: 0, marketStyle: "lonja" }).scene.getObjectByName("building:market");
  const tris = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) { const geo = o.geometry; n += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; } }); return n; };
  assert.ok(lonja.children.some((c) => c.name === "fused") && Math.abs(tris(lonja) - tris(crane)) > 200, "lonja reads as an arcade, not the crane hall"); // the two styles are distinct models
  assert.ok(boxOf(makeHarborCrane(THREE)).h > 6.5);
});
test("typed town buildings are pickable, fused on their own and keep the forge glowing", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 30000, ships: 0 });
  const tb = scene.children.filter((c) => String(c.userData.building || "").startsWith("town:"));
  assert.deepEqual(tb.map((g) => g.userData.building).sort(), ["town:chapel", "town:inn", "town:smithy"]);
  for (const g of tb) assert.ok(g.children.some((c) => c.name === "fused"), g.name);
  assert.ok(scene.getObjectByName("town:smithy").children.some((c) => c.isMesh && c.material.emissiveIntensity > 0)); // the forge glow stays apart
});
test("fusing keeps the buildings clickable and keeps emissive lights apart", async () => {
  const THREE = await import("../web/vendor/three.module.min.js"), { buildPortScene, fuseStatic } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 40000, ships: 0 });
  const t = scene.children.find((c) => c.userData.building === "tavern"); assert.ok(t.children.some((c) => c.name === "fused")); assert.ok(t.children.some((c) => c.isMesh && c.material.emissiveIntensity > 0));
  assert.equal(fuseStatic(THREE, new THREE.Group()), 0);
});

test("water waves run on the GPU: shader hook and time uniform are wired", async () => {
  const { gpuWaves } = await import("../src/view3d/port3d.mjs");
  const water = { material: { onBeforeCompile: null, needsUpdate: false }, userData: {} };
  gpuWaves(water);
  assert.equal(typeof water.material.onBeforeCompile, "function");
  assert.equal(water.material.needsUpdate, true);
  assert.ok(water.userData.time && water.userData.time.value === 0);
  // the injected GLSL matches the pure waveHeight maths (same sines, same amplitudes)
  const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>", fragmentShader: "#include <color_fragment>" };
  water.material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes("uniform float uTime"));
  assert.ok(shader.vertexShader.includes("/ 7.0 + uTime * 1.2) * 0.09"));
  assert.ok(shader.vertexShader.includes("/ 11.0 + uTime * 0.9) * 0.06"));
  assert.equal(shader.uniforms.uTime, water.userData.time);
});

test("environment stops: zenith darker than horizon, colours in range", async () => {
  const { envStops, skyFor } = await import("../src/view3d/port3d.mjs");
  for (const tod of [0, 0.25, 0.5, 0.75, 1]) {
    const st = envStops(skyFor(tod));
    for (const key of ["zenith", "horizon", "ground", "deep"]) {
      assert.equal(st[key].length, 3);
      for (const v of st[key]) assert.ok(Number.isInteger(v) && v >= 0 && v <= 255, `${key} channel ${v} at tod ${tod}`);
    }
    assert.ok(st.zenith[2] < st.horizon[2] || st.zenith[0] < st.horizon[0], "zenith dimmer than horizon");
  }
});

test("water foam: quay-edge band and darkening are injected into the fragment shader", async () => {
  const { gpuWaves } = await import("../src/view3d/port3d.mjs");
  const water = { material: { onBeforeCompile: null, needsUpdate: false }, userData: {} };
  gpuWaves(water, { quayEdgeZ: -2 });
  const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>", fragmentShader: "#include <color_fragment>" };
  water.material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes("vWorldPos"));
  assert.ok(shader.fragmentShader.includes("QUAY_EDGE_Z = -2.0"));
  assert.ok(shader.fragmentShader.includes("(1.0 - smoothstep(0.0, 2.4, dQ))"), "foam band falls off seaward (edge0 < edge1, defined GLSL)");
  assert.ok(shader.fragmentShader.includes("0.93, 0.95, 0.94"), "foam colour");
  assert.ok(shader.fragmentShader.includes("uTime"), "foam breathes with time");
});

test("fuseStatic splits textured and plain meshes into one fused mesh per kind", async () => {
  const { fuseStatic } = await import("../src/view3d/port3d.mjs");
  const THREE = await import("../web/vendor/three.module.min.js");
  const root = new THREE.Group();
  const plain = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  const tiled = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x9b4a2b }));
  tiled.material.userData.texKind = "tiles@0.35";
  root.add(plain, tiled);
  const fused = fuseStatic(THREE, root);
  assert.equal(fused, 2);
  const kinds = root.children.map((o) => o.name).filter((n) => n === "fused" || n?.startsWith("fused:")).sort();
  assert.deepEqual(kinds, ["fused", "fused:tiles@0.35"]);
  const tiledMesh = root.children.find((o) => o.name === "fused:tiles@0.35");
  assert.ok(tiledMesh.geometry.attributes.uv, "fused geometry keeps UVs");
});

test("boxUVmetres scales box UVs to metres per face", async () => {
  const { boxUVmetres } = await import("../src/view3d/port3d.mjs");
  const THREE = await import("../web/vendor/three.module.min.js");
  const g = boxUVmetres(new THREE.BoxGeometry(10, 2, 4), 10, 2, 4);
  const uv = g.attributes.uv;
  let maxU = 0, maxV = 0;
  for (let i = 0; i < uv.count; i++) { maxU = Math.max(maxU, uv.getX(i)); maxV = Math.max(maxV, uv.getY(i)); }
  assert.ok(maxU >= 4 && maxV >= 2, `uv span ${maxU}x${maxV} should reach the face metres`);
});

test("textures are null in Node (no DOM) and kinds are marked on materials", async () => {
  const { makeTexture } = await import("../src/view3d/textures.mjs");
  assert.equal(makeTexture(null, "tiles"), null);
  assert.equal(makeTexture(null, "unknown"), null);
});

test("flags wave on the GPU, survive fusing and share the scene time", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { buildPortScene, makeFlag, advanceTime } = await import("../src/view3d/port3d.mjs");
  const f = makeFlag(THREE, { len: 1.2 });
  assert.equal(f.userData.keep, true, "flags must not be fused (they animate)");
  const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>" };
  f.material.onBeforeCompile(shader);
  assert.ok(shader.vertexShader.includes("uniform float uTime") && shader.vertexShader.includes("FLAG_LEN = 1.20"));
  assert.equal(shader.uniforms.uTime, f.userData.time);
  const { scene, water } = buildPortScene(THREE, { id: "cadiz", pop: 30000, ships: 3 });
  const flags = []; scene.traverse((o) => { if (o.name === "flag") flags.push(o); });
  assert.ok(flags.length >= 4, "pennants on 3 masts minimum plus the tower banner, got " + flags.length);
  advanceTime(scene, 3.5);
  assert.equal(water.userData.time.value, 3.5);
  for (const fl of flags) assert.equal(fl.userData.time.value, 3.5);
});

test("the visible sun disc sits along the light direction and is DOM-gated", async () => {
  const { sunPose, makeSunDisc, skyFor } = await import("../src/view3d/port3d.mjs");
  for (const tod of [0, 0.25, 0.5, 0.75, 1]) {
    const [x, y, z] = sunPose(skyFor(tod));
    assert.ok(Math.abs(Math.hypot(x, y, z) - 350) < 1e-6, "sun disc stays at 350 m, inside the camera far plane");
    assert.ok(y > 0, "disc above the horizon at tod " + tod);
    assert.ok(x < 0 && z > 0, "disc on the light side (west, seaward)");
  }
  assert.equal(makeSunDisc(null, skyFor(0.5)), null, "no DOM in Node, no disc");
});

test("the sky dome grades horizon to zenith and stays out of the fusing", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { buildPortScene, makeSkyDome, skyGradient, skyFor, envStops } = await import("../src/view3d/port3d.mjs");
  const st = envStops(skyFor(0.5));
  assert.deepEqual(skyGradient(st, 0.5), st.zenith, "overhead is the zenith colour");
  const mid = skyGradient(st, 0.1);
  assert.ok(Math.abs(mid[2] - (st.horizon[2] + st.zenith[2]) / 2) < 60, "low sky sits between horizon and zenith");
  const dome = makeSkyDome(THREE, skyFor(0.5));
  assert.equal(dome.name, "sky");
  assert.ok(dome.geometry.attributes.color, "vertex colours carry the gradient");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 30000, ships: 1 });
  assert.ok(scene.getObjectByName("sky"), "the dome is in the scene");
  assert.ok(!scene.getObjectByName("town")?.getObjectByName("sky"), "the dome is not fused into the town");
});

test("house family module: levels, construction state and palette stay in family", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { makeHouse } = await import("../src/view3d/buildings/house.mjs");
  const h1 = makeHouse(THREE, { tint: 0.2 }), h3 = makeHouse(THREE, { tint: 0.2, level: 3 });
  const tall = (g) => { const b = new THREE.Box3().setFromObject(g); return b.max.y - b.min.y; };
  assert.ok(tall(h3) > tall(h1) + 1, "level 3 is taller than level 1");
  const con = makeHouse(THREE, { tint: 0.2, state: "construction" });
  let walls = 0, posts = 0;
  con.traverse((o) => { if (o.isMesh) { const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); if (s.x > 3 && s.y > 3) walls++; if (s.x < 0.3 && s.y > 3) posts++; } });
  assert.equal(walls, 0, "under construction there are no walls yet");
  assert.ok(posts >= 4, "the timber skeleton stands first");
  assert.equal(con.userData.buildingType, "house");
});

test("market family module: two distinct styles, construction frame and crow-step gable", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { makeMarket } = await import("../src/view3d/buildings/market.mjs");
  const tris = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) { const geo = o.geometry; n += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; } }); return n; };
  const lonja = makeMarket(THREE, { style: "lonja", level: 2 }), crane = makeMarket(THREE, { style: "crane", level: 2 });
  assert.ok(Math.abs(tris(lonja) - tris(crane)) > 200, "the two styles stay unmistakable");
  const tall = (g) => { const b = new THREE.Box3().setFromObject(g); return b.max.y; };
  assert.ok(tall(makeMarket(THREE, { level: 3 })) > tall(makeMarket(THREE, { level: 1 })), "level grows the hall");
  const con = makeMarket(THREE, { state: "construction" });
  let walls = 0; con.traverse((o) => { if (o.isMesh) { const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); if (s.x > 10 && s.y > 3) walls++; } });
  assert.equal(walls, 0, "under construction the hall is not walled yet");
  // crow-step gable: a staircase of small stones climbing the gable face
  lonja.updateMatrixWorld(true);
  let steps = 0; lonja.traverse((o) => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); if (s.x < 0.8 && s.y < 0.9 && s.z < 0.6 && c.y > 5) steps++; } });
  assert.ok(steps >= 8, "crow steps climb the gable, got " + steps);
});

test("tavern family module: jetty upper floor at level 2, chimney and second sign at level 3, construction frame", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { makeTavern, makeInn } = await import("../src/view3d/buildings/tavern.mjs");
  const tall = (g) => { g.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g).max.y; };
  assert.ok(tall(makeTavern(THREE, { level: 3 })) > tall(makeTavern(THREE, { level: 1 })) + 1.5, "level 3 raises the tavern");
  const t2 = makeTavern(THREE, { level: 2 }); t2.updateMatrixWorld(true);
  let jetty = false; t2.traverse((o) => { if (o.isMesh) { const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); if (s.x > 8 && s.y > 2 && s.y < 3.5) jetty = true; } });
  assert.ok(jetty, "level 2 has the overhanging timber-framed floor");
  const con = makeTavern(THREE, { state: "construction" });
  let walls = 0; con.updateMatrixWorld(true); con.traverse((o) => { if (o.isMesh) { const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); if (s.x > 7 && s.y > 3) walls++; } });
  assert.equal(walls, 0, "construction raises no walls");
  const inn = makeInn(THREE, {});
  assert.equal(inn.userData.buildingType, "inn");
  let glow = 0; makeTavern(THREE, { level: 3 }).traverse((o) => { if (o.isMesh && o.material.emissiveIntensity > 0) glow++; });
  assert.ok(glow >= 2, "level 3 windows glow at night");
});

test("scene check: quay buildings stand behind the front line (Vida fail on #187/#188)", async () => {
  const THREE = await import("../web/vendor/three.module.min.js");
  const { buildPortScene, FRONT_Z } = await import("../src/view3d/port3d.mjs");
  const { scene } = buildPortScene(THREE, { id: "cadiz", pop: 12000, ships: 0 });
  scene.updateMatrixWorld(true);
  let checked = 0;
  for (const o of scene.children) {
    if (typeof o.userData?.building !== "string" || o.userData.building.startsWith("town:")) continue;
    // A building mounted at the wrong z shifts its WHOLE body: its back edge ends up on the quay walk
    // (the #187/#188 regression: market back at -7.3, tavern back at -6.3 with FRONT_Z=-9). By design the
    // body reaches metres behind the line; only props (crane jib, slipway, steps) cross it forward.
    const box = new THREE.Box3().setFromObject(o);
    checked++;
    assert.ok(box.min.z <= FRONT_Z - 2, `${o.name}: back edge ${box.min.z.toFixed(2)} does not reach behind the front line ${FRONT_Z} (mounted at the wrong z?)`);
  }
  assert.ok(checked >= 4, "all quay buildings checked");
});
