/**
 * Pay Theory QR Code Checkout Test
 *
 * This test file initializes a Pay Theory QR code that can be scanned
 * to open a mobile checkout experience.
 */

// Load configuration from env-config.local.js
if (!window.ENV_CONFIG || !window.ENV_CONFIG.PAYTHEORY_API_KEY) {
  throw new Error(
    'PAYTHEORY_API_KEY must be set in window.ENV_CONFIG. Make sure env-config.local.js is loaded.',
  );
}

const API_KEY = window.ENV_CONFIG.PAYTHEORY_API_KEY;

// State
let qrInitialized = false;

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
    paymentDescription: 'Testing the Pay Theory QR code checkout',
    callToAction: paytheory[callToAction] || callToAction,
    acceptedPaymentMethods: paytheory[acceptedPaymentMethods] || acceptedPaymentMethods,
    feeMode: paytheory[feeMode] || feeMode,
    metadata: {
      'test-key': 'test-value',
      source: 'qr-code-test',
    },
  };
}

/**
 * Get QR code size from configuration
 */
function getQRSize() {
  const size = parseInt(document.getElementById('size-input').value) || 200;
  // Enforce min/max limits
  return Math.min(Math.max(size, 128), 300);
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
 * Initialize the QR code
 */
function initializeQRCode() {
  if (qrInitialized) {
    console.log('QR Code already initialized');
    return;
  }

  if (typeof paytheory === 'undefined' || typeof paytheory.qrCode === 'undefined') {
    console.error('PayTheory SDK not available');
    showStatus('PayTheory SDK not available', 'error');
    return;
  }

  console.log('Initializing QR Code...');
  qrInitialized = true;

  try {
    paytheory.qrCode({
      apiKey: API_KEY,
      checkoutDetails: getCheckoutDetails(),
      size: getQRSize(),
      onReady: isReady => {
        console.log('QR Code ready:', isReady);
        document.getElementById('loading').style.display = 'none';
        showStatus('QR Code ready! Scan with your mobile device.', 'success');
      },
      onSuccess: result => {
        console.log('QR Code payment success:', result);
        showStatus('Payment completed successfully!', 'success');
        showResult(result);
      },
      onError: error => {
        console.error('QR Code error:', error);
        showStatus(`Error: ${error}`, 'error');
        qrInitialized = false;
      },
    });
  } catch (error) {
    console.error('Error initializing QR Code:', error);
    showStatus(`Initialization error: ${error.message}`, 'error');
    qrInitialized = false;
  }
}

/**
 * Wait for PayTheory SDK to load
 */
function waitForSDK() {
  if (typeof paytheory !== 'undefined') {
    console.log('PayTheory SDK loaded');
    initializeQRCode();
    return;
  }

  console.log('Waiting for PayTheory SDK...');
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds

  const checkSDK = () => {
    attempts++;
    if (typeof paytheory !== 'undefined') {
      console.log('PayTheory SDK loaded');
      initializeQRCode();
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

  // Note: Configuration changes require page reload since QR code is already initialized
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
