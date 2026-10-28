import test from "node:test";
import assert from "node:assert/strict";
import { newCamera, zoomAt, viewBox } from "../src/view/camera.mjs";
import { newFollow, toggleFollow, stopFollow, isFollowing, followAfterInput, pruneFollow, followStep, followButtonHtml, followText } from "../src/view/follow.mjs";
import { loadWorld } from "../src/sim/world.mjs";
import { newGame } from "../src/game/game.mjs";
import { serialize, deserialize } from "../src/game/gamesave.mjs";

const centre = (c) => { const [x, y, w, h] = viewBox(c); return [x + w / 2, y + h / 2]; };

test("toggle is per ship: on, switch to another ship, off", () => {
  const f = newFollow();
  assert.equal(toggleFollow(f, 3), true); assert.ok(isFollowing(f, 3));
  assert.equal(toggleFollow(f, 5), true); assert.ok(isFollowing(f, 5)); assert.ok(!isFollowing(f, 3));
  assert.equal(toggleFollow(f, 5), false); assert.equal(f.ship, null);
});
test("dragging, pinching or Esc turns it off; wheel zoom does not", () => {
  for (const input of ["drag", "pinch", "escape"]) { const f = newFollow(); toggleFollow(f, 1); assert.equal(followAfterInput(f, input), true, input); assert.equal(f.ship, null); }
  const f = newFollow(); toggleFollow(f, 1);
  assert.equal(followAfterInput(f, "wheel"), false); assert.ok(isFollowing(f, 1));
  assert.equal(stopFollow(newFollow()), false, "Esc is not consumed when nothing is followed");
});
test("a follow on a ship that is gone is dropped", () => {
  const f = newFollow(); toggleFollow(f, 9);
  pruneFollow(f, [{ id: 1 }, { id: 9 }]); assert.ok(isFollowing(f, 9));
  pruneFollow(f, [{ id: 1 }]); assert.equal(f.ship, null);
});
test("camera glides toward the ship without overshooting and settles on it", () => {
  const c = newCamera(800, 600); zoomAt(c, 4);
  const target = [300, 200]; let prev = Math.hypot(...centre(c).map((v, i) => v - target[i]));
  for (let i = 0; i < 200; i++) { // ~3.2 s of 16 ms frames: the gap halves every 220 ms
    followStep(c, ...target, 16);
    const d = Math.hypot(...centre(c).map((v, i) => v - target[i]));
    assert.ok(d <= prev + 1e-9, "distance never grows"); prev = d;
  }
  assert.deepEqual(centre(c), target);
  assert.equal(followStep(c, ...target, 16), false, "settled: no more movement");
});
test("one half-life closes half the gap; dt 0 does not move", () => {
  const c = newCamera(800, 600); zoomAt(c, 4); // view 200x150 centred at 400,300
  c.x = 300; c.y = 225; // centred at 400,300
  assert.equal(followStep(c, 400, 300, 0), false);
  followStep(c, 440, 300, 220, { halfLifeMs: 220 });
  assert.ok(Math.abs(centre(c)[0] - 420) < 1e-9);
});
test("reduced motion snaps at once; edges stay clamped to the chart", () => {
  const c = newCamera(800, 600); zoomAt(c, 2);
  followStep(c, 500, 400, 16, { reduceMotion: true }); assert.deepEqual(centre(c), [500, 400]);
  followStep(c, 5, 5, 16, { reduceMotion: true }); assert.deepEqual(viewBox(c), [0, 0, 400, 300]);
  const z1 = newCamera(800, 600); followStep(z1, 100, 100, 1000); assert.deepEqual(viewBox(z1), [0, 0, 800, 600]);
});
test("Spanish and English labels", () => {
  assert.match(followButtonHtml("es", false), />Seguir</);
  assert.match(followButtonHtml("es", true), />Dejar de seguir</);
  assert.match(followButtonHtml("en", false), />Follow</);
  assert.match(followButtonHtml("en", true), /aria-pressed="true"[^>]*>Stop following</);
  assert.match(followText("en").hint, /Esc/); assert.match(followText("es").hint, /Esc/);
});
test("following never touches the game or the save", () => {
  const world = loadWorld(), g = newGame(world, "cadiz");
  const before = JSON.stringify(serialize(g, "T", 0));
  const f = newFollow(); toggleFollow(f, g.ships[0].id);
  const c = newCamera(800, 600); zoomAt(c, 3); followStep(c, 200, 200, 100);
  const after = serialize(g, "T", 0);
  assert.equal(JSON.stringify(after), before);
  assert.ok(!("follow" in after.state), "no follow field in the save");
  assert.ok(!("follow" in deserialize(after, world).g));
});

test('double-click reset, minimap/keyboard panning and explicit centering release follow',()=>{
 for(const input of ['dblclick','pan','center']){const f=newFollow();toggleFollow(f,1);assert.equal(followAfterInput(f,input),true);assert.equal(f.ship,null);}
});
