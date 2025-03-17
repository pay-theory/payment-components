/**
 * Mock version of the payment-fields module for testing
 */

// Mock implementation of the createPaymentFields function
export default function createPaymentFields(api, client, options = {}) {
  // Return a mock payment fields object
  return {
    mount: async elements => {
      // Create the necessary DOM elements for testing
      const container = document.createElement('div');
      container.id = 'pay-theory-credit-card-tag-frame';
      container.valid = true;
      document.body.appendChild(container);

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

      // Dispatch a ready event
      setTimeout(() => {
        const readyEvent = new CustomEvent('ready');
        container.dispatchEvent(readyEvent);
      }, 150);

      return container;
    },

    initTransaction: async (amount, metadata, verification) => {
      const container =
        document.getElementById('pay-theory-credit-card-tag-frame') ||
        document.getElementById('pay-theory-credit-card-custom-tag-frame');

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
        document.getElementById('pay-theory-credit-card-custom-tag-frame');

      container.tokenize = undefined;
      return container;
    },

    confirm: async () => {
      const container =
        document.getElementById('pay-theory-credit-card-tag-frame') ||
        document.getElementById('pay-theory-credit-card-custom-tag-frame');

      container.capture = true;
      return container;
    },

    errorObserver: callback => {
      // Mock implementation
      return callback;
    },

    readyObserver: callback => {
      // Mock implementation
      setTimeout(() => {
        callback();
      }, 150);
      return callback;
    },
  };
}
