import { html, fixture, expect } from '@open-wc/testing';
import { stub, spy } from 'sinon';
import sinon from 'sinon';

import * as common from './common.js';
import createPaymentFields from './mocks/payment-fields.js';
import * as data from './mocks/data.js';

describe('createPaymentFields', () => {
  let fetchStub;
  let errorSpy;

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch');
    fetchStub.onCall(0).resolves(
      new Response(JSON.stringify(common.MOCK_TOKEN), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    fetchStub.onCall(1).resolves(
      new Response(JSON.stringify(common.MOCK_JSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    fetchStub.onCall(2).resolves(
      new Response(JSON.stringify(common.MOCK_JSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    fetchStub.onCall(3).resolves(
      new Response(JSON.stringify(common.MOCK_JSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    fetchStub.onCall(4).resolves(
      new Response(JSON.stringify(common.MOCK_JSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    errorSpy = spy();
    window.onerror = errorSpy;
  });

  afterEach(() => {
    fetchStub.restore();
    data.removeAll();
    window.onerror = null;
  });

  it('renders iframes', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client, {});

    const ccTag = document.getElementById('pay-theory-credit-card');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const tfTag = document.getElementById('pay-theory-credit-card-tag-frame');
    expect(tfTag).to.exist;

    const fcTag = document.getElementById('pay-theory-credit-card-hosted-field-container');
    expect(fcTag).to.exist;

    const fwNum = document.getElementById('field-wrapper-card-number').childElementCount;
    expect(fwNum).to.be.greaterThan(0);

    const fwExp = document.getElementById('field-wrapper-card-exp').childElementCount;
    expect(fwExp).to.be.greaterThan(0);

    const fwCvv = document.getElementById('field-wrapper-card-cvv').childElementCount;
    expect(fwCvv).to.be.greaterThan(0);
  });

  it('renders iframes with an additional account name and zip field', async () => {
    const el = await fixture(html`
      <div id="pay-theory-credit-card"></div>
      <div id="pay-theory-credit-card-account-name"></div>
      <div id="pay-theory-credit-card-zip"></div>
    `);

    const creditCard = await createPaymentFields(common.api, common.client);

    const ccTag = document.getElementById('pay-theory-credit-card');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const tfTag = document.getElementById('pay-theory-credit-card-tag-frame');
    expect(tfTag).to.exist;

    const fcTag = document.getElementById('pay-theory-credit-card-hosted-field-container');
    expect(fcTag).to.exist;

    const fwNum = document.getElementById('field-wrapper-card-number').childElementCount;
    expect(fwNum).to.be.greaterThan(0);

    const fwExp = document.getElementById('field-wrapper-card-exp').childElementCount;
    expect(fwExp).to.be.greaterThan(0);

    const fwCvv = document.getElementById('field-wrapper-card-cvv').childElementCount;
    expect(fwCvv).to.be.greaterThan(0);

    const fwName = document.getElementById('field-wrapper-card-name').childElementCount;
    expect(fwName).to.be.greaterThan(0);

    const fwZip = document.getElementById('field-wrapper-billing-zip').childElementCount;
    expect(fwZip).to.be.greaterThan(0);
  });

  it('renders iframes with all fields split out', async () => {
    const el = await fixture(html`
      <div id="pay-theory-credit-card-number"></div>
      <div id="pay-theory-credit-card-exp"></div>
      <div id="pay-theory-credit-card-cvv"></div>
      <div id="pay-theory-credit-card-account-name"></div>
      <div id="pay-theory-credit-card-zip"></div>
      <div id="pay-theory-credit-card-address-1"></div>
      <div id="pay-theory-credit-card-address-2"></div>
      <div id="pay-theory-credit-card-city"></div>
      <div id="pay-theory-credit-card-state"></div>
    `);

    const creditCard = await createPaymentFields(common.api, common.client);

    const ccTag = document.getElementById('pay-theory-credit-card-number');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const tfTag = document.getElementById('pay-theory-credit-card-number-tag-frame');
    expect(tfTag).to.exist;

    const fcTag = document.getElementById('pay-theory-credit-card-exp-tag-frame');
    expect(fcTag).to.exist;

    const fwNum = document.getElementById('field-wrapper-card-number').childElementCount;
    expect(fwNum).to.be.greaterThan(0);

    const fwExp = document.getElementById('field-wrapper-card-exp').childElementCount;
    expect(fwExp).to.be.greaterThan(0);

    const fwCVV = document.getElementById('field-wrapper-card-cvv').childElementCount;
    expect(fwCVV).to.be.greaterThan(0);

    const fwName = document.getElementById('field-wrapper-card-name').childElementCount;
    expect(fwName).to.be.greaterThan(0);

    const fwLineOne = document.getElementById('field-wrapper-billing-line1').childElementCount;
    expect(fwLineOne).to.be.greaterThan(0);

    const fwLineTwo = document.getElementById('field-wrapper-billing-line2').childElementCount;
    expect(fwLineTwo).to.be.greaterThan(0);

    const fwState = document.getElementById('field-wrapper-billing-state').childElementCount;
    expect(fwState).to.be.greaterThan(0);

    const fwZip = document.getElementById('field-wrapper-billing-zip').childElementCount;
    expect(fwZip).to.be.greaterThan(0);
  });

  it('renders iframes with custom element id', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card-custom"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client, 2500);

    const ccTag = document.getElementById('pay-theory-credit-card-custom');
    expect(ccTag).to.exist;

    await creditCard.mount({
      'credit-card': 'pay-theory-credit-card-custom',
      number: '',
      exp: '',
      cvv: '',
      'account-name': '',
      'address-1': '',
      'address-2': '',
      city: '',
      state: '',
      zip: '',
    });

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    const tfTag = document.getElementById('pay-theory-credit-card-custom-tag-frame');
    expect(tfTag).to.exist;

    const fcTag = document.getElementById('pay-theory-credit-card-hosted-field-container');
    expect(fcTag).to.exist;

    const fwNum = document.getElementById('field-wrapper-card-number').childElementCount;
    expect(fwNum).to.be.greaterThan(0);

    const fwExp = document.getElementById('field-wrapper-card-exp').childElementCount;
    expect(fwExp).to.be.greaterThan(0);

    const fwCvv = document.getElementById('field-wrapper-card-cvv').childElementCount;
    expect(fwCvv).to.be.greaterThan(0);
  });

  it('initTransaction sets transact to true', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client);

    const ccTag = document.getElementById('pay-theory-credit-card');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const ccTagFrame = document.getElementById('pay-theory-credit-card-tag-frame');

    expect(ccTagFrame.transact).to.be.undefined;

    await creditCard.initTransaction(2500);

    expect(ccTagFrame.transact).to.be.true;
  });

  it('initTransaction sets tokenize to true with verification step and cancel', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client);

    const ccTag = document.getElementById('pay-theory-credit-card');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const ccTagFrame = document.getElementById('pay-theory-credit-card-tag-frame');

    expect(ccTagFrame.tokenize).to.be.undefined;

    await creditCard.initTransaction(2500, {}, true);

    expect(ccTagFrame.tokenize).to.be.true;

    await creditCard.cancel();

    expect(ccTagFrame.tokenize).to.be.undefined;
  });

  it('initTransaction sets capture to true with verification step and confirm', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client);

    const ccTag = document.getElementById('pay-theory-credit-card');
    expect(ccTag).to.exist;

    await creditCard.mount();

    // Wait a small amount of time for elements to be created
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(errorSpy.called).to.be.false;

    const ccTagFrame = document.getElementById('pay-theory-credit-card-tag-frame');

    expect(ccTagFrame.tokenize).to.be.undefined;

    await creditCard.initTransaction(2500, {}, true);

    expect(ccTagFrame.tokenize).to.be.true;

    expect(ccTagFrame.capture).to.be.undefined;

    await creditCard.confirm();

    expect(ccTagFrame.capture).to.be.true;
  });

  it('readyObserver triggers on ready message from mount', async () => {
    const el = await fixture(html`<div id="pay-theory-credit-card"></div>`);

    const creditCard = await createPaymentFields(common.api, common.client, 2500);

    const readySpy = sinon.spy();

    await creditCard.readyObserver(readySpy);

    // Wait a small amount of time
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(readySpy.called).to.be.false;

    await creditCard.mount();

    // Wait a small amount of time for ready event
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(readySpy.called).to.be.true;
  });
});
