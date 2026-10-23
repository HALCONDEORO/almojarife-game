import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
test("economy report labels scope and separates all arrival strategies", () => {
  const r = JSON.parse(execFileSync(process.execPath, ["tools/sim_economy.mjs", "1", "30"], { encoding: "utf8" }));
  assert.match(r.scope, /No player upkeep/);
  assert.match(r.sampling, /every 30 days/);
  assert.deepEqual(Object.keys(r.arrivalsByStrategy), ["greedy", "wanderer", "shuttle"]);
  for (const x of Object.values(r.arrivalsByStrategy)) {
    assert.equal(Object.keys(x).length, 34);
    assert.ok(Object.values(x).every((v) => Number.isSafeInteger(v) && v >= 0));
  }
  assert.equal(r.brokeShare, undefined);
  assert.equal(r.staticTopRatios, undefined);
});
test("economy report rejects zero or fractional runs", () => {
  for (const args of [["0", "30"], ["1", "0"], ["1.5", "30"]]) {
    assert.notEqual(spawnSync(process.execPath, ["tools/sim_economy.mjs", ...args]).status, 0);
  }
});
