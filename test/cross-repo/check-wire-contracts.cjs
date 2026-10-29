/* Offline cross-repository audit: actual socket -> hosted transformer -> SDK parser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sdk = path.resolve(__dirname, '../..');
const fields = path.resolve(process.env.SECURE_TAGS_LIB_ROOT || '../secure-tags-lib');
const evidence = path.resolve(process.env.CONTRACT_EVIDENCE_DIR || 'coverage/cross-repo');
fs.mkdirSync(evidence, { recursive: true });
const esbuild = require(path.join(sdk, 'node_modules/esbuild'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'paytheory-wire-contracts-'));
const bundle = path.join(temporary, 'consumers.cjs');
esbuild.buildSync({
  stdin: {
    contents: `exports.hosted = require(${JSON.stringify(path.join(fields, 'src/utils/socketMessageParsing.ts'))});
exports.sdk = require(${JSON.stringify(path.join(sdk, 'src/common/format.ts'))});`,
    resolveDir: sdk,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'es2020',
  alias: { '@': path.join(fields, 'src') },
  outfile: bundle,
  logLevel: 'silent',
});
try {
const posted = [];
global.window = {
  location: { origin: 'https://synthetic-merchant.invalid' },
  postMessage: (...args) => posted.push(args),
};
global.fetch = () => { throw new Error('network forbidden'); };
const { hosted, sdk: consumer } = require(bundle);
const messages = JSON.parse(fs.readFileSync(path.join(evidence, 'socket-wire-messages.json'), 'utf8'));
const results = [];
const expectedCases = [
  'transfer-success-False', 'transfer-decline-False', 'transfer-transport-False',
  'transfer-success-True', 'transfer-decline-True', 'transfer-transport-True',
  'confirmation', 'fee-no-payment-type',
  'tokenize-True-False', 'tokenize-False-False', 'tokenize-True-True', 'tokenize-False-True',
  'barcode-False', 'barcode-True', 'wallet-APPLE_PAY', 'wallet-GOOGLE_PAY', 'wallet-PAZE',
  'host-token-wallets-False', 'host-token-wallets-True', 'hosted-checkout-button',
  'hosted-checkout-qr_code', 'invoice-resend', 'apple-merchant-session', 'cancel-acknowledgment',
];
assert.deepEqual(messages.map(message => message.case).sort(), expectedCases.sort(),
  'Every required financial and control producer case must execute');
for (const message of messages) {
  const input = { type: message.type, body: message.body };
  let relay;
  let output;
  if (message.type === 'transfer_complete') {
    relay = hosted.transformTransferComplete(input, 'card-number', message.expanded);
    output = consumer.parseResponse(relay);
    const failed = message.case.includes('decline');
    assert.equal(output.type, failed ? 'FAILED' : 'SUCCESS');
    if (message.expanded) {
      assert.equal(output.body.transaction_id, 'transaction');
      assert.equal(output.body.status, failed ? 'FAILED' : 'PENDING');
    } else {
      assert.equal(output.body.receipt_number, 'transaction');
      assert.equal(output.body.last_four, '4242');
      if (failed) assert.equal(output.body.reason.failure_code, 'GENERIC_DECLINE');
      else {
        assert.deepEqual(output.body.metadata, { order: 'synthetic-order' });
        assert.deepEqual(output.body.tags, output.body.metadata);
        assert.equal(output.body.payment_method_id, 'pm');
      }
    }
  } else if (message.type === 'error') {
    relay = hosted.transformError(input, 'card-number');
    output = consumer.parseResponse(relay);
    assert.equal(output.type, 'ERROR');
    assert.equal(output.error, `SOCKET_ERROR: ${message.case.startsWith('tokenize-') ? 'Token validation failed: Token declined' : 'upstream unavailable'}`);
    assert.equal(posted.at(-1)[1], window.location.origin);
  } else if (message.type === 'transfer_confirmation') {
    relay = hosted.transformTransferConfirmation(input, 'card-number', '4242424242424242', 'visa', { visa: 'VISA' });
    output = consumer.parseResponse(relay);
    assert.equal(output.type, 'CONFIRMATION');
    assert.equal(output.body.amount, 1050);
    assert.equal(output.body.service_fee, 50);
    assert.equal(output.body.receipt_number, 'transaction');
    assert.equal(output.body.last_four, '4242');
    assert.equal(output.body.first_six, '424242');
    assert.equal(JSON.stringify(relay).includes('confirmation_signature'), false);
    assert.equal(JSON.stringify(relay).includes('merchant_identity'), false);
  } else if (message.type === 'calculate_fee_complete') {
    relay = hosted.transformCalculateFee(input, 'card-number');
    // The active SDK fee consumer uses fee; no payment_type is produced upstream.
    assert.equal(relay.type, 'pt-static:calculated_fee');
    assert.equal(relay.body.fee, 50);
    assert.equal(relay.body.payment_type, null);
    output = { type: relay.type, fee: relay.body.fee, payment_type: relay.body.payment_type };
  } else if (message.type === 'tokenize_complete' || message.type === 'tokenize_failure') {
    relay = message.type === 'tokenize_complete'
      ? hosted.transformTokenizeComplete(input, 'card-number', message.expanded)
      : hosted.transformTokenizeFailure(input, 'card-number', message.expanded);
    output = consumer.parseResponse(relay);
    assert.equal(output.type, message.type === 'tokenize_failure' ? 'FAILED' : 'TOKENIZED');
    if (message.type === 'tokenize_complete') {
      assert.ok(output.body.payment_method_id);
      assert.equal(JSON.stringify(output).includes('processor_token'), false);
    }
  } else if (message.type === 'barcode_complete') {
    relay = hosted.transformBarcodeComplete(input, 'cash-contact');
    output = consumer.parseResponse(relay);
    assert.equal(output.type, 'CASH');
    assert.equal(output.body.barcodeUrl, input.body.barcodeUrl);
  } else if (['host_token', 'hosted_checkout', 'apple_merchant_validation', 'resend_invoice_email_success', 'cancel'].includes(message.type)) {
    // These actual control replies additionally run through the real hosted hooks
    // in hosted-consumers.contract-spec.js; no invented parser substitutes for it.
    relay = input;
    output = { type: 'CONTROL_REPLY_FOR_HOSTED_HOOK' };
  } else {
    throw new Error(`Unexpected actual producer type: ${message.type}`);
  }
  results.push({ case: message.case, wireType: message.type, relayType: relay.type, publicType: output.type });
}
assert.ok(results.length >= 8);
assert.equal(new Set(results.map(x => x.case)).size, results.length, 'Every corpus case must be unique');
fs.writeFileSync(path.join(evidence, 'wire-contract-results.json'), JSON.stringify({
  outcome: 'passed', cases: results,
  scope: 'Actual Python handlers, JWT checks, message/history builders and box encryption; API/storage/provider/secret boundaries synthetic. Actual hosted transforms and SDK parser for financial replies; real hosted hooks separately verify control replies. Per-repository coverage is reported separately.',
}, null, 2) + '\n');
console.log(`Passed ${results.length} actual producer/hosted/SDK wire-contract cases.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
