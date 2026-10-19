import { test } from "node:test";
import assert from "node:assert/strict";
import { orderProgress, shipIconSvg, yardSceneSvg } from "../src/view/yardscene.mjs";
import { SHIP_TYPES } from "../src/sim/trade.mjs";

test("orderProgress runs from 0 to 1 over the build time and is clamped", () => {
  const bd = SHIP_TYPES.cog.buildDays;
  assert.equal(orderProgress({ type: "cog", readyDay: 10 + bd }, 10), 0);
  assert.equal(orderProgress({ type: "cog", readyDay: 10 }, 10), 1);
  assert.equal(orderProgress({ type: "cog", readyDay: 10 }, 99), 1);
  assert.equal(orderProgress({ type: "cog", readyDay: 500 }, 0), 0);
  const mid = orderProgress({ type: "cog", readyDay: 10 + Math.ceil(bd / 2) }, 10);
  assert.ok(mid > 0 && mid < 1);
});
test("ship icons exist for every class and are bigger for bigger classes", () => {
  for (const k of Object.keys(SHIP_TYPES)) assert.match(shipIconSvg(k), /^<svg/);
  assert.ok(shipIconSvg("nao").length > shipIconSvg("barca").length);
});
test("yard scene is valid-looking SVG with one cradle per order, max 4, and handles none", () => {
  assert.match(yardSceneSvg({ orders: [] }), /<\/svg>$/);
  const o = (t) => ({ type: t, readyDay: 20 });
  const many = yardSceneSvg({ orders: [o("cog"), o("nao"), o("barca"), o("cog"), o("nao")], day: 5 });
  assert.equal((many.match(/fill="#5a8a3a"/g) || []).length, 4);
});
