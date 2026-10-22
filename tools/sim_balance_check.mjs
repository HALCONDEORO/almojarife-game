// Balance regression check over the 1/5/10/30 game-year horizons (365/1825/3650/10950 days).
// Runs the buildings/jobs economy sim in sandbox mode (campaign end cleared; the sim reports
// campaignEnd separately) and asserts per-horizon thresholds, so balance changes get caught in CI.
// Run: node tools/sim_balance_check.mjs [report.json]
// With a report path it evaluates that file (for testing); otherwise it runs the sim.
// Exit 0 = all hard checks pass, 1 = at least one fails. WARN lines report known long-term
// mechanics issues without failing CI (see the warnings section).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { OVERDRAFT_LIMIT } from "../src/game/ledger.mjs";

const report = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf8"))
  : JSON.parse(execFileSync(process.execPath, ["tools/sim_buildings_economy.mjs"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

const checks = [], warnings = [];
const check = (name, actual, ok, expect) => checks.push({ name, actual, ok, expect });
const warn = (name, actual, note) => warnings.push({ name, actual, note });
const within = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
const H = [365, 1825, 3650, 10950, 18250, 36500].filter((h) => report.horizons?.includes(h));

// The campaign deadline still ends the game at day 365 (free-play scenarios record the would-be result).
for (const [key, sc] of Object.entries(report.scenarios ?? {})) {
  if (key === "D_freeplay_idle") continue; // D has no campaign: free play never ends
  check(`${key}: campaign ends at day 365`, sc.campaignEnd?.day ?? "never", sc.campaignEnd?.day === 365, "365");
}

// Scenario D (free play, idle): bankruptcy resolves instead of ending the game; debt stays bounded.
const D = report.scenarios?.D_freeplay_idle ?? {};
check("D: free play runs to the end", D.dayEnd ?? "missing", D.dayEnd === report.days, String(report.days));
check("D: no game over in free play", D.over ?? "null", D.over === null, "null");
check("D: debt stays bounded", D.cashMin ?? "missing", Number.isFinite(D.cashMin) && D.cashMin > -(OVERDRAFT_LIMIT + 500), `> -${OVERDRAFT_LIMIT + 500}`);
check("D: cash stays finite", D.cashEnd ?? "missing", Number.isFinite(D.cashEnd), "finite");
if ((report.days ?? 0) > 365) check("D: bankruptcy actually resolves", D.bankruptcies ?? 0, (D.bankruptcies ?? 0) >= 1, ">= 1"); // the idle trader needs a few years to hit the limit

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

// NPC worth band per horizon (cash + cargo at base prices), measured with tools/sim_npc_worth_bands.mjs on main 3bf5cae.
// The NPC economy is deterministic in scenario A (seeds give identical runs) and oscillates between about 22k and 709k over 100 years,
// so each band is set from the measured values within +-2 years of the horizon: low = 0.5 x the minimum, high = 4 x the maximum.
// It catches a collapse or a runaway, not a drift. Recalibrate when the measured window moves.
const NPC_WORTH_BAND = { 365: [50000, 720000], 1825: [35000, 1270000], 3650: [180000, 1950000], 10950: [12000, 930000], 18250: [75000, 1610000], 36500: [45000, 590000] };

// Per-horizon hard checks: the economy must stay alive and sane at every game-year horizon.
for (const h of H) {
  const tag = { 365: "1y", 1825: "5y", 3650: "10y", 10950: "30y", 18250: "50y", 36500: "100y" }[h] ?? (h + "d");
  const aH = A.horizons?.[h], bH = B.horizons?.[h], cH = C.horizons?.[h];
  if (aH) {
    check(`A@${tag}: price index in band [0.80, 1.40] (no inflation spiral)`, aH.priceIndex, within(aH.priceIndex, 0.8, 1.4), "0.80-1.40");
    const [wLo, wHi] = NPC_WORTH_BAND[h] ?? [10000, 1000000];
    check(`A@${tag}: NPC worth (cash + cargo) in band [${wLo}, ${wHi}]`, aH.npcWorth ?? aH.npcCash, within(aH.npcWorth ?? aH.npcCash, wLo, wHi), `${wLo}-${wHi}`);
  }
  if (bH) {
    check(`B@${tag}: price index in band [0.80, 1.40]`, bH.priceIndex, within(bH.priceIndex, 0.8, 1.4), "0.80-1.40");
    check(`B@${tag}: bot cash positive and above 4,500`, bH.cash, within(bH.cash, 4501, Infinity), "> 4500");
    check(`B@${tag}: workshop never halted`, bH.haltEvents, bH.haltEvents === 0, "0");
    const prev = H[H.indexOf(h) - 1], pH = prev ? B.horizons?.[prev] : null;
    if (pH) {
      check(`B@${tag}: production grows vs previous horizon`, bH.produced, bH.produced > pH.produced, "> " + pH.produced);
      check(`B@${tag}: cash grows vs previous horizon`, bH.cash, bH.cash > pH.cash, "> " + pH.cash);
    }
  }
  if (cH) check(`C@${tag}: poor bot stays halted (no silent recovery)`, cH.halted, cH.halted === true, "true");
}

// Known long-term mechanics issues, measured: reported as WARN so the log shows them
// without turning CI red. Tighten to hard checks when the mechanics get fixed.
const aEnd = A.horizons?.[Math.max(...H)] ?? {};
// (was WARN A: "debt compounds without bound" - fixed by free-play bankruptcy resolution; D's hard checks now guard it)
if ((B.upgrades ?? 0) === 0)
  warn("B: workshop never upgrades", B.upgrades, "Upgrading needs materials from the local market (36 timber vs ~26 stocked in Casablanca): ports without stock can never level buildings, and the bot does not stockpile.");
if (C.resumedDay == null && C.haltedEnd)
  warn("C: a halted building never resumes", null, "Auto-restart (with two-day hysteresis) exists since the halt fix; C still never resumes because the broke bot never earns again: a terminal halt is expected here, but watch it in long horizons.");
// Criterion: mean NPC worth (cash + cargo at base prices) over the last 10 years against the start. The last snapshot is
// informational only: ships are at sea with cash turned into cargo, so one snapshot swings between ~32k and ~272k.
const npcW0 = A.npcWorth?.[0] ?? A.npcCash?.[0], npcWMean = A.npcWorthMean10y, npcWEnd = A.npcWorth?.[1];
if (Number.isFinite(npcW0) && Number.isFinite(npcWMean) && npcWMean < npcW0)
  warn("A: NPC traders lose worth over the long run", npcW0 + " -> mean " + npcWMean, "Mean NPC worth (cash + cargo) over the last 10 years is below the start value.");
if (Number.isFinite(npcWEnd)) console.log(`info: NPC worth at the last snapshot ${npcWEnd} (start ${npcW0}, last-10-year mean ${npcWMean}); informational, not a warning by itself`);
if ((B.finalLevel ?? 1) === 1 && (report.days ?? 0) > 365)
  warn("B: building level stuck at 1 over the whole run", B.finalLevel, "Consequence of the materials gate above: level-1 output and wages forever.");

const fails = checks.filter((c) => !c.ok);
console.log("Balance regression check (" + report.days + " days, horizons " + H.join("/") + ", sim " + report.seconds + "s):");
for (const c of checks) console.log((c.ok ? "PASS" : "FAIL") + "  " + c.name + "  [actual: " + c.actual + ", expected: " + c.expect + "]");
for (const w of warnings) console.log("WARN  " + w.name + "  [actual: " + w.actual + "] " + w.note);
console.log(fails.length ? "RESULT: " + fails.length + "/" + checks.length + " FAILED" : "RESULT: " + checks.length + "/" + checks.length + " PASS, " + warnings.length + " WARN");
process.exit(fails.length ? 1 : 0);
