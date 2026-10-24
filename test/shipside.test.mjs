import test from "node:test";
import assert from "node:assert/strict";
import { shipSideSvg } from "../src/view/shipside.mjs";

const TYPES = ["barca", "cog", "caravel", "nao"], count = (s, re) => (s.match(re) || []).length;

test("every class returns a complete svg with viewBox and size", () => {
  for (const t of TYPES) {
    const s = shipSideSvg(t);
    assert.ok(s.startsWith("<svg"));
    assert.match(s, /viewBox="0 0 \d+ \d+"/);
    assert.match(s, /width="\d+" height="\d+"/);
    assert.match(s, /role="img" aria-label="/);
    assert.doesNotMatch(s, /<script|<image|font/);
  }
  assert.match(shipSideSvg("cog", {}, { w: 90, h: 50, cls: "shipicon" }), /class="shipicon" viewBox="0 0 90 50" width="90" height="50"/);
});

test("art differs per class and the nao is the richest", () => {
  assert.equal(new Set(TYPES.map((t) => shipSideSvg(t))).size, 4);
  assert.ok(shipSideSvg("nao").length > shipSideSvg("barca").length);
});

test("damage adds #6b5136 plank patches: none intact, one at hull 50, two at hull 20", () => {
  assert.equal(count(shipSideSvg("cog"), /#6b5136/g), 0);
  assert.equal(count(shipSideSvg("cog", { hull: 50 }), /#6b5136/g), 1);
  assert.equal(count(shipSideSvg("cog", { hull: 20 }), /#6b5136/g), 2);
});

test("weapons add gunport marks, capped, worn pieces half-size", () => {
  assert.equal(count(shipSideSvg("nao"), /<rect/g), 0);
  assert.equal(count(shipSideSvg("nao", { weapons: 5, maxGuns: 8 }), /<rect/g), 5);
  assert.equal(count(shipSideSvg("barca", { weapons: 5, maxGuns: 1 }), /<rect/g), 1);
  const good = shipSideSvg("cog", { weapons: 1 }), worn = shipSideSvg("cog", { weapons: 1, gun: 40 });
  assert.match(good, /class="gunport"[^>]*width="4"/);
  assert.match(worn, /class="gunport"[^>]*width="2"/);
});

test("unknown type falls back to the cog drawing", () => {
  const u = shipSideSvg("galleon"), c = shipSideSvg("cog");
  assert.equal(u.replace('aria-label="galleon"', 'aria-label="cog"'), c);
});

test("output is deterministic", () => {
  for (const t of TYPES) assert.equal(shipSideSvg(t, { hull: 40, weapons: 2 }), shipSideSvg(t, { hull: 40, weapons: 2 }));
});
