/* eslint-disable @typescript-eslint/no-unused-vars */
import { html, fixture, expect, assert } from '@open-wc/testing';
import { aTimeout } from '@open-wc/testing-helpers';
import sinon from 'sinon';

import * as common from './common';
import '../src/components/credit-card';
import createPaymentFields from '../src/field-set/payment-fields';
import * as data from '../src/common/data';

describe('credit-card', () => {
  let error;

  beforeEach(() => {
    let stub = sinon.stub(window, 'fetch'); //add stub
    stub.onCall(0).returns(common.jsonOk(common.MOCK_TOKEN));
    stub.onCall(1).returns(common.jsonOk(common.MOCK_JSON));
    stub.onCall(2).returns(common.jsonOk(common.MOCK_JSON));
    stub.onCall(3).returns(common.jsonOk(common.MOCK_JSON));
    stub.onCall(4).returns(common.jsonOk(common.MOCK_JSON));

    error = undefined;
    window.onerror = e => (error = e);
  });

  afterEach(() => {
    window.fetch.restore(); //remove stub
    data.removeAll();
  });

  // it('getters and setters work', async() => {

  //     const fixed = await fixture(html ` <pay-theory-credit-card-tag-frame/>`);

  //     expect(fixed.ready).to.be;

  //     fixed.valid = true;

  //     expect(fixed.valid).to.be;

  //     fixed.error = 'error'

  //     expect(fixed.error).to.equal('error')

  //     fixed.styles = 'style boy'

  //     expect(fixed.styles).to.equal('style boy')

  //     fixed.styles = null

  //     expect(fixed.styles).to.equal(fixed.defaultStyles)

  //     fixed.amount = 200;

  //     expect(fixed.amount).to.equal(200)

  // });

  it('negative interger throws error on tokenize', async () => {
    const fixed = await fixture(html` <div id="pay-theory-credit-card" />`);

    const creditCard = await createPaymentFields(common.api, common.client, {});

    const ccDiv = await document.getElementById('pay-theory-credit-card');

    await expect(ccDiv).to.be.ok;

    await creditCard.mount();

    const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

    expect(ccTagFrame.valid).to.be;

    let spy = sinon.spy();

    creditCard.errorObserver(spy);

    expect(error).not.to.be;

    ccTagFrame.tokenize = -2;

    expect(error).to.be;
  });

  it('negative interger throws error on transact', async () => {
    const fixed = await fixture(html` <div id="pay-theory-credit-card" />`);

    const creditCard = await createPaymentFields(common.api, common.client, {});

    const ccDiv = await document.getElementById('pay-theory-credit-card');

    await expect(ccDiv).to.be.ok;

    await creditCard.mount();

    const ccTagFrame = await document.getElementById('pay-theory-credit-card-tag-frame');

    expect(ccTagFrame.valid).to.be;

    let spy = sinon.spy();

    creditCard.errorObserver(spy);

    expect(error).not.to.be;

    ccTagFrame.transact = -2;

    expect(error).to.be;

    ccTagFrame.transact = false;

    expect(ccTagFrame.transact).not.to.be;
  });
});
