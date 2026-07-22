import { expect } from '@open-wc/testing';
import { stub } from 'sinon';

import { transact } from '../src/field-set/actions.ts';

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
  element.transact = stub().resolves(successfulTransaction);
  document.body.appendChild(element);
  return element;
};

describe('transact idempotency', () => {
  afterEach(() => {
    document.getElementsByName(TRANSACTING_ELEMENT_NAME).forEach(element => element.remove());
  });

  it('passes idempotencyId to the backend payload as idempotency_id', async () => {
    const transactingElement = createTransactingElement();

    await transact({ amount: 1200, idempotencyId: 'checkout-attempt-123' });

    expect(transactingElement.transact.calledOnce).to.be.true;
    const transactionData = transactingElement.transact.firstCall.args[0];
    expect(transactionData.payTheoryData.idempotency_id).to.equal('checkout-attempt-123');
  });
});
