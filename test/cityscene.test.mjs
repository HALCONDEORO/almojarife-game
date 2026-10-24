import test from "node:test";
import assert from "node:assert/strict";
import { seeded } from "../src/view/cityscene.mjs";

test("seeded is deterministic per key and differs across keys", () => {
  const a1 = seeded("cadiz"), a2 = seeded("cadiz"), b = seeded("sevilla");
  for (let i = 0; i < 5; i++) assert.equal(a1(), a2());
  const r = seeded("cadiz");
  for (let i = 0; i < 20; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
  assert.notEqual(seeded("cadiz")(), b());
});
