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

test('styles roster: every style cell runs clean in both modes (live 1-seed run)', () => {
  const r = JSON.parse(execFileSync(process.execPath, ['tools/balance_report.mjs', '1', 'default', '0', 'styles'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  assert.equal(r.roster, 'styles');
  assert.equal(Object.keys(r.summaries).length, 18); // 9 styles x 2 modes
  assert.equal(r.results.length, 18);
  // Live harness check (Automejora fail on #175): the errand runner must really complete M1 and M2,
  // so the committed styles baseline means what it says.
  const errand = r.results.find((x) => x.strategy === 'errand' && x.mode === 'campaign' && x.events);
  assert.ok(errand.missions['m1-oficio'].done, 'errand completes M1');
  assert.ok(errand.missions['m2-nombre'].done, 'errand completes M2');
  for (const [key, s] of Object.entries(r.summaries)) {
    assert.ok(key.endsWith('+events'), key); // style cells always run with events on
    assert.equal(s.games, 1, key);
    assert.equal(s.stalledRuns, 0, key); // event auto-resolution never wedges the clock
    if (key.endsWith('/freeplay+events')) assert.equal(r.results.find((x) => x.strategy === key.split('/')[0] && x.mode === 'freeplay').day, 365, key);
  }
});

test('styles baseline (33 seeds per cell) holds the balance limits', () => {
  const r = JSON.parse(readFileSync(new URL('../docs/design/balance-styles-2026-10-21.json', import.meta.url)));
  assert.equal(r.gamesPerCell, 33);
  assert.equal(Object.keys(r.summaries).length, 18);
  assert.equal(r.results.length, 594);
  const S = r.summaries;
  // Every trading style wins the campaign most of the time (with events on).
  for (const k of ['greedy-preview', 'conservative', 'leveraged', 'short-haul', 'foggy', 'clumsy']) {
    const s = S[`${k}/campaign+events`];
    assert.ok(s.wins / 33 >= 0.75, `${k} wins ${s.wins}/33`);
    assert.ok(s.seedsWithBankruptcy / 33 <= 0.5, `${k} bankrupt share ${s.seedsWithBankruptcy}/33`);
    assert.ok(s.topGood.share <= 0.8, `${k} top good share ${s.topGood.share}`);
  }
  // Free play: all trading styles end richer than the 2,000 start, no mass bankruptcy.
  for (const k of ['greedy-preview', 'conservative', 'leveraged', 'short-haul', 'foggy', 'clumsy']) {
    const s = S[`${k}/freeplay+events`];
    assert.ok(s.medianFinalNetWorth > 2000, `${k} freeplay median NW ${s.medianFinalNetWorth}`);
    assert.ok(s.seedsWithBankruptcy / 33 <= 0.5, `${k} freeplay bankrupt share ${s.seedsWithBankruptcy}/33`);
  }
  // Missions enter the report automatically: the mission runner completes M1 fast and often;
  // pure trading styles never complete it incidentally (a pinned design property).
  const m1e = S['errand/campaign+events'].missions['m1-oficio'];
  assert.ok(m1e.done / 33 >= 0.9, `errand M1 done ${m1e.done}/33`);
  assert.ok(m1e.medianDoneDay !== null && m1e.medianDoneDay <= 20, `errand M1 median day ${m1e.medianDoneDay}`);
  const m2e = S['errand/campaign+events'].missions['m2-nombre'];
  assert.ok(m2e.done / 33 >= 0.9, `errand M2 done ${m2e.done}/33`);
  assert.ok(m2e.medianDoneDay !== null && m2e.medianDoneDay <= 20, `errand M2 median day ${m2e.medianDoneDay}`);
  for (const k of ['greedy-preview', 'conservative', 'leveraged', 'specialist', 'short-haul', 'foggy', 'clumsy', 'industrial']) {
    assert.equal(S[`${k}/campaign+events`].missions['m1-oficio'].done, 0, `${k} completes M1 incidentally`);
    assert.equal(S[`${k}/campaign+events`].missions['m2-nombre'].done, 0, `${k} completes M2 incidentally`);
  }
  // Known weak strategies, pinned so a rebalance changes the baseline on purpose:
  // specialist (one good only) starves and never wins; industrial (build at home) rarely wins.
  assert.ok(S['specialist/campaign+events'].wins / 33 <= 0.2, `specialist wins ${S['specialist/campaign+events'].wins}/33`);
  assert.ok(S['specialist/campaign+events'].medianFinalNetWorth < 10000, `specialist median NW ${S['specialist/campaign+events'].medianFinalNetWorth}`);
  assert.ok(S['industrial/campaign+events'].wins / 33 <= 0.2, `industrial wins ${S['industrial/campaign+events'].wins}/33`);
  assert.ok(S['industrial/campaign+events'].medianFinalNetWorth < 20000, `industrial median NW ${S['industrial/campaign+events'].medianFinalNetWorth}`);
});

test('balance report rejects a bad roster', () => {
  assert.notEqual(spawnSync(process.execPath, ['tools/balance_report.mjs', '1', 'default', '0', 'bogus']).status, 0);
});
