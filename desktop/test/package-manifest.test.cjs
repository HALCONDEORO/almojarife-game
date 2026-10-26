'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

test('packaging includes entry point and its local runtime modules', () => {
  const root = path.join(__dirname, '..');
  const config = yaml.load(fs.readFileSync(path.join(root, 'electron-builder.yml'), 'utf8'));
  const main = require('../package.json').main;
  assert.ok(config.files.includes(main), 'package entry point');
  const source = fs.readFileSync(path.join(root, main), 'utf8');
  const imports = [...source.matchAll(/require\(['"](\.\/[^'"]+)['"]\)/g)].map(match => match[1].slice(2));
  assert.ok(imports.length > 0, 'exercise the runtime dependency coverage');
  for (const file of imports) {
    assert.ok(fs.existsSync(path.join(root, file)), `runtime module exists: ${file}`);
    assert.ok(config.files.includes(file), `runtime module packaged: ${file}`);
  }
  assert.equal(config.publish, null, 'no public release publishing');
});
