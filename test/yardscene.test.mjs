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

test("the hull under construction follows the class and the build phases", () => {
  const early = { type: "nao", readyDay: 100 }, late = { type: "nao", readyDay: 12 }, day = 10;
  const e = yardSceneSvg({ orders: [early], day }), l = yardSceneSvg({ orders: [late], day });
  assert.ok(l.length > e.length, "late-phase hull draws masts and planking");
  const barca = yardSceneSvg({ orders: [{ type: "barca", readyDay: 12 }], day });
  assert.notEqual(l, barca, "class changes the slipway hull");
});

test("yard scene output is well-formed markup", () => {
  const svg = yardSceneSvg({ orders: [{ at: "cadiz", type: "cog", readyDay: 30, total: 14 }], day: 20, tod: 0.5, emptyLabel: "x" });
  for (const m of svg.matchAll(/<[^<>]*>/g))
    assert.ok(/^<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>$/.test(m[0]), `well-formed tag, got: ${m[0].slice(0, 90)}`);
});
