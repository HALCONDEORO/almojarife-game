import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateEvidence, deploymentEvidence, REQUIRED_CHECKS, safePath } from '../tools/delivery/verify.mjs';
const head = 'a'.repeat(40), merge = 'b'.repeat(40);
const candidate = () => ({ state: 'open', merged: false, head: { sha: head }, html_url: 'fixture:pr' });
const checks = () => ({ total_count: REQUIRED_CHECKS.length, check_runs: REQUIRED_CHECKS.map(name => ({ name, status: 'completed', conclusion: 'success' })) });
const status = () => ({ state: 'success', statuses: [{ context: 'DeepSource: JavaScript', state: 'success' }] });
const merged = () => ({ merged: true, merge_commit_sha: merge });
const runs = () => ({ workflow_runs: [{ path: 'dynamic/pages/pages-build-deployment', head_sha: merge, status: 'completed', conclusion: 'success' }] });

test('candidate requires the exact full SHA, every named gate, and DeepSource', () => {
  assert.equal(candidateEvidence(candidate(), head, checks(), status()).ok, true);
  assert.equal(candidateEvidence(candidate(), merge, checks(), status()).ok, false);
  assert.equal(candidateEvidence(candidate(), head.slice(0, 7), checks(), status()).ok, false);
  for (const name of REQUIRED_CHECKS) {
    const missing = checks(); missing.check_runs = missing.check_runs.filter(check => check.name !== name); missing.total_count--;
    assert.equal(candidateEvidence(candidate(), head, missing, status()).ok, false, `missing ${name}`);
  }
  assert.equal(candidateEvidence(candidate(), head, checks(), { state: 'success', statuses: [] }).ok, false);
});

test('newest rerun, incomplete lists, extra failed or pending checks all fail closed', () => {
  for (const [state, conclusion] of [['in_progress', null], ['completed', 'failure'], ['completed', 'skipped']]) {
    const changed = checks(); changed.check_runs.unshift({ name: 'test', status: state, conclusion }); changed.total_count++;
    assert.equal(candidateEvidence(candidate(), head, changed, status()).ok, false);
  }
  const partial = checks(); partial.total_count++;
  assert.equal(candidateEvidence(candidate(), head, partial, status()).ok, false);
  const failed = checks(); failed.check_runs.push({ name: 'balance', status: 'completed', conclusion: 'failure' }); failed.total_count++;
  assert.equal(candidateEvidence(candidate(), head, failed, status()).ok, false);
});

test('delivery requires merged SHA, successful exact-SHA Pages run and all requested byte comparisons', () => {
  const paths = ['web/main.mjs'], files = [{ path: paths[0], matches: true }];
  assert.equal(deploymentEvidence(merged(), merge, runs(), paths, files).ok, true);
  assert.equal(deploymentEvidence(candidate(), merge, runs(), paths, files).ok, false);
  const wrong = runs(); wrong.workflow_runs[0].head_sha = head;
  assert.equal(deploymentEvidence(merged(), merge, wrong, paths, files).ok, false);
  const pending = runs(); pending.workflow_runs[0].status = 'in_progress';
  assert.equal(deploymentEvidence(merged(), merge, pending, paths, files).ok, false);
  assert.equal(deploymentEvidence(merged(), merge, runs(), [], []).ok, false);
  assert.equal(deploymentEvidence(merged(), merge, runs(), paths, []).ok, false);
  assert.equal(deploymentEvidence(merged(), merge, runs(), paths, [{ path: paths[0], matches: false }]).ok, false);
  assert.equal(deploymentEvidence(merged(), merge, runs(), paths, [{ path: 'other', matches: true }]).ok, false);
});

test('file paths cannot escape the requested production tree', () => {
  assert.equal(safePath('src/game/game.mjs'), 'src/game/game.mjs');
  for (const value of ['../secret', '/web/main.mjs', 'web//main.mjs', 'web/./main.mjs', 'web/main.mjs?x=1', 'https://elsewhere.test']) assert.throws(() => safePath(value));
});
