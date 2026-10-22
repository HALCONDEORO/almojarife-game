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
