import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import * as actions from '../src/field-set/actions.ts';
import { CARD_NUMBER } from '../src/common/data.ts';

// The adapter stands in for the hosted custom element. The public action,
// validation, request formatting, response parsing and DOM discovery are real.
describe('public payment action contracts', () => {
  let field;
  beforeEach(() => {
    field = document.createElement('div');
    field.setAttribute('name', CARD_NUMBER);
    Object.assign(field, {
      initialized: false,
      complete: false,
      valid: true,
      ready: true,
      connected: true,
      feeMode: 'merchant_fee',
      resetToken: sinon.stub().resolves({ type: 'READY' }),
      transact: sinon.stub(),
      capture: sinon.stub(),
      cancel: sinon.stub(),
      tokenize: sinon.stub(),
    });
    document.body.appendChild(field);
  });
  afterEach(() => {
    field.remove();
    sinon.restore();
  });
  it('reports missing fields and invalid update amounts without touching an adapter', async () => {
    field.remove();
    for (const action of [
      () => actions.transact({ amount: 100 }),
      () => actions.tokenizePaymentMethod({}),
      () => actions.confirm(),
    ])
      expect(await action()).to.deep.equal({
        type: 'ERROR',
        error: 'TRANSACTING_FIELD_ERROR: No transacting fields found',
      });
    // The canonical public SDK explicitly permits void cancellation with no active fields.
    expect(await actions.cancel()).to.equal(undefined);
    expect((await actions.updateAmount(100)).error).to.match(/^NO_FIELDS:/);
    expect((await actions.updateAmount(-1)).type).to.equal('ERROR');
  });
  for (const [property, value, code] of [
    ['complete', true, 'ACTION_COMPLETE'],
    ['initialized', true, 'ACTION_IN_PROGRESS'],
    ['valid', false, 'NOT_VALID'],
    ['ready', false, 'NOT_READY'],
  ])
    it(`rejects ${code} before sending a payment`, async () => {
      field[property] = value;
      expect((await actions.transact({ amount: 100 })).error).to.match(new RegExp(`^${code}:`));
      expect(field.transact.called).to.equal(false);
      if (code === 'NOT_VALID' || code === 'NOT_READY') expect(field.initialized).to.equal(false);
    });
  it('formats a valid transaction and marks its hosted adapter complete', async () => {
    field.transact.resolves({
      type: 'pt-static:complete',
      paymentType: 'transfer',
      expandedResponse: true,
      body: { status: 'SUCCEEDED', id: 'synthetic' },
    });
    const result = await actions.transact({ amount: 100, metadata: { test: true }, reference: 0 });
    expect(result).to.deep.equal({
      type: 'SUCCESS',
      body: { status: 'SUCCEEDED', id: 'synthetic' },
    });
    expect(field.transact.calledOnce).to.equal(true);
    const [data, target] = field.transact.firstCall.args;
    expect(target).to.equal(field);
    expect(data).to.include({ amount: 100, fee_mode: 'merchant_fee', confirmation: false });
    expect(data.payTheoryData.reference).to.equal(0);
    expect(field.complete).to.equal(true);
  });
  it('leaves confirmation fields open and sends capture as a separate operation', async () => {
    field.transact.resolves({
      type: 'pt-static:confirm',
      body: {
        fee_mode: 'merchant_fee',
        fee: 0,
        amount: 100,
        idempotency: 'r',
        first_six: '123456',
        last_four: '1234',
        brand: 'VISA',
      },
    });
    expect((await actions.transact({ amount: 100, confirmation: true })).type).to.equal(
      'CONFIRMATION',
    );
    expect(field.complete).to.equal(false);
    field.capture.resolves({
      type: 'pt-static:complete',
      paymentType: 'transfer',
      expandedResponse: true,
      body: { status: 'SUCCEEDED', id: 'captured' },
    });
    expect(await actions.confirm()).to.deep.equal({
      type: 'SUCCESS',
      body: { status: 'SUCCEEDED', id: 'captured' },
    });
    expect(field.complete).to.equal(true);
  });
  it('resets failed transfers for retry and returns their processor failure reason', async () => {
    field.transact.resolves({
      type: 'pt-static:complete',
      paymentType: 'transfer',
      expandedResponse: true,
      body: { status: 'FAILED', id: 'failed' },
    });
    expect((await actions.transact({ amount: 100 })).type).to.equal('FAILED');
    expect(field.initialized).to.equal(false);
    expect(field.resetToken.calledOnce).to.equal(true);
  });
  it('keeps skip-validation tokenization fields editable and disconnected for the next call', async () => {
    field.tokenize.resolves({
      type: 'pt-static:complete',
      paymentType: 'tokenize',
      expandedResponse: false,
      body: { payment_method_id: 'method' },
    });
    expect(await actions.tokenizePaymentMethod({ skipValidation: true })).to.deep.equal({
      type: 'TOKENIZED',
      body: { payment_method_id: 'method' },
    });
    expect(field.tokenize.firstCall.args[0]).to.include({ skipValidation: true });
    expect(field.initialized).to.equal(false);
    expect(field.complete).to.equal(false);
    expect(field.connected).to.equal(false);
  });
  for (const action of ['transact', 'confirm', 'cancel', 'tokenizePaymentMethod'])
    it(`preserves thrown ${action} errors as public ERROR results`, async () => {
      const method = { confirm: 'capture', tokenizePaymentMethod: 'tokenize' }[action] || action;
      field[method].rejects(Error('synthetic adapter failure'));
      expect(await actions[action](action === 'transact' ? { amount: 100 } : {})).to.deep.equal({
        type: 'ERROR',
        error: 'synthetic adapter failure',
      });
    });
  it('reconnects before update and changes amount/fee only when the value changes', async () => {
    field.connected = false;
    field.amount = 100;
    field.fee = 10;
    expect(await actions.updateAmount(100)).to.equal(true);
    expect(field.resetToken.calledOnce).to.equal(true);
    expect(field.fee).to.equal(10);
    field.connected = true;
    expect(await actions.updateAmount(200)).to.equal(true);
    expect(field.amount).to.equal(200);
    expect(field.fee).to.equal(undefined);
  });
  it('returns reset-token failures and not-ready errors before changing amounts', async () => {
    field.connected = false;
    field.resetToken.resolves({ type: 'ERROR', error: 'synthetic reset failed' });
    expect(await actions.updateAmount(100)).to.deep.equal({
      type: 'ERROR',
      error: 'SOCKET_ERROR: synthetic reset failed',
    });
    field.ready = false;
    expect((await actions.updateAmount(100)).error).to.match(/^NOT_READY:/);
    expect(field.amount).to.equal(undefined);
  });
  it('delegates cancellation and preserves true success', async () => {
    field.cancel.resolves(true);
    expect(await actions.cancel()).to.equal(true);
    expect(field.cancel.calledOnce).to.equal(true);
  });
});
