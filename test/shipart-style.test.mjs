import test from "node:test";
import assert from "node:assert/strict";
import * as ships from "../src/view/ships.mjs";

const classes = ["barca", "cog", "caravel", "nao"];
const scales = { barca: .9, cog: 1, caravel: 1.08, nao: 1.18 };
const sailCounts = { barca: 1, cog: 1, caravel: 2, nao: 3 };
// Existing outer hulls are the geometry contract; interior artwork may evolve.
const hulls = {
  barca: "M-8 0 C-7.6 -2.4 -3 -3.6 2 -3 C5 -2.6 6.8 -1.4 8.5 0 C6.8 1.4 5 2.6 2 3 C-3 3.6 -7.6 2.4 -8 0 Z",
  cog: "M-11 0 C-10.5 -3.4 -6 -5.4 0 -5.2 C5 -5 9 -3 12.5 0 C9 3 5 5 0 5.2 C-6 5.4 -10.5 3.4 -11 0 Z",
  caravel: "M-12 0 C-11.5 -2.8 -6 -4.4 0 -4.2 C6 -4 10 -2.2 14.5 0 C10 2.2 6 4 0 4.2 C-6 4.4 -11.5 2.8 -12 0 Z",
  nao: "M-14 0 C-13.5 -4.2 -7 -6.4 0 -6.2 C7 -6 11 -3.4 15 0 C11 3.4 7 6 0 6.2 C-7 6.4 -13.5 4.2 -14 0 Z",
};

test("ship art preserves exports, east-facing hulls, class scales and sail plans", () => {
  assert.deepEqual(Object.keys(ships).sort(), ["headingDeg", "pushTrail", "shipSvg", "wakeSvg"]);
  for (const type of classes) {
    const svg = ships.shipSvg(type);
    assert.ok(svg.startsWith('<g class="ship" transform="rotate(0) scale(1.7)">'), type);
    assert.equal(svg.match(/<path d="([^"]+)"/)[1], hulls[type], type);
    assert.equal(svg.match(/<g transform="scale\(([\d.]+)\)">/)?.[1] ?? "1", String(scales[type]));
    assert.equal((svg.match(/fill="#e8e2d0"/g) ?? []).length, sailCounts[type], type);
    assert.match(ships.shipSvg(type, { heading: 137 }), /transform="rotate\(137\) scale\(1.7\)"/);
  }
  assert.equal(ships.shipSvg("unknown"), ships.shipSvg("cog"));
});

test("every class shares city wood, brown outlines, cream canvas and shaded faces", () => {
  for (const type of classes) {
    const rival = ships.shipSvg(type), own = ships.shipSvg(type, { mine: true });
    for (const svg of [rival, own]) {
      assert.match(svg, /stroke="#6e4a22" stroke-width="\.9"/);
      assert.match(svg, /fill="#c9a35e"/); // raised deck
      assert.match(svg, /fill="#6e4a22" opacity="\.3"/); // lower hull face
      assert.match(svg, /fill="#b9b09a" opacity="\.6"/); // canvas fold
      assert.doesNotMatch(svg, /#55493a|#7a2a1c/); // former dark hull fills
    }
    assert.match(own, /fill="#a8533a"/);
    assert.match(own, /fill="#b2403f"/);
    assert.match(own, /fill="#f6e9cc" stroke=/);
    assert.match(rival, /fill="#a8733a"/);
    assert.notEqual(own, rival);
  }
});

test("all classes and wear bands emit self-contained SVG fragments without external references", () => {
  for (const type of classes) for (const mine of [false, true]) for (const hull of [100, 50, 20]) {
    const svg = ships.shipSvg(type, { mine, hull, weapons: 2, gun: 40 });
    assert.doesNotMatch(svg, /(?:href|src|url\(|https?:|data:|@import|<style|<script|<image|<text|<foreignObject|\bid=|NaN|undefined)/i);
    // Only local vector primitives, with balanced group nesting; no shared defs/IDs.
    const tags = [...svg.matchAll(/<\/?([a-zA-Z]+)\b[^>]*>/g)];
    let depth = 0;
    for (const [tag, name] of tags) {
      assert.ok(["g", "path", "line", "circle", "rect"].includes(name), tag);
      if (name === "g") depth += tag.startsWith("</") ? -1 : 1;
      else assert.ok(tag.endsWith("/>"), tag);
      assert.ok(depth >= 0);
    }
    assert.equal(depth, 0);
    assert.equal(tags.map(([tag]) => tag).join(""), svg);
  }
});
