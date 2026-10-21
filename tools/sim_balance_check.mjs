// Balance regression check over the 1/5/10/30 game-year horizons (365/1825/3650/10950 days).
// Runs the buildings/jobs economy sim in sandbox mode (campaign end cleared; the sim reports
// campaignEnd separately) and asserts per-horizon thresholds, so balance changes get caught in CI.
// Run: node tools/sim_balance_check.mjs [report.json]
// With a report path it evaluates that file (for testing); otherwise it runs the sim.
// Exit 0 = all hard checks pass, 1 = at least one fails. WARN lines report known long-term
// mechanics issues without failing CI (see the warnings section).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const report = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf8"))
  : JSON.parse(execFileSync(process.execPath, ["tools/sim_buildings_economy.mjs"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

const checks = [], warnings = [];
const check = (name, actual, ok, expect) => checks.push({ name, actual, ok, expect });
const warn = (name, actual, note) => warnings.push({ name, actual, note });
const within = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
const H = [365, 1825, 3650, 10950].filter((h) => report.horizons?.includes(h));

// The campaign deadline still ends the game at day 365 (sandbox reports it, then keeps running).
for (const [key, sc] of Object.entries(report.scenarios ?? {}))
  check(`${key}: campaign ends at day 365`, sc.campaignEnd?.day ?? "never", sc.campaignEnd?.day === 365, "365");

const A = report.scenarios?.A_no_player ?? {};
check("A: price index stays in band [0.70, 1.60] at 1y", A.priceIndex?.[1], within(A.priceIndex?.[1], 0.7, 1.6), "0.70-1.60");
const npcGrowthA = A.npcCash?.[0] > 0 ? A.npcCash[1] / A.npcCash[0] : NaN;
check("A: NPC cash growth x0.5-x30 over 365d", +npcGrowthA.toFixed(2), within(npcGrowthA, 0.5, 30), "0.5-30");

const B = report.scenarios?.B_builder_bot ?? {};
check("B: builder bot never halts (0 events)", B.haltEvents, B.haltEvents === 0, "0");
check("B: builder bot ends richer than 4,500 start", B.cashEnd, within(B.cashEnd, 4501, Infinity), "> 4500");
check("B: workshop produces (>= 50 batches)", B.produced, within(B.produced, 50, Infinity), ">= 50");

const C = report.scenarios?.C_poor_bot ?? {};
check("C: poor bot's saltworks gets built", C.buildOk, C.buildOk === true, "true");
check("C: wages halt it within 180 days", C.firstHaltDay, Number.isInteger(C.firstHaltDay) && C.firstHaltDay <= 180, "1-180");
check("C: still halted at day 365", C.haltedEnd, C.haltedEnd === true, "true");

// Per-horizon hard checks: the economy must stay alive and sane at every game-year horizon.
for (const h of H) {
  const tag = h === 365 ? "1y" : h === 1825 ? "5y" : h === 3650 ? "10y" : "30y";
  const aH = A.horizons?.[h], bH = B.horizons?.[h], cH = C.horizons?.[h];
  if (aH) {
    check(`A@${tag}: price index in band [0.80, 1.40] (no inflation spiral)`, aH.priceIndex, within(aH.priceIndex, 0.8, 1.4), "0.80-1.40");
    check(`A@${tag}: NPC cash sane [10k, 500k]`, aH.npcCash, within(aH.npcCash, 10000, 500000), "10000-500000");
  }
  if (bH) {
    check(`B@${tag}: price index in band [0.80, 1.40]`, bH.priceIndex, within(bH.priceIndex, 0.8, 1.4), "0.80-1.40");
    check(`B@${tag}: bot cash positive and above 4,500`, bH.cash, within(bH.cash, 4501, Infinity), "> 4500");
    check(`B@${tag}: workshop never halted`, bH.haltEvents, bH.haltEvents === 0, "0");
    const prev = H[H.indexOf(h) - 1], pH = prev ? B.horizons?.[prev] : null;
    if (pH) {
      check(`B@${tag}: production grows vs previous horizon`, bH.produced - pH.produced, bH.produced > pH.produced, "> " + pH.produced);
      check(`B@${tag}: cash grows vs previous horizon`, bH.cash - pH.cash, bH.cash > pH.cash, "> " + pH.cash);
    }
  }
  if (cH) check(`C@${tag}: poor bot stays halted (no silent recovery)`, cH.halted, cH.halted === true, "true");
}

// Known long-term mechanics issues, measured: reported as WARN so the log shows them
// without turning CI red. Tighten to hard checks when the mechanics get fixed.
const aEnd = A.horizons?.[Math.max(...H)] ?? {};
if (Math.abs(aEnd.idlePlayerCash ?? 0) > 1e6)
  warn("A: debt compounds without bound", aEnd.idlePlayerCash, "Negative cash grows exponentially (interest on debt, no bankruptcy resolution); masked in campaign by the day-365 deadline, but any free-play mode inherits it.");
if ((B.upgrades ?? 0) === 0)
  warn("B: workshop never upgrades", B.upgrades, "Upgrading needs materials from the local market (36 timber vs ~26 stocked in Casablanca): ports without stock can never level buildings, and the bot does not stockpile.");
if (C.resumedDay == null && C.haltedEnd)
  warn("C: a halted building never resumes", null, "restartBuilding exists but nothing calls it: once wages halt a building it stays dead for the whole run (no partial wages, no recovery path).");
if ((B.finalLevel ?? 1) === 1 && (report.days ?? 0) > 365)
  warn("B: building level stuck at 1 over the whole run", B.finalLevel, "Consequence of the materials gate above: level-1 output and wages forever.");

const fails = checks.filter((c) => !c.ok);
console.log("Balance regression check (" + report.days + " days, horizons " + H.join("/") + ", sim " + report.seconds + "s):");
for (const c of checks) console.log((c.ok ? "PASS" : "FAIL") + "  " + c.name + "  [actual: " + c.actual + ", expected: " + c.expect + "]");
for (const w of warnings) console.log("WARN  " + w.name + "  [actual: " + w.actual + "] " + w.note);
console.log(fails.length ? "RESULT: " + fails.length + "/" + checks.length + " FAILED" : "RESULT: " + checks.length + "/" + checks.length + " PASS, " + warnings.length + " WARN");
process.exit(fails.length ? 1 : 0);
