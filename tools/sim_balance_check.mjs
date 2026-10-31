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

// BALANCE_DAYS: shorter horizon for the fast PR gate; unset = full run.
// Extra game seeds for bots B and C. Default 1,2,3; BALANCE_SEEDS=none turns them off explicitly (never silent). Seeds are uint32.
const seedsEnv = process.env.BALANCE_SEEDS ?? "1,2,3";
const seeds = seedsEnv === "none" ? [] : seedsEnv.split(",").map((x) => (/^\d+$/.test(x) ? Number(x) : NaN));
if (seeds.some((x) => !Number.isSafeInteger(x) || x > 4294967295) || new Set(seeds).size !== seeds.length) throw new Error("BALANCE_SEEDS must be 'none' or a comma list of distinct uint32 integers");
const report = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf8"))
  : JSON.parse(execFileSync(process.execPath, ["tools/sim_buildings_economy.mjs", process.env.BALANCE_DAYS || "36500", seeds.join(",")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

const checks = [], warnings = [];
const EXPECTED_H = [365, 1825, 3650, 10950, 18250, 36500].filter((h) => h <= (report.days ?? 0));
if (JSON.stringify(report.horizons ?? null) !== JSON.stringify(EXPECTED_H)) { console.log("FAIL  report horizons " + JSON.stringify(report.horizons) + " do not match days " + report.days + " (expected " + JSON.stringify(EXPECTED_H) + ")"); process.exit(1); }

// Split runs (the Balance workflow's weekly 100-year legs): BALANCE_BASE=0 legs carry only the
// per-seed slice. Fail loudly on a mismatched slice so a missing base slice never skips checks silently.
const baseExpected = process.env.BALANCE_BASE !== "0";
if (baseExpected !== !!report.scenarios) { console.log("FAIL  base slice " + (report.scenarios ? "present" : "missing") + " but BALANCE_BASE=" + (baseExpected ? "1" : "0")); process.exit(1); }
const check = (name, actual, ok, expect) => checks.push({ name, actual, ok, expect });
const warn = (name, actual, note) => warnings.push({ name, actual, note });
const within = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
const H = [365, 1825, 3650, 10950, 18250, 36500].filter((h) => report.horizons?.includes(h));

// Bots B and C: the same final and per-horizon checks run for the default game (prefix "") and for every extra game seed.
function checkBC(prefix, B, C) {
  check(`${prefix}B: builder has no financial halts`, B.financialHalts, B.financialHalts === 0, "0");
  check(`${prefix}B: no bankruptcies`, B.bankruptcies, B.bankruptcies === 0, "0");
  check(`${prefix}B: workshop retained`, B.workshopLostDay, B.workshopLostDay === null, "null");
  check(`${prefix}B: every ended fire reopens`, B.fireReopens, B.fireHalts === B.fireReopens + Number(B.fireActive === true), "all ended fire closures reopen");
  check(`${prefix}B: builder net worth exceeds 4,500 start`, B.netWorthEnd, within(B.netWorthEnd, 4501, Infinity), "> 4500");
  check(`${prefix}B: workshop produces (>= 50 batches)`, B.produced, within(B.produced, 50, Infinity), ">= 50");

  check(`${prefix}C: poor bot's saltworks gets built`, C.buildOk, C.buildOk === true, "true");
  check(`${prefix}C: wages halt it within 180 days`, C.firstHaltDay, Number.isInteger(C.firstHaltDay) && C.firstHaltDay <= 180, "1-180");
  check(`${prefix}C: still halted at day 365`, C.haltedEnd, C.haltedEnd === true, "true");
  for (const h of H) {
    const tag = { 365: "1y", 1825: "5y", 3650: "10y", 10950: "30y", 18250: "50y", 36500: "100y" }[h] ?? (h + "d");
    const bH = B.horizons?.[h], cH = C.horizons?.[h];
  check(`${prefix}B@${tag}: snapshot present`, bH ? "present" : "missing", !!bH, "present");
  check(`${prefix}C@${tag}: snapshot present`, cH ? "present" : "missing", !!cH, "present");
  if (bH) {
    check(`${prefix}B@${tag}: price index in band [0.80, 1.40]`, bH.priceIndex, within(bH.priceIndex, 0.8, 1.4), "0.80-1.40");
    check(`${prefix}B@${tag}: cash plus stored/cargo goods above 4,500`, bH.netWorth ?? bH.cash, within(bH.netWorth ?? bH.cash, 4501, Infinity), "> 4500");
    check(`${prefix}B@${tag}: no financial halts`, bH.financialHalts, bH.financialHalts === 0, "0");
    const prev = H[H.indexOf(h) - 1], pH = prev ? B.horizons?.[prev] : null;
    if (pH) {
      check(`${prefix}B@${tag}: production grows vs previous horizon`, bH.produced, bH.produced > pH.produced, "> " + pH.produced);
      check(`${prefix}B@${tag}: net worth grows vs previous horizon`, bH.netWorth, bH.netWorth > pH.netWorth, "> " + pH.netWorth);
    }
  }
  if (cH) check(`${prefix}C@${tag}: poor bot stays halted (no silent recovery)`, cH.halted, cH.halted === true, "true");
  }
}

// The campaign deadline still ends the game at day 365 (free-play scenarios record the would-be result).
for (const [key, sc] of Object.entries(report.scenarios ?? {})) {
  if (key === "D_freeplay_idle") continue; // D has no campaign: free play never ends
  check(`${key}: campaign ends at day 365`, sc.campaignEnd?.day ?? "never", sc.campaignEnd?.day === 365, "365");
}

// Scenario D (free play, idle): bankruptcy resolves instead of ending the game; debt stays bounded.
const D = report.scenarios?.D_freeplay_idle ?? {};
if (baseExpected) {
check("D: free play runs to the end", D.dayEnd ?? "missing", D.dayEnd === report.days, String(report.days));
check("D: no game over in free play", D.over ?? "null", D.over === null, "null");
check("D: debt stays bounded", D.cashMin ?? "missing", Number.isFinite(D.cashMin) && D.cashMin > -(OVERDRAFT_LIMIT + 500), `> -${OVERDRAFT_LIMIT + 500}`);
check("D: cash stays finite", D.cashEnd ?? "missing", Number.isFinite(D.cashEnd), "finite");
if ((report.days ?? 0) > 365) check("D: bankruptcy actually resolves", D.bankruptcies ?? 0, (D.bankruptcies ?? 0) >= 1, ">= 1"); // the idle trader needs a few years to hit the limit
}

const A = report.scenarios?.A_no_player ?? {};
if (baseExpected) check("A: price index stays in band [0.70, 1.60] at 1y", A.priceIndex?.[1], within(A.priceIndex?.[1], 0.7, 1.6), "0.70-1.60");
// npcCash[1] is the final snapshot of the complete run, which may span 100 years.
// Evaluate the named 365-day horizon, never the final cash of a longer simulation.
const npcCashYear1 = A.horizons?.[365]?.npcCash;
const absoluteCashGrowth = A.npcCash?.[0] > 0 ? npcCashYear1 / A.npcCash[0] : NaN;
const absoluteWorthGrowth = A.npcWorth?.[0] > 0 ? A.horizons?.[365]?.npcWorth / A.npcWorth[0] : NaN;
if (baseExpected) console.log(`info visible absolute NPC growth at 365d: cash ${absoluteCashGrowth.toFixed(2)}x, worth ${absoluteWorthGrowth.toFixed(2)}x. Legacy cash gate 0.215-30 was FAIL on activation (32.37x cash / 34.40x worth); it is not erased or called equivalent.`);
// Regional-rival warmup leaves 6,000 starting cash instead of legacy 48,521.
// Compare simultaneous OFF/ON wealth (cash+cargo), not unlike post-warmup cash denominators.
if (baseExpected) for (const h of H) {
 const off=report.npcOff?.horizons?.[h]?.npcWorth, on=A.horizons?.[h]?.npcWorth;
 const ratio=off>0?on/off:NaN;
 check(`NPC ON/OFF worth ratio @${h}d`,ratio,within(ratio,0.25,4),"0.25-4 (explicit relative guard, no formula change)");
}

const B = report.scenarios?.B_builder_bot ?? {}, C = report.scenarios?.C_poor_bot ?? {};
// NPC worth band per horizon (cash + cargo at base prices), measured with tools/sim_npc_worth_bands.mjs on main 3bf5cae.
// The NPC economy is deterministic in scenario A (seeds give identical runs) and oscillates between about 22k and 709k over 100 years,
// so each band is set from the measured values within +-2 years of the horizon: low = 0.5 x the minimum, high = 4 x the maximum.
// It catches a collapse or a runaway, not a drift. Recalibrate when the measured window moves.
// 365 recalibrated 26/10 on the household-purses head with the documented rule below (tools/sim_npc_worth_bands.mjs 100 0 -> window years 1..3 = min 281268 / max 609370; the purse cap on discretionary retail leaves luxury stock on the shelf, NPC arbitrage margins grow, y1 worth 277679 -> 459320: trajectories reach the old head's y3 values about a year earlier, not a runaway); previous value [32934, 357228].
const NPC_WORTH_BAND = { 365: [103199, 1982492], 1825: [247812, 4110688], 3650: [565549, 6272164], 10950: [1529976, 13258576], 18250: [2075616, 17096684], 36500: [2740520, 22611680] }; // recalibrated 30/10 on the world-systems head (#639: household, calamities and regional rivals ON by default; expected drift, ON/OFF 30y ratio 1.37x inside the 0.25-4x policy): same documented rule (low = 0.5 x min, high = 4 x max of the +-2y window, windows clamped at year 1; fractional lows round UP), measured on scenario A's exact configuration (seed 0) with tools/sim_npc_worth_bands.mjs 100 0 (series sampled per game year, save/load chunks verified identical to a straight run at year 32); supersedes the 24/10 plague-head bands, which predate the world-systems defaults

// Per-horizon hard checks: the economy must stay alive and sane at every game-year horizon.
if (baseExpected) for (const h of H) {
  const tag = { 365: "1y", 1825: "5y", 3650: "10y", 10950: "30y", 18250: "50y", 36500: "100y" }[h] ?? (h + "d");
  const aH = A.horizons?.[h], bH = B.horizons?.[h], cH = C.horizons?.[h];
  if (aH) {
    check(`A@${tag}: price index in band [0.80, 1.40] (no inflation spiral)`, aH.priceIndex, within(aH.priceIndex, 0.8, 1.4), "0.80-1.40");
    const [wLo, wHi] = NPC_WORTH_BAND[h] ?? [10000, 1000000];
    check(`A@${tag}: NPC worth (cash + cargo) in band [${wLo}, ${wHi}]`, aH.npcWorth ?? aH.npcCash, within(aH.npcWorth ?? aH.npcCash, wLo, wHi), `${wLo}-${wHi}`);
  }
}

if (baseExpected) checkBC("", B, C);
for (const seed of seeds) {
  const sr = report.seedRuns?.[seed];
  check(`seed ${seed}: B and C were run`, sr ? "present" : "missing", !!(sr?.B_builder_bot && sr?.C_poor_bot), "present");
  if (sr?.B_builder_bot && sr?.C_poor_bot) checkBC(`seed ${seed} `, sr.B_builder_bot, sr.C_poor_bot);
}

// Paired controlled policies are mandatory, not an OFF replacement for the ON gate.
for (const seed of baseExpected ? [0,...seeds] : seeds) {
 const pair=report.pairedBuilders?.[seed];
 check(`pair seed ${seed}: OFF/ON/legacy policies present`, !!pair, !!(pair?.off&&pair?.on&&pair?.legacyOn), "true");
 if(!pair) continue;
 for(const mode of ['off','on']) {
  const b=pair[mode];
  check(`pair ${seed} ${mode}: no bankruptcy or lost workshop`, b.cashEnd, b.bankruptcies===0&&b.workshopLostDay===null, "retained, zero bankruptcies");
  check(`pair ${seed} ${mode}: no financial halt`, b.financialHalts, b.financialHalts===0, "0");
  check(`pair ${seed} ${mode}: ended fires reopen`, b.fireReopens, b.fireHalts===b.fireReopens+Number(b.fireActive===true), "all");
  for(let i=1;i<H.length;i++) {const a=b.horizons?.[H[i-1]],z=b.horizons?.[H[i]];check(`pair ${seed} ${mode}: production and worth grow to ${H[i]}`,z?.netWorth,!!a&&!!z&&z.produced>a.produced&&z.netWorth>a.netWorth, "both grow");}
 }
 console.log(`info legacy L3 seed ${seed}: bankruptcies ${pair.legacyOn.bankruptcies}, lost ${pair.legacyOn.workshopLostDay}, cash ${pair.legacyOn.cashEnd}; recorded, not claimed robust`);
}

// Known long-term mechanics issues, measured: reported as WARN so the log shows them
// without turning CI red. Tighten to hard checks when the mechanics get fixed.
if (baseExpected) {
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
}

const fails = checks.filter((c) => !c.ok);
console.log("Balance regression check (" + report.days + " days, horizons " + H.join("/") + ", sim " + report.seconds + "s):");
for (const c of checks) console.log((c.ok ? "PASS" : "FAIL") + "  " + c.name + "  [actual: " + c.actual + ", expected: " + c.expect + "]");
for (const w of warnings) console.log("WARN  " + w.name + "  [actual: " + w.actual + "] " + w.note);
console.log(fails.length ? "RESULT: " + fails.length + "/" + checks.length + " FAILED" : "RESULT: " + checks.length + "/" + checks.length + " PASS, " + warnings.length + " WARN");
process.exit(fails.length ? 1 : 0);
