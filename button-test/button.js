/**
 * Pay Theory Checkout Button Test
 *
 * This test file initializes a Pay Theory checkout button that opens
 * a hosted checkout experience when clicked.
 */

// Load configuration from env-config.local.js
if (!window.ENV_CONFIG || !window.ENV_CONFIG.PAYTHEORY_API_KEY) {
  throw new Error(
    'PAYTHEORY_API_KEY must be set in window.ENV_CONFIG. Make sure env-config.local.js is loaded.',
  );
}

const API_KEY = window.ENV_CONFIG.PAYTHEORY_API_KEY;

// State
let buttonInitialized = false;

/**
 * Get checkout details from current configuration
 */
function getCheckoutDetails() {
  const amount = parseInt(document.getElementById('amount-input').value) || 1000;
  const feeMode = document.getElementById('fee-mode-select').value;
  const acceptedPaymentMethods = document.getElementById('payment-methods-select').value;
  const callToAction = document.getElementById('call-to-action-select').value;

  return {
    amount: amount,
    paymentName: 'Test Purchase',
    paymentDescription: 'Testing the Pay Theory checkout button',
    callToAction: paytheory[callToAction] || callToAction,
    acceptedPaymentMethods: paytheory[acceptedPaymentMethods] || acceptedPaymentMethods,
    feeMode: paytheory[feeMode] || feeMode,
    metadata: {
      'test-key': 'test-value',
      source: 'button-test',
    },
  };
}

/**
 * Get style object from current configuration
 */
function getStyleObject() {
  const buttonColor = document.getElementById('button-color-select').value;
  const pill = document.getElementById('pill-checkbox').checked;
  const callToAction = document.getElementById('call-to-action-select').value;

  return {
    color: paytheory[buttonColor] || buttonColor,
    callToAction: paytheory[callToAction] || callToAction,
    pill: pill,
    height: '48px',
  };
}

/**
 * Update the amount display
 */
function updateAmountDisplay() {
  const amount = parseInt(document.getElementById('amount-input').value) || 1000;
  const displayEl = document.getElementById('amount-display');
  if (displayEl) {
    displayEl.textContent = `Amount: $${(amount / 100).toFixed(2)}`;
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }
}

/**
 * Show result
 */
function showResult(result) {
  const resultContainer = document.getElementById('result-container');
  const resultText = document.getElementById('result-text');

  if (resultContainer && resultText) {
    resultText.textContent = JSON.stringify(result, null, 2);
    resultContainer.style.display = 'block';
  }
}

/**
 * Hide result
 */
function hideResult() {
  const resultContainer = document.getElementById('result-container');
  if (resultContainer) {
    resultContainer.style.display = 'none';
  }
}

/**
 * Initialize the checkout button
 */
function initializeButton() {
  if (buttonInitialized) {
    console.log('Button already initialized');
    return;
  }

  if (typeof paytheory === 'undefined' || typeof paytheory.button === 'undefined') {
    console.error('PayTheory SDK not available');
    showStatus('PayTheory SDK not available', 'error');
    return;
  }

  console.log('Initializing Checkout Button...');
  buttonInitialized = true;

  try {
    paytheory.button({
      apiKey: API_KEY,
      checkoutDetails: getCheckoutDetails(),
      style: getStyleObject(),
      onReady: isReady => {
        console.log('Checkout Button ready:', isReady);
        document.getElementById('loading').style.display = 'none';
        showStatus('Checkout Button ready! Click to open hosted checkout.', 'success');
      },
      onClick: () => {
        console.log('Checkout Button clicked');
        showStatus('Opening hosted checkout...', 'info');
        hideResult();
      },
      onSuccess: result => {
        console.log('Checkout success:', result);
        showStatus('Payment completed successfully!', 'success');
        showResult(result);
      },
      onError: error => {
        console.error('Checkout error:', error);
        showStatus(`Error: ${error}`, 'error');
        buttonInitialized = false;
      },
      onCancel: () => {
        console.log('Checkout cancelled');
        showStatus('Checkout cancelled by user', 'info');
      },
      onBarcode: barcodeData => {
        console.log('Barcode generated:', barcodeData);
        showStatus('Barcode generated for cash payment', 'success');
        showResult(barcodeData);
      },
    });
  } catch (error) {
    console.error('Error initializing button:', error);
    showStatus(`Initialization error: ${error.message}`, 'error');
    buttonInitialized = false;
  }
}

/**
 * Wait for PayTheory SDK to load
 */
function waitForSDK() {
  if (typeof paytheory !== 'undefined') {
    console.log('PayTheory SDK loaded');
    initializeButton();
    return;
  }

  console.log('Waiting for PayTheory SDK...');
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds

  const checkSDK = () => {
    attempts++;
    if (typeof paytheory !== 'undefined') {
      console.log('PayTheory SDK loaded');
      initializeButton();
    } else if (attempts < maxAttempts) {
      setTimeout(checkSDK, 100);
    } else {
      console.error('PayTheory SDK failed to load');
      showStatus('PayTheory SDK failed to load. Check that index.js is built.', 'error');
      document.getElementById('loading').style.display = 'none';
    }
  };

  checkSDK();
}

/**
 * Set up event listeners for configuration changes
 */
function setupConfigListeners() {
  // Update amount display when amount changes
  const amountInput = document.getElementById('amount-input');
  if (amountInput) {
    amountInput.addEventListener('input', updateAmountDisplay);
  }

  // Note: Configuration changes require page reload since button is already initialized
  // Add a note about this if needed
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupConfigListeners();
    updateAmountDisplay();
    waitForSDK();
  });
} else {
  setupConfigListeners();
  updateAmountDisplay();
  waitForSDK();
}
