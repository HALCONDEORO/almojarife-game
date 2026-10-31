import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (env, args = []) => spawnSync(process.execPath, ['tools/sim_balance_check.mjs', ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

test('balance gate rejects bad extra seeds (not uint32, duplicate, not a number)', () => {
  for (const bad of ['4294967296', '-1', '1,1', 'x', '1.5']) assert.notEqual(run({ BALANCE_SEEDS: bad, BALANCE_DAYS: '365' }).status, 0, bad);
});

test('balance gate fails when a requested seed is missing from the report', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bal-'));
  const rep = JSON.parse(execFileSync(process.execPath, ['tools/sim_buildings_economy.mjs', '365'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const f = join(dir, 'r.json'); writeFileSync(f, JSON.stringify(rep));
  const r = run({ BALANCE_SEEDS: '1' }, [f]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /seed 1: B and C were run.*missing/);
});

test('balance economy report carries per-seed runs for B and C', () => {
  const rep = JSON.parse(execFileSync(process.execPath, ['tools/sim_buildings_economy.mjs', '365', '1,2'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  assert.deepEqual(Object.keys(rep.seedRuns), ['1', '2']);
  for (const s of ['1', '2']) assert.ok(rep.seedRuns[s].B_builder_bot.horizons && rep.seedRuns[s].C_poor_bot.horizons);
});

test('balance gate rejects a report with a missing horizon snapshot or horizons that do not match days', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bal-'));
  const rep = JSON.parse(execFileSync(process.execPath, ['tools/sim_buildings_economy.mjs', '3650', '1'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const ok = join(dir, 'ok.json'); writeFileSync(ok, JSON.stringify(rep));
  const base = run({ BALANCE_SEEDS: '1' }, [ok]);
  assert.equal(base.status, 0, base.stdout.slice(-600));
  const a = structuredClone(rep); delete a.seedRuns['1'].B_builder_bot.horizons[1825];
  const fa = join(dir, 'a.json'); writeFileSync(fa, JSON.stringify(a));
  const ra = run({ BALANCE_SEEDS: '1' }, [fa]); assert.notEqual(ra.status, 0); assert.match(ra.stdout, /seed 1 B@5y: snapshot present.*missing/);
  const b = structuredClone(rep); b.horizons = []; b.scenarios.B_builder_bot.horizons = {}; b.scenarios.C_poor_bot.horizons = {};
  const fb = join(dir, 'b.json'); writeFileSync(fb, JSON.stringify(b));
  const rb = run({ BALANCE_SEEDS: '1' }, [fb]); assert.notEqual(rb.status, 0); assert.match(rb.stdout, /do not match days/);
});

test('paired gate rejects absent paired policy data and financial halts without hiding legacy absolute growth',()=>{
 const dir=mkdtempSync(join(tmpdir(),'bal-pair-'));
 const rep=JSON.parse(execFileSync(process.execPath,['tools/sim_buildings_economy.mjs','365'],{encoding:'utf8',maxBuffer:64*1024*1024}));
 const f=join(dir,'pair.json');writeFileSync(f,JSON.stringify(rep));
 const baseline=run({BALANCE_SEEDS:'none'},[f]);assert.equal(baseline.status,0,baseline.stdout);assert.match(baseline.stdout,/visible absolute NPC growth/);assert.match(baseline.stdout,/Legacy cash gate.*FAIL on activation/);
 const missing=structuredClone(rep);delete missing.pairedBuilders;writeFileSync(f,JSON.stringify(missing));const a=run({BALANCE_SEEDS:'none'},[f]);assert.notEqual(a.status,0);assert.match(a.stdout,/pair seed 0: OFF\/ON\/legacy policies present.*false/);
 rep.scenarios.B_builder_bot.financialHalts=1;writeFileSync(f,JSON.stringify(rep));const b=run({BALANCE_SEEDS:'none'},[f]);assert.notEqual(b.status,0);assert.match(b.stdout,/no financial halts.*actual: 1/);
});

test('split run: BALANCE_BASE=0 legs carry and check only the per-seed slice; slices are fail-closed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bal-split-'));
  // Seed leg: no base slice, seed 1 only.
  const seedRep = JSON.parse(execFileSync(process.execPath, ['tools/sim_buildings_economy.mjs', '365', '1'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, BALANCE_BASE: '0' } }));
  assert.equal(seedRep.scenarios, undefined);
  assert.equal(seedRep.npcOff, undefined);
  assert.deepEqual(Object.keys(seedRep.seedRuns), ['1']);
  assert.deepEqual(Object.keys(seedRep.pairedBuilders), ['1']); // pair 0 belongs to the base leg
  const f = join(dir, 'seed.json'); writeFileSync(f, JSON.stringify(seedRep));
  const ok = run({ BALANCE_SEEDS: '1', BALANCE_BASE: '0' }, [f]);
  assert.equal(ok.status, 0, ok.stdout.slice(-800));
  // The same seed-only report must FAIL with BALANCE_BASE unset (a full run missing its base slice is never a silent skip).
  const missingBase = run({ BALANCE_SEEDS: '1' }, [f]);
  assert.notEqual(missingBase.status, 0);
  assert.match(missingBase.stdout, /base slice missing but BALANCE_BASE=1/);
  // A full base report must FAIL in a seed leg.
  const fullRep = JSON.parse(execFileSync(process.execPath, ['tools/sim_buildings_economy.mjs', '365', '1'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const f2 = join(dir, 'full.json'); writeFileSync(f2, JSON.stringify(fullRep));
  const baseInSeedLeg = run({ BALANCE_SEEDS: '1', BALANCE_BASE: '0' }, [f2]);
  assert.notEqual(baseInSeedLeg.status, 0);
  assert.match(baseInSeedLeg.stdout, /base slice present but BALANCE_BASE=0/);
  // And the full report still passes as a full run (the single-shot path is unchanged).
  const fullOk = run({ BALANCE_SEEDS: '1' }, [f2]);
  assert.equal(fullOk.status, 0, fullOk.stdout.slice(-800));
});
