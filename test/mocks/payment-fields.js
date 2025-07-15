/**
 * Mock version of the payment-fields module for testing
 */

// Mock implementation of the createPaymentFields function
export default function createPaymentFields(
  api,
  client,
  options = {},
  amount,
  feeMode,
  placeholders,
) {
  // Create observer callbacks storage
  const observers = {
    error: null,
    ready: null,
    state: null,
    valid: null,
    tokenize: null,
    transacted: null,
    capture: null,
    cash: null,
    validation: null, // Add validation observer
    socket: null, // Add socket observer for connection events
  };

  // Return a mock payment fields object
  return {
    mount: async elements => {
      // Create the necessary DOM elements for testing - Credit Card components
      const ccContainer = document.createElement('div');
      ccContainer.id = 'pay-theory-credit-card-tag-frame';
      ccContainer.valid = true;
      ccContainer.fields = ['card-number', 'card-exp', 'card-cvv'];
      ccContainer.fieldName = 'credit-card';
      ccContainer.complete = false;
      ccContainer.connected = true;
      ccContainer.ready = true;
      ccContainer.transactingType = 'card';
      ccContainer.stylesApplied = false;
      ccContainer.styles = options;
      ccContainer.stateGroup = {
        empty: true,
        focused: false,
        complete: false,
      };

      // Add shadow root for iframe tests
      ccContainer.attachShadow({ mode: 'open' });
      const iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms');
      iframe.setAttribute('src', 'https://example.com/secure-iframe');
      const iframeContainer = document.createElement('div');
      iframeContainer.style.pointerEvents = 'none';
      iframeContainer.appendChild(iframe);
      ccContainer.shadowRoot.appendChild(iframeContainer);

      document.body.appendChild(ccContainer);

      // Create hosted field container
      const hostedContainer = document.createElement('div');
      hostedContainer.id = 'pay-theory-credit-card-hosted-field-container';
      document.body.appendChild(hostedContainer);

      // Create field wrappers
      const fieldWrappers = [
        'field-wrapper-card-number',
        'field-wrapper-card-exp',
        'field-wrapper-card-cvv',
        'field-wrapper-card-name',
        'field-wrapper-billing-zip',
        'field-wrapper-billing-line1',
        'field-wrapper-billing-line2',
        'field-wrapper-billing-state',
      ];

      fieldWrappers.forEach(id => {
        const wrapper = document.createElement('div');
        wrapper.id = id;
        const child = document.createElement('div');
        wrapper.appendChild(child);
        document.body.appendChild(wrapper);
      });

      // Create tag frames for split mode
      ['number', 'exp', 'cvv'].forEach(type => {
        const frame = document.createElement('div');
        frame.id = `pay-theory-credit-card-${type}-tag-frame`;
        document.body.appendChild(frame);
      });

      // Create custom tag frame if needed
      if (elements && elements['credit-card'] === 'pay-theory-credit-card-custom') {
        const customFrame = document.createElement('div');
        customFrame.id = 'pay-theory-credit-card-custom-tag-frame';
        document.body.appendChild(customFrame);
      }

      // Create the necessary DOM elements for testing - Bank Account components
      const bankAccountNumberFrame = document.createElement('div');
      // Set the ID to match what the tests expect
      bankAccountNumberFrame.id = 'pay-theory-bank-account-number-tag-frame';
      bankAccountNumberFrame.valid = true;
      bankAccountNumberFrame.fields = ['account-number'];
      bankAccountNumberFrame.fieldName = 'account-number';
      bankAccountNumberFrame.complete = false;
      bankAccountNumberFrame.connected = true;
      bankAccountNumberFrame.ready = false; // Start as not ready
      bankAccountNumberFrame.stylesApplied = false;
      bankAccountNumberFrame.value = '';

      // Set appropriate styles from options
      if (options && typeof options === 'object') {
        bankAccountNumberFrame.styles = JSON.parse(JSON.stringify(options));
      } else {
        bankAccountNumberFrame.styles = { base: { color: '#000000' } };
      }

      // Set placeholder if provided
      if (placeholders && placeholders['account-number']) {
        bankAccountNumberFrame.placeholder = placeholders['account-number'];
      } else {
        bankAccountNumberFrame.placeholder = 'Enter your bank account number';
      }

      // Set up stateGroup
      bankAccountNumberFrame.stateGroup = {
        empty: true,
        focused: false,
        complete: false,
      };

      // Add shadow root for iframe tests
      bankAccountNumberFrame.attachShadow({ mode: 'open' });
      const bankIframe = document.createElement('iframe');
      bankIframe.setAttribute('sandbox', 'allow-scripts allow-forms');
      bankIframe.setAttribute('src', 'https://example.com/secure-iframe');
      const bankIframeContainer = document.createElement('div');
      bankIframeContainer.style.pointerEvents = 'none';
      bankIframeContainer.appendChild(bankIframe);
      bankAccountNumberFrame.shadowRoot.appendChild(bankIframeContainer);

      // Set up a custom attributes tracking system
      bankAccountNumberFrame._attributes = {};
      bankAccountNumberFrame.setAttribute = function (name, value) {
        this._attributes[name] = value;
      };
      bankAccountNumberFrame.getAttribute = function (name) {
        return this._attributes[name] || null;
      };
      bankAccountNumberFrame.removeAttribute = function (name) {
        delete this._attributes[name];
      };

      // Set initial attributes
      bankAccountNumberFrame.setAttribute('role', 'group');
      bankAccountNumberFrame.setAttribute('aria-label', 'account number');

      // Ensure transactingType can't be changed
      let transactingTypeValue = 'bank';
      Object.defineProperty(bankAccountNumberFrame, 'transactingType', {
        get: function () {
          return transactingTypeValue;
        },
        set: function () {
          // Always keep it as 'bank' regardless of the attempted value
          transactingTypeValue = 'bank';
          // Setters should not return values - they should only perform side effects
        },
        configurable: true,
        enumerable: true,
      });

      // Add property for valid state
      bankAccountNumberFrame._valid = true; // Initial state is valid
      Object.defineProperty(bankAccountNumberFrame, 'valid', {
        get() {
          return this._valid;
        },
        set(value) {
          this._valid = value;
          if (value) {
            this.removeAttribute('aria-invalid');
          } else {
            this.setAttribute('aria-invalid', 'true');
          }
        },
      });

      // Modify dispatchEvent for bankAccountNumberFrame
      const originalDispatchEvent = bankAccountNumberFrame.dispatchEvent;
      bankAccountNumberFrame.dispatchEvent = function (event) {
        if (!event) return false;

        try {
          if (event.type === 'pt-ready') {
            this.ready = true; // Ensure ready is set to true
            if (observers.ready) {
              observers.ready(event.detail || { ready: true });
            }
            return true;
          } else if (event.type === 'pt-state-change') {
            // Update the stateGroup with the event details
            if (event.detail) {
              this.stateGroup = { ...this.stateGroup, ...event.detail };

              // If complete is set to true, update the element's complete property
              if (event.detail.complete === true) {
                this.complete = true;
              }

              // If focused is changed, reflect that in the element's state
              if (event.detail.focused !== undefined) {
                // Add a visual indicator for focused state if needed
                if (event.detail.focused) {
                  this.classList.add('focused');
                } else {
                  this.classList.remove('focused');
                }
              }
            }

            // Notify observers
            if (observers.state) {
              observers.state(event.detail || { empty: false, focused: false, complete: false });
            }
            return true;
          } else if (
            event.type === 'pt-message' &&
            event.detail &&
            event.detail.field === 'account-number'
          ) {
            // Handle validation events for the account-number field
            // For the special formatting test, use the raw value if provided
            if (event.detail.raw) {
              this.value = event.detail.raw;
            } else {
              this.value = event.detail.value || '';
            }

            // Important: save the valid state DIRECTLY from the event detail without additional validation
            // This ensures the test cases can control the valid state
            this._valid = event.detail.valid;

            // Update state based on the value length
            const empty = !this.value;
            // Note: In a real implementation, completeness would also depend on validation rules,
            // but for testing we'll consider it based on length only
            const complete = this.value && this.value.length >= 4 && this.value.length <= 17;

            // Dispatch state change event
            this.dispatchEvent(
              new CustomEvent('pt-state-change', {
                detail: {
                  empty: empty,
                  complete: complete,
                  focused: this.classList.contains('focused'),
                },
              }),
            );

            // Notify validation observers with the validation result
            if (observers.validation) {
              observers.validation({
                field: 'account-number',
                valid: this._valid,
                value: this.value,
              });
            }
            return true;
          } else if (event.type === 'pt-socket-disconnect') {
            this.connected = false;
            // Update visual state for disconnection
            this.classList.add('disconnected');
            this.classList.remove('connected');

            if (observers.socket) {
              observers.socket({ connected: false });
            }
            return true;
          } else if (event.type === 'pt-socket-connect') {
            this.connected = true;
            // Update visual state for connection
            this.classList.remove('disconnected');
            this.classList.add('connected');

            if (observers.socket) {
              observers.socket({ connected: true });
            }
            return true;
          } else if (event.type === 'pt-tokenize') {
            // Check for negative numbers in tokenization attempts
            if (event.detail && event.detail.amount && event.detail.amount < 0) {
              // Handle negative amount error case
              const errorEvent = new CustomEvent('pt-error', {
                detail: {
                  code: 'negative_amount',
                  message: 'Amount cannot be negative',
                },
              });
              this.dispatchEvent(errorEvent);
              return false;
            }

            this.complete = true;
            if (observers.tokenize) {
              observers.tokenize(event.detail);
            }
            return true;
          } else if (event.type === 'pt-error') {
            // Apply visual error state
            this.classList.add('error');
            setTimeout(() => this.classList.remove('error'), 3000); // Auto-clear after 3s

            if (observers.error) {
              observers.error(event.detail);
            }
            return true;
          } else if (event.type === 'pt-style-applied') {
            this.stylesApplied = true;
            // Apply styles to the element as specified
            if (this.styles) {
              for (const [key, value] of Object.entries(this.styles.base || {})) {
                this.style[key] = value;
              }
            }
            return true;
          }

          // For other event types
          try {
            return originalDispatchEvent.call(this, event);
          } catch (e) {
            console.error('Error in original dispatchEvent for bankAccountNumberFrame:', e);
            return false;
          }
        } catch (e) {
          console.error('Error dispatching event in bankAccountNumberFrame:', e);
          return false;
        }
      };

      // Insert the element where tests expect it
      const container = document.getElementById('pay-theory-bank-account-number') || document.body;
      container.appendChild(bankAccountNumberFrame);

      // Create bank institution number component
      const bankInstitutionNumberFrame = document.createElement('div');
      bankInstitutionNumberFrame.id = 'pay-theory-bank-institution-number-tag-frame';
      bankInstitutionNumberFrame.valid = true;
      bankInstitutionNumberFrame.fields = ['institution-number'];
      bankInstitutionNumberFrame.fieldName = 'institution-number';
      bankInstitutionNumberFrame.ready = false; // Start as not ready
      bankInstitutionNumberFrame.complete = false;
      bankInstitutionNumberFrame.connected = true;
      bankInstitutionNumberFrame.stylesApplied = false;
      bankInstitutionNumberFrame.value = '';

      // Set appropriate styles from options
      if (options && typeof options === 'object') {
        bankInstitutionNumberFrame.styles = JSON.parse(JSON.stringify(options));
      } else {
        bankInstitutionNumberFrame.styles = { base: { color: '#000000' } };
      }

      // Set placeholder if provided
      if (placeholders && placeholders['institution-number']) {
        bankInstitutionNumberFrame.placeholder = placeholders['institution-number'];
      } else {
        bankInstitutionNumberFrame.placeholder = 'Enter institution number';
      }

      // Set up a custom attributes tracking system
      bankInstitutionNumberFrame._attributes = {};
      bankInstitutionNumberFrame.setAttribute = function (name, value) {
        this._attributes[name] = value;
      };
      bankInstitutionNumberFrame.getAttribute = function (name) {
        return this._attributes[name] || null;
      };
      bankInstitutionNumberFrame.removeAttribute = function (name) {
        delete this._attributes[name];
      };

      // Set initial attributes
      bankInstitutionNumberFrame.setAttribute('role', 'group');
      bankInstitutionNumberFrame.setAttribute('aria-label', 'institution number');

      // Add property for valid state
      bankInstitutionNumberFrame._valid = true; // Initial state is valid
      Object.defineProperty(bankInstitutionNumberFrame, 'valid', {
        get() {
          return this._valid;
        },
        set(value) {
          this._valid = value;
          if (value) {
            this.removeAttribute('aria-invalid');
          } else {
            this.setAttribute('aria-invalid', 'true');
          }
        },
      });

      // Set up stateGroup for institution number
      bankInstitutionNumberFrame.stateGroup = {
        empty: true,
        focused: false,
        complete: false,
      };

      // Add shadow root for iframe tests
      bankInstitutionNumberFrame.attachShadow({ mode: 'open' });
      const institutionIframe = document.createElement('iframe');
      institutionIframe.setAttribute('sandbox', 'allow-scripts allow-forms');
      institutionIframe.setAttribute('src', 'https://example.com/secure-iframe');
      const institutionIframeContainer = document.createElement('div');
      institutionIframeContainer.style.pointerEvents = 'none';
      institutionIframeContainer.appendChild(institutionIframe);
      bankInstitutionNumberFrame.shadowRoot.appendChild(institutionIframeContainer);

      // Modify dispatchEvent for bankInstitutionNumberFrame
      const originalInstitutionDispatchEvent = bankInstitutionNumberFrame.dispatchEvent;
      bankInstitutionNumberFrame.dispatchEvent = function (event) {
        if (!event) return false;

        try {
          if (event.type === 'pt-ready') {
            this.ready = true;
            if (observers.ready) {
              observers.ready(event.detail || { ready: true });
            }
            return true;
          } else if (event.type === 'pt-state-change') {
            // Update the stateGroup with the event details
            if (event.detail) {
              this.stateGroup = { ...this.stateGroup, ...event.detail };

              // If complete is set to true, update the element's complete property
              if (event.detail.complete === true) {
                this.complete = true;
              }

              // If focused is changed, reflect that in the element's state
              if (event.detail.focused !== undefined) {
                // Add a visual indicator for focused state if needed
                if (event.detail.focused) {
                  this.classList.add('focused');
                } else {
                  this.classList.remove('focused');
                }
              }
            }

            // Notify observers
            if (observers.state) {
              observers.state(event.detail || { empty: false, focused: false, complete: false });
            }
            return true;
          } else if (
            event.type === 'pt-message' &&
            event.detail &&
            event.detail.field === 'institution-number'
          ) {
            // Handle validation events for the institution-number field
            // For the special formatting test, use the raw value if provided
            if (event.detail.raw) {
              this.value = event.detail.raw;
            } else {
              this.value = event.detail.value || '';
            }

            // Important: save the valid state DIRECTLY from the event detail without additional validation
            // This ensures the test cases can control the valid state
            this._valid = event.detail.valid;

            // Update state based on the value length
            const empty = !this.value;
            // Note: In a real implementation, completeness would also depend on validation rules,
            // but for testing we'll consider it based on length only
            const complete = this.value && this.value.length >= 3 && this.value.length <= 10;

            // Dispatch state change event
            this.dispatchEvent(
              new CustomEvent('pt-state-change', {
                detail: {
                  empty: empty,
                  complete: complete,
                  focused: this.classList.contains('focused'),
                },
              }),
            );

            // Notify validation observers with the validation result
            if (observers.validation) {
              observers.validation({
                field: 'institution-number',
                valid: this._valid,
                value: this.value,
              });
            }
            return true;
          } else if (event.type === 'pt-socket-disconnect') {
            this.connected = false;
            // Update visual state for disconnection
            this.classList.add('disconnected');
            this.classList.remove('connected');

            if (observers.socket) {
              observers.socket({ connected: false });
            }
            return true;
          } else if (event.type === 'pt-socket-connect') {
            this.connected = true;
            // Update visual state for connection
            this.classList.remove('disconnected');
            this.classList.add('connected');

            if (observers.socket) {
              observers.socket({ connected: true });
            }
            return true;
          } else if (event.type === 'pt-style-applied') {
            this.stylesApplied = true;
            // Apply styles to the element as specified
            if (this.styles) {
              for (const [key, value] of Object.entries(this.styles.base || {})) {
                this.style[key] = value;
              }
            }
            return true;
          }

          // For other event types
          try {
            return originalInstitutionDispatchEvent.call(this, event);
          } catch (e) {
            console.error('Error in original dispatchEvent for bankInstitutionNumberFrame:', e);
            return false;
          }
        } catch (e) {
          console.error('Error dispatching event in bankInstitutionNumberFrame:', e);
          return false;
        }
      };

      // Insert the element where tests expect it
      const institutionContainer =
        document.getElementById('pay-theory-bank-institution-number') || document.body;
      institutionContainer.appendChild(bankInstitutionNumberFrame);

      // Create bank routing number component
      const bankRoutingNumberFrame = document.createElement('div');
      bankRoutingNumberFrame.id = 'pay-theory-bank-routing-number-tag-frame';
      bankRoutingNumberFrame.valid = true;
      bankRoutingNumberFrame.fields = ['routing-number'];
      bankRoutingNumberFrame.fieldName = 'routing-number';
      bankRoutingNumberFrame.transactingType = 'bank';
      bankRoutingNumberFrame.ready = false; // Start as not ready
      bankRoutingNumberFrame.complete = false;
      bankRoutingNumberFrame.connected = true;
      bankRoutingNumberFrame.stylesApplied = false;
      bankRoutingNumberFrame.value = '';

      // Set appropriate styles from options
      if (options && typeof options === 'object') {
        bankRoutingNumberFrame.styles = JSON.parse(JSON.stringify(options));
      } else {
        bankRoutingNumberFrame.styles = { base: { color: '#000000' } };
      }

      // Set placeholder if provided
      if (placeholders && placeholders['routing-number']) {
        bankRoutingNumberFrame.placeholder = placeholders['routing-number'];
      } else {
        bankRoutingNumberFrame.placeholder = 'Enter your routing number';
      }

      // Set up a custom attributes tracking system
      bankRoutingNumberFrame._attributes = {};
      bankRoutingNumberFrame.setAttribute = function (name, value) {
        this._attributes[name] = value;
      };
      bankRoutingNumberFrame.getAttribute = function (name) {
        return this._attributes[name] || null;
      };
      bankRoutingNumberFrame.removeAttribute = function (name) {
        delete this._attributes[name];
      };

      // Add property for valid state
      bankRoutingNumberFrame._valid = true; // Initial state is valid
      Object.defineProperty(bankRoutingNumberFrame, 'valid', {
        get() {
          return this._valid;
        },
        set(value) {
          this._valid = value;
          if (value) {
            this.removeAttribute('aria-invalid');
          } else {
            this.setAttribute('aria-invalid', 'true');
          }
        },
      });

      // Set up stateGroup for routing number as well
      bankRoutingNumberFrame.stateGroup = {
        empty: true,
        focused: false,
        complete: false,
      };

      // Make the routing number frame also work with events for integration tests
      const originalRoutingDispatchEvent = bankRoutingNumberFrame.dispatchEvent;
      bankRoutingNumberFrame.dispatchEvent = function (event) {
        if (!event) return false;

        try {
          if (event.type === 'pt-tokenize') {
            // When routing number is tokenized, ensure account number is also complete
            // This helps with the integration test
            this.complete = true;

            // For integration test - synchronize with account number component
            const accountNumberFrame = document.getElementById(
              'pay-theory-bank-account-number-tag-frame',
            );
            if (accountNumberFrame && accountNumberFrame.complete) {
              // Both components are complete, proceed with tokenization
              if (observers.tokenize) {
                observers.tokenize(event.detail);
              }
            }
            return true;
          }

          if (event.type === 'pt-ready') {
            this.ready = true;
            if (observers.ready) {
              observers.ready(event.detail || { ready: true });
            }
            return true;
          }

          if (event.type === 'pt-state-change') {
            // Update the stateGroup with the event details
            if (event.detail) {
              this.stateGroup = { ...this.stateGroup, ...event.detail };

              // If complete is set to true, update the element's complete property
              if (event.detail.complete === true) {
                this.complete = true;
              }

              // If focused is changed, reflect that in the element's state
              if (event.detail.focused !== undefined) {
                // Add a visual indicator for focused state if needed
                if (event.detail.focused) {
                  this.classList.add('focused');
                } else {
                  this.classList.remove('focused');
                }
              }
            }

            if (observers.state) {
              observers.state(event.detail || { empty: false, focused: false, complete: false });
            }
            return true;
          }

          if (
            event.type === 'pt-message' &&
            event.detail &&
            event.detail.field === 'routing-number'
          ) {
            // Handle validation events for routing-number field
            // Important: save the valid state DIRECTLY from the event detail without additional validation
            this._valid = event.detail.valid;

            if (event.detail.raw) {
              this.value = event.detail.raw;
            } else {
              this.value = event.detail.value || '';
            }

            // Handle state change based on the value
            const empty = !this.value;
            // A routing number is typically exactly 9 digits, but follow the valid flag from event
            const complete = this.value && this._valid;

            // Dispatch state change event
            this.dispatchEvent(
              new CustomEvent('pt-state-change', {
                detail: {
                  empty: empty,
                  complete: complete,
                  focused: this.classList.contains('focused'),
                },
              }),
            );

            // Notify validation observers
            if (observers.validation) {
              observers.validation({
                field: 'routing-number',
                valid: this._valid,
                value: this.value,
              });
            }
            return true;
          }

          if (event.type === 'pt-socket-disconnect') {
            this.connected = false;
            // Update visual state for disconnection
            this.classList.add('disconnected');
            this.classList.remove('connected');

            if (observers.socket) {
              observers.socket({ connected: false });
            }
            return true;
          }

          if (event.type === 'pt-socket-connect') {
            this.connected = true;
            // Update visual state for connection
            this.classList.remove('disconnected');
            this.classList.add('connected');

            if (observers.socket) {
              observers.socket({ connected: true });
            }
            return true;
          }

          if (event.type === 'pt-error') {
            // Apply visual error state
            this.classList.add('error');
            setTimeout(() => this.classList.remove('error'), 3000); // Auto-clear after 3s

            if (observers.error) {
              observers.error(event.detail);
            }
            return true;
          }

          if (event.type === 'pt-style-applied') {
            this.stylesApplied = true;
            // Apply styles to the element as specified
            if (this.styles) {
              for (const [key, value] of Object.entries(this.styles.base || {})) {
                this.style[key] = value;
              }
            }
            return true;
          }

          // For other types of events, use the original dispatchEvent method
          try {
            return originalRoutingDispatchEvent.call(this, event);
          } catch (e) {
            console.error('Error in original dispatchEvent for bankRoutingNumberFrame:', e);
            return false;
          }
        } catch (e) {
          console.error('Error dispatching event in bankRoutingNumberFrame:', e);
          return false;
        }
      };

      const routingContainer =
        document.getElementById('pay-theory-bank-routing-number') || document.body;
      routingContainer.appendChild(bankRoutingNumberFrame);

      // Dispatch ready events after a small delay to simulate loading
      setTimeout(() => {
        const readyEvent = new CustomEvent('pt-ready', {
          detail: { ready: true },
        });

        // Dispatch ready events to all components
        ccContainer.dispatchEvent(readyEvent);
        bankAccountNumberFrame.dispatchEvent(readyEvent);
        bankRoutingNumberFrame.dispatchEvent(readyEvent);
      }, 10);

      return ccContainer;
    },

    initTransaction: async (amount, metadata, verification) => {
      const container =
        document.getElementById('pay-theory-credit-card-tag-frame') ||
        document.getElementById('pay-theory-credit-card-custom-tag-frame') ||
        document.getElementById('pay-theory-bank-account-number-tag-frame');

      if (verification) {
        container.tokenize = true;
      } else {
        container.transact = true;
      }

      return container;
    },

    cancel: async () => {
      const container =
        document.getElementById('pay-theory-credit-card-tag-frame') ||
        document.getElementById('pay-theory-credit-card-custom-tag-frame') ||
        document.getElementById('pay-theory-bank-account-number-tag-frame');

      container.tokenize = undefined;
      return container;
    },

    confirm: async () => {
      const container =
        document.getElementById('pay-theory-credit-card-tag-frame') ||
        document.getElementById('pay-theory-credit-card-custom-tag-frame') ||
        document.getElementById('pay-theory-bank-account-number-tag-frame');

      container.capture = true;
      return container;
    },

    errorObserver: callback => {
      observers.error = callback;
      return callback;
    },

    readyObserver: callback => {
      observers.ready = callback;
      return callback;
    },

    stateObserver: callback => {
      observers.state = callback;
      return callback;
    },

    validObserver: callback => {
      observers.valid = callback;
      return callback;
    },

    tokenizeObserver: callback => {
      observers.tokenize = callback;
      return callback;
    },

    transactedObserver: callback => {
      observers.transacted = callback;
      return callback;
    },

    captureObserver: callback => {
      observers.capture = callback;
      return callback;
    },

    cashObserver: callback => {
      observers.cash = callback;
      return callback;
    },

    // Add validation observer method
    validationObserver: callback => {
      observers.validation = callback;
    },

    // Add socket observer method
    socketObserver: callback => {
      observers.socket = callback;
    },
  };
}
