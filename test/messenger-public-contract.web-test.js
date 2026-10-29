import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import PayTheoryMessenger from '../src/messenger/pay-theory-messenger.ts';
import { hostedFieldsEndpoint } from '../src/common/network.ts';
import * as types from '../src/messenger/constants.ts';

describe('public messenger through real SDK initialization and MessageChannel', () => {
  let sdk;
  let peer;
  let commands;
  let responder;
  let fetchStub;
  let walletCallback;
  before(async () => {
    // Execute the sample application's actual callback, not a rewritten consumer model.
    const source = await fetch(new URL('../wallet-test/wallet.js', import.meta.url)).then(
      response => response.text(),
    );
    const start = source.indexOf('session.onvalidatemerchant = ');
    const end = source.indexOf(';\n\n  session.onpaymentauthorized', start);
    expect(start).to.be.greaterThan(-1);
    expect(end).to.be.greaterThan(start);
    const callback = source.slice(start + 'session.onvalidatemerchant = '.length, end);
    walletCallback = new Function('messenger', 'session', 'showStatus', `return (${callback});`);
  });
  beforeEach(() => {
    commands = [];
    responder = message => {
      switch (message.type) {
        case types.PT_MESSENGER_MERCHANT_VALIDATION:
          return {
            type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
            body: { success: true, session: { merchantIdentifier: 'synthetic' } },
          };
        case types.PT_MESSENGER_WALLET_TRANSACTION:
          return {
            type: types.PT_MESSENGER_TRANSFER_COMPLETE,
            body: {
              transaction: {
                receipt_number: 'receipt',
                status: 'SUCCEEDED',
                amount: message.data.amount,
              },
            },
          };
        case types.PT_MESSENGER_RECONNECT_TOKEN:
          return { type: types.PT_MESSENGER_RECONNECT_TOKEN_SUCCESS, success: true };
        case types.PT_MESSENGER_RESEND_INVOICE_EMAIL:
          return { type: types.PT_MESSENGER_RESEND_INVOICE_EMAIL_SUCCESS, success: true };
        default:
          throw Error(`Unexpected SDK command ${message.type}`);
      }
    };
    const remoteWindow = {
      postMessage(message, origin, ports) {
        if (message.type === types.PT_MESSENGER_PING) {
          queueMicrotask(() =>
            window.dispatchEvent(
              new MessageEvent('message', {
                origin: hostedFieldsEndpoint,
                data: { type: types.PT_MESSENGER_READY },
              }),
            ),
          );
        } else {
          expect(message.type).to.equal(types.PT_MESSENGER_ESTABLISH_CHANNEL);
          peer = ports[0];
          peer.onmessage = event => {
            commands.push(event.data);
            peer.postMessage({ ...responder(event.data), messageId: event.data.messageId });
          };
          peer.postMessage({
            type: types.PT_MESSENGER_CONNECTION_ACK,
            success: true,
            messageId: message.messageId,
          });
        }
      },
    };
    // Synthetic iframe boundary: no network, while initialize/readiness/channel remain real.
    sinon.stub(HTMLIFrameElement.prototype, 'src').set(function (value) {
      this.setAttribute('data-synthetic-src', value);
    });
    sinon.stub(HTMLIFrameElement.prototype, 'contentWindow').get(() => remoteWindow);
    sinon
      .stub(HTMLIFrameElement.prototype, 'contentDocument')
      .get(() => ({ readyState: 'complete' }));
    fetchStub = sinon
      .stub(window, 'fetch')
      .resolves({ json: async () => ({ 'pt-token': 'synthetic-token' }) });
    sdk = new PayTheoryMessenger({ checkoutContext: { sessionId: 'synthetic-session' } });
  });
  afterEach(() => {
    sdk.destroy();
    peer?.close();
    sinon.restore();
    PayTheoryMessenger.clearInstances();
  });
  it('initializes once, emits READY, and encodes origin/session/token for the hosted producer', async () => {
    const ready = sinon.spy();
    sdk.on('ready', ready);
    expect(await sdk.initialize()).to.deep.equal({ success: true });
    expect(await sdk.initialize()).to.deep.equal({ success: true });
    expect(fetchStub.callCount).to.equal(1);
    expect(ready.calledOnceWithExactly({ success: true })).to.equal(true);
    const url = new URL(
      document
        .querySelector('iframe[title="Payment Theory Messenger"]')
        .getAttribute('data-synthetic-src'),
    );
    expect(url.origin).to.equal(hostedFieldsEndpoint);
    expect(url.pathname).to.equal('/messenger');
    const auth = JSON.parse(atob(decodeURI(url.searchParams.get('token'))));
    expect(auth.origin).to.equal(window.location.origin);
    expect(auth.token).to.equal('synthetic-token');
    expect(auth.sessionKey).to.be.a('string');
  });
  it('returns the declared Apple session and resend response shapes', async () => {
    expect(await sdk.getApplePaySession()).to.deep.equal({
      type: 'SUCCESS',
      session: { success: true, session: { merchantIdentifier: 'synthetic' } },
    });
    expect(await sdk.resendInvoiceEmail()).to.deep.equal({ success: true });
    expect(commands.map(message => message.type)).to.deep.equal([
      types.PT_MESSENGER_MERCHANT_VALIDATION,
      types.PT_MESSENGER_RESEND_INVOICE_EMAIL,
    ]);
  });
  for (const walletType of ['APPLE_PAY', 'GOOGLE_PAY', 'PAZE']) {
    it(`preserves ${walletType} and maps public camelCase payment fields to backend snake_case`, async () => {
      await sdk.initialize();
      const completed = sinon.spy();
      sdk.on('transaction_complete', completed);
      // Provider payloads are serialized/opaque strings; these synthetic tokens are not decryptable.
      const walletToken =
        walletType === 'PAZE'
          ? 'synthetic-paze-encrypted-token'
          : JSON.stringify({ synthetic: true });
      const payload = {
        walletType,
        amount: 100,
        digitalWalletPayload: walletToken,
        accountCode: 'account',
        additionalPurchaseData: { tax: 5 },
        billingAddress: { postal_code: '12345' },
        healthExpenseType: 'RX',
        invoiceId: 'invoice',
        receiptDescription: 'receipt',
        payorId: 'payor',
        recurringId: 'recurring',
        sendReceipt: false,
        reference: 0,
        fee: 0,
        metadata: { test: true },
        split: [],
      };
      const result = await sdk.processWalletTransaction(payload);
      expect(result).to.deep.equal({
        type: 'SUCCESS',
        transaction: { receipt_number: 'receipt', status: 'SUCCEEDED', amount: 100 },
      });
      expect(completed.calledOnceWithExactly({ transaction: result.transaction })).to.equal(true);
      expect(commands[0].data).to.deep.equal({
        wallet_type: walletType,
        amount: 100,
        digital_wallet_payload: walletToken,
        account_code: 'account',
        additional_purchase_data: { tax: 5 },
        billing_address: { postal_code: '12345' },
        health_expense_type: 'RX',
        invoice_id: 'invoice',
        receipt_description: 'receipt',
        payor_id: 'payor',
        recurring_id: 'recurring',
        send_receipt: false,
        reference: 0,
        fee: 0,
        metadata: { test: true },
        split: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        payor: undefined,
      });
      expect(sdk.getState()).to.equal('connected');
    });
  }
  it('rejects missing required wallet values before transport and preserves static wallet constants', async () => {
    expect([
      PayTheoryMessenger.applePay,
      PayTheoryMessenger.googlePay,
      PayTheoryMessenger.paze,
    ]).to.deep.equal(['APPLE_PAY', 'GOOGLE_PAY', 'PAZE']);
    for (const payload of [{}, { amount: 0, digitalWalletPayload: {}, walletType: 'APPLE_PAY' }])
      expect((await sdk.processWalletTransaction(payload)).type).to.equal('ERROR');
    expect(commands).to.have.length(0);
    expect(fetchStub.called).to.equal(false);
  });
  it('normalizes the Apple merchant session after a single TOKEN_EXPIRED refresh retry', async () => {
    await sdk.initialize();
    const previous = responder;
    let validationCalls = 0;
    responder = message => {
      if (message.type === types.PT_MESSENGER_MERCHANT_VALIDATION && validationCalls++ === 0)
        return {
          type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
          body: { success: false, error: 'TOKEN_EXPIRED' },
        };
      return previous(message);
    };
    expect(await sdk.getApplePaySession()).to.deep.equal({
      type: 'SUCCESS',
      session: { success: true, session: { merchantIdentifier: 'synthetic' } },
    });
    expect(commands.map(message => message.type)).to.deep.equal([
      types.PT_MESSENGER_MERCHANT_VALIDATION,
      types.PT_MESSENGER_RECONNECT_TOKEN,
      types.PT_MESSENGER_MERCHANT_VALIDATION,
    ]);
    expect(fetchStub.callCount).to.equal(2);
  });
  it('bounds Apple validation retries when the renewed token is also expired', async () => {
    await sdk.initialize();
    const previous = responder;
    responder = message =>
      message.type === types.PT_MESSENGER_MERCHANT_VALIDATION
        ? {
            type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
            body: { success: false, error: 'TOKEN_EXPIRED' },
          }
        : previous(message);
    expect(await sdk.getApplePaySession()).to.deep.equal({
      type: 'ERROR',
      error: 'TOKEN_EXPIRED',
    });
    expect(
      commands.filter(message => message.type === types.PT_MESSENGER_MERCHANT_VALIDATION),
    ).to.have.length(2);
    expect(fetchStub.callCount).to.equal(2);
  });
  it('makes the actual wallet consumer abort after repeated expiry instead of validating a failure object', async () => {
    await sdk.initialize();
    const previous = responder;
    responder = message =>
      message.type === types.PT_MESSENGER_MERCHANT_VALIDATION
        ? {
            type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
            body: { success: false, error: 'TOKEN_EXPIRED' },
          }
        : previous(message);
    const session = { completeMerchantValidation: sinon.spy(), abort: sinon.spy() };
    await walletCallback(sdk, session, () => {})({});
    expect(session.abort.calledOnce).to.equal(true);
    expect(session.completeMerchantValidation.called).to.equal(false);
    expect(
      commands.filter(message => message.type === types.PT_MESSENGER_MERCHANT_VALIDATION),
    ).to.have.length(2);
    expect(fetchStub.callCount).to.equal(2);
  });
  it('preserves a first-attempt negative validation body without an unnecessary refresh', async () => {
    await sdk.initialize();
    responder = () => ({
      type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
      body: { success: false, error: 'MERCHANT_UNAVAILABLE' },
    });
    expect(await sdk.getApplePaySession()).to.deep.equal({
      type: 'SUCCESS',
      session: { success: false, error: 'MERCHANT_UNAVAILABLE' },
    });
    expect(commands).to.have.length(1);
    expect(fetchStub.callCount).to.equal(1);
  });
  it('returns the established error fallback when a retried explicit failure omits its error', async () => {
    await sdk.initialize();
    const previous = responder;
    let attempts = 0;
    responder = message =>
      message.type === types.PT_MESSENGER_MERCHANT_VALIDATION
        ? {
            type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
            body:
              attempts++ === 0 ? { success: false, error: 'TOKEN_EXPIRED' } : { success: false },
          }
        : previous(message);
    expect(await sdk.getApplePaySession()).to.deep.equal({
      type: 'ERROR',
      error: 'Apple merchant validation failed',
    });
    expect(attempts).to.equal(2);
    expect(fetchStub.callCount).to.equal(2);
  });
  it('keeps a successful legacy retry body without success usable by the actual wallet callback', async () => {
    await sdk.initialize();
    const previous = responder;
    let attempts = 0;
    const providerSession = { merchantIdentifier: 'legacy-synthetic' };
    responder = message =>
      message.type === types.PT_MESSENGER_MERCHANT_VALIDATION
        ? {
            type: types.PT_MESSENGER_APPLE_MERCHANT_VALIDATION,
            body:
              attempts++ === 0
                ? { success: false, error: 'TOKEN_EXPIRED' }
                : { session: providerSession },
          }
        : previous(message);
    const session = { completeMerchantValidation: sinon.spy(), abort: sinon.spy() };
    await walletCallback(sdk, session, () => {})({});
    expect(session.completeMerchantValidation.calledOnceWithExactly(providerSession)).to.equal(
      true,
    );
    expect(session.abort.called).to.equal(false);
    expect(attempts).to.equal(2);
    expect(fetchStub.callCount).to.equal(2);
  });
  it('maps resend socket errors and unexpected replies to stable public errors', async () => {
    await sdk.initialize();
    responder = () => ({ type: types.PT_MESSENGER_SOCKET_ERROR, body: { error: 'PIN_LOCKED' } });
    expect(await sdk.resendInvoiceEmail()).to.deep.equal({ success: false, error: 'PIN_LOCKED' });
    responder = () => ({ type: 'unexpected' });
    expect(await sdk.resendInvoiceEmail()).to.deep.equal({
      success: false,
      error: 'Unexpected response format',
    });
  });
  it('reports wallet socket errors once, refreshes credentials, and never resubmits a charge automatically', async () => {
    await sdk.initialize();
    const error = sinon.spy();
    sdk.on('transaction_error', error);
    const previous = responder;
    responder = message =>
      message.type === types.PT_MESSENGER_WALLET_TRANSACTION
        ? { type: types.PT_MESSENGER_SOCKET_ERROR, body: { error: 'TOKEN_EXPIRED' } }
        : previous(message);
    expect(
      await sdk.processWalletTransaction({
        amount: 100,
        digitalWalletPayload: JSON.stringify({ synthetic: true }),
        walletType: 'APPLE_PAY',
      }),
    ).to.deep.equal({ type: 'ERROR', error: 'TOKEN_EXPIRED' });
    expect(error.calledOnceWithExactly({ error: 'TOKEN_EXPIRED' })).to.equal(true);
    expect(commands.map(message => message.type)).to.deep.equal([
      types.PT_MESSENGER_WALLET_TRANSACTION,
      types.PT_MESSENGER_RECONNECT_TOKEN,
    ]);
    expect(fetchStub.callCount).to.equal(2);
  });
});
