import { expect } from '@open-wc/testing';
import sinon from 'sinon';

import { getHostedCheckoutEndpoint, getTransactionEndpoint } from '../src/common/network.local.ts';
import common from '../src/common/index.ts';
import createPaymentButton from '../src/field-set/payment-button.ts';
import '../src/components/pay-theory-checkout-button/index.ts';
import '../src/components/pay-theory-overlay/index.ts';

describe('Hosted checkout endpoint', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  for (const partner of ['innovate', 'pt']) {
    for (const stage of ['paytheorylab', 'paytheory']) {
      for (const targetMode of ['', '-sandbox']) {
        it(`uses the checkout host for ${partner}${targetMode}.${stage}`, () => {
          Object.assign(process.env, { ENV: partner, STAGE: stage, TARGET_MODE: targetMode });

          expect(getHostedCheckoutEndpoint()).to.equal(
            `https://${partner}${targetMode}.checkout.${stage}.com`,
          );
          expect(getTransactionEndpoint()).to.equal(
            `https://${partner}${targetMode}.${stage}.com/pt-token-service/`,
          );
        });
      }
    }
  }

  it('preserves the existing environment fallbacks', () => {
    process.env = {};

    expect(getHostedCheckoutEndpoint()).to.equal('https://paytheory.checkout.checkout.com');
    expect(getTransactionEndpoint()).to.equal('https://paytheory.api.com/pt-token-service/');
  });

  it('keeps local development checkout on the configured deployed host', () => {
    Object.assign(process.env, {
      ENV: 'pt',
      STAGE: 'paytheorylab',
      TARGET_MODE: '-sandbox',
      LOCAL_DEV: 'true',
    });

    expect(getHostedCheckoutEndpoint()).to.equal('https://pt-sandbox.checkout.paytheorylab.com');
  });
});

describe('Hosted checkout button popup and callbacks', () => {
  const environment = `${process.env.ENV || 'paytheory'}${process.env.TARGET_MODE || ''}`;
  const stage = process.env.STAGE || 'checkout';
  const checkoutOrigin = `https://${environment}.checkout.${stage}.com`;
  const apiOrigin = `https://${environment}.${stage}.com`;
  const sessionId = 'synthetic-checkout-session';
  let sandbox;
  let container;
  let button;
  let popup;
  let openPopup;
  let onSuccess;
  let onError;
  let onReady;

  const dispatch = (origin, message) => {
    window.dispatchEvent(new MessageEvent('message', { origin, data: message }));
  };

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    sandbox.stub(window, 'fetch').resolves({
      json: async () => ({ 'pt-token': 'synthetic-token', origin: window.location.origin }),
    });
    sandbox.stub(HTMLIFrameElement.prototype, 'setAttribute').callsFake(function (name, value) {
      if (name !== 'src') Element.prototype.setAttribute.call(this, name, value);
    });
    popup = { focus: sandbox.spy(), close: sandbox.spy(), closed: false };
    openPopup = sandbox.stub(window, 'open').returns(popup);
    onSuccess = sandbox.spy();
    onError = sandbox.spy();
    onReady = sandbox.spy();
    container = document.createElement('div');
    container.id = common.checkoutButtonField;
    document.body.appendChild(container);

    await createPaymentButton({
      apiKey: 'synthetic-api-key',
      checkoutDetails: { amount: 100, paymentName: 'Synthetic checkout' },
      onSuccess,
      onError,
      onReady,
    });
    button = container.querySelector(common.checkoutButtonField);
    expect(button).to.exist;
    dispatch(common.hostedFieldsEndpoint, { type: 'pt-static:button-ready', sessionId });
    expect(onReady.calledOnceWithExactly(true)).to.be.true;
  });

  afterEach(() => {
    clearInterval(container?.closeInterval);
    container?.remove();
    document.querySelectorAll(common.payTheoryOverlay).forEach(overlay => overlay.remove());
    sandbox.restore();
  });

  const clickButton = () => {
    dispatch(common.hostedFieldsEndpoint, { type: 'pt-static:button-click' });
  };

  it('opens /hosted on the shared checkout host with the ready session ID', () => {
    expect(common.hostedCheckoutEndpoint).to.equal(checkoutOrigin);
    clickButton();

    expect(openPopup.calledOnce).to.be.true;
    expect(openPopup.firstCall.args[0]).to.equal(`${checkoutOrigin}/hosted?sessionId=${sessionId}`);
    expect(popup.focus.calledOnce).to.be.true;
    expect(container.checkoutWindow).to.equal(popup);
  });

  it('delivers checkout completion to the merchant callback and closes the popup', () => {
    clickButton();
    const data = { reference: 'synthetic-completion' };
    dispatch(checkoutOrigin, { type: 'pt-checkout:complete', data });

    expect(onSuccess.calledOnceWithExactly(data)).to.be.true;
    expect(popup.close.calledOnce).to.be.true;
    expect(container.closeInterval).to.be.null;
    expect(document.querySelector(common.payTheoryOverlay)).to.be.null;
  });

  it('delivers checkout barcode messages to the button barcode handler', () => {
    const data = { reference: 'synthetic-barcode' };
    dispatch(checkoutOrigin, { type: 'pt-checkout:barcode-received', data });

    expect(JSON.parse(button.buttonBarcode)).to.deep.equal(data);
    expect(onSuccess.called).to.be.false;
  });

  it('accepts stringified checkout messages through the same origin gate', () => {
    const data = { reference: 'synthetic-completion' };
    dispatch(checkoutOrigin, JSON.stringify({ type: 'pt-checkout:complete', data }));

    expect(onSuccess.calledOnceWithExactly(data)).to.be.true;
  });

  it('delivers errors from the checkout host to the configured handler', () => {
    const message = { type: 'pt-checkout:error', error: 'synthetic-checkout-error' };
    dispatch(checkoutOrigin, message);

    expect(onError.calledOnceWithExactly(message)).to.be.true;
  });

  for (const origin of [
    apiOrigin,
    'https://unrelated.example',
    window.location.origin,
    checkoutOrigin.replace('https:', 'http:'),
    `${checkoutOrigin}:8443`,
    `${checkoutOrigin}.unrelated.example`,
    `https://other-partner.checkout.${stage}.com`,
    `https://${environment}-other.checkout.${stage}.com`,
    'null',
  ]) {
    it(`rejects completion, barcode, and error messages from ${origin}`, () => {
      clickButton();
      dispatch(origin, {
        type: 'pt-checkout:complete',
        data: { reference: 'synthetic-completion' },
      });
      dispatch(origin, {
        type: 'pt-checkout:barcode-received',
        data: { reference: 'synthetic-barcode' },
      });
      dispatch(origin, { type: 'pt-checkout:error', error: 'synthetic-checkout-error' });

      expect(onSuccess.called).to.be.false;
      expect(onError.called).to.be.false;
      expect(button.buttonBarcode).to.be.undefined;
      expect(popup.close.called).to.be.false;
    });
  }

  it('ignores unrelated message types even from the checkout host', () => {
    dispatch(checkoutOrigin, { type: 'unrelated:complete', data: {} });

    expect(onSuccess.called).to.be.false;
    expect(onError.called).to.be.false;
    expect(button.buttonBarcode).to.be.undefined;
  });
});
