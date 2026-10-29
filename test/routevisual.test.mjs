import {routeKind,remainingRoute} from '../src/view/navmarks.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { routeStyle, routeStrokeAttrs, routeLineSvg, routeLegendHtml } from "../src/view/routevisual.mjs";

test("route hierarchy uses opacity, weight and pattern; red is reserved for invalid", () => {
  const network = routeStyle("network"), active = routeStyle("active");
  assert.equal(network.stroke, "#514b3f");
  assert.ok(network.opacity < 0.3);
  assert.ok(network.width < active.width);
  assert.equal(active.stroke, "#205c53");
  assert.equal(active.opacity, 1);
  assert.equal(active.dash, "none");
  assert.equal(routeStyle("preview").stroke, active.stroke);
  assert.notEqual(routeStyle("preview").dash, active.dash);
  assert.equal(routeStyle("automatic").stroke, active.stroke);
  assert.ok(routeStyle("automatic").width < active.width);
  assert.equal(routeStyle("automatic").dash, "none");
  assert.equal(routeStyle("invalid").stroke, "#b3261e");
  for (const kind of ["network", "active", "automatic", "preview"]) {
    assert.notEqual(routeStyle(kind).stroke, routeStyle("invalid").stroke);
  }
});

test("styles cannot be changed by consumers or inherited property names", () => {
  assert.throws(() => { routeStyle("active").stroke = "red"; }, TypeError);
  for (const kind of ["toString", "__proto__", '<script>', "missing"]) {
    assert.throws(() => routeStrokeAttrs(kind), RangeError);
  }
});

test("route SVG escapes its points attribute and preserves ordinary geometry", () => {
  assert.match(routeLineSvg("1,2 3,4", "active"), /points="1,2 3,4"/);
  const html = routeLineSvg('" onload="<script>&\'', "preview");
  assert.ok(html.includes('points="&quot; onload=&quot;&lt;script&gt;&amp;&#39;"'));
  assert.equal((html.match(/<polyline/g) ?? []).length, 1);
  assert.ok(!html.includes('<script>'));
  assert.match(html, /pointer-events="none"/);
  assert.match(html, /vector-effect="non-scaling-stroke"/);
});

test("ES/EN legends describe every style in accessible text with decorative swatches", () => {
  for (const [lang, title, labels] of [
    ["es", "Rutas del mapa", ["Red tenue", "verde continuo", "verde fino", "verde discontinuo", "No válida: rojo"]],
    ["en", "Map routes", ["Faint network", "solid green", "thin green", "dashed green", "Invalid: red"]],
  ]) {
    const html = routeLegendHtml(lang);
    assert.ok(html.includes(`<section aria-label="${title}"`));
    assert.equal((html.match(/<li>/g) ?? []).length, 5);
    assert.equal((html.match(/aria-hidden="true" focusable="false"/g) ?? []).length, 5);
    for (const label of labels) assert.ok(html.includes(label), label);
    assert.match(html, /<ul /);
    assert.match(html, /min-width:0;max-width:100%/);
    assert.match(html, /overflow-wrap:anywhere/);
    assert.ok(!/position:|white-space:nowrap|<style/.test(html));
  }
  assert.equal(routeLegendHtml('<img src=x onerror="x">'), routeLegendHtml("es"));
  assert.equal(routeLegendHtml("__proto__"), routeLegendHtml("es"));
});

// Exercise the actual main rendering fragment without booting the game or a browser.
const main = readFileSync(new URL("../web/main.mjs", import.meta.url), "utf8");
const start = main.indexOf('  let m = chartOrnamentSvg(');
const end = main.indexOf("  const historical = historicalLayer", start);
assert.ok(start >= 0 && end > start);
const fragment = main.slice(start, end) + "\nm;";
function renderRoutes({ voyage = null, automatic = false, estimate = null } = {}) {
  const world = { nodes: { a: { lon: 1, lat: 2 }, b: { lon: 3, lat: 4 }, hidden: { lon: 5, lat: 6 } }, lanes: [["a", "b"], ["a", "hidden"]] };
  const s = { at: "a", voyage, route: automatic ? { v: 2 } : null };
  const before = JSON.stringify({ world, s, estimate });
  const html = runInNewContext(fragment, {
    world, s, target: "b", g: {ships:[s]}, cityIdSet: new Set(["a", "b", "hidden"]),
    isDiscovered: (_, id) => id !== "hidden", X: x => x, Y: y => y,
    shipPosition: () => ({ lon: 1.5, lat: 2.5 }), tickAcc: 0, tickDurationMs: () => 1,
    travelEstimate: () => estimate, legWindEst: () => 1,
    routeKind,remainingRoute,chartLabels:()=>new Map(),routeStrokeAttrs, routeLineSvg, chartOrnamentSvg:()=>"", location:{search:""}, URLSearchParams, mapMode:"geographic", lang:"es",
  });
  assert.equal(JSON.stringify({ world, s, estimate }), before, "rendering must not mutate game inputs");
  assert.equal((html.match(/<line /g) ?? []).length, 1, "hidden lanes stay hidden");
  assert.ok(html.includes(routeStrokeAttrs("network")));
  return html;
}

test("main renders selected voyages solid, automatic voyages thinner, with remaining waypoints and main styles", () => {
  const voyage = { path: ["a","b"], totalTicks:10,ticksLeft:10,km:1 };
  assert.ok(renderRoutes({ voyage }).includes(routeLineSvg("1.5,2.5 3,4", "active")));
  assert.ok(renderRoutes({ voyage, automatic: true }).includes(routeLineSvg("1.5,2.5 3,4", "automatic")));
});

test("main renders only valid planned geometry, dashed green", () => {
  const html = renderRoutes({ estimate: { ok: true, path: ["a", "b"] } });
  assert.ok(html.includes(routeLineSvg("1,2 3,4", "preview")));
  assert.ok(!renderRoutes({ estimate: { ok: false, reason: "no route" } }).includes("<polyline"));
  assert.ok(!renderRoutes().includes("<polyline"));
});

test("main destination ring reserves red for a rejected destination", () => {
  const expression = main.match(/stroke="\$\{(!explored \? "#806b50"[^}]+)\}"/)?.[1];
  assert.ok(expression, "destination ring expression must exist");
  const ring = (est, explored = true, id = "b") => runInNewContext(expression, {
    est, explored, c: { id }, target: "b", routeStyle,
  });
  assert.equal(ring({ ok: true }), routeStyle("preview").stroke);
  assert.equal(ring({ ok: false, reason: "no route" }), routeStyle("invalid").stroke);
  assert.equal(ring({ ok: false, reason: "crew" }), routeStyle("invalid").stroke);
  assert.equal(ring({ ok: false, reason: "already here" }), routeStyle("preview").stroke);
  assert.equal(ring(null), routeStyle("preview").stroke);
  assert.equal(ring({ ok: false, reason: "no route" }, false), "#806b50");
  assert.equal(ring({ ok: true }, true, "a"), "none");
});
