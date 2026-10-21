import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('balance report reconciles outcome counts and profit attribution (live 2-seed run)', () => {
  const r = JSON.parse(execFileSync(process.execPath, ['tools/balance_report.mjs', '2', 'default', '0'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  assert.equal(r.gamesPerCell, 2);
  assert.equal(r.results.length, 8); // 2 strategies x 2 modes x 2 games
  for (const [key, s] of Object.entries(r.summaries)) {
    assert.equal(s.games, 2, key);
    if (key.endsWith('/campaign')) assert.equal(s.wins + s.bankruptEndings + s.deadlineLosses, 2, key);
    if (key.endsWith('/freeplay')) assert.equal(s.wins, 0, key); // free play has no goal
    assert.ok(s.medianFinalNetWorth !== null && Number.isFinite(s.medianFinalNetWorth), key);
    assert.ok(s.topGood && s.topGood.share > 0 && s.topGood.share <= 1, key);
    assert.ok(Object.values(s.profitByGood).every((v) => Number.isFinite(v)), key);
  }
  // Results and summaries agree per cell.
  for (const key of Object.keys(r.summaries)) {
    const [strategy, mode] = key.split('/');
    const rows = r.results.filter((x) => x.strategy === strategy && x.mode === mode);
    assert.equal(rows.length, r.summaries[key].games, key);
    assert.equal(r.summaries[key].seedsWithBankruptcy, rows.filter((x) => x.bankruptcies > 0 || x.reason === 'bankrupt').length, key);
  }
});

test('balance baseline (66 seeds per cell) holds the balance limits', () => {
  const r = JSON.parse(readFileSync(new URL('../docs/design/balance-baseline-2026-10-21.json', import.meta.url)));
  assert.equal(r.gamesPerCell, 66);
  assert.equal(r.results.length, 264); // 2 strategies x 2 modes x 66 games
  const S = r.summaries, gc = S['greedy-preview/campaign'], rc = S['random-destination/campaign'];
  const gf = S['greedy-preview/freeplay'], rf = S['random-destination/freeplay'];
  // Campaign: trading pays. A regression that kills trade profit breaks these.
  assert.equal(gc.bankruptEndings, 0, 'greedy campaign bankruptcies');
  assert.ok(gc.wins / 66 >= 0.9, `greedy win rate ${gc.wins}/66`);
  assert.ok(gc.medianEndDay <= 120, `greedy median win day ${gc.medianEndDay}`);
  assert.ok(rc.bankruptEndings / 66 <= 0.4, `random bankrupt share ${rc.bankruptEndings}/66`);
  assert.ok(rc.wins / 66 >= 0.5, `random win rate ${rc.wins}/66`);
  // Free play: bankruptcy is rare and both strategies end richer than the 2,000 start.
  for (const [k, s] of [['greedy', gf], ['random', rf]]) {
    assert.ok(s.seedsWithBankruptcy / 66 <= 0.4, `${k} freeplay bankrupt share ${s.seedsWithBankruptcy}/66`);
    assert.ok(s.medianFinalNetWorth > 2000, `${k} freeplay median net worth ${s.medianFinalNetWorth}`);
  }
  // No single good dominates trading profit anywhere (dead/dominant good detector).
  for (const [key, s] of Object.entries(S)) assert.ok(s.topGood.share <= 0.65, `${key} top good ${s.topGood.good} share ${s.topGood.share}`);
});

test('balance report rejects bad arguments', () => {
  for (const args of [['0'], ['1.5'], ['2', 'bogus'], ['2', 'default', '-1']]) {
    assert.notEqual(spawnSync(process.execPath, ['tools/balance_report.mjs', ...args]).status, 0, args.join(' '));
  }
});
