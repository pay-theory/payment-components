/* global module, require */
const fs = require('node:fs');
const path = require('node:path');
const { createInstrumenter } = require('istanbul-lib-instrument');

// Instrument original TypeScript before transpilation so counters refer to source lines.
// Seed every src file with zero counters; unimported modules remain uncovered.
module.exports = function staticCoverage(root) {
  const sources = new Map();
  const empty = {};
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(ts|js)$/.test(entry.name)) {
        const instrumenter = createInstrumenter({
          esModules: true,
          compact: false,
          parserPlugins: ['typescript'],
          preserveComments: true,
        });
        const code = instrumenter.instrumentSync(fs.readFileSync(file, 'utf8'), file);
        sources.set(`/${path.relative(root, file).split(path.sep).join('/')}`, code);
        empty[file] = instrumenter.lastFileCoverage();
      }
    }
  }
  visit(path.join(root, 'src'));
  return {
    initialCoverage: JSON.stringify(empty),
    plugin: {
      name: 'static-source-coverage',
      transform(context) {
        return sources.get(context.path);
      },
    },
  };
};
