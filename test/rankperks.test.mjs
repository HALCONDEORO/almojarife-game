import test from "node:test";
import assert from "node:assert/strict";
import { RANKS } from "../src/game/rank.mjs";
import { contractMaxFor, CONTRACT_MAX_BASE } from "../src/game/rankperks.mjs";
test("council orders: 3 below Trader, 4 from Trader up, for every rank", () => {
  RANKS.forEach((r, i) => assert.equal(contractMaxFor({ rankIdx: i }), i >= 1 ? CONTRACT_MAX_BASE + 1 : CONTRACT_MAX_BASE, r.id));
});
test("old saves without a rank keep the base limit", () => assert.equal(contractMaxFor({}), 3));
