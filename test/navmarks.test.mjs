import test from "node:test";
import assert from "node:assert/strict";
import { TRAIL_LEN, TRAIL_STEP, trailSvg, headingArrowSvg, routeKind, routeLineSvg, ROUTE_STYLE } from "../src/view/navmarks.mjs";
import { pushTrail } from "../src/view/ships.mjs";

const opacities = (svg) => [...svg.matchAll(/fill-opacity="([\d.]+)"/g)].map((m) => +m[1]);

test("trail keeps six positions and draws the five behind the ship, fading with age", () => {
  const tr = {};
  for (let i = 0; i < 20; i++) pushTrail(tr, 1, { x: i * 10, y: 0 }, TRAIL_LEN, TRAIL_STEP);
  assert.equal(tr[1].length, 6);
  const svg = trailSvg(tr[1]);
  assert.equal((svg.match(/<circle/g) || []).length, 5);
  const o = opacities(svg);
  for (let i = 1; i < o.length; i++) assert.ok(o[i] > o[i - 1], "older dots are fainter");
  assert.ok(!/#fff"/i.test(svg), "no white marks on the pale chart");
});
test("trail needs two positions and only uses the last six", () => {
  assert.equal(trailSvg([]), "");
  assert.equal(trailSvg([{ x: 0, y: 0 }]), "");
  const many = Array.from({ length: 12 }, (_, i) => ({ x: i, y: 0 }));
  assert.equal((trailSvg(many).match(/<circle/g) || []).length, TRAIL_LEN - 1);
  assert.ok(!trailSvg(many).includes('cx="0"'), "positions older than six are dropped");
});
test("trail dots follow marker scale", () => {
  const pts = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
  const r = (svg) => +svg.match(/ r="([\d.]+)"/)[1];
  assert.ok(r(trailSvg(pts, 0.5)) < r(trailSvg(pts, 1)));
});
test("heading arrow points east at 0 degrees and ignores the pointer", () => {
  const svg = headingArrowSvg();
  assert.match(svg, /class="heading"/);
  assert.match(svg, /pointer-events="none"/);
  assert.match(svg, /L24 0/); // tip on +x, ahead of the bow
});
test("automatic trade routes are drawn thin and distinct from manual orders", () => {
  assert.equal(routeKind({ route: { a: "cadiz", b: "tanger" } }), "auto");
  assert.equal(routeKind({}), "manual");
  assert.equal(routeKind(null), "manual");
  assert.ok(ROUTE_STYLE.auto.width < ROUTE_STYLE.manual.width);
  assert.notEqual(ROUTE_STYLE.auto.stroke, ROUTE_STYLE.manual.stroke);
  assert.notEqual(ROUTE_STYLE.auto.dash, ROUTE_STYLE.manual.dash);
  const pts = [[0, 0], [10.04, 5], [20, 5]];
  assert.match(routeLineSvg(pts, "auto"), /data-route="auto"[^>]*stroke-width="1.25"/);
  assert.match(routeLineSvg(pts, "manual"), /data-route="manual"[^>]*stroke-width="3"/);
  assert.match(routeLineSvg(pts, "auto"), /points="0,0 10,5 20,5"/);
  assert.equal(routeLineSvg([[0, 0]], "auto"), "");
  assert.match(routeLineSvg(pts, "bogus"), /data-route="bogus"[^>]*stroke-width="3"/); // unknown kind falls back to manual style
});

import {remainingRoute} from '../src/view/navmarks.mjs';
import {haversineKm} from '../tools/geo.mjs';
test('remaining route never redraws passed waypoints behind the ship',()=>{
 const world={nodes:{a:{lat:0,lon:0},b:{lat:0,lon:1},c:{lat:0,lon:2}}},km=2*haversineKm(world.nodes.a,world.nodes.b);
 const ship={voyage:{path:['a','b','c'],km,totalTicks:4,ticksLeft:1}};
 assert.deepEqual(remainingRoute(world,ship),[world.nodes.c]);
 assert.deepEqual(remainingRoute(world,{}),[]);
});
