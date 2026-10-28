import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRelease } from '../tools/release/prepare.mjs';
const sha = 'a'.repeat(40);
const input = { repo: 'owner/game', ref: 'refs/heads/main', version: 'v0.5.0-beta.3', sha, previousTag: 'v0.5.0-beta.2', confirmation: `v0.5.0-beta.3@${sha}` };
function fixture(overrides = {}) {
  const writes = []; let mainReads = 0;
  const gh = args => {
    const path = args.find(a => a.startsWith('repos/'));
    if (args.includes('POST')) writes.push(args);
    if (path.endsWith('git/ref/heads/main')) return { object: { sha: ++mainReads === 2 && overrides.drift ? 'b'.repeat(40) : sha } };
    if (path.includes('matching-refs')) return [overrides.tag ? [{ ref: `refs/tags/${input.version}` }] : []];
    if (path.endsWith('releases?per_page=100')) return [overrides.release ? [{ tag_name: input.version }] : []];
    if (path.includes('compare/')) return { status: overrides.comparison || 'ahead' };
    if (path.includes('actions/runs?')) return [{ workflow_runs: ['CI', 'secret scan', 'CodeQL'].filter(n => n !== overrides.missing).map(name => ({ name, head_sha: sha, run_number: 1, run_attempt: 1, status: 'completed', conclusion: name === overrides.failed ? 'failure' : 'success' })) }];
    if (path.endsWith('generate-notes')) return { body: overrides.empty ? '' : 'Merged pull requests' };
    if (path.endsWith('git/refs')) return {};
    if (path.endsWith('/releases')) {
      if (overrides.creationFailure) throw new Error('API unavailable');
      return { draft: true, prerelease: true, tag_name: input.version, html_url: 'https://example.invalid/draft' };
    }
    throw new Error(`Unexpected ${args}`);
  };
  return { gh, writes };
}
test('creates exact tag and draft prerelease, never a published release', () => {
  const f = fixture(); assert.equal(prepareRelease(input, f.gh), 'https://example.invalid/draft');
  assert.equal(f.writes.length, 3); // notes generation is a non-publishing POST
  assert.ok(f.writes[1].includes(`sha=${sha}`));
  assert.ok(f.writes[2].includes('draft=true')); assert.ok(f.writes[2].includes('prerelease=true'));
  assert.ok(f.writes[2].includes('make_latest=false'));
});
for (const [name, patch] of Object.entries({ branch: { ref: 'refs/heads/other' }, version: { version: 'v1.0.0' }, shell: { version: 'v1;echo bad' }, shortSHA: { sha: 'abc' }, confirmation: { confirmation: 'yes' }, sameTag: { previousTag: input.version } })) {
  test(`rejects invalid input: ${name}`, () => { const f = fixture(); assert.throws(() => prepareRelease({ ...input, ...patch }, f.gh)); assert.equal(f.writes.length, 0); });
}
for (const [name, overrides] of Object.entries({ tag: { tag: true }, release: { release: true }, ancestry: { comparison: 'diverged' }, failedCI: { failed: 'CI' }, missingScan: { missing: 'secret scan' }, emptyNotes: { empty: true }, drift: { drift: true } })) {
  test(`stops before tag mutation: ${name}`, () => { const f = fixture(overrides); assert.throws(() => prepareRelease(input, f.gh)); assert.ok(!f.writes.some(a => a.includes('ref=refs/tags/v0.5.0-beta.3'))); });
}
test('API read failure is fatal, not interpreted as absence', () => assert.throws(() => prepareRelease(input, () => { throw new Error('Forbidden'); }), /Forbidden/));
test('release failure keeps tag and never attempts deletion', () => { const f = fixture({ creationFailure: true }); assert.throws(() => prepareRelease(input, f.gh), /API unavailable/); assert.equal(f.writes.length, 3); assert.ok(f.writes.every(a => !a.includes('DELETE'))); });
