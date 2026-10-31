// Read-only delivery evidence. This does not approve, merge or publish anything.
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const REQUIRED_CHECKS = ['balance', 'test', 'gitleaks', 'CodeQL', 'Analyze (python)', 'Analyze (actions)', 'Analyze (javascript-typescript)'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const shaPattern = /^[a-f0-9]{40}$/;

// Check-runs are newest first. A later rerun must not be hidden by an older success.
function latestChecks(checks) {
  const latest = new Map();
  for (const check of checks) if (!latest.has(check.name)) latest.set(check.name, check);
  return latest;
}

function validateProvenance(latest, expectedHead, required, errors) {
  const trustedApps = { 'github-actions': 15368, 'github-advanced-security': 57789, coderabbitai: 347564 };
  for (const check of latest.values()) {
    if (check.head_sha !== expectedHead) errors.push(`Check SHA mismatch: ${check.name}`);
    if (trustedApps[check.app?.slug] !== check.app?.id || !check.app?.id) errors.push(`Unrecognized check app: ${check.name}`);
    const requiredApp = check.name === 'CodeQL' ? 'github-advanced-security' : 'github-actions';
    if (required.includes(check.name) && check.app?.slug !== requiredApp) errors.push(`Wrong required-check app: ${check.name}`);
  }
}

function validateConclusions(latest, required, errors) {
  for (const name of required) {
    const check = latest.get(name);
    if (!check || check.status !== 'completed' || check.conclusion !== 'success') errors.push(`Required check is not successful: ${name}`);
  }
  for (const check of latest.values()) {
    if (check.status !== 'completed' || !['success', 'neutral', 'skipped'].includes(check.conclusion)) errors.push(`Unfinished or failed check: ${check.name}`);
  }
}

export function candidateEvidence(pr, expectedHead, checks, status, required = REQUIRED_CHECKS) {
  const errors = [];
  if (!shaPattern.test(expectedHead) || pr.head?.sha !== expectedHead) errors.push('PR head does not match the requested full SHA');
  if (pr.state !== 'open' || pr.merged) errors.push('PR is not an open candidate');
  if (status.sha !== expectedHead) errors.push('Commit status SHA does not match requested head');
  if (checks.total_count !== checks.check_runs?.length) errors.push('Check list is incomplete');
  const latest = latestChecks(checks.check_runs ?? []);
  validateProvenance(latest, expectedHead, required, errors);
  validateConclusions(latest, required, errors);
  const deepSource = status.statuses?.find(entry => entry.context === 'DeepSource: JavaScript');
  if (status.state !== 'success' || deepSource?.state !== 'success') errors.push('Commit statuses or DeepSource are not successful');
  return { ok: errors.length === 0, errors, head: pr.head?.sha, pr: pr.html_url, checks: [...latest.values()].map(check => ({ name: check.name, head: check.head_sha, app: check.app?.slug, appId: check.app?.id, conclusion: check.conclusion, url: check.html_url })), deepSource: deepSource?.target_url, balancePolicy: 'Balance is conservatively required for every candidate. If path filters omit it, this script cannot declare the candidate fully green; validate applicability separately against the current workflow.', independentReview: 'Not verified by this script. Exact-head independent approval is still required.' };
}

export function deploymentEvidence(pr, expectedMerge, runs, requestedPaths, comparisons) {
  const errors = [];
  if (!shaPattern.test(expectedMerge) || !pr.merged || pr.merge_commit_sha !== expectedMerge) errors.push('Merged PR does not match the requested full merge SHA');
  const deployment = runs.workflow_runs?.find(run => run.path === 'dynamic/pages/pages-build-deployment' && run.head_sha === expectedMerge);
  if (!deployment || deployment.status !== 'completed' || deployment.conclusion !== 'success') errors.push('No successful Pages deployment for the exact merge SHA');
  if (!requestedPaths.length) errors.push('No production paths requested');
  if (new Set(requestedPaths).size !== requestedPaths.length) errors.push('Duplicate production paths');
  if (comparisons.length !== requestedPaths.length || requestedPaths.some(path => comparisons.filter(item => item.path === path).length !== 1)) errors.push('Production byte comparisons are incomplete');
  for (const item of comparisons) if (!item.matches) errors.push(`Production bytes differ: ${item.path}`);
  return { ok: errors.length === 0, errors, merge: expectedMerge, pr: pr.html_url, deployment: deployment?.html_url, files: comparisons, scope: 'Only the listed paths were byte-verified. No visual or behavior verification is implied.' };
}

export function safePath(value) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(value) || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..')) throw Error(`Unsafe relative path: ${value}`);
  return value;
}

async function get(url, json = true) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Almojarife-delivery-verifier', 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`);
  return json ? response.json() : Buffer.from(await response.arrayBuffer());
}

async function main(args) {
  const [mode, number, expected, ...paths] = args;
  if (!['candidate', 'delivered'].includes(mode) || !/^[1-9][0-9]*$/.test(number ?? '') || !shaPattern.test(expected ?? '') || (mode === 'candidate' && paths.length)) throw Error('Usage: node tools/delivery/verify.mjs candidate PR FULL_HEAD_SHA | delivered PR FULL_MERGE_SHA PATH [PATH...]');
  const api = 'https://api.github.com/repos/HALCONDEORO/almojarife-game/';
  const pr = await get(`${api}pulls/${number}`);
  let evidence = null;
  if (mode === 'candidate') {
    const [checks, status] = await Promise.all([get(`${api}commits/${expected}/check-runs?per_page=100`), get(`${api}commits/${expected}/status`)]);
    evidence = candidateEvidence(pr, expected, checks, status);
  } else {
    paths.forEach(safePath);
    if (!paths.length) throw Error('Specify at least one production path to compare');
    const runs = await get(`${api}actions/runs?head_sha=${expected}&per_page=100`);
    const comparisons = [];
    for (const path of paths) {
      const source = `https://raw.githubusercontent.com/HALCONDEORO/almojarife-game/${expected}/${path}`;
      const production = `https://halcondeoro.github.io/almojarife-game/${path}?delivery=${expected}`;
      const [wanted, published] = await Promise.all([get(source, false), get(production, false)]);
      comparisons.push({ path, matches: wanted.equals(published), expectedSha256: digest(wanted), publishedSha256: digest(published), source, production });
    }
    evidence = deploymentEvidence(pr, expected, runs, paths, comparisons);
  }
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!evidence.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
