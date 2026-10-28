import test from "node:test";
import assert from "node:assert/strict";
import { loadWorld } from "../src/sim/world.mjs";
import { tradeCardLayout, tradeBadgePorts, mapLabelPlacement } from "../src/view/historicalmap.mjs";
import { markerScale, labelFontSize } from "../src/view/camera.mjs";

// Regression pin for the trade-card/label collision fixed alongside this test: red before
// the fix (audited head 78687e6), green with it. Kept in CI.
// Visually verified defect (audit 2026-10-23, headless captures on 78687e6): at zoom 1 the
// Argel trade card clips the tail of the "Mostaganem" port label. Root cause: the label
// obstacles inside tradeCardLayout (src/view/historicalmap.mjs) use a fixed 7px/char width,
// unscaled placement offsets and a fixed 17px height, while the real DOM label follows the
// model audited in maplabels.test.mjs (0.571*labelFontSize per char, offsets scaled by
// markerScale). The pin mirrors the DOM label model, so green means the layout protects the
// label the player actually sees. Only this pair is pinned: a general no-overlap sweep with
// the conservative label metric produces near-miss positives (barcelona/sansebastian,
// valencia/tarragona) that the render does not confirm; further cases need visual proof first.
const world = loadWorld();
const nodes = Object.values(world.nodes);
const lons = nodes.map((n) => n.lon), lats = nodes.map((n) => n.lat);
const [x0, x1, y0, y1] = [Math.min(...lons) - 1, Math.max(...lons) + 1, Math.min(...lats) - 1, Math.max(...lats) + 1];
const sc = 800 / (x1 - x0), VH = Math.round((y1 - y0) * sc * 1.25);
const X = (lon) => (lon - x0) * sc, Y = (lat) => (y1 - lat) * sc * 1.25;
const ports = world.cities;
const bounds = { width: 800, height: VH }; // same bounds as the web/main.mjs historicalLayer call

// DOM-faithful label box: same model as maplabels.test.mjs (0.571*fs per char).
const labelBox = (p, zoom) => {
  const fs = labelFontSize(zoom), k = markerScale(zoom), l = mapLabelPlacement(p.id);
  const w = p.name.length * fs * 0.571 * k, h = 1.214 * fs * k;
  const tx = X(p.lon) + k * l.x, ty = Y(p.lat) + k * l.y;
  return { x: tx - (l.anchor === "end" ? w : l.anchor === "middle" ? w / 2 : 0), y: ty - 13 * (fs / 14) * k, w, h };
};

test("Argel trade card does not cover the Mostaganem label at zoom 1", () => {
  const zoom = 1;
  const cards = tradeCardLayout(tradeBadgePorts(ports, zoom), X, Y, bounds, zoom, ports);
  const argel = cards.find((c) => c.port.id === "argel");
  assert.ok(argel, "argel trade card present at zoom 1");
  const lb = labelBox(ports.find((p) => p.id === "mostaganem"), zoom);
  const b = argel.box;
  assert.ok(
    !(b.x < lb.x + lb.w && b.x + b.w > lb.x && b.y < lb.y + lb.h && b.y + b.h > lb.y),
    `argel card ${JSON.stringify(b)} covers mostaganem label ${JSON.stringify(lb)}`,
  );
});

test('card cache follows actual label offsets and obstacles, not only port data',()=>{
 const ps=[{id:'p',name:'Port',lon:100,lat:100,makes:['salt'],needs:[]}],x=v=>v,y=v=>v,bounds={width:400,height:300};
 const left=tradeCardLayout(ps,x,y,bounds,1,ps,()=>({x:14,y:4,anchor:'start'}));
 const right=tradeCardLayout(ps,x,y,bounds,1,ps,()=>({x:-14,y:4,anchor:'end'}));
 assert.notStrictEqual(left,right);
 assert.equal(tradeCardLayout(ps,x,y,bounds,1,ps,()=>({x:-14,y:4,anchor:'end'})),right);
});
