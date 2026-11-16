import { expect } from '@open-wc/testing';
import sdk from '../src/index.ts';
import * as values from '../src/common/data.ts';
import * as actions from '../src/field-set/actions.ts';
import PayTheoryMessenger from '../src/messenger/pay-theory-messenger.ts';

describe('actual browser entry and registration contract', () => {
  it('installs the canonical globals and public function identities', () => {
    expect(window.paytheory).to.equal(sdk); expect(window.PayTheoryMessenger).to.equal(PayTheoryMessenger);
    for (const name of ['transact', 'confirm', 'cancel', 'tokenizePaymentMethod', 'updateAmount']) expect(sdk[name]).to.equal(actions[name]);
    for (const name of ['SURCHARGE', 'SERVICE_FEE', 'INTERCHANGE', 'MERCHANT_FEE', 'ALL', 'NOT_CASH', 'NOT_CARD', 'NOT_ACH', 'ONLY_CASH', 'ONLY_CARD', 'ONLY_ACH', 'PAY', 'BOOK', 'DONATE', 'CHECKOUT', 'WHITE', 'GREY', 'BLACK', 'PURPLE']) expect(sdk[name]).to.equal(values[name]);
    expect(new sdk.PayTheoryMessenger({ apiKey: 'test-api-synthetic' })).to.be.instanceOf(PayTheoryMessenger);
    for (const name of ['button', 'qrCode', 'payTheoryFields', 'errorObserver', 'transactedObserver', 'tokenizeObserver', 'captureObserver', 'stateObserver', 'validObserver', 'readyObserver', 'cashObserver']) expect(sdk[name]).to.be.a('function');
  });
  it('registers every owned field class and constructs genuine browser elements', () => {
    for (const name of [...new Set(Object.values(values.webComponentMap)), values.checkoutButtonField, values.checkoutQRField, values.payTheoryOverlay]) {
      expect(customElements.get(name), name).to.be.a('function');
      expect(document.createElement(name)).to.be.instanceOf(HTMLElement);
    }
  });
  it('executes deprecated wrapper mapping and warning without network', async () => {
    const warnings = []; const warn = console.warn; console.warn = message => warnings.push(message);
    try {
      const legacy = await sdk.createPaymentFields('test-api-synthetic', 'ignored', {}, { legacy: true });
      const current = await sdk.create('test-api-synthetic', {}, { current: true }, 'service_fee');
      expect(warnings).to.deep.equal(['createPaymentFields has been deprecated']);
      expect(legacy.mount).to.be.a('function'); expect(current.mount).to.be.a('function');
    } finally { console.warn = warn; }
  });
});
