/* global require, process, __dirname, module */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCoverageMap } = require('istanbul-lib-coverage');

const root = path.resolve(__dirname, '..');
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'coverage-baseline.json'), 'utf8'));
const metrics = ['lines', 'statements', 'functions', 'branches'];
const targets = {
  'src/components/pay-theory-hosted-field-transactional/index.ts': { lines: 90, branches: 80 },
  'src/components/pay-theory-hosted-field/index.ts': { lines: 90 },
  'src/field-set/payment-fields-v2.ts': { lines: 90, branches: 80 },
  'src/field-set/validation.ts': { lines: 95, branches: 90 },
  'src/field-set/payment-qr.ts': { lines: 85, branches: 75 },
  'src/components/pay-theory-checkout-qr/index.ts': { lines: 85, branches: 75 },
};
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(absolute) : /\.(ts|js)$/.test(entry.name) ? [path.relative(root, absolute).split(path.sep).join('/')] : [];
  }).sort();
}
function run(reportDirectory = path.join(root, 'coverage')) {
  const raw = JSON.parse(fs.readFileSync(path.join(reportDirectory, 'coverage-final.json'), 'utf8'));
  const reported = JSON.parse(fs.readFileSync(path.join(reportDirectory, 'coverage-summary.json'), 'utf8'));
  const actual = createCoverageMap(raw);
  const inventory = sourceFiles(path.join(root, 'src'));
  const errors = [];
  // These two unreachable URLs are deliberate old browser-fixture inputs,
  // not provider endpoints. Everything else must be served locally or fail.
  const expectedBlocked = new Set(['https://example.com/secure-iframe', 'https://cdn.example/late.js']);
  const network = fs.readFileSync(path.join(reportDirectory, 'network-guard.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).flatMap(line => JSON.parse(line));
  for (const request of network) {
    if (request.disposition === 'blocked' && !expectedBlocked.has(request.url)) errors.push(`Unexpected remote request was blocked: ${request.url}`);
    else if (!['blocked', 'local-fixture-fulfill'].includes(request.disposition)) errors.push('Invalid network ledger disposition');
  }
  const byName = new Map(actual.files().map(file => [path.relative(root, file).split(path.sep).join('/'), file]));
  if (JSON.stringify([...byName.keys()].sort()) !== JSON.stringify(inventory)) errors.push('Coverage inventory does not match every owned runtime/type source file. Unloaded modules must remain zero-seeded.');
  if (JSON.stringify(Object.keys(baseline.files).sort()) !== JSON.stringify(inventory)) errors.push('Source inventory changed from the reviewed baseline; explicitly review and regenerate the baseline instead of dropping files.');
  const total = actual.getCoverageSummary().toJSON();
  for (const metric of metrics) {
    for (const key of ['covered', 'total']) if (total[metric][key] !== reported.total[metric][key]) errors.push(`Summary/raw mismatch: total ${metric}.${key}`);
  }
  const results = {};
  function gate(label, summary, minimums) {
    for (const [metric, threshold] of Object.entries(minimums)) {
      const minimum = Math.ceil(summary[metric].total * threshold / 100);
      if (!summary[metric].total || summary[metric].covered < minimum) errors.push(`${label}: ${metric} ${summary[metric].covered}/${summary[metric].total} below ${threshold}% (requires ${minimum})`);
    }
  }
  gate('Whole source', total, { lines: 80, branches: 70 });
  for (const name of inventory) {
    const rawPath = byName.get(name);
    if (!rawPath) continue;
    const file = actual.fileCoverageFor(rawPath);
    const summary = file.toSummary().toJSON();
    results[name] = summary;
    const previous = baseline.files[name];
    const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
    if (!previous || sourceHash !== previous.sourceSha256) errors.push(`${name}: source changed; review contracts and baseline denominators explicitly before accepting a measurement change.`);
    for (const metric of metrics) {
      const listed = reported[rawPath]?.[metric];
      if (!listed || listed.total !== summary[metric].total || listed.covered !== summary[metric].covered) errors.push(`${name}: ${metric} summary/raw mismatch`);
      if (previous && summary[metric].total !== previous.metrics[metric].total) errors.push(`${name}: ${metric} denominator changed`);
      if (previous && summary[metric].covered < previous.metrics[metric].covered) errors.push(`${name}: ${metric} coverage regressed`);
    }
    if (targets[name]) gate(name, summary, targets[name]);
  }
  const output = { networkGuard: { requests: network.length, expectedBlocked: network.filter(request => request.disposition === 'blocked').length, unexpectedBlocked: network.filter(request => request.disposition === 'blocked' && !expectedBlocked.has(request.url)).length }, baselineRevision: baseline.revision, sourceFiles: inventory.length, total, criticalPaths: Object.fromEntries(Object.keys(targets).map(name => [name, results[name]])), errors };
  fs.writeFileSync(path.join(reportDirectory, 'coverage-gates.json'), JSON.stringify(output, null, 2) + '\n');
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  if (errors.length) throw new Error(`${errors.length} coverage acceptance checks failed`);
  return output;
}
module.exports = { run };
if (require.main === module) run(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
