import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('../tools/test_runner.mjs', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [runner, ...a], { encoding: 'utf8' });

for (const args of [
  ['--jobs', '0'], ['--jobs', 'nope'], ['--jobs'], ['--timeout', '0'], ['--timeout', 'x'],
  ['--shard', '0/2'], ['--shard', '3/2'], ['--shard', 'a/b'], ['--shard', '1/0'], ['--shard', '1/2/3'], ['--shard', '1/2/'], ['--shard'], ['--timeout'], ['--expect'], ['--json'], ['--expect', 'x'],
  ['--bogus'], ['zzz-no-such-test-file'],
]) {
  test(`runner rejects ${args.join(' ')} with a non-zero exit and runs nothing`, () => {
    const r = run(...args);
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /^PASS/m);
  });
}

test('runner runs a real file, exit 0, and fails on expect mismatch', () => {
  const ok = run('--jobs', '1', '--expect', '1', 'achievements.test');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /files: 1\/1 \(expected 1 OK\)/);
  const bad = run('--jobs', '1', '--expect', '2', 'achievements.test');
  assert.equal(bad.status, 1);
});

for (const args of [['--json', '--jobs', '1', 'x'], ['--json'], ['--dir'], ['--timeout', '2147484'], ['--timeout', '99999999999999999999'], ['--jobs', '100000']]) {
  test(`runner rejects ${args.join(' ')}`, () => {
    const r = run(...args);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /^PASS/m);
  });
}

test('a timed-out test leaves no orphan worker or grandchild (POSIX)', { skip: process.platform === 'win32' }, async () => {
  const { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, relative } = await import('node:path');
  const { fileURLToPath: f2p } = await import('node:url');
  const dir = mkdtempSync(join(tmpdir(), 'runner-orphan-'));
  const pidFile = join(dir, 'child.pid');
  writeFileSync(join(dir, 'hang.test.mjs'), `
    import { spawn } from 'node:child_process';
    import { writeFileSync } from 'node:fs';
    const c = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'inherit' });
    writeFileSync(${JSON.stringify(pidFile)}, String(c.pid));
    await new Promise(() => setInterval(() => {}, 1000));
  `);
  const root = f2p(new URL('..', import.meta.url));
  const r = run('--dir', relative(root, dir), '--timeout', '2', '--jobs', '1');
  try {
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /^TIMEOUT/m);
    assert.ok(existsSync(pidFile), 'grandchild did not start');
    const pid = +readFileSync(pidFile, 'utf8');
    await new Promise(res => setTimeout(res, 300));
    let alive = true;
    try { process.kill(pid, 0); } catch { alive = false; }
    if (alive) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    assert.equal(alive, false, 'grandchild ' + pid + ' still running after timeout');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  test(`${sig} to the runner kills running test process groups (POSIX)`, { skip: process.platform === 'win32' }, async () => {
    const { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join, relative } = await import('node:path');
    const { spawn } = await import('node:child_process');
    const dir = mkdtempSync(join(tmpdir(), 'runner-sig-'));
    const pidFile = join(dir, 'child.pid');
    writeFileSync(join(dir, 'hang.test.mjs'), `
      import { spawn } from 'node:child_process';
      import { writeFileSync } from 'node:fs';
      const c = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'inherit' });
      writeFileSync(${JSON.stringify(pidFile)}, String(c.pid));
      await new Promise(() => setInterval(() => {}, 1000));
    `);
    const root = fileURLToPath(new URL('..', import.meta.url));
    const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
    const p = spawn(process.execPath, [runner, '--dir', relative(root, dir), '--timeout', '60', '--jobs', '1'], { stdio: 'ignore', env });
    const exited = new Promise(res => p.on('close', (code, s) => res({ code, s })));
    const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
    let pid = 0;
    try {
      for (let i = 0; i < 100 && !existsSync(pidFile); i++) await new Promise(r => setTimeout(r, 100));
      assert.ok(existsSync(pidFile), 'grandchild did not start');
      pid = +readFileSync(pidFile, 'utf8');
      assert.ok(alive(pid));
      p.kill(sig);
      const r = await exited;
      assert.ok(r.code === (sig === 'SIGINT' ? 130 : 143) || r.s === sig, JSON.stringify(r));
      await new Promise(r => setTimeout(r, 300));
      assert.equal(alive(pid), false, 'grandchild ' + pid + ' still running after ' + sig);
    } finally { if (pid && alive(pid)) process.kill(pid, 'SIGKILL'); rmSync(dir, { recursive: true, force: true }); }
  });
}

test('--skip removes files, comma patterns select several, skipping everything is an error', () => {
  const both = run('--jobs', '2', '--expect', '2', 'achievements.test,achievementsview.test');
  assert.equal(both.status, 0, both.stdout + both.stderr);
  const skipped = run('--jobs', '1', '--expect', '1', '--skip', 'achievementsview', 'achievements');
  assert.equal(skipped.status, 0, skipped.stdout + skipped.stderr);
  assert.match(skipped.stdout, /files: 1\/1/);
  assert.equal(run('--skip', 'test', 'achievements').status, 2);
  assert.equal(run('--skip').status, 2);
});
