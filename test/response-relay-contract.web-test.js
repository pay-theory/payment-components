import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { parseResponse, parseInputParams, localizeCashBarcodeUrl } from '../src/common/format.ts';
import { relayHandler } from '../src/field-set/handler.ts';
import { handleHostedFieldMessage, relayTypeMessage } from '../src/common/message.ts';
import { hostedFieldsEndpoint } from '../src/common/network.ts';
import * as messaging from '../src/common/message.ts';
import * as observers from '../src/common/observe.ts';
import StateManager, { MessengerState as S } from '../src/messenger/state-manager.ts';

// Synthetic payloads follow secure-tags-lib response handlers; no payment provider is contacted.
describe('hosted response and observer compatibility', () => {
  afterEach(() => sinon.restore());
  it('retains compact transaction metadata and legacy tags without leaking transport fields', () => {
    const body = {
      receipt_number: 'r',
      last_four: '1234',
      brand: 'VISA',
      created_at: '2026-01-01',
      amount: 100,
      service_fee: 5,
      state: 'SUCCESS',
      metadata: { source: 'synthetic' },
      payor_id: 'p',
      payment_method_id: 'm',
    };
    expect(
      parseResponse({
        type: 'pt-static:complete',
        paymentType: 'transfer',
        expandedResponse: false,
        body,
      }),
    ).to.deep.equal({ type: 'SUCCESS', body: { ...body, tags: body.metadata } });
  });
  for (const feeMode of ['service_fee', 'merchant_fee'])
    it(`keeps confirmation receipt and ${feeMode} fee semantics`, () => {
      expect(
        parseResponse({
          type: 'pt-static:confirm',
          body: {
            first_six: '123456',
            last_four: '1234',
            brand: 'VISA',
            idempotency: 'r',
            amount: 100,
            fee: 5,
            fee_mode: feeMode,
          },
        }),
      ).to.deep.equal({
        type: 'CONFIRMATION',
        body: {
          first_six: '123456',
          last_four: '1234',
          brand: 'VISA',
          receipt_number: 'r',
          amount: 100,
          service_fee: feeMode === 'service_fee' ? 5 : 0,
        },
      });
    });
  it('maps compact processor failure codes and text to the public reason', () => {
    const body = {
      receipt_number: 'r',
      last_four: '1234',
      brand: 'VISA',
      state: 'FAILURE',
      type: 'CARD',
      payor_id: 'p',
      status: {
        result: 'FAILED',
        reason: { error_code: 'DECLINED', error_text: 'Synthetic decline' },
      },
    };
    expect(
      parseResponse({
        type: 'pt-static:complete',
        paymentType: 'transfer',
        expandedResponse: false,
        body,
      }),
    ).to.deep.equal({
      type: 'FAILED',
      body: {
        receipt_number: 'r',
        last_four: '1234',
        brand: 'VISA',
        state: 'FAILURE',
        type: 'CARD',
        payor_id: 'p',
        reason: { failure_code: 'DECLINED', failure_text: 'Synthetic decline' },
      },
    });
  });
  for (const status of ['FAILED', 'SUCCEEDED'])
    it(`passes expanded ${status} transaction bodies through intact`, () => {
      const body = { status, id: 'transaction', custom: { preserved: true } };
      const result = parseResponse({
        type: 'pt-static:complete',
        paymentType: 'transfer',
        expandedResponse: true,
        body,
      });
      expect(result).to.deep.equal({ type: status === 'FAILED' ? 'FAILED' : 'SUCCESS', body });
      expect(result.body).to.equal(body);
    });
  for (const expandedResponse of [false, true])
    it(`preserves tokenization ${expandedResponse ? 'expanded' : 'compact'} and failure contracts`, () => {
      const body = { payment_method_id: 'm', state: 'ACTIVE' };
      expect(
        parseResponse({
          type: 'pt-static:complete',
          paymentType: 'tokenize',
          expandedResponse,
          body,
        }),
      ).to.deep.equal({ type: 'TOKENIZED', body });
      const failed = {
        state: 'FAILURE',
        status: {
          result: 'FAILED',
          reason: { error_code: 'INVALID', error_text: 'Synthetic invalid token' },
        },
      };
      expect(
        parseResponse({
          type: 'pt-static:complete',
          paymentType: 'tokenize',
          expandedResponse,
          body: failed,
        }),
      ).to.deep.equal(
        expandedResponse
          ? {
              type: 'FAILED',
              body: { failure_code: 'INVALID', failure_text: 'Synthetic invalid token' },
            }
          : {
              type: 'ERROR',
              error: 'SOCKET_ERROR: Token validation failed: Synthetic invalid token',
            },
      );
    });
  it('preserves cash, direct error and unknown envelopes', () => {
    const body = { barcode: 'synthetic', mapUrl: 'https://synthetic.invalid' };
    expect(parseResponse({ type: 'pt-static:cash-complete', body })).to.deep.equal({
      type: 'CASH',
      body,
    });
    expect(parseResponse({ type: 'pt-static:error', error: 'SESSION_EXPIRED' })).to.deep.equal({
      type: 'ERROR',
      error: 'SESSION_EXPIRED',
    });
    const unknown = { type: 'future:message', body };
    expect(parseResponse(unknown)).to.equal(unknown);
  });
  it('maps request aliases, preserves explicit false/zero values, and leaves caller input untouched', () => {
    const input = {
      amount: 100,
      accountCode: 0,
      reference: 0,
      sendReceipt: false,
      oneTimeUseToken: false,
      expandedResponse: true,
      billingInfo: { name: 'Synthetic' },
      metadata: {
        'pay-theory-account-code': 'fallback',
        'pay-theory-reference': 'fallback',
        'pay-theory-receipt': true,
        'payment-parameters-name': 'params',
      },
    };
    const copy = JSON.parse(JSON.stringify(input));
    const result = parseInputParams(input);
    expect(result.payTheoryData).to.include({
      account_code: 0,
      reference: 0,
      send_receipt: false,
      oneTimeUseToken: false,
      expanded_response: true,
      payment_parameters: 'params',
    });
    expect(result.payTheoryData.billing_info).to.deep.equal(input.billingInfo);
    expect(input).to.deep.equal(copy);
    expect(parseInputParams({ amount: 100 }).payTheoryData).to.include({
      oneTimeUseToken: false,
      send_receipt: false,
    });
  });
  for (const [type, method, confirmation] of [
    ['SUCCESS', 'transactedObserver', false],
    ['TOKENIZED', 'transactedObserver', false],
    ['FAILED', 'captureObserver', true],
    ['CASH', 'cashObserver', false],
    ['CONFIRMATION', 'tokenizeObserver', false],
  ])
    it(`delivers ${type} to ${method} and honors unsubscribe`, async () => {
      const callback = sinon.spy();
      const unsubscribe = observers[method](callback);
      const body = { synthetic: type };
      messaging.sendObserverMessage({ type, body }, confirmation);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(callback.calledOnceWithExactly(body)).to.equal(true);
      unsubscribe();
      unsubscribe();
      messaging.sendObserverMessage({ type, body }, confirmation);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(callback.callCount).to.equal(1);
    });
  it('localizes cash maps using coordinates and leaves maps usable when geolocation fails', async () => {
    const position = sinon.stub(navigator.geolocation, 'getCurrentPosition');
    position.callsFake(success => success({ coords: { latitude: 1.25, longitude: -2.5 } }));
    expect((await localizeCashBarcodeUrl({ type: 'CASH', body: {} })).body.mapUrl).to.include(
      '?lat=1.25&lng=-2.5',
    );
    position.callsFake((success, error) => error());
    const response = { type: 'CASH', body: { mapUrl: 'original' } };
    expect(await localizeCashBarcodeUrl(response)).to.equal(response);
    expect(response.body.mapUrl).to.equal('original');
  });
});

describe('hosted field relay transport compatibility', () => {
  let frames;
  afterEach(() => {
    frames.forEach(frame => frame.remove());
    sinon.restore();
  });
  beforeEach(() => {
    frames = [];
  });
  function frame(name) {
    const iframe = document.createElement('iframe');
    iframe.name = name;
    document.body.appendChild(iframe);
    frames.push(iframe);
    return sinon.stub(iframe.contentWindow, 'postMessage');
  }
  for (const [element, targets] of [
    ['card-autofill', ['card-name-iframe', 'card-cvv-iframe', 'card-exp-iframe']],
    [
      'address-autofill',
      ['billing-line2-iframe', 'billing-city-iframe', 'billing-state-iframe', 'billing-zip-iframe'],
    ],
    ['card-cvv', ['card-number-iframe']],
  ])
    it(`relays ${element} without altering payload or provider target origin`, () => {
      const peers = targets.map(frame);
      const message = {
        type: 'pt-static:relay',
        element,
        value: { synthetic: true },
        siblingSocketEvent: true,
      };
      relayHandler(message);
      peers.forEach(peer =>
        expect(peer.calledOnceWithExactly(message, hostedFieldsEndpoint)).to.equal(true),
      );
    });
  it('accepts provider object/JSON relays, rejects foreign/malformed/unrelated input and cleans listener up', () => {
    const callback = sinon.spy();
    const remove = handleHostedFieldMessage(relayTypeMessage, callback);
    const message = { type: 'pt-static:relay', element: 'card-cvv', value: 'synthetic' };
    const dispatch = (origin, data) =>
      window.dispatchEvent(new MessageEvent('message', { origin, data }));
    dispatch('https://foreign.invalid', message);
    dispatch(hostedFieldsEndpoint, 'invalid json');
    dispatch(hostedFieldsEndpoint, { type: 'unrelated' });
    expect(callback.called).to.equal(false);
    dispatch(hostedFieldsEndpoint, message);
    dispatch(hostedFieldsEndpoint, JSON.stringify(message));
    expect(callback.callCount).to.equal(2);
    remove();
    dispatch(hostedFieldsEndpoint, message);
    expect(callback.callCount).to.equal(2);
  });
});

describe('messenger state guards', () => {
  it('rejects illegal transitions without history mutation and returns a defensive history copy', () => {
    const state = new StateManager();
    expect(state.setState(S.PROCESSING)).to.equal(false);
    const history = state.getStateHistory();
    history.push(S.FAILED);
    expect(state.getStateHistory()).to.deep.equal([S.IDLE]);
  });
  it('isolates callback failures and reports previous/current states in order', () => {
    const state = new StateManager();
    const observed = [];
    state.onStateChange(() => {
      throw Error('synthetic callback');
    });
    state.onStateChange((next, previous) => observed.push([next, previous]));
    expect(state.setState(S.INITIALIZING)).to.equal(true);
    expect(state.setState(S.CONNECTED)).to.equal(true);
    expect(observed).to.deep.equal([
      [S.INITIALIZING, S.IDLE],
      [S.CONNECTED, S.INITIALIZING],
    ]);
  });
  it('guards successful work, preserves original failures, and skips work for invalid entry states', async () => {
    const state = new StateManager();
    expect(
      await state.withStateGuard(S.INITIALIZING, S.CONNECTED, S.ERROR, async () => 42),
    ).to.equal(42);
    const failure = Error('original failure');
    expect(
      await state
        .withStateGuard(S.PROCESSING, S.CONNECTED, S.ERROR, async () => {
          throw failure;
        })
        .catch(error => error),
    ).to.equal(failure);
    expect(state.getState()).to.equal(S.ERROR);
    const operation = sinon.spy();
    const rejected = await state
      .withStateGuard(S.PROCESSING, S.CONNECTED, S.ERROR, operation)
      .catch(error => error);
    expect(rejected.message).to.equal('Cannot transition from error to processing');
    expect(operation.called).to.equal(false);
  });
});
