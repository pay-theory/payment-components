/* global require, process, console */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const sdk = path.resolve(__dirname, '../..');
const socket = path.resolve(process.env.SOCKET_ROOT || '../tags-secure-socket');
const fields = path.resolve(process.env.SECURE_TAGS_LIB_ROOT || '../secure-tags-lib');
const evidence = path.resolve(process.env.CONTRACT_EVIDENCE_DIR || path.join(sdk, 'coverage/cross-repo'));
const python = process.env.PYTHON || 'python3';
const producer = path.join(socket, 'tools/contracts/produce_socket_messages.py');
assert.ok(fs.existsSync(producer), 'SOCKET_ROOT must contain the actual versioned socket producer corpus');
assert.ok(fs.existsSync(path.join(fields, 'src/utils/socketMessageParsing.ts')), 'Actual hosted consumer source is required');
fs.mkdirSync(evidence, { recursive: true });
const env = { ...process.env, SOCKET_ROOT: socket, SECURE_TAGS_LIB_ROOT: fields, CONTRACT_EVIDENCE_DIR: evidence };
execFileSync(python, [producer, '--socket-root', socket, '--output', path.join(evidence, 'socket-wire-messages.json')], { env, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'check-wire-contracts.cjs')], { cwd: sdk, env, stdio: 'inherit' });
const vitest = path.join(fields, 'node_modules/vitest/vitest.mjs');
assert.ok(fs.existsSync(vitest), 'Install actual hosted-library lockfile dependencies to execute its hooks');
execFileSync(process.execPath, [vitest, 'run', '--config', path.join(__dirname, 'vitest.config.cjs'), '--reporter=default', '--reporter=json',
  '--outputFile=' + path.join(evidence, 'hosted-consumer-tests.json')], { cwd: sdk, env, stdio: 'inherit' });
const snapshots = {};
for (const [name, root, files] of [
  ['sdk', sdk, ['src/common/format.ts', 'src/paytheory-sdk.ts', 'src/messenger/pay-theory-messenger.ts']],
  ['socket', socket, ['pt_websocket/session_messenger/host_actions.py', 'pt_websocket/session_messenger/transfer.py', 'pt_websocket/session_messenger/host_token.py']],
  ['hosted', fields, ['src/utils/socketMessageParsing.ts', 'src/hooks/action/useMessenger/useMessenger.ts', 'src/hooks/communication/useWebSocket/index.ts']],
]) {
  snapshots[name] = { revision: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceFiles: Object.fromEntries(files.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')])) };
}
fs.writeFileSync(path.join(evidence, 'source-provenance.json'), JSON.stringify({ ...snapshots,
  caveat: 'Parent revisions plus exact subject hashes are recorded; uncommitted test/workflow edits may exist during local development. No live providers or deployed versions were exercised.' }, null, 2) + '\n');
console.log('Actual socket -> hosted consumer -> SDK contract corpus passed.');
