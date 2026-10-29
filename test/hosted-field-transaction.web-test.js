import { expect } from '@open-wc/testing';
import { fixture, data } from './support/real-fields-fixture.js';
import * as actions from '../src/field-set/actions.ts';
import { tokenizeObserver, captureObserver, transactedObserver } from '../src/common/observe.ts';

const successful = { type: 'pt-static:complete', paymentType: 'transfer', expandedResponse: true, body: { status: 'SUCCEEDED', id: 'payment-1', metadata: { zero: 0, no: false } } };
const declined = { ...successful, body: { status: 'FAILED', id: 'decline-1', reason: 'DECLINED', code: 'D1' } };
const transport = { type: 'pt-static:error', error: 'SOCKET_ERROR: TRANSPORT: synthetic', field: 'card-number' };

describe('actual hosted transaction methods and public actions through native peer ports [HF13-HF17]', () => {
  let f, element, frames;
  beforeEach(async () => { f = fixture(); element = f.mount(data.COMBINED_CARD, { metadata: { initial: true }, feeMode: 'service_fee' }); frames = await f.prepare(element); });
  afterEach(() => f.cleanup());
  const configure = async replies => { await f.command(frames[0], 'configure', { replies }); };
  const input = () => ({ amount: 100, payorInfo: {}, payTheoryData: { billing_info: { city: 'Cincinnati' } } });
  it('transacts with default precedence, exact billing first and one payment request [HF13]', async () => {
    const payload = input(); const result = await element.transact(payload, element);
    expect(result.body.id).to.equal('fixture-payment');
    expect(payload).to.include({ fee_mode: 'service_fee' }); expect(payload.metadata).to.deep.equal({ initial: true });
    const sent = f.ledger.filter(row => row.message.type === 'pt-static:transact');
    expect(sent[0].message).to.deep.equal({ type: 'pt-static:transact', element: 'card-number', billingInfo: { city: 'Cincinnati' } });
    const detail = f.ledger.find(row => row.message.type === 'pt-static:payment-detail');
    expect(detail.message).to.deep.equal({ type: 'pt-static:payment-detail', data: payload, async: true });
    const explicit = { ...input(), metadata: {}, fee_mode: 'merchant_fee' };
    await element.transact(explicit, element);
    expect(explicit.metadata).to.deep.equal({}); expect(explicit.fee_mode).to.equal('merchant_fee');
    element.metadata = undefined; element.feeMode = undefined;
    const defaults = input(); await element.transact(defaults, element); expect(defaults.fee_mode).to.equal('merchant_fee');
  });
  for (const [label, response] of [['SUCCESS', successful], ['FAILED', declined], ['ERROR', transport], ['CASH', { type: 'pt-static:cash', body: { barcode_id: 'barcode', barcode_url: 'https://synthetic.invalid/barcode' } }], ['CONFIRMATION', { type: 'pt-static:confirm', body: { fee_mode: 'merchant_fee', fee: 0, amount: 100, payment_prep: { synthetic: 'opaque' } } }]]) {
    it(`preserves the exact ${label} raw peer envelope with one payment [HF14]`, async () => {
      await configure({ 'pt-static:payment-detail': response });
      expect(await element.transact(input(), element)).to.deep.equal(response);
      expect(f.ledger.filter(row => row.message.type === 'pt-static:payment-detail')).to.have.length(1);
    });
  }
  it('stops before payment and tokenization when the transacting readiness port reports error [HF14/16]', async () => {
    await configure({ 'pt-static:transact': transport });
    expect(await element.transact(input(), element)).to.deep.equal(transport);
    expect(element._isTransactingElement).to.equal(false);
    expect(await element.tokenize({ metadata: { test: true } }, element)).to.deep.equal(transport);
    expect(element.initialized).to.equal(true); // Existing method leaves initialized true on this error.
    expect(element._isTransactingElement).to.equal(false);
    expect(f.ledger.some(row => ['pt-static:payment-detail', 'pt-static:tokenize-detail'].includes(row.message.type))).to.equal(false);
  });
  for (const response of [successful, declined, transport]) it(`capture preserves ${response.type}/${response.body?.status || 'ERROR'} and sends only confirm [HF15]`, async () => {
    await configure({ 'pt-static:confirm': response });
    expect(await element.capture()).to.deep.equal(response);
    expect(f.ledger.map(row => row.message)).to.deep.equal([{ type: 'pt-static:confirm', async: true }]);
  });
  for (const response of [{ type: 'pt-static:complete', paymentType: 'tokenize', expandedResponse: true, body: { status: 'SUCCEEDED', payment_method_id: 'pm-synthetic' } }, { type: 'pt-static:complete', paymentType: 'tokenize', body: { success: false, error: 'synthetic' } }, transport]) it(`tokenizes through real billing handshake without a charge [HF16] ${JSON.stringify(response.body)}`, async () => {
    await configure({ 'pt-static:tokenize-detail': response }); const value = { billingInfo: { city: 'Paris' }, metadata: { number: 0 } };
    expect(await element.tokenize(value, element)).to.deep.equal(response); expect(element.initialized).to.equal(true);
    expect(f.ledger.find(row => row.message.type === 'pt-static:tokenize-detail').message.data).to.deep.equal(value);
    expect(f.ledger.some(row => row.message.type === 'pt-static:payment-detail')).to.equal(false);
  });
  it('cancels then resets and clears initialization only on READY [HF17]', async () => {
    element.initialized = true;
    expect(await element.cancel()).to.equal(true); expect(element.initialized).to.equal(false);
    expect(f.ledger.map(row => row.message.type)).to.deep.equal(['pt-static:cancel', 'pt-static:reset_host']);
    await configure({ 'pt-static:reset_host': transport }); element.initialized = true;
    expect(await element.cancel()).to.deep.equal({ type: 'ERROR', error: 'CANCEL_FAILED: Failed to reset token' });
    expect(element.initialized).to.equal(true);
    frames[0].remove();
    expect(await element.cancel()).to.deep.equal({ type: 'ERROR', error: 'CANCEL_FAILED: Failed to find transacting iframe' });
  });
  it('runs the public transact action against the real mounted element [HF13/14/15]', async () => {
    await element.sendPtToken();
    for (const field of ['card-number', 'card-exp', 'card-cvv', 'billing-zip']) element.state = { element: field, isDirty: true, errorMessages: [] };
    await configure({ 'pt-static:payment-detail': successful });
    expect(await actions.transact({ amount: 100, metadata: { zero: 0, no: false } })).to.deep.equal({ type: 'SUCCESS', body: successful.body });
    expect(element.complete).to.equal(true);
    expect(f.ledger.filter(row => row.message.type === 'pt-static:payment-detail')).to.have.length(1);
  });
  it('runs public confirmation then capture with exact observer bodies and no second charge [HF15]', async () => {
    await element.sendPtToken();
    for (const field of ['card-number', 'card-exp', 'card-cvv', 'billing-zip']) element.state = { element: field, isDirty: true, errorMessages: [] };
    const confirmationBody = { fee_mode: 'merchant_fee', fee: 0, amount: 100, first_six: '411111', last_four: '0000', brand: 'SYNTHETIC', idempotency: 'receipt-0' };
    await configure({ 'pt-static:payment-detail': { type: 'pt-static:confirm', body: confirmationBody }, 'pt-static:confirm': successful });
    const confirmations = [], captures = [];
    let confirmObserved, captureObserved;
    const confirmPromise = new Promise(resolve => { confirmObserved = resolve; }); const capturePromise = new Promise(resolve => { captureObserved = resolve; });
    const removeConfirm = tokenizeObserver(body => { confirmations.push(body); confirmObserved(body); }); const removeCapture = captureObserver(body => { captures.push(body); captureObserved(body); });
    try {
      const confirmation = await actions.transact({ amount: 100, confirmation: true, metadata: { zero: 0, no: false } });
      expect(confirmation).to.deep.equal({ type: 'CONFIRMATION', body: { first_six: '411111', last_four: '0000', brand: 'SYNTHETIC', receipt_number: 'receipt-0', amount: 100, service_fee: 0 } });
      expect(element.complete).to.equal(false);
      expect(await actions.confirm()).to.deep.equal({ type: 'SUCCESS', body: successful.body });
      await Promise.all([confirmPromise, capturePromise]);
      expect(confirmations).to.deep.equal([confirmation.body]); expect(captures).to.deep.equal([successful.body]);
      expect(f.ledger.filter(row => row.message.type === 'pt-static:payment-detail')).to.have.length(1);
      expect(f.ledger.filter(row => row.message.type === 'pt-static:confirm')).to.have.length(1);
      expect(f.ledger.find(row => row.message.type === 'pt-static:payment-detail').message.data.metadata).to.deep.equal({ zero: 0, no: false });
    } finally { removeConfirm(); removeCapture(); }
  });
  it('runs public tokenization through real fields then permits public cancellation without a charge [HF16/17]', async () => {
    await element.sendPtToken();
    for (const field of ['card-number', 'card-exp', 'card-cvv', 'billing-zip']) element.state = { element: field, isDirty: true, errorMessages: [] };
    const token = { id: 'synthetic-method', metadata: { zero: 0, no: false }, status: 'ACTIVE' };
    await configure({ 'pt-static:tokenize-detail': { type: 'pt-static:complete', paymentType: 'tokenize', expandedResponse: true, body: token } });
    const observed = []; let resolveObserved; const observedPromise = new Promise(resolve => { resolveObserved = resolve; }); const remove = transactedObserver(body => { observed.push(body); resolveObserved(body); });
    try {
      expect(await actions.tokenizePaymentMethod({ expandedResponse: true, skipValidation: true, metadata: { zero: 0, no: false } })).to.deep.equal({ type: 'TOKENIZED', body: token });
      await observedPromise; expect(observed).to.deep.equal([token]);
      expect(element.complete).to.equal(false); expect(element.initialized).to.equal(false); expect(element.connected).to.equal(false);
      expect(await actions.cancel()).to.equal(true); expect(element.connected).to.equal(true);
      expect(f.ledger.filter(row => row.message.type === 'pt-static:tokenize-detail')).to.have.length(1);
      expect(f.ledger.some(row => row.message.type === 'pt-static:payment-detail')).to.equal(false);
      expect(f.ledger.slice(-2).map(row => row.message.type)).to.deep.equal(['pt-static:cancel', 'pt-static:reset_host']);
    } finally { remove(); }
  });

});
