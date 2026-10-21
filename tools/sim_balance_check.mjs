// Balance regression check: runs the buildings/jobs economy sim and asserts pass/fail
// thresholds on its report, so balance changes get caught in CI on every PR.
// Run: node tools/sim_balance_check.mjs [report.json]
// With a report path it evaluates that file (for testing); otherwise it runs the sim.
// Exit 0 = all checks pass, 1 = at least one fails. Prints a short report.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const report = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf8"))
  : JSON.parse(execFileSync(process.execPath, ["tools/sim_buildings_economy.mjs"], { encoding: "utf8" }));

const checks = [];
const check = (name, actual, ok, expect) => checks.push({ name, actual, ok, expect });
const within = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;

const A = report.scenarios?.A_no_player ?? {};
check("A: price index stays in band [0.70, 1.60]", A.priceIndex?.[1], within(A.priceIndex?.[1], 0.7, 1.6), "0.70-1.60");
const npcGrowthA = A.npcCash?.[0] > 0 ? A.npcCash[1] / A.npcCash[0] : NaN;
check("A: NPC cash growth x0.5-x30 over 365d", +npcGrowthA.toFixed(2), within(npcGrowthA, 0.5, 30), "0.5-30");

const B = report.scenarios?.B_builder_bot ?? {};
check("B: builder bot never halts (0 events)", B.haltEvents, B.haltEvents === 0, "0");
check("B: builder bot ends richer than 4,500 start", B.cashEnd, within(B.cashEnd, 4501, Infinity), "> 4500");
check("B: workshop produces (>= 50 batches)", B.produced, within(B.produced, 50, Infinity), ">= 50");
check("B: price index stays in band [0.70, 1.60]", B.priceIndex?.[1], within(B.priceIndex?.[1], 0.7, 1.6), "0.70-1.60");
const npcGrowthB = B.npcCash?.[0] > 0 ? B.npcCash[1] / B.npcCash[0] : NaN;
check("B: NPC cash growth x0.5-x30", +npcGrowthB.toFixed(2), within(npcGrowthB, 0.5, 30), "0.5-30");

const C = report.scenarios?.C_poor_bot ?? {};
check("C: poor bot's saltworks gets built", C.buildOk, C.buildOk === true, "true");
check("C: wages halt it within 180 days", C.firstHaltDay, Number.isInteger(C.firstHaltDay) && C.firstHaltDay <= 180, "1-180");
check("C: still halted at day 365", C.haltedEnd, C.haltedEnd === true, "true");

const fails = checks.filter((c) => !c.ok);
console.log("Balance regression check (" + report.days + " days, sim " + report.seconds + "s):");
for (const c of checks) console.log((c.ok ? "PASS" : "FAIL") + "  " + c.name + "  [actual: " + c.actual + ", expected: " + c.expect + "]");
console.log(fails.length ? "RESULT: " + fails.length + "/" + checks.length + " FAILED" : "RESULT: " + checks.length + "/" + checks.length + " PASS");
process.exit(fails.length ? 1 : 0);
