const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../..');
const bundlePath = path.join(repositoryRoot, 'dist/index.js');
const bundle = fs.readFileSync(bundlePath, 'utf8');

// These modules register browser behavior through imports alone. A valid CDN bundle must retain
// representative output from each side-effect category even when Webpack tree-shaking is enabled.
const requiredSideEffects = new Map([
  ['custom-element registration', 'customElements.define'],
  ['SDK stylesheet injection', '#pay-theory-badge-wrapper'],
  ['browser fetch polyfill', 'Invalid character in header field name'],
]);

const missingSideEffects = [...requiredSideEffects]
  .filter(([, marker]) => !bundle.includes(marker))
  .map(([name]) => name);

assert.deepEqual(
  missingSideEffects,
  [],
  `dist/index.js is missing required runtime side effects: ${missingSideEffects.join(', ')}`,
);
