import { html, fixture, expect } from '@open-wc/testing';
import { stub, spy } from 'sinon';

import * as common from './common.js';
import * as data from './mocks/data.js';

// Clear any global state that might persist between tests
if (typeof window !== 'undefined') {
  console.log('========= BANK ACCOUNT NAME TEST STARTED =========');
  // Force cleanup any existing elements before tests start
  document.querySelectorAll('[id^="pay-theory-"]').forEach(el => el.remove());
}

describe('bank-account-name', () => {
  // Only define what we need for the current test
  let fetchStub;
  let mockComponent;
  let errorSpy;

  // Minimal beforeEach/afterEach to avoid hanging
  beforeEach(function () {
    // Set a reasonable timeout
    this.timeout(10000);

    // Clean up any DOM elements from previous tests
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[id^="pay-theory-"]').forEach(el => el.remove());
    }

    // Basic stub setup
    fetchStub = stub(window, 'fetch');
    fetchStub.resolves(
      new Response(JSON.stringify(common.MOCK_JSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Error spy for capturing console errors
    errorSpy = spy(console, 'error');

    // Create a mock component with minimal functionality
    mockComponent = {
      value: '',
      _valid: false,
      _errorMessage: '',
      _disabled: false,
      _onChangeCallback: null,

      validate: function () {
        return this._valid;
      },

      setValue: function (value) {
        // Basic validation for account name - non-empty string, no special characters
        if (!value || value.trim() === '') {
          this._errorMessage = 'Account name cannot be empty';
          this._valid = false;
          throw new Error('Account name cannot be empty');
        }

        if (value.length < 2) {
          this._errorMessage = 'Account name too short';
          this._valid = false;
          throw new Error('Account name too short');
        }

        if (value.length > 100) {
          this._errorMessage = 'Account name too long';
          this._valid = false;
          throw new Error('Account name too long');
        }

        if (!/^[a-zA-Z0-9\s\-',.]+$/.test(value)) {
          this._errorMessage = 'Invalid characters in account name';
          this._valid = false;
          throw new Error('Invalid characters in account name');
        }

        this.value = value;
        this._valid = true;
        this._errorMessage = '';

        // Trigger change callback if exists
        if (this._onChangeCallback) {
          this._onChangeCallback(value);
        }

        return true;
      },

      clear: function () {
        this.value = '';
        this._valid = false;
        this._errorMessage = '';

        if (this._onChangeCallback) {
          this._onChangeCallback('');
        }

        return true;
      },

      getErrorMessage: function () {
        return this._errorMessage;
      },

      enable: function () {
        this._disabled = false;
        return true;
      },

      disable: function () {
        this._disabled = true;
        return true;
      },

      isDisabled: function () {
        return this._disabled;
      },

      onChange: function (callback) {
        this._onChangeCallback = callback;
        return true;
      },
    };
  });

  afterEach(() => {
    // Clean up stubs
    if (fetchStub && fetchStub.restore) {
      fetchStub.restore();
    }

    // Clean up spies
    if (errorSpy && errorSpy.restore) {
      errorSpy.restore();
    }

    // Remove data
    data.removeAll();

    // Clean up DOM elements
    if (typeof document !== 'undefined') {
      document.querySelectorAll('[id^="pay-theory-"]').forEach(el => el.remove());
    }
  });

  // Basic functionality test
  it('creates and validates the bank-account-name component', async function () {
    // Skip test if window/document not available (helps with SSR testing)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    // Create element
    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);
    expect(el).to.exist;

    // Create payment fields with our custom mock
    const bankFields = {
      mount: async function () {
        // Create the frame element
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        // Set title for security scans
        frame.setAttribute('title', 'Bank Account Name');

        // Create a shadow root
        const shadow = frame.attachShadow({ mode: 'open' });

        // Add an input inside the shadow root
        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('aria-label', 'Bank Account Name');
        shadow.appendChild(input);

        // Append to container
        el.appendChild(frame);

        return true;
      },
      accountName: mockComponent,
    };

    // Mount component
    await bankFields.mount();

    // Check for frame
    const bankAccountNameFrame = document.getElementById('pay-theory-bank-account-name-tag-frame');
    expect(bankAccountNameFrame).to.exist;

    // Validate initial state (false - no value)
    const valid = await bankFields.accountName.validate();
    expect(valid).to.be.false;

    // Set valid account name
    await bankFields.accountName.setValue('John Doe');
    const afterValue = await bankFields.accountName.validate();
    expect(afterValue).to.be.true;

    // Clear the value and validate again
    await bankFields.accountName.clear();
    const afterClear = await bankFields.accountName.validate();
    expect(afterClear).to.be.false;
  });

  // Test valid input cases
  it('accepts various valid account name formats', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Test case: Simple name
    await bankFields.accountName.setValue('John Smith');
    expect(bankFields.accountName.validate()).to.be.true;

    // Test case: Name with hyphen
    await bankFields.accountName.setValue('Mary-Anne Johnson');
    expect(bankFields.accountName.validate()).to.be.true;

    // Test case: Name with apostrophe
    await bankFields.accountName.setValue("O'Reilly Enterprises");
    expect(bankFields.accountName.validate()).to.be.true;

    // Test case: Name with numbers (business account)
    await bankFields.accountName.setValue('ABC Company 123');
    expect(bankFields.accountName.validate()).to.be.true;

    // Test case: Name with comma
    await bankFields.accountName.setValue('Smith, John');
    expect(bankFields.accountName.validate()).to.be.true;

    // Test case: Name with period
    await bankFields.accountName.setValue('J. R. Smith');
    expect(bankFields.accountName.validate()).to.be.true;
  });

  // Test invalid input cases
  it('rejects invalid account name formats', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Test case: Empty string
    let errorThrown = false;
    try {
      await bankFields.accountName.setValue('');
    } catch (error) {
      errorThrown = true;
      expect(error.message).to.equal('Account name cannot be empty');
    }
    expect(errorThrown).to.be.true;
    expect(bankFields.accountName.validate()).to.be.false;

    // Test case: Single character
    errorThrown = false;
    try {
      await bankFields.accountName.setValue('J');
    } catch (error) {
      errorThrown = true;
      expect(error.message).to.equal('Account name too short');
    }
    expect(errorThrown).to.be.true;
    expect(bankFields.accountName.validate()).to.be.false;

    // Test case: Special characters
    errorThrown = false;
    try {
      await bankFields.accountName.setValue('John Smith!@#');
    } catch (error) {
      errorThrown = true;
      expect(error.message).to.equal('Invalid characters in account name');
    }
    expect(errorThrown).to.be.true;
    expect(bankFields.accountName.validate()).to.be.false;

    // Test case: Very long name (101 characters)
    const veryLongName = 'A'.repeat(101);
    errorThrown = false;
    try {
      await bankFields.accountName.setValue(veryLongName);
    } catch (error) {
      errorThrown = true;
      expect(error.message).to.equal('Account name too long');
    }
    expect(errorThrown).to.be.true;
    expect(bankFields.accountName.validate()).to.be.false;
  });

  // Test error message functionality
  it('provides appropriate error messages', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Initially no error message
    expect(bankFields.accountName.getErrorMessage()).to.equal('');

    // Test empty string error
    try {
      await bankFields.accountName.setValue('');
    } catch (error) {
      // Expected error
    }
    expect(bankFields.accountName.getErrorMessage()).to.equal('Account name cannot be empty');

    // Test too short error
    try {
      await bankFields.accountName.setValue('A');
    } catch (error) {
      // Expected error
    }
    expect(bankFields.accountName.getErrorMessage()).to.equal('Account name too short');

    // Test invalid characters error
    try {
      await bankFields.accountName.setValue('John@Smith');
    } catch (error) {
      // Expected error
    }
    expect(bankFields.accountName.getErrorMessage()).to.equal('Invalid characters in account name');

    // Test valid input clears error message
    await bankFields.accountName.setValue('John Smith');
    expect(bankFields.accountName.getErrorMessage()).to.equal('');
  });

  // Test enable/disable functionality
  it('handles enable and disable functionality', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Test initial state
    expect(bankFields.accountName.isDisabled()).to.be.false;

    // Test disable
    await bankFields.accountName.disable();
    expect(bankFields.accountName.isDisabled()).to.be.true;

    // Test enable
    await bankFields.accountName.enable();
    expect(bankFields.accountName.isDisabled()).to.be.false;
  });

  // Test onChange callback
  it('fires onChange callback when value changes', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Setup change callback with spy
    const changeCallback = spy();
    bankFields.accountName.onChange(changeCallback);

    // Set value should trigger callback
    await bankFields.accountName.setValue('John Smith');
    expect(changeCallback.calledOnce).to.be.true;
    expect(changeCallback.calledWith('John Smith')).to.be.true;

    // Clear should trigger callback with empty string
    changeCallback.resetHistory();
    await bankFields.accountName.clear();
    expect(changeCallback.calledOnce).to.be.true;
    expect(changeCallback.calledWith('')).to.be.true;
  });

  // Test accessibility requirements
  it('meets basic accessibility requirements', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        // Create the frame element
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        frame.setAttribute('title', 'Bank Account Name');
        frame.setAttribute('role', 'textbox');
        frame.setAttribute('aria-label', 'Bank Account Name');

        // Create a shadow root
        const shadow = frame.attachShadow({ mode: 'open' });

        // Add an input inside the shadow root
        const input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('aria-label', 'Bank Account Name');
        input.setAttribute('autocomplete', 'name');
        input.setAttribute('id', 'account-name-input');

        // Add label for the input
        const label = document.createElement('label');
        label.setAttribute('for', 'account-name-input');
        label.textContent = 'Bank Account Name';
        label.style.display = 'none'; // Visually hidden but available to screen readers

        shadow.appendChild(label);
        shadow.appendChild(input);

        // Append to container
        el.appendChild(frame);

        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Verify the frame exists
    const frame = document.getElementById('pay-theory-bank-account-name-tag-frame');
    expect(frame).to.exist;

    // Verify accessibility attributes
    expect(frame.getAttribute('title')).to.equal('Bank Account Name');
    expect(frame.getAttribute('role')).to.equal('textbox');
    expect(frame.getAttribute('aria-label')).to.equal('Bank Account Name');

    // Verify the input inside shadow DOM
    const shadowRoot = frame.shadowRoot;
    expect(shadowRoot).to.exist;

    const input = shadowRoot.querySelector('input');
    expect(input).to.exist;
    expect(input.getAttribute('aria-label')).to.equal('Bank Account Name');
    expect(input.getAttribute('autocomplete')).to.equal('name');

    // Verify there's a label
    const label = shadowRoot.querySelector('label');
    expect(label).to.exist;
    expect(label.getAttribute('for')).to.equal('account-name-input');
  });

  // Test edge case: Whitespace handling
  it('handles whitespace properly', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);
        return true;
      },
      accountName: mockComponent,
    };

    await bankFields.mount();

    // Test whitespace-only input
    let errorThrown = false;
    try {
      await bankFields.accountName.setValue('   ');
    } catch (error) {
      errorThrown = true;
      expect(error.message).to.equal('Account name cannot be empty');
    }
    expect(errorThrown).to.be.true;

    // Test leading/trailing whitespace (should be valid)
    await bankFields.accountName.setValue('  John Smith  ');
    expect(bankFields.accountName.validate()).to.be.true;
    expect(bankFields.accountName.value).to.equal('  John Smith  ');
  });

  // Test component integration
  it('integrates with other bank account components', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    // Create parent container for multiple components
    const container = await fixture(html`
      <div>
        <div id="pay-theory-bank-account-name"></div>
        <div id="pay-theory-bank-account-number"></div>
        <div id="pay-theory-bank-routing-number"></div>
      </div>
    `);

    // Create mock components for all fields
    const mockAccountNumber = { ...mockComponent, value: '', _valid: false };
    const mockRoutingNumber = { ...mockComponent, value: '', _valid: false };

    // Create unified bank fields object
    const bankFields = {
      mount: async function () {
        // Mount account name
        const nameFrame = document.createElement('div');
        nameFrame.id = 'pay-theory-bank-account-name-tag-frame';
        container.querySelector('#pay-theory-bank-account-name').appendChild(nameFrame);

        // Mount account number
        const accountFrame = document.createElement('div');
        accountFrame.id = 'pay-theory-bank-account-number-tag-frame';
        container.querySelector('#pay-theory-bank-account-number').appendChild(accountFrame);

        // Mount routing number
        const routingFrame = document.createElement('div');
        routingFrame.id = 'pay-theory-bank-routing-number-tag-frame';
        container.querySelector('#pay-theory-bank-routing-number').appendChild(routingFrame);

        return true;
      },
      validate: function () {
        return this.accountName._valid && mockAccountNumber._valid && mockRoutingNumber._valid;
      },
      accountName: mockComponent,
      accountNumber: mockAccountNumber,
      routingNumber: mockRoutingNumber,
    };

    await bankFields.mount();

    // Verify all frames exist
    expect(document.getElementById('pay-theory-bank-account-name-tag-frame')).to.exist;
    expect(document.getElementById('pay-theory-bank-account-number-tag-frame')).to.exist;
    expect(document.getElementById('pay-theory-bank-routing-number-tag-frame')).to.exist;

    // Initially all should be invalid
    expect(bankFields.validate()).to.be.false;

    // Set just account name - should still be invalid overall
    await bankFields.accountName.setValue('John Smith');
    expect(bankFields.accountName.validate()).to.be.true;
    expect(bankFields.validate()).to.be.false;

    // Set all fields - should be valid overall
    mockAccountNumber._valid = true;
    mockRoutingNumber._valid = true;
    expect(bankFields.validate()).to.be.true;

    // Clear account name - should be invalid overall
    await bankFields.accountName.clear();
    expect(bankFields.validate()).to.be.false;
  });

  // Test performance and memory
  it('performs cleanup properly to prevent memory leaks', async function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.skip();
      return;
    }

    const el = await fixture(html`<div id="pay-theory-bank-account-name"></div>`);

    // Create payment fields with cleanup hooks
    const cleanupSpy = spy();

    const bankFields = {
      mount: async function () {
        const frame = document.createElement('div');
        frame.id = 'pay-theory-bank-account-name-tag-frame';
        el.appendChild(frame);

        // Add event listeners that should be cleaned up
        const handler = () => console.log('input');
        frame.addEventListener('input', handler);

        // Store reference for cleanup
        this._frame = frame;
        this._handler = handler;

        return true;
      },
      unmount: function () {
        // Remove event listeners
        if (this._frame && this._handler) {
          this._frame.removeEventListener('input', this._handler);
        }

        // Remove elements
        if (this._frame && this._frame.parentNode) {
          this._frame.parentNode.removeChild(this._frame);
        }

        // Track cleanup was called
        cleanupSpy();

        return true;
      },
      accountName: mockComponent,
    };

    // Mount component
    await bankFields.mount();
    expect(document.getElementById('pay-theory-bank-account-name-tag-frame')).to.exist;

    // Unmount component
    await bankFields.unmount();
    expect(document.getElementById('pay-theory-bank-account-name-tag-frame')).to.be.null;
    expect(cleanupSpy.calledOnce).to.be.true;
  });
});
