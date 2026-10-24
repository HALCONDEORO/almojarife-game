import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function check({year1 = 2000, final = 200000, start = 1000, omitYear = false} = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'npc-cash-'));
  try {
    const report = {days: 36500, horizons: [365, 1825, 3650, 10950, 18250, 36500], seconds: 0, scenarios: {
      A_no_player: {npcCash: [start, final], horizons: omitYear ? {} : {365: {npcCash: year1}}}
    }};
    const path = join(dir, 'report.json'); writeFileSync(path, JSON.stringify(report));
    const r = spawnSync(process.execPath, ['tools/sim_balance_check.mjs', path], {encoding: 'utf8', env: {...process.env, BALANCE_SEEDS: 'none'}}); // synthetic report: the horizon list must match days, no extra seeds
    assert.equal(r.error, undefined);
    return r.stdout.split('\n').find((line) => line.includes('NPC cash growth x0.2-x30 over 365d')); // label follows the plague-ON floor (24/10: measured 0.43 on the plague-on head, low = 0.5 x measured)
  } finally { rmSync(dir, {recursive: true, force: true}); }
}

test('the 365-day growth check ignores the final cash of a 100-year run', () => {
  const line = check();
  assert.ok(line.startsWith('PASS'), line);
  assert.ok(line.includes('actual: 2,'), line);
});
test('a runaway at year one fails even if final cash later returns to normal', () => {
  const line = check({year1: 40000, final: 1000});
  assert.ok(line.startsWith('FAIL'), line);
  assert.ok(line.includes('actual: 40,'), line);
});
test('missing year-one measurement is not replaced with the final snapshot', () => {
  const line = check({omitYear: true, final: 2000});
  assert.ok(line.startsWith('FAIL'), line);
  assert.ok(line.includes('actual: NaN,'), line);
});
test('unchanged 0.2-30 limits reject a real collapse or excess', () => { // floor pinned at 0.2 since the plague-ON recalibration (24/10)
  assert.ok(check({year1: 199}).startsWith('FAIL'));
  assert.ok(check({year1: 200}).startsWith('PASS'));
  assert.ok(check({year1: 30000}).startsWith('PASS'));
  assert.ok(check({year1: 30001}).startsWith('FAIL'));
});
