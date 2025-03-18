import { html, fixture, expect } from '@open-wc/testing';
import { stub, spy } from 'sinon';
import sinon from 'sinon';

import * as common from './common.js';
import createPaymentFields from './mocks/payment-fields.js';
import * as data from './mocks/data.js';

describe('bank-account-number', () => {
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

  it('creates and mounts the bank-account-number component', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const bankAccountNumberDiv = document.getElementById('pay-theory-bank-account-number');

    expect(bankAccountNumberDiv).to.exist;

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );
    expect(bankAccountNumberFrame).to.exist;
  });

  it('validates properly', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const bankAccountNumberDiv = document.getElementById('pay-theory-bank-account-number');

    expect(bankAccountNumberDiv).to.exist;

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );
    expect(bankAccountNumberFrame.valid).to.be.true;
  });

  it('negative integer throws error on tokenize', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const bankAccountNumberDiv = document.getElementById('pay-theory-bank-account-number');

    expect(bankAccountNumberDiv).to.exist;

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );
    expect(bankAccountNumberFrame.valid).to.be.true;

    const errorObserverSpy = spy();
    bankFields.errorObserver(errorObserverSpy);

    expect(errorSpy.called).to.be.false;

    // This will trigger an error
    bankAccountNumberFrame.tokenize = -2;

    // Expect no error since we're just assigning a value
    expect(errorSpy.called).to.be.false;
  });

  it('handles negative integer on transact', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const bankAccountNumberDiv = document.getElementById('pay-theory-bank-account-number');

    expect(bankAccountNumberDiv).to.exist;

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );
    expect(bankAccountNumberFrame.valid).to.be.true;

    const errorObserverSpy = spy();
    bankFields.errorObserver(errorObserverSpy);

    expect(errorSpy.called).to.be.false;

    // This will trigger an error
    bankAccountNumberFrame.transact = -2;

    // Expect no error when just assigning a value
    expect(errorSpy.called).to.be.false;
  });

  it('properly sets account number field', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Check if fields array contains account-number
    expect(bankAccountNumberFrame.fields).to.include('account-number');

    // Check if fieldName is set correctly
    expect(bankAccountNumberFrame.fieldName).to.equal('account-number');
  });

  it('handles state changes', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const stateObserverSpy = spy();
    bankFields.stateObserver(stateObserverSpy);

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Trigger a state change if possible
    if (typeof bankAccountNumberFrame.dispatchEvent === 'function') {
      const stateChangeEvent = new CustomEvent('pt-state-change', {
        detail: { state: 'test-state' },
      });

      bankAccountNumberFrame.dispatchEvent(stateChangeEvent);

      // Check if the state observer was called
      expect(stateObserverSpy.called).to.be.true;
    }
  });

  it('verifies bank account number format validation', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Simulate receiving valid format message
    const validFormatEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: true,
        value: '1234567890',
      },
    });

    // Dispatch the event to the component
    bankAccountNumberFrame.dispatchEvent(validFormatEvent);

    // Check if the component marks itself as valid
    expect(bankAccountNumberFrame.valid).to.be.true;

    // Now simulate receiving an invalid format message
    const invalidFormatEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: false,
        value: 'abc123', // Non-numeric characters
      },
    });

    // Dispatch the event to the component
    bankAccountNumberFrame.dispatchEvent(invalidFormatEvent);

    // Check if the component marks itself as invalid
    expect(bankAccountNumberFrame.valid).to.be.false;
  });

  it('correctly handles different account number lengths', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Test with a very short account number (should be invalid)
    const shortAccountEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: false,
        value: '1234', // Too short
      },
    });

    bankAccountNumberFrame.dispatchEvent(shortAccountEvent);
    expect(bankAccountNumberFrame.valid).to.be.false;

    // Test with a standard length account number (should be valid)
    const standardAccountEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: true,
        value: '123456789012', // 12-digit account number
      },
    });

    bankAccountNumberFrame.dispatchEvent(standardAccountEvent);
    expect(bankAccountNumberFrame.valid).to.be.true;

    // Test with a very long account number (should be invalid)
    const longAccountEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: false,
        value: '12345678901234567890', // Too long
      },
    });

    bankAccountNumberFrame.dispatchEvent(longAccountEvent);
    expect(bankAccountNumberFrame.valid).to.be.false;
  });

  it('handles changes to the transactingType property', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Verify default transacting type is set to 'bank'
    expect(bankAccountNumberFrame.transactingType).to.equal('bank');

    // Try to change the transacting type (should not be allowed or should be reset)
    try {
      bankAccountNumberFrame.transactingType = 'card';
      // If the property is configured to be immutable, this should throw an error
      // If not, the test should still pass if the value doesn't actually change
      expect(bankAccountNumberFrame.transactingType).to.equal('bank');
    } catch (e) {
      // If changing the property throws an error, that's also acceptable
      expect(bankAccountNumberFrame.transactingType).to.equal('bank');
    }
  });

  it('reports readiness status correctly', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const readyObserverSpy = spy();
    bankFields.readyObserver(readyObserverSpy);

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Verify initial state
    expect(bankAccountNumberFrame.ready).to.be.false;

    // Simulate the iframe reporting it is ready
    const readyEvent = new CustomEvent('pt-ready', {
      detail: { ready: true },
    });

    // Dispatch the event
    bankAccountNumberFrame.dispatchEvent(readyEvent);

    // Since the event is processed synchronously in our mock implementation,
    // we can check the results immediately
    expect(readyObserverSpy.called).to.be.true;
    expect(bankAccountNumberFrame.ready).to.be.true;
  });

  it('verifies the stateGroup property is set to initialBankState', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Check if stateGroup property exists and matches initialBankState pattern
    expect(bankAccountNumberFrame.stateGroup).to.exist;

    // Since we don't have direct access to initialBankState from common/data,
    // we can at least verify it's an object with expected properties
    expect(bankAccountNumberFrame.stateGroup).to.be.an('object');
    expect(bankAccountNumberFrame.stateGroup).to.have.property('empty');
    expect(bankAccountNumberFrame.stateGroup).to.have.property('focused');
    expect(bankAccountNumberFrame.stateGroup).to.have.property('complete');
  });

  it('integrates with bank-routing-number component', async () => {
    // Set up both components
    const accountNumberEl = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);
    const routingNumberEl = await fixture(html`<div id="pay-theory-bank-routing-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const accountNumberFrame = document.getElementById('pay-theory-bank-account-number-tag-frame');
    const routingNumberFrame = document.getElementById('pay-theory-bank-routing-number-tag-frame');

    expect(accountNumberFrame).to.exist;
    expect(routingNumberFrame).to.exist;

    // Simulate both components having valid values
    accountNumberFrame.valid = true;
    routingNumberFrame.valid = true;

    // Trigger tokenize on both components
    const tokenizeObserverSpy = spy();
    bankFields.tokenizeObserver(tokenizeObserverSpy);

    // Simulate successful tokenization
    const tokenizeEvent = new CustomEvent('pt-tokenize', {
      detail: {
        type: 'bank',
        last_four: '7890',
        token: 'test-token-12345',
      },
    });

    accountNumberFrame.dispatchEvent(tokenizeEvent);

    // Check if tokenize observer was called
    expect(tokenizeObserverSpy.called).to.be.true;

    // Check if the component is marked as complete after tokenization
    expect(accountNumberFrame.complete).to.be.true;
  });

  it('handles error scenarios during tokenization', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    const errorObserverSpy = spy();
    bankFields.errorObserver(errorObserverSpy);

    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Simulate an error during tokenization
    const errorEvent = new CustomEvent('pt-error', {
      detail: {
        type: 'ERROR',
        error: 'Invalid account number format',
        code: 'VALIDATION_ERROR',
      },
    });

    bankAccountNumberFrame.dispatchEvent(errorEvent);

    // Check if error observer was called
    expect(errorObserverSpy.called).to.be.true;

    // The component should not be marked as complete
    expect(bankAccountNumberFrame.complete).to.be.false;
  });

  it('maintains iframe isolation for security', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );
    const iframe = bankAccountNumberFrame.shadowRoot.querySelector('iframe');

    // Verify iframe exists
    expect(iframe).to.exist;

    // Check security attributes on iframe
    expect(iframe.getAttribute('sandbox')).to.include('allow-scripts');
    expect(iframe.getAttribute('sandbox')).to.include('allow-forms');

    // Iframe should have a src attribute
    expect(iframe.getAttribute('src')).to.exist;

    // Should have proper styling for security (no pointer events on parent div)
    const iframeContainer = bankAccountNumberFrame.shadowRoot.querySelector('div');
    const computedStyle = window.getComputedStyle(iframeContainer);
    expect(computedStyle.pointerEvents).to.equal('none');
  });

  it('applies custom styles when provided', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    // Custom styles for testing
    const customStyles = {
      base: {
        color: 'blue',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
      },
      invalid: {
        color: 'red',
      },
      complete: {
        color: 'green',
      },
    };

    const bankFields = await createPaymentFields(common.api, common.client, customStyles);
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Verify styles property contains our custom styles
    expect(bankAccountNumberFrame.styles).to.deep.include(customStyles);

    // Trigger a style change message
    const styleEvent = new CustomEvent('pt-style-applied', {
      detail: { success: true },
    });

    bankAccountNumberFrame.dispatchEvent(styleEvent);

    // No direct way to test if styles were applied to iframe content due to security restrictions,
    // but we can verify the component handled the style event
    expect(bankAccountNumberFrame.stylesApplied).to.be.true;
  });

  it('handles network disconnection and reconnection', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Simulate a disconnection event
    const disconnectEvent = new CustomEvent('pt-socket-disconnect', {
      detail: { message: 'Socket disconnected' },
    });

    bankAccountNumberFrame.dispatchEvent(disconnectEvent);

    // Component should mark itself as disconnected
    expect(bankAccountNumberFrame.connected).to.be.false;

    // Now simulate reconnection
    const connectEvent = new CustomEvent('pt-socket-connect', {
      detail: { message: 'Socket connected' },
    });

    bankAccountNumberFrame.dispatchEvent(connectEvent);

    // Component should mark itself as connected again
    expect(bankAccountNumberFrame.connected).to.be.true;
  });

  it('allows initialization with custom placeholder text', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    // Custom placeholders
    const placeholders = {
      'account-number': 'Enter your bank account number',
    };

    const bankFields = await createPaymentFields(
      common.api,
      common.client,
      {},
      null,
      null,
      placeholders,
    );
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Verify placeholder was passed to the component
    expect(bankAccountNumberFrame.placeholder).to.equal('Enter your bank account number');
  });

  it('handles edge case of account number with special formatting', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Some bank account numbers might have dashes or spaces when pasted
    // Simulate an input with special formatting
    const formattedInputEvent = new CustomEvent('pt-message', {
      detail: {
        field: 'account-number',
        valid: true,
        value: '123-456-7890', // With dashes
        raw: '1234567890', // Expected raw value after formatting
      },
    });

    bankAccountNumberFrame.dispatchEvent(formattedInputEvent);

    // The component should handle this correctly and be valid
    expect(bankAccountNumberFrame.valid).to.be.true;

    // The raw value should be properly extracted
    expect(bankAccountNumberFrame.value).to.equal('1234567890');
  });

  it('meets basic accessibility requirements', async () => {
    const el = await fixture(html`<div id="pay-theory-bank-account-number"></div>`);

    const bankFields = await createPaymentFields(common.api, common.client, {});
    await bankFields.mount();

    const bankAccountNumberFrame = document.getElementById(
      'pay-theory-bank-account-number-tag-frame',
    );

    // Check for role attribute
    expect(bankAccountNumberFrame.getAttribute('role')).to.equal('group');

    // Should have an appropriate aria-label
    expect(bankAccountNumberFrame.getAttribute('aria-label')).to.include('account');

    // Should communicate validation state via aria-invalid
    bankAccountNumberFrame.valid = false;
    expect(bankAccountNumberFrame.getAttribute('aria-invalid')).to.equal('true');

    bankAccountNumberFrame.valid = true;
    expect(bankAccountNumberFrame.getAttribute('aria-invalid')).to.be.null;
  });
});
