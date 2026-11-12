#!/usr/bin/env node
// Runs test/*.test.mjs one file per process, in parallel batches, with a per-file timeout.
// POSIX only: process-group kills do not cover Windows (not supported there).
// Exit codes: 0 all files ran and passed; 1 a file failed/timed out, not every selected file ran, or --expect mismatch; 2 bad arguments or no files matched (empty selection is an error); 130/143/129 interrupted by SIGINT/SIGTERM/SIGHUP (all test process groups are killed).
// Usage: node tools/test_runner.mjs [--jobs N] [--timeout SEC] [--expect N] [--json out.json] [--shard K/N] [--skip a,b] [pattern[,pattern]]
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = { jobs: Math.max(2, cpus().length), timeout: 60, expect: null, json: null, skip: null, dir: 'test', shard: null, pattern: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--jobs') opt.jobs = args[++i] ?? '';
  else if (a === '--timeout') opt.timeout = args[++i] ?? '';
  else if (a === '--expect') opt.expect = args[++i] ?? '';
  else if (a === '--json') { opt.json = args[++i]; if (!opt.json || opt.json.startsWith('--')) die('--json needs a file path'); }
  else if (a === '--skip') { opt.skip = args[++i]; if (!opt.skip || opt.skip.startsWith('--')) die('--skip needs a comma-separated list'); }
  else if (a === '--dir') { opt.dir = args[++i]; if (!opt.dir || opt.dir.startsWith('--')) die('--dir needs a directory'); }
  else if (a === '--shard') opt.shard = args[++i] ?? '';
  else if (a.startsWith('--')) die('unknown option ' + a);
  else opt.pattern = a;
}
function die(msg) { console.error('test_runner: ' + msg); process.exit(2); }
const MAX_TIMEOUT_S = 2_000_000; // setTimeout max is 2^31-1 ms (~2147483 s)
const posInt = (v) => /^\d+$/.test(String(v)) && Number.isSafeInteger(+v) && +v >= 1;
if (!posInt(opt.jobs)) die('--jobs must be an integer >= 1');
if (!posInt(opt.timeout)) die('--timeout must be an integer >= 1 (seconds)');
if (+opt.timeout > MAX_TIMEOUT_S) die('--timeout must be <= ' + MAX_TIMEOUT_S + ' seconds');
if (+opt.jobs > 1024) die('--jobs must be <= 1024');
if (opt.expect !== null && !/^\d+$/.test(String(opt.expect))) die('--expect must be an integer >= 0');
if (opt.shard !== null) {
  const m = /^(\d+)\/(\d+)$/.exec(opt.shard);
  if (!m || +m[2] < 1 || +m[1] < 1 || +m[1] > +m[2]) die('--shard must be K/N with 1 <= K <= N');
}
let files = readdirSync(join(root, opt.dir)).filter(f => f.endsWith('.test.mjs')).sort();
if (opt.pattern) { const ps = opt.pattern.split(',').filter(Boolean); files = files.filter(f => ps.some(p => f.includes(p))); }
if (opt.skip) { const ks = opt.skip.split(',').filter(Boolean); files = files.filter(f => !ks.some(k => f.includes(k))); }
if (opt.shard) { const [k, n] = opt.shard.split('/').map(Number); files = files.filter((_, i) => i % n === k - 1); }
const total = files.length;
if (total === 0) die('no test files matched');

// Drop the parent test runner's marker so a nested `node --test` really runs its tests.
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;

// Process groups of running tests; killed if this runner is interrupted or exits.
const active = new Set();
function killAll() { for (const pid of active) { try { process.kill(-pid, 'SIGKILL'); } catch {} } active.clear(); }
process.on('exit', killAll);
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) process.on(sig, () => { killAll(); process.exit(code); });

function runOne(f) {
  return new Promise(res => {
    const t0 = Date.now();
    // detached = own process group, so the whole tree can be killed (POSIX).
    const p = spawn(process.execPath, ['--test', join(opt.dir, f)], { cwd: root, detached: true, env });
    active.add(p.pid);
    const killTree = () => { try { process.kill(-p.pid, 'SIGKILL'); } catch { try { p.kill('SIGKILL'); } catch {} } };
    let out = '', timedOut = false;
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    const timer = setTimeout(() => { timedOut = true; killTree(); }, +opt.timeout * 1000);
    p.on('close', code => {
      clearTimeout(timer);
      killTree(); active.delete(p.pid); // reap grandchildren left behind by a finished test
      const num = k => +((out.match(new RegExp('^# ' + k + ' (\\d+)', 'm')) || [])[1] || 0);
      const r = { file: f, ms: Date.now() - t0, tests: num('tests'), pass: num('pass'), fail: num('fail'), skipped: num('skipped') + num('todo'),
        status: timedOut ? 'TIMEOUT' : code === 0 ? 'PASS' : 'FAIL' };
      if (r.status !== 'PASS') r.tail = out.split('\n').slice(-25).join('\n');
      res(r);
    });
  });
}

const results = [];
let next = 0;
const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(+opt.jobs, total) }, async () => {
  while (next < total) {
    const f = files[next++];
    const r = await runOne(f);
    results.push(r);
    console.log(`${r.status.padEnd(7)} ${String(r.ms).padStart(6)}ms  ${r.pass}/${r.tests}  ${f}`);
  }
}));

const sum = k => results.reduce((a, r) => a + r[k], 0);
const bad = results.filter(r => r.status !== 'PASS');
console.log('\n--- summary ---');
console.log(`files: ${results.length}/${total}${opt.expect != null ? ` (expected ${opt.expect}${results.length === +opt.expect ? ' OK' : ' MISMATCH'})` : ''}`);
console.log(`tests: ${sum('tests')}  pass: ${sum('pass')}  fail: ${sum('fail')}  skipped: ${sum('skipped')}`);
console.log(`files failed: ${results.filter(r => r.status === 'FAIL').length}  timed out: ${results.filter(r => r.status === 'TIMEOUT').length}`);
console.log(`wall: ${((Date.now() - t0) / 1000).toFixed(1)}s  jobs: ${opt.jobs}  per-file timeout: ${opt.timeout}s`);
console.log('slowest:', [...results].sort((a, b) => b.ms - a.ms).slice(0, 5).map(r => `${r.file} ${r.ms}ms`).join(', '));
for (const r of bad) console.log(`\n### ${r.status}: ${r.file}\n${r.tail}`);
if (opt.json) writeFileSync(opt.json, JSON.stringify(results.sort((a, b) => a.file.localeCompare(b.file)), null, 1));
process.exit(bad.length || results.length !== total || (opt.expect != null && results.length !== +opt.expect) ? 1 : 0);
