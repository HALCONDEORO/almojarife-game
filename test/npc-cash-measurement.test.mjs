import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function check({year1 = 2000, final = 200000, start = 1000, omitYear = false} = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'npc-cash-'));
  try {
    const report = {days: 36500, horizons: [], seconds: 0, scenarios: {
      A_no_player: {npcCash: [start, final], horizons: omitYear ? {} : {365: {npcCash: year1}}}
    }};
    const path = join(dir, 'report.json'); writeFileSync(path, JSON.stringify(report));
    const r = spawnSync(process.execPath, ['tools/sim_balance_check.mjs', path], {encoding: 'utf8'});
    assert.equal(r.error, undefined);
    return r.stdout.split('\n').find((line) => line.includes('NPC cash growth x0.5-x30 over 365d'));
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
test('unchanged 0.5-30 limits reject a real collapse or excess', () => {
  assert.ok(check({year1: 499}).startsWith('FAIL'));
  assert.ok(check({year1: 500}).startsWith('PASS'));
  assert.ok(check({year1: 30000}).startsWith('PASS'));
  assert.ok(check({year1: 30001}).startsWith('FAIL'));
});
