'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const asar = require('@electron/asar');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'almojarife-globs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function consumerMatcher(consumer) {
  return require(require.resolve('minimatch', { paths: [require.resolve(consumer)] }));
}

test('modern glob consumers resolve the patched named API, legacy consumers stay callable', () => {
  for (const consumer of ['app-builder-lib', '@electron/universal', 'filelist']) {
    const matcher = consumerMatcher(consumer);
    const manifest = require(require.resolve('minimatch/package.json', { paths: [require.resolve(consumer)] }));
    assert.equal(manifest.version, '11.0.3', consumer);
    assert.equal(matcher.minimatch('app/index.html', '**/*.html'), true, consumer);
  }
  for (const consumer of ['@electron/asar', 'dir-compare', 'glob']) {
    const matcher = consumerMatcher(consumer);
    assert.equal(typeof matcher, 'function', consumer);
    assert.equal(matcher('app/index.html', '**/*.html'), true, consumer);
  }
});

test('builder patterns and filelist preserve include/exclude glob behavior', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'index.html'), 'game');
  fs.writeFileSync(path.join(root, 'notes.tmp'), 'ignore');
  const { FileMatcher } = require('app-builder-lib/out/fileMatcher');
  const patterns = [];
  new FileMatcher(root, root, value => value, ['**/*.html']).computeParsedPatterns(patterns);
  assert.equal(patterns[0].match('app/index.html'), true);
  assert.equal(patterns[0].match('app/notes.tmp'), false);
  const files = new (require('filelist').FileList)(path.join(root, '*'));
  files.exclude(path.join(root, '*.tmp'));
  assert.deepEqual(files.toArray(), [path.join(root, 'index.html')]);
});

test('legacy directory filters and ASAR unpack globs still execute', async t => {
  const root = fixture(t);
  const input = path.join(root, 'input');
  fs.mkdirSync(input);
  fs.mkdirSync(path.join(input, 'assets'));
  fs.writeFileSync(path.join(input, 'assets', 'index.html'), 'game content');
  assert.equal(require('dir-compare').compareSync(input, input, { includeFilter: '*.html', excludeFilter: '*.tmp' }).same, true);
  assert.deepEqual(require('glob').sync('**/*.html', { cwd: input }), ['assets/index.html']);
  const archive = path.join(root, 'game.asar');
  await asar.createPackageWithOptions(input, archive, { unpackDir: '**/assets', unpack: '**/*.html' });
  assert.equal(asar.extractFile(archive, 'assets/index.html').toString(), 'game content');
  assert.equal(asar.statFile(archive, 'assets/index.html').unpacked, true);
});

test('universal ASAR merge accepts allowed unique files and rejects nonmatching globs', async t => {
  const root = fixture(t);
  for (const arch of ['x64', 'arm64']) {
    const input = path.join(root, arch);
    fs.mkdirSync(input);
    fs.writeFileSync(path.join(input, 'index.html'), 'shared game content');
    if (arch === 'x64') fs.writeFileSync(path.join(input, 'x64.txt'), 'architecture note');
    await asar.createPackage(input, path.join(root, `${arch}.asar`));
  }
  const { mergeASARs } = require('@electron/universal/dist/cjs/asar-utils');
  const options = { x64AsarPath: path.join(root, 'x64.asar'), arm64AsarPath: path.join(root, 'arm64.asar'), outputAsarPath: path.join(root, 'merged.asar') };
  await assert.rejects(mergeASARs({ ...options, singleArchFiles: '*.bin' }), /not covered/);
  await mergeASARs({ ...options, singleArchFiles: '*.txt' });
  assert.equal(asar.extractFile(options.outputAsarPath, 'x64.txt').toString(), 'architecture note');
  assert.equal(asar.extractFile(options.outputAsarPath, 'index.html').toString(), 'shared game content');
});
