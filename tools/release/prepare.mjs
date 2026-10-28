import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function prepareRelease({ repo, version, sha, previousTag, confirmation, ref, checkoutSha }, gh) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('Invalid repository');
  if (ref !== 'refs/heads/main') throw new Error('Run only from main');
  if (!/^v\d+\.\d+\.\d+-beta\.\d+$/.test(version || '')) throw new Error('Only beta versions are supported');
  if (!/^[0-9a-f]{40}$/.test(sha || '')) throw new Error('Expected a full commit SHA');
  if (!/^v\d+\.\d+\.\d+(?:-beta\.\d+)?$/.test(previousTag || '') || previousTag === version) throw new Error('Invalid previous tag');
  if (checkoutSha !== sha) throw new Error('Workflow checkout must match approved SHA');
  if (confirmation !== `${version}@${sha}`) throw new Error('Confirmation must match version@SHA');
  const api = (path, ...args) => gh(['api', `repos/${repo}/${path}`, ...args]);
  if (api('git/ref/heads/main').object.sha !== sha) throw new Error('main moved; review the new head');
  // A complete list makes absence unambiguous; never treat an API failure as absence.
  const refs = gh(['api', '--paginate', '--slurp', `repos/${repo}/git/matching-refs/tags/${version}`]).flat();
  if (refs.some(r => r.ref === `refs/tags/${version}`)) throw new Error('Tag already exists; do not overwrite');
  const releases = gh(['api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`]).flat();
  if (releases.some(r => r.tag_name === version)) throw new Error('Release already exists; do not overwrite');
  const comparison = api(`compare/${previousTag}...${sha}`);
  if (comparison.status !== 'ahead') throw new Error('Previous tag must be an ancestor with new commits');
  const runs = gh(['api', '--paginate', '--slurp', `repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`]).flatMap(p => p.workflow_runs);
  const required = [
    { label: 'CI', name: 'CI', path: '.github/workflows/ci.yml', event: 'push' },
    { label: 'secret scan', name: 'secret scan', path: '.github/workflows/gitleaks.yml', event: 'push' },
    // GitHub default setup emits a dynamic workflow, not a push named CodeQL.
    { label: 'CodeQL', name: 'Push on main', path: 'dynamic/github-code-scanning/codeql', event: 'dynamic', workflow_id: 389523448 },
  ];
  for (const expected of required) {
    const run = runs.filter(r => r.name === expected.name && r.path === expected.path && r.event === expected.event && (!expected.workflow_id || r.workflow_id === expected.workflow_id) && r.head_sha === sha && r.head_branch === 'main').sort((a, b) => b.run_number - a.run_number || b.run_attempt - a.run_attempt)[0];
    if (!run || run.status !== 'completed' || run.conclusion !== 'success') throw new Error(`${expected.label} must be successful on the exact SHA`);
  }
  const generated = api('releases/generate-notes', '--method', 'POST', '-f', `tag_name=${version}`, '-f', `target_commitish=${sha}`, '-f', `previous_tag_name=${previousTag}`);
  if (!generated.body?.trim()) throw new Error('Empty generated release notes');
  // Recheck after reads, immediately before the first write. Tag stays pinned even if main later moves.
  if (api('git/ref/heads/main').object.sha !== sha) throw new Error('main moved during preparation');
  api('git/refs', '--method', 'POST', '-f', `ref=refs/tags/${version}`, '-f', `sha=${sha}`);
  // If draft creation fails, keep the immutable tag and fail loudly. Do not delete or retry blindly.
  const release = api('releases', '--method', 'POST', '-f', `tag_name=${version}`, '-f', `target_commitish=${sha}`, '-f', `name=${version}`, '-f', `body=${generated.body}\n\nSource checkpoint: ${sha}. Desktop packages are not built or attached by this workflow. Publication remains a separate approved step.`, '-F', 'draft=true', '-F', 'prerelease=true', '-f', 'make_latest=false');
  if (!release.draft || !release.prerelease || release.tag_name !== version) throw new Error('Unexpected release state; inspect manually');
  return release.html_url;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const gh = args => JSON.parse(execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  try {
    console.log(prepareRelease({ repo: process.env.GITHUB_REPOSITORY, ref: process.env.GITHUB_REF, checkoutSha: process.env.GITHUB_SHA, version: process.env.VERSION, sha: process.env.EXPECTED_SHA, previousTag: process.env.PREVIOUS_TAG, confirmation: process.env.CONFIRMATION }, gh));
  } catch (error) {
    console.error(`Release preparation failed: ${error.message}. Inspect tags/releases before any retry; an already-created tag is never deleted automatically.`);
    process.exitCode = 1;
  }
}
