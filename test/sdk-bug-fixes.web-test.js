import { expect } from '@open-wc/testing';
import sinon from 'sinon';

import { transact } from '../src/field-set/actions.ts';
import PayTheoryMessenger from '../src/messenger/pay-theory-messenger.ts';
import common from '../src/common/index.ts';
import createPaymentButton from '../src/field-set/payment-button.ts';
import '../src/components/pay-theory-checkout-button/index.ts';
import '../src/components/pay-theory-overlay/index.ts';

const TRANSACTING_ELEMENT_NAME = 'pay-theory-credit-card-tag-frame';

const successfulTransaction = {
  type: 'pt-static:complete',
  paymentType: 'transfer',
  expandedResponse: false,
  body: {
    receipt_number: 'receipt-123',
    last_four: '4242',
    brand: 'visa',
    created_at: '2026-07-22T00:00:00.000Z',
    amount: 1200,
    service_fee: 0,
    state: 'SUCCESS',
    metadata: {},
    payor_id: 'payor-123',
    payment_method_id: 'payment-method-123',
  },
};

/**
 * Creates the smallest visible transacting field needed to exercise the public
 * transact API without coupling the test to the component's internal rendering.
 */
const createTransactingElement = () => {
  const element = document.createElement('div');
  element.setAttribute('name', TRANSACTING_ELEMENT_NAME);
  element.connected = true;
  element.initialized = false;
  element.complete = false;
  element.valid = true;
  element.ready = true;
  element.transact = sinon.stub().resolves(successfulTransaction);
  element.resetToken = sinon.stub().resolves();
  document.body.appendChild(element);
  return element;
};

const removeTransactingElements = () => {
  document.getElementsByName(TRANSACTING_ELEMENT_NAME).forEach(element => element.remove());
};

describe('transact idempotency (IO-329)', () => {
  afterEach(removeTransactingElements);

  it('passes idempotencyKey to the backend payload as idempotency_key', async () => {
    const transactingElement = createTransactingElement();

    await transact({ amount: 1200, idempotencyKey: 'checkout-attempt-123' });

    expect(transactingElement.transact.calledOnce).to.be.true;
    const transactionData = transactingElement.transact.firstCall.args[0];
    expect(transactionData.payTheoryData.idempotency_key).to.equal('checkout-attempt-123');
  });

  it('passes statementDescriptor to the backend payload as statement_descriptor', async () => {
    const transactingElement = createTransactingElement();

    await transact({ amount: 1200, statementDescriptor: 'PAYTHEORY COFFEE' });

    expect(transactingElement.transact.calledOnce).to.be.true;
    const transactionData = transactingElement.transact.firstCall.args[0];
    expect(transactionData.payTheoryData.statement_descriptor).to.equal('PAYTHEORY COFFEE');
  });

  it('leaves idempotency_key unset when no key is passed', async () => {
    const transactingElement = createTransactingElement();

    await transact({ amount: 1200 });

    const transactionData = transactingElement.transact.firstCall.args[0];
    expect(transactionData.payTheoryData.idempotency_key).to.be.undefined;
  });
});

describe('transact console output (PRD-781)', () => {
  let logStub;

  beforeEach(() => {
    logStub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    logStub.restore();
    removeTransactingElements();
  });

  it('does not log the caller props or the transaction response', async () => {
    createTransactingElement();

    await transact({
      amount: 1200,
      idempotencyKey: 'secret-key-123',
      payorInfo: { email: 'pat@example.com' },
    });

    const logged = JSON.stringify(logStub.args);
    expect(logged).to.not.include('secret-key-123');
    expect(logged).to.not.include('pat@example.com');
    expect(logged).to.not.include('receipt-123');
  });
});

describe('level3DataSummary validation (PRD-782)', () => {
  afterEach(removeTransactingElements);

  it('names purch_idfr when purch_idfr is not a string', async () => {
    createTransactingElement();

    const result = await transact({ amount: 1200, level3DataSummary: { purch_idfr: 123 } });

    expect(result.type).to.equal('ERROR');
    expect(result.error).to.include('purch_idfr');
    expect(result.error).to.not.include('ship_from_zip');
  });
});

describe('getApplePaySession after a token refresh (PRD-779)', () => {
  let messenger;

  afterEach(() => {
    messenger?.destroy();
    messenger = null;
  });

  it('returns the same { type, session } shape on the retry path', async () => {
    messenger = new PayTheoryMessenger({ apiKey: 'test-api-key-apple-retry' });
    const merchantSession = { merchantSessionIdentifier: 'session-abc' };
    const sendMessage = sinon.stub();
    sendMessage.onFirstCall().resolves({
      type: 'pt-messenger:apple-merchant-validation',
      messageId: 'm1',
      body: { success: false, error: 'TOKEN_EXPIRED' },
    });
    sendMessage.onSecondCall().resolves({
      type: 'pt-messenger:apple-merchant-validation',
      messageId: 'm2',
      body: { success: true, session: merchantSession },
    });
    messenger.channel = { sendMessage, disconnect: () => {} };
    messenger.ensureConnected = async () => ({ success: true });
    messenger.refreshConnection = async () => ({ success: true });

    const result = await messenger.getApplePaySession();

    expect(sendMessage.calledTwice).to.be.true;
    expect(result.type).to.equal('SUCCESS');
    expect(result.session.success).to.be.true;
    expect(result.session.session).to.deep.equal(merchantSession);
  });
});

describe('payment button style (PRD-783)', () => {
  let sandbox;
  let container;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(window, 'fetch').resolves({
      json: async () => ({ 'pt-token': 'synthetic-token', origin: window.location.origin }),
    });
    sandbox.stub(HTMLIFrameElement.prototype, 'setAttribute').callsFake(function (name, value) {
      if (name !== 'src') Element.prototype.setAttribute.call(this, name, value);
    });
    container = document.createElement('div');
    container.id = common.checkoutButtonField;
    document.body.appendChild(container);
  });

  afterEach(() => {
    clearInterval(container?.closeInterval);
    container?.remove();
    sandbox.restore();
  });

  it('sends the button style where the hosted button reads it (styles.button)', async () => {
    const style = { color: 'black', callToAction: 'DONATE', pill: true, height: 40 };

    await createPaymentButton({
      apiKey: 'synthetic-api-key',
      checkoutDetails: { amount: 100, paymentName: 'Synthetic checkout' },
      style,
    });

    const button = container.querySelector(common.checkoutButtonField);
    // The component exposes only a token setter, so read the stored value
    const tokenObject = JSON.parse(window.atob(decodeURI(button._token)));
    expect(tokenObject.styles.button).to.deep.equal(style);
  });
});
