/* global require, process, console */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const sibling = path.resolve(process.env.SECURE_TAGS_LIB_ROOT || '../secure-tags-lib');
assert.ok(
  fs.existsSync(path.join(sibling, 'src/utils/messengerChannelSecurity.ts')),
  'SECURE_TAGS_LIB_ROOT must identify the actual sibling checkout, including its command validator',
);
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const compiled = new Module(file, module);
  cache.set(file, compiled);
  compiled.filename = file;
  const requireFromFile = Module.createRequire(file);
  compiled.require = specifier => {
    if (specifier.startsWith('.')) {
      const candidate = path.resolve(path.dirname(file), `${specifier}.ts`);
      if (fs.existsSync(candidate)) return load(candidate);
    }
    return requireFromFile(specifier);
  };
  compiled._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText,
    file,
  );
  return compiled.exports;
}
const sdk = load(path.resolve('src/messenger/constants.ts'));
const hosted = load(path.join(sibling, 'src/constants/messageTypes.ts'));
const { validMessengerCommand } = load(path.join(sibling, 'src/utils/messengerChannelSecurity.ts'));
const constants = Object.keys(sdk).filter(key => key.startsWith('PT_MESSENGER_'));
for (const key of constants)
  assert.equal(sdk[key], hosted[key], `SDK/hosted constant mismatch: ${key}`);
for (const type of [sdk.PT_MESSENGER_MERCHANT_VALIDATION, sdk.PT_MESSENGER_RESEND_INVOICE_EMAIL])
  assert.equal(validMessengerCommand({ type, messageId: 'synthetic', data: undefined }), true);
assert.equal(
  validMessengerCommand({
    type: sdk.PT_MESSENGER_RECONNECT_TOKEN,
    messageId: 'synthetic',
    data: { token: 'renewed' },
  }),
  true,
);
for (const wallet_type of [
  sdk.PT_WALLET_TYPE_APPLE,
  sdk.PT_WALLET_TYPE_GOOGLE,
  sdk.PT_WALLET_TYPE_PAZE,
])
  assert.equal(
    validMessengerCommand({
      type: sdk.PT_MESSENGER_WALLET_TRANSACTION,
      messageId: 'synthetic',
      data: {
        wallet_type,
        amount: 100,
        digital_wallet_payload:
          wallet_type === 'PAZE'
            ? 'synthetic-paze-encrypted-token'
            : JSON.stringify({ synthetic: true }),
        timezone: 'America/New_York',
        send_receipt: false,
        fee: 0,
      },
    }),
    true,
    wallet_type,
  );
for (const message of [
  {
    type: sdk.PT_MESSENGER_WALLET_TRANSACTION,
    messageId: 'bad',
    data: {
      wallet_type: 'APPLE_PAY',
      amount: 0,
      digital_wallet_payload: {},
      timezone: 'America/New_York',
    },
  },
  { type: sdk.PT_MESSENGER_RECONNECT_TOKEN, messageId: 'bad', data: { token: '' } },
  { type: sdk.PT_MESSENGER_MERCHANT_VALIDATION, messageId: 'bad', host_token: 'injected' },
])
  assert.equal(validMessengerCommand(message), false);
console.log(
  `Actual sibling contract: ${constants.length} messenger constants, all four commands, three SDK wallet enums, malformed-command rejection passed (${sibling}).`,
);
